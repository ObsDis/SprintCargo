"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { cn, formatCurrency, formatDate, formatRelativeTime } from "@/lib/utils";
import type { Job, JobQuote, QuoteStatus } from "@/types/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Package,
  MapPin,
  ArrowRight,
  Clock,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Star,
  Truck,
  Check,
  X,
  RefreshCw,
  User,
  Timer,
} from "lucide-react";
import { toast } from "sonner";

type JobWithQuotes = Job & { quotes: (JobQuote & { driver_profile?: { full_name: string; rating: number; total_deliveries: number } })[] };

const STATUS_BADGE_MAP: Record<string, { label: string; className: string }> = {
  posted: { label: "Awaiting Quotes", className: "bg-blue-100 text-blue-700" },
  quoted: { label: "Quotes Received", className: "bg-indigo-100 text-indigo-700" },
};

const QUOTE_STATUS_MAP: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-amber-100 text-amber-700" },
  countered_by_shipper: { label: "You Countered", className: "bg-purple-100 text-purple-700" },
  countered_by_driver: { label: "Driver Countered", className: "bg-orange-100 text-orange-700" },
  accepted: { label: "Accepted", className: "bg-green-100 text-green-700" },
  declined: { label: "Declined", className: "bg-red-100 text-red-700" },
  expired: { label: "Expired", className: "bg-gray-100 text-gray-500" },
  withdrawn: { label: "Withdrawn", className: "bg-gray-100 text-gray-500" },
};

function ExpirationCountdown({ expiresAt }: { expiresAt: string }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const update = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft("Expired");
        return;
      }
      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      setTimeLeft(hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`);
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const isUrgent = new Date(expiresAt).getTime() - Date.now() < 3600000;
  return (
    <span className={cn("text-xs flex items-center gap-1", isUrgent ? "text-red-600" : "text-gray-500")}>
      <Timer className="h-3 w-3" />
      {timeLeft}
    </span>
  );
}

export default function ShipmentBidsPage() {
  const [jobs, setJobs] = useState<JobWithQuotes[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [counterModal, setCounterModal] = useState<{ quoteId: string; jobId: string; currentAmount: number } | null>(null);
  const [counterAmount, setCounterAmount] = useState("");
  const [counterNote, setCounterNote] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchJobs = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("shipper_id", user.id)
      .in("status", ["posted", "quoted"])
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load jobs");
      setLoading(false);
      return;
    }

    const jobsData = (data ?? []) as Job[];

    // Fetch quotes for all jobs
    const jobIds = jobsData.map((j) => j.id);
    let quotesData: JobQuote[] = [];
    if (jobIds.length > 0) {
      const { data: quotes } = await supabase
        .from("job_quotes")
        .select("*")
        .in("job_id", jobIds)
        .order("created_at", { ascending: false });
      quotesData = (quotes ?? []) as JobQuote[];
    }

    // Fetch driver profiles for quotes
    const driverIds = [...new Set(quotesData.map((q) => q.driver_id))];
    let driversMap: Record<string, { full_name: string; rating: number; total_deliveries: number }> = {};
    if (driverIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", driverIds);
      const { data: driverProfiles } = await supabase
        .from("driver_profiles")
        .select("id, rating, total_deliveries")
        .in("id", driverIds);

      (profiles ?? []).forEach((p) => {
        const dp = (driverProfiles ?? []).find((d) => d.id === p.id);
        driversMap[p.id] = {
          full_name: p.full_name,
          rating: dp?.rating ?? 0,
          total_deliveries: dp?.total_deliveries ?? 0,
        };
      });
    }

    const enriched: JobWithQuotes[] = jobsData.map((job) => ({
      ...job,
      quotes: quotesData
        .filter((q) => q.job_id === job.id)
        .map((q) => ({ ...q, driver_profile: driversMap[q.driver_id] })),
    }));

    setJobs(enriched);
    setLoading(false);
  };

  useEffect(() => { fetchJobs(); }, []);

  const handleAcceptQuote = async (quoteId: string, jobId: string) => {
    setActionLoading(true);
    const supabase = createClient();
    const { error: quoteError } = await supabase
      .from("job_quotes")
      .update({ status: "accepted" as QuoteStatus })
      .eq("id", quoteId);
    if (quoteError) {
      toast.error("Failed to accept quote");
      setActionLoading(false);
      return;
    }
    // Also update job
    const quote = jobs.flatMap((j) => j.quotes).find((q) => q.id === quoteId);
    await supabase
      .from("jobs")
      .update({ status: "accepted", accepted_quote_id: quoteId, assigned_driver_id: quote?.driver_id })
      .eq("id", jobId);
    toast.success("Quote accepted! The driver has been notified.");
    setActionLoading(false);
    fetchJobs();
  };

  const handleDeclineQuote = async (quoteId: string) => {
    setActionLoading(true);
    const supabase = createClient();
    await supabase.from("job_quotes").update({ status: "declined" as QuoteStatus }).eq("id", quoteId);
    toast.success("Quote declined.");
    setActionLoading(false);
    fetchJobs();
  };

  const handleCounterOffer = async () => {
    if (!counterModal || !counterAmount) return;
    setActionLoading(true);
    const supabase = createClient();
    await supabase.from("job_quotes").update({
      status: "countered_by_shipper" as QuoteStatus,
      shipper_counter_amount: parseFloat(counterAmount),
      shipper_counter_note: counterNote || null,
    }).eq("id", counterModal.quoteId);
    toast.success("Counter offer sent!");
    setCounterModal(null);
    setCounterAmount("");
    setCounterNote("");
    setActionLoading(false);
    fetchJobs();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A]">Shipment Bids</h1>
        <p className="text-gray-500 mt-1">Manage quotes on your posted shipments</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="rounded-xl shadow-sm border-0 bg-white">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-52" />
                    <Skeleton className="h-4 w-80" />
                  </div>
                  <Skeleton className="h-8 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <Card className="rounded-xl shadow-sm border-0 bg-white">
          <CardContent className="py-16 text-center">
            <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No active bids</p>
            <p className="text-sm text-gray-400 mt-1">Post a shipment to start receiving quotes from drivers</p>
            <Link href="/dashboard/shipper/create-shipment">
              <Button className="mt-4 bg-[#3B82F6] hover:bg-[#2563EB] text-white">Create Shipment</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => {
            const isExpanded = expandedJob === job.id;
            const activeQuotes = job.quotes.filter((q) => !["declined", "expired", "withdrawn"].includes(q.status));
            const badgeConfig = STATUS_BADGE_MAP[job.status] ?? { label: job.status, className: "bg-gray-100 text-gray-700" };

            return (
              <Card key={job.id} className="rounded-xl shadow-sm border-0 bg-white overflow-hidden">
                <CardContent className="p-0">
                  {/* Job Header */}
                  <button
                    type="button"
                    onClick={() => setExpandedJob(isExpanded ? null : job.id)}
                    className="w-full p-5 flex items-center gap-4 text-left hover:bg-gray-50/50 transition-colors"
                  >
                    <div className="h-12 w-12 rounded-lg bg-[#0F172A]/5 flex items-center justify-center shrink-0">
                      <Package className="h-5 w-5 text-[#0F172A]/60" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-[#0F172A] truncate">{job.title}</p>
                        <Badge variant="secondary" className={cn("text-xs shrink-0", badgeConfig.className)}>
                          {badgeConfig.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="h-3 w-3 shrink-0" />
                          {job.pickup_address.split(",")[0]}
                        </span>
                        <ArrowRight className="h-3 w-3 shrink-0 text-gray-300" />
                        <span className="truncate">{job.dropoff_address.split(",")[0]}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <div className="flex items-center gap-1.5">
                          <MessageSquare className="h-4 w-4 text-[#3B82F6]" />
                          <span className="text-sm font-semibold text-[#0F172A]">
                            {activeQuotes.length}
                          </span>
                          <span className="text-xs text-gray-400">quote{activeQuotes.length !== 1 ? "s" : ""}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Posted {formatRelativeTime(job.created_at)}
                        </p>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Quotes */}
                  {isExpanded && (
                    <div className="border-t px-5 pb-5">
                      {job.quotes.length === 0 ? (
                        <div className="py-8 text-center">
                          <Clock className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">No quotes yet. Drivers will submit their offers soon.</p>
                        </div>
                      ) : (
                        <div className="space-y-3 pt-4">
                          {job.quotes.map((quote) => {
                            const quoteStatus = QUOTE_STATUS_MAP[quote.status] ?? { label: quote.status, className: "bg-gray-100 text-gray-700" };
                            const isActionable = ["pending", "countered_by_driver"].includes(quote.status);
                            return (
                              <div
                                key={quote.id}
                                className={cn(
                                  "p-4 rounded-lg border transition-all",
                                  isActionable ? "border-[#3B82F6]/20 bg-blue-50/30" : "border-gray-100 bg-gray-50/50"
                                )}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex items-start gap-3">
                                    <div className="h-10 w-10 rounded-full bg-[#0F172A]/10 flex items-center justify-center shrink-0">
                                      <User className="h-4 w-4 text-[#0F172A]/60" />
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <p className="font-medium text-[#0F172A] text-sm">
                                          {quote.driver_profile?.full_name ?? "Driver"}
                                        </p>
                                        {quote.driver_profile && (
                                          <span className="flex items-center gap-0.5 text-xs text-amber-600">
                                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                            {quote.driver_profile.rating.toFixed(1)}
                                          </span>
                                        )}
                                        {quote.driver_profile && (
                                          <span className="text-xs text-gray-400">
                                            {quote.driver_profile.total_deliveries} deliveries
                                          </span>
                                        )}
                                      </div>
                                      {quote.driver_note && (
                                        <p className="text-sm text-gray-600 mt-1">{quote.driver_note}</p>
                                      )}
                                      {quote.estimated_pickup_eta_minutes && (
                                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                          <Truck className="h-3 w-3" />
                                          ETA: {quote.estimated_pickup_eta_minutes} min
                                        </p>
                                      )}
                                      {quote.shipper_counter_amount && (
                                        <p className="text-xs text-purple-600 mt-1">
                                          Your counter: {formatCurrency(quote.shipper_counter_amount)}
                                          {quote.shipper_counter_note && ` - "${quote.shipper_counter_note}"`}
                                        </p>
                                      )}
                                      {quote.driver_counter_amount && (
                                        <p className="text-xs text-orange-600 mt-1">
                                          Driver&apos;s counter: {formatCurrency(quote.driver_counter_amount)}
                                          {quote.driver_counter_note && ` - "${quote.driver_counter_note}"`}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <p className="text-lg font-bold text-[#0F172A]">
                                      {formatCurrency(quote.driver_counter_amount ?? quote.amount)}
                                    </p>
                                    <Badge variant="secondary" className={cn("text-xs mt-1", quoteStatus.className)}>
                                      {quoteStatus.label}
                                    </Badge>
                                    <div className="mt-1">
                                      <ExpirationCountdown expiresAt={quote.expires_at} />
                                    </div>
                                  </div>
                                </div>

                                {isActionable && (
                                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                                    <Button
                                      size="sm"
                                      onClick={() => handleAcceptQuote(quote.id, job.id)}
                                      disabled={actionLoading}
                                      className="bg-green-600 hover:bg-green-700 text-white text-xs gap-1"
                                    >
                                      <Check className="h-3 w-3" /> Accept
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        setCounterModal({
                                          quoteId: quote.id,
                                          jobId: job.id,
                                          currentAmount: quote.driver_counter_amount ?? quote.amount,
                                        })
                                      }
                                      disabled={actionLoading}
                                      className="text-xs gap-1 border-[#3B82F6]/30 text-[#3B82F6]"
                                    >
                                      <RefreshCw className="h-3 w-3" /> Counter
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleDeclineQuote(quote.id)}
                                      disabled={actionLoading}
                                      className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 gap-1"
                                    >
                                      <X className="h-3 w-3" /> Decline
                                    </Button>
                                    <div className="flex-1" />
                                    <Link href={`/dashboard/shipper/shipment-bids/${job.id}`}>
                                      <Button size="sm" variant="ghost" className="text-xs text-gray-500">
                                        View Details
                                      </Button>
                                    </Link>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Counter Offer Modal */}
      <Dialog open={!!counterModal} onOpenChange={() => setCounterModal(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Counter Offer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {counterModal && (
              <p className="text-sm text-gray-500">
                Current quote: <span className="font-semibold text-[#0F172A]">{formatCurrency(counterModal.currentAmount)}</span>
              </p>
            )}
            <div>
              <Label htmlFor="counterAmount">Your Offer ($)</Label>
              <Input
                id="counterAmount"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={counterAmount}
                onChange={(e) => setCounterAmount(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="counterNote">Note (optional)</Label>
              <Textarea
                id="counterNote"
                placeholder="Explain your counter offer..."
                value={counterNote}
                onChange={(e) => setCounterNote(e.target.value)}
                className="mt-1.5"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCounterModal(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleCounterOffer}
              disabled={!counterAmount || actionLoading}
              className="bg-[#3B82F6] hover:bg-[#2563EB] text-white"
            >
              Send Counter Offer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
