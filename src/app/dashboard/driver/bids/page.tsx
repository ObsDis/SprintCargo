"use client";

import { useEffect, useState, useCallback } from "react";
import {
  MapPin,
  ArrowRight,
  Package,
  Zap,
  Clock,
  ChevronDown,
  ChevronUp,
  Send,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { SIZE_CATEGORIES, DELIVERY_SPEEDS, QUOTE_STATUSES } from "@/lib/constants";
import type {
  Job,
  JobQuote,
  DriverRateCard,
  SizeCategory,
  DeliverySpeed,
  QuoteStatus,
} from "@/types/database";

type JobWithQuoteCount = Job & { existingQuote?: boolean };

export default function BidsPage() {
  const [availableJobs, setAvailableJobs] = useState<JobWithQuoteCount[]>([]);
  const [myQuotes, setMyQuotes] = useState<(JobQuote & { job?: Job })[]>([]);
  const [rateCard, setRateCard] = useState<DriverRateCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [submittingQuote, setSubmittingQuote] = useState<string | null>(null);
  const [quoteAmounts, setQuoteAmounts] = useState<Record<string, number>>({});
  const [quoteNotes, setQuoteNotes] = useState<Record<string, string>>({});
  const [counterModalQuote, setCounterModalQuote] = useState<
    (JobQuote & { job?: Job }) | null
  >(null);
  const [counterAmount, setCounterAmount] = useState("");
  const [counterNote, setCounterNote] = useState("");
  const [counterSubmitting, setCounterSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    // Fetch rate card
    const { data: rc } = await supabase
      .from("driver_rate_cards")
      .select("*")
      .eq("driver_id", user.id)
      .single();
    setRateCard(rc);

    // Fetch available jobs
    const { data: jobs } = await supabase
      .from("jobs")
      .select("*")
      .in("status", ["posted", "quoted"])
      .order("created_at", { ascending: false });

    // Check which jobs this driver already quoted on
    const { data: driverQuotes } = await supabase
      .from("job_quotes")
      .select("job_id")
      .eq("driver_id", user.id);

    const quotedJobIds = new Set(driverQuotes?.map((q) => q.job_id) || []);
    const enrichedJobs =
      jobs?.map((j) => ({
        ...j,
        existingQuote: quotedJobIds.has(j.id),
      })) || [];
    setAvailableJobs(enrichedJobs);

    // Pre-calculate quote amounts
    if (rc && jobs) {
      const amounts: Record<string, number> = {};
      jobs.forEach((job) => {
        amounts[job.id] = calculateQuote(rc, job);
      });
      setQuoteAmounts((prev) => {
        const merged = { ...amounts };
        // Preserve any user-adjusted amounts
        Object.keys(prev).forEach((k) => {
          if (prev[k] !== undefined) merged[k] = prev[k];
        });
        return merged;
      });
    }

    // Fetch my quotes with job details
    const { data: quotes } = await supabase
      .from("job_quotes")
      .select("*")
      .eq("driver_id", user.id)
      .order("created_at", { ascending: false });

    if (quotes && quotes.length > 0) {
      const jobIds = [...new Set(quotes.map((q) => q.job_id))];
      const { data: quotedJobs } = await supabase
        .from("jobs")
        .select("*")
        .in("id", jobIds);
      const jobMap = new Map(quotedJobs?.map((j) => [j.id, j]) || []);
      setMyQuotes(
        quotes.map((q) => ({ ...q, job: jobMap.get(q.job_id) }))
      );
    } else {
      setMyQuotes([]);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function calculateQuote(rc: DriverRateCard, job: Job): number {
    let total = rc.base_rate;
    total += (job.estimated_distance_miles || 0) * rc.per_mile_rate;

    // Size surcharge
    const sizeMap: Record<SizeCategory, number> = {
      small: rc.size_small_surcharge,
      medium: rc.size_medium_surcharge,
      large: rc.size_large_surcharge,
      oversized: rc.size_oversized_surcharge,
    };
    total += sizeMap[job.size_category] || 0;

    // Weight surcharge
    const weight = job.estimated_weight_lbs || 0;
    if (weight > 500) total += rc.weight_over_500_surcharge;
    else if (weight > 150) total += rc.weight_150_to_500_surcharge;
    else if (weight > 50) total += rc.weight_50_to_150_surcharge;
    else total += rc.weight_under_50_surcharge;

    // Rush multiplier
    if (job.delivery_speed === "rush") {
      total *= rc.rush_multiplier;
    }

    // Additional stops
    if (job.additional_stops) {
      const stops = Array.isArray(job.additional_stops)
        ? job.additional_stops.length
        : 0;
      total += stops * rc.multi_stop_per_stop_rate;
    }

    return Math.round(total * 100) / 100;
  }

  async function handleSubmitQuote(jobId: string) {
    if (!userId) return;
    setSubmittingQuote(jobId);
    const supabase = createClient();
    const amount = quoteAmounts[jobId] || 0;
    const note = quoteNotes[jobId] || "";

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const { error } = await supabase.from("job_quotes").insert({
      job_id: jobId,
      driver_id: userId,
      amount,
      auto_calculated_amount: rateCard
        ? calculateQuote(
            rateCard,
            availableJobs.find((j) => j.id === jobId)!
          )
        : null,
      driver_note: note || null,
      expires_at: expiresAt.toISOString(),
    });

    if (!error) {
      await loadData();
    }
    setSubmittingQuote(null);
  }

  async function handleAcceptCounter(quoteId: string) {
    const supabase = createClient();
    const quote = myQuotes.find((q) => q.id === quoteId);
    if (!quote) return;

    await supabase
      .from("job_quotes")
      .update({
        status: "accepted",
        amount: quote.shipper_counter_amount!,
      })
      .eq("id", quoteId);

    await loadData();
  }

  async function handleDeclineCounter(quoteId: string) {
    const supabase = createClient();
    await supabase
      .from("job_quotes")
      .update({ status: "declined" })
      .eq("id", quoteId);
    await loadData();
  }

  async function handleCounterBack() {
    if (!counterModalQuote) return;
    setCounterSubmitting(true);
    const supabase = createClient();

    await supabase
      .from("job_quotes")
      .update({
        status: "countered_by_driver",
        driver_counter_amount: parseFloat(counterAmount),
        driver_counter_note: counterNote || null,
        negotiation_round: (counterModalQuote.negotiation_round || 1) + 1,
      })
      .eq("id", counterModalQuote.id);

    setCounterModalQuote(null);
    setCounterAmount("");
    setCounterNote("");
    setCounterSubmitting(false);
    await loadData();
  }

  if (loading) return <BidsSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#0F172A]">
          Jobs &amp; Quotes
        </h1>
        <p className="mt-1 text-muted-foreground">
          Find available jobs and manage your quotes.
        </p>
      </div>

      <Tabs defaultValue="available" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="available">Available Jobs</TabsTrigger>
          <TabsTrigger value="quotes">
            My Quotes
            {myQuotes.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {myQuotes.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Available Jobs Tab */}
        <TabsContent value="available" className="mt-6 space-y-4">
          {availableJobs.length === 0 ? (
            <Card className="rounded-xl shadow-md">
              <CardContent className="py-16 text-center">
                <Package className="mx-auto h-12 w-12 text-muted-foreground/40" />
                <p className="mt-4 text-lg font-medium text-muted-foreground">
                  No available jobs right now
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Check back soon for new delivery opportunities.
                </p>
              </CardContent>
            </Card>
          ) : (
            availableJobs.map((job) => {
              const isExpanded = expandedJob === job.id;
              const autoQuote = rateCard
                ? calculateQuote(rateCard, job)
                : null;
              return (
                <Card
                  key={job.id}
                  className="overflow-hidden rounded-xl shadow-md"
                >
                  <CardContent className="p-0">
                    {/* Job summary row */}
                    <div
                      className="flex cursor-pointer items-center justify-between p-5"
                      onClick={() =>
                        setExpandedJob(isExpanded ? null : job.id)
                      }
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-[#0F172A]">
                            {job.title}
                          </p>
                          {job.existingQuote && (
                            <Badge variant="outline" className="text-xs">
                              Quoted
                            </Badge>
                          )}
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {job.pickup_address.split(",")[0]}
                          </span>
                          <ArrowRight className="h-3 w-3" />
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {job.dropoff_address.split(",")[0]}
                          </span>
                          {job.estimated_distance_miles && (
                            <span className="text-xs">
                              ({job.estimated_distance_miles.toFixed(1)} mi)
                            </span>
                          )}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {SIZE_CATEGORIES[job.size_category]?.label ||
                              job.size_category}
                          </Badge>
                          <Badge
                            variant={
                              job.delivery_speed === "rush"
                                ? "destructive"
                                : "secondary"
                            }
                            className="text-xs"
                          >
                            {job.delivery_speed === "rush" && (
                              <Zap className="mr-1 h-3 w-3" />
                            )}
                            {DELIVERY_SPEEDS[job.delivery_speed]?.label ||
                              job.delivery_speed}
                          </Badge>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            Pickup:{" "}
                            {formatDate(
                              job.pickup_window_start,
                              "MMM d, h:mm a"
                            )}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4 flex flex-col items-end gap-2">
                        {autoQuote !== null && (
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">
                              Your auto-quote
                            </p>
                            <p className="text-lg font-bold text-[#3B82F6]">
                              {formatCurrency(autoQuote)}
                            </p>
                          </div>
                        )}
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="border-t bg-muted/30 p-5">
                        <div className="grid gap-6 md:grid-cols-2">
                          {/* Details */}
                          <div className="space-y-4">
                            <div>
                              <p className="text-sm font-medium text-[#0F172A]">
                                Pickup Address
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {job.pickup_address}
                              </p>
                              {job.pickup_notes && (
                                <p className="mt-1 text-xs italic text-muted-foreground">
                                  Note: {job.pickup_notes}
                                </p>
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-[#0F172A]">
                                Drop-off Address
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {job.dropoff_address}
                              </p>
                              {job.dropoff_notes && (
                                <p className="mt-1 text-xs italic text-muted-foreground">
                                  Note: {job.dropoff_notes}
                                </p>
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-[#0F172A]">
                                Item Description
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {job.item_description}
                              </p>
                              {job.estimated_weight_lbs && (
                                <p className="text-xs text-muted-foreground">
                                  Est. weight: {job.estimated_weight_lbs} lbs
                                </p>
                              )}
                              {job.fragile && (
                                <Badge
                                  variant="destructive"
                                  className="mt-1 text-xs"
                                >
                                  Fragile
                                </Badge>
                              )}
                              {job.requires_helpers && (
                                <Badge variant="outline" className="mt-1 ml-1 text-xs">
                                  Helpers Required
                                </Badge>
                              )}
                            </div>
                            {job.special_instructions && (
                              <div>
                                <p className="text-sm font-medium text-[#0F172A]">
                                  Special Instructions
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {job.special_instructions}
                                </p>
                              </div>
                            )}
                            {job.item_photos && job.item_photos.length > 0 && (
                              <div>
                                <p className="text-sm font-medium text-[#0F172A]">
                                  Photos
                                </p>
                                <div className="mt-1 flex gap-2">
                                  {job.item_photos.map((url, i) => (
                                    <div
                                      key={i}
                                      className="flex h-20 w-20 items-center justify-center rounded-lg border bg-muted"
                                    >
                                      <ImageIcon className="h-6 w-6 text-muted-foreground" />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {/* Map placeholder */}
                            <div className="flex h-40 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50">
                              <p className="text-sm text-muted-foreground">
                                Map preview
                              </p>
                            </div>
                          </div>

                          {/* Quote form */}
                          <div>
                            {job.existingQuote ? (
                              <div className="rounded-lg border bg-green-50 p-4 text-center">
                                <p className="font-medium text-green-800">
                                  You already submitted a quote for this job.
                                </p>
                                <p className="mt-1 text-sm text-green-700">
                                  Check the &quot;My Quotes&quot; tab for
                                  details.
                                </p>
                              </div>
                            ) : (
                              <Card className="rounded-xl">
                                <CardHeader>
                                  <CardTitle className="text-base">
                                    Submit Your Quote
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                  <div>
                                    <Label htmlFor={`amount-${job.id}`}>
                                      Quote Amount ($)
                                    </Label>
                                    <Input
                                      id={`amount-${job.id}`}
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      value={quoteAmounts[job.id] || ""}
                                      onChange={(e) =>
                                        setQuoteAmounts((prev) => ({
                                          ...prev,
                                          [job.id]: parseFloat(
                                            e.target.value
                                          ),
                                        }))
                                      }
                                      className="mt-1"
                                    />
                                    {autoQuote !== null && (
                                      <p className="mt-1 text-xs text-muted-foreground">
                                        Auto-calculated:{" "}
                                        {formatCurrency(autoQuote)}
                                      </p>
                                    )}
                                  </div>
                                  <div>
                                    <Label htmlFor={`note-${job.id}`}>
                                      Note (optional)
                                    </Label>
                                    <Textarea
                                      id={`note-${job.id}`}
                                      placeholder="Any additional info for the shipper..."
                                      value={quoteNotes[job.id] || ""}
                                      onChange={(e) =>
                                        setQuoteNotes((prev) => ({
                                          ...prev,
                                          [job.id]: e.target.value,
                                        }))
                                      }
                                      rows={3}
                                      className="mt-1"
                                    />
                                  </div>
                                  <Button
                                    className="w-full bg-[#3B82F6] hover:bg-[#2563EB]"
                                    disabled={
                                      submittingQuote === job.id ||
                                      !quoteAmounts[job.id]
                                    }
                                    onClick={() =>
                                      handleSubmitQuote(job.id)
                                    }
                                  >
                                    {submittingQuote === job.id ? (
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                      <Send className="mr-2 h-4 w-4" />
                                    )}
                                    Submit Quote
                                  </Button>
                                </CardContent>
                              </Card>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        {/* My Quotes Tab */}
        <TabsContent value="quotes" className="mt-6 space-y-4">
          {myQuotes.length === 0 ? (
            <Card className="rounded-xl shadow-md">
              <CardContent className="py-16 text-center">
                <Send className="mx-auto h-12 w-12 text-muted-foreground/40" />
                <p className="mt-4 text-lg font-medium text-muted-foreground">
                  No quotes yet
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Browse available jobs and submit your first quote.
                </p>
              </CardContent>
            </Card>
          ) : (
            myQuotes.map((quote) => {
              const statusInfo = QUOTE_STATUSES[quote.status];
              const isCountered =
                quote.status === "countered_by_shipper";
              const canCounterBack =
                isCountered && (quote.negotiation_round || 1) < 2;

              return (
                <Card
                  key={quote.id}
                  className="overflow-hidden rounded-xl shadow-md"
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-[#0F172A]">
                          {quote.job?.title || "Job"}
                        </p>
                        {quote.job && (
                          <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5" />
                            {quote.job.pickup_address.split(",")[0]}
                            <ArrowRight className="h-3 w-3" />
                            {quote.job.dropoff_address.split(",")[0]}
                          </div>
                        )}
                        <div className="mt-3 flex flex-wrap items-center gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Your Quote
                            </p>
                            <p className="font-semibold text-[#0F172A]">
                              {formatCurrency(quote.amount)}
                            </p>
                          </div>
                          {quote.driver_note && (
                            <div>
                              <p className="text-xs text-muted-foreground">
                                Note
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {quote.driver_note}
                              </p>
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Submitted {formatDate(quote.created_at)}
                          </p>
                        </div>

                        {/* Counter offer details */}
                        {isCountered && (
                          <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
                            <p className="text-sm font-medium text-blue-900">
                              Shipper Counter Offer
                            </p>
                            <p className="mt-1 text-lg font-bold text-blue-700">
                              {formatCurrency(
                                quote.shipper_counter_amount || 0
                              )}
                            </p>
                            {quote.shipper_counter_note && (
                              <p className="mt-1 text-sm text-blue-800">
                                &quot;{quote.shipper_counter_note}&quot;
                              </p>
                            )}
                            <div className="mt-3 flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700"
                                onClick={() => handleAcceptCounter(quote.id)}
                              >
                                Accept Counter
                              </Button>
                              {canCounterBack && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setCounterModalQuote(quote);
                                    setCounterAmount(
                                      quote.amount.toString()
                                    );
                                  }}
                                >
                                  Counter Back
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() =>
                                  handleDeclineCounter(quote.id)
                                }
                              >
                                Decline
                              </Button>
                            </div>
                          </div>
                        )}

                        {quote.status === "countered_by_driver" && (
                          <div className="mt-4 rounded-lg border border-indigo-200 bg-indigo-50 p-3">
                            <p className="text-sm font-medium text-indigo-900">
                              Your Counter (Round{" "}
                              {quote.negotiation_round || 2})
                            </p>
                            <p className="mt-1 text-lg font-bold text-indigo-700">
                              {formatCurrency(
                                quote.driver_counter_amount || 0
                              )}
                            </p>
                            {quote.driver_counter_note && (
                              <p className="mt-1 text-sm text-indigo-800">
                                &quot;{quote.driver_counter_note}&quot;
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <QuoteStatusBadge status={quote.status} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>

      {/* Counter Back Modal */}
      <Dialog
        open={!!counterModalQuote}
        onOpenChange={(open) => !open && setCounterModalQuote(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Counter Offer (Round 2)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {counterModalQuote && (
              <div className="rounded-lg border bg-muted/50 p-3 text-sm">
                <p>
                  <span className="font-medium">Your original quote:</span>{" "}
                  {formatCurrency(counterModalQuote.amount)}
                </p>
                <p>
                  <span className="font-medium">Shipper&apos;s counter:</span>{" "}
                  {formatCurrency(
                    counterModalQuote.shipper_counter_amount || 0
                  )}
                </p>
              </div>
            )}
            <div>
              <Label htmlFor="counter-amount">Your Counter Amount ($)</Label>
              <Input
                id="counter-amount"
                type="number"
                step="0.01"
                min="0"
                value={counterAmount}
                onChange={(e) => setCounterAmount(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="counter-note">Note (optional)</Label>
              <Textarea
                id="counter-note"
                value={counterNote}
                onChange={(e) => setCounterNote(e.target.value)}
                placeholder="Explain your pricing..."
                rows={3}
                className="mt-1"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              This is the final round of negotiation. Max 2 rounds allowed.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCounterModalQuote(null)}
            >
              Cancel
            </Button>
            <Button
              className="bg-[#3B82F6] hover:bg-[#2563EB]"
              disabled={counterSubmitting || !counterAmount}
              onClick={handleCounterBack}
            >
              {counterSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Submit Counter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function QuoteStatusBadge({ status }: { status: QuoteStatus }) {
  const map: Record<
    string,
    { variant: "default" | "secondary" | "destructive" | "outline" }
  > = {
    pending: { variant: "secondary" },
    countered_by_shipper: { variant: "default" },
    countered_by_driver: { variant: "outline" },
    accepted: { variant: "default" },
    declined: { variant: "destructive" },
    expired: { variant: "outline" },
    withdrawn: { variant: "outline" },
  };
  const info = QUOTE_STATUSES[status];
  const style = map[status] || { variant: "outline" as const };
  return (
    <Badge
      variant={style.variant}
      className={cn(
        status === "accepted" && "bg-emerald-600",
        status === "countered_by_shipper" && "bg-blue-600"
      )}
    >
      {info?.label || status}
    </Badge>
  );
}

function BidsSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-9 w-48" />
        <Skeleton className="mt-2 h-5 w-72" />
      </div>
      <Skeleton className="h-10 w-64" />
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="rounded-xl shadow-md">
            <CardContent className="p-5">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="mt-2 h-4 w-64" />
              <div className="mt-3 flex gap-2">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
