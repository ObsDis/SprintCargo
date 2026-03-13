"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
  ArrowLeft,
  MapPin,
  Package,
  Clock,
  AlertTriangle,
  Users,
  Zap,
  Star,
  Truck,
  User,
  Check,
  X,
  RefreshCw,
  Timer,
  Image,
  MessageCircle,
} from "lucide-react";
import { toast } from "sonner";

interface DriverInfo {
  full_name: string;
  rating: number;
  total_deliveries: number;
}

type QuoteWithDriver = JobQuote & { driver_profile?: DriverInfo };

const SIZE_LABELS: Record<string, string> = {
  small: "Small",
  medium: "Medium",
  large: "Large",
  oversized: "Oversized",
};

const SPEED_LABELS: Record<string, string> = {
  standard: "Standard",
  same_day: "Same Day",
  rush: "Rush",
};

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  posted: { label: "Awaiting Quotes", className: "bg-blue-100 text-blue-700" },
  quoted: { label: "Quotes Received", className: "bg-indigo-100 text-indigo-700" },
  accepted: { label: "Accepted", className: "bg-green-100 text-green-700" },
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
      if (diff <= 0) { setTimeLeft("Expired"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setTimeLeft(h > 0 ? `${h}h ${m}m` : `${m}m`);
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [expiresAt]);
  const isUrgent = new Date(expiresAt).getTime() - Date.now() < 3600000;
  return (
    <span className={cn("text-xs flex items-center gap-1", isUrgent ? "text-red-600" : "text-gray-500")}>
      <Timer className="h-3 w-3" />{timeLeft}
    </span>
  );
}

export default function JobBidDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId as string;
  const [job, setJob] = useState<Job | null>(null);
  const [quotes, setQuotes] = useState<QuoteWithDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [counterModal, setCounterModal] = useState<{ quoteId: string; currentAmount: number } | null>(null);
  const [counterAmount, setCounterAmount] = useState("");
  const [counterNote, setCounterNote] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async () => {
    const supabase = createClient();
    const { data: jobData, error: jobError } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", jobId)
      .single();

    if (jobError || !jobData) {
      toast.error("Job not found");
      setLoading(false);
      return;
    }
    setJob(jobData as Job);

    const { data: quotesData } = await supabase
      .from("job_quotes")
      .select("*")
      .eq("job_id", jobId)
      .order("created_at", { ascending: false });

    const allQuotes = (quotesData ?? []) as JobQuote[];
    const driverIds = [...new Set(allQuotes.map((q) => q.driver_id))];
    let driversMap: Record<string, DriverInfo> = {};

    if (driverIds.length > 0) {
      const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", driverIds);
      const { data: dps } = await supabase.from("driver_profiles").select("id, rating, total_deliveries").in("id", driverIds);
      (profiles ?? []).forEach((p) => {
        const dp = (dps ?? []).find((d) => d.id === p.id);
        driversMap[p.id] = { full_name: p.full_name, rating: dp?.rating ?? 0, total_deliveries: dp?.total_deliveries ?? 0 };
      });
    }

    setQuotes(allQuotes.map((q) => ({ ...q, driver_profile: driversMap[q.driver_id] })));
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [jobId]);

  const handleAccept = async (quoteId: string) => {
    setActionLoading(true);
    const supabase = createClient();
    const quote = quotes.find((q) => q.id === quoteId);
    await supabase.from("job_quotes").update({ status: "accepted" as QuoteStatus }).eq("id", quoteId);
    await supabase.from("jobs").update({ status: "accepted", accepted_quote_id: quoteId, assigned_driver_id: quote?.driver_id }).eq("id", jobId);
    toast.success("Quote accepted!");
    setActionLoading(false);
    fetchData();
  };

  const handleDecline = async (quoteId: string) => {
    setActionLoading(true);
    const supabase = createClient();
    await supabase.from("job_quotes").update({ status: "declined" as QuoteStatus }).eq("id", quoteId);
    toast.success("Quote declined.");
    setActionLoading(false);
    fetchData();
  };

  const handleCounter = async () => {
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
    fetchData();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
          </div>
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-16">
        <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 font-medium">Job not found</p>
        <Link href="/dashboard/shipper/shipment-bids">
          <Button className="mt-4" variant="outline">Go Back</Button>
        </Link>
      </div>
    );
  }

  const statusConfig = STATUS_BADGE[job.status] ?? { label: job.status, className: "bg-gray-100 text-gray-700" };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-1 text-gray-500">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[#0F172A]">{job.title}</h1>
            <Badge variant="secondary" className={cn("text-xs", statusConfig.className)}>{statusConfig.label}</Badge>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">Posted {formatRelativeTime(job.created_at)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Job Details */}
        <div className="lg:col-span-2 space-y-4">
          {/* Map Placeholder */}
          <Card className="rounded-xl shadow-sm border-0 bg-white overflow-hidden">
            <div className="h-56 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <MapPin className="h-10 w-10 mx-auto mb-2" />
                <p className="text-sm font-medium">Route Map</p>
                <p className="text-xs">Map preview will appear here</p>
              </div>
            </div>
          </Card>

          {/* Pickup & Dropoff */}
          <Card className="rounded-xl shadow-sm border-0 bg-white">
            <CardContent className="p-5 space-y-4">
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                    <div className="h-3 w-3 rounded-full bg-green-500" />
                  </div>
                  <div className="w-0.5 flex-1 bg-gray-200 my-1" />
                  <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                    <div className="h-3 w-3 rounded-full bg-red-500" />
                  </div>
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Pickup</p>
                    <p className="font-medium text-[#0F172A] mt-0.5">{job.pickup_address}</p>
                    <p className="text-sm text-gray-500">{job.pickup_contact_name} &middot; {job.pickup_contact_phone}</p>
                    {job.pickup_notes && <p className="text-sm text-gray-400 mt-0.5">{job.pickup_notes}</p>}
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(job.pickup_window_start, "MMM d, h:mm a")} - {formatDate(job.pickup_window_end, "h:mm a")}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Drop-off</p>
                    <p className="font-medium text-[#0F172A] mt-0.5">{job.dropoff_address}</p>
                    <p className="text-sm text-gray-500">{job.dropoff_contact_name} &middot; {job.dropoff_contact_phone}</p>
                    {job.dropoff_notes && <p className="text-sm text-gray-400 mt-0.5">{job.dropoff_notes}</p>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Item Details */}
          <Card className="rounded-xl shadow-sm border-0 bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-[#0F172A] flex items-center gap-2">
                <Package className="h-4 w-4 text-[#3B82F6]" /> Item Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-700">{job.item_description}</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{SIZE_LABELS[job.size_category] ?? job.size_category}</Badge>
                {job.estimated_weight_lbs && <Badge variant="secondary">{job.estimated_weight_lbs} lbs</Badge>}
                <Badge variant="secondary">{job.num_items} item(s)</Badge>
                <Badge variant="secondary">{SPEED_LABELS[job.delivery_speed] ?? job.delivery_speed}</Badge>
                {job.fragile && <Badge variant="secondary" className="bg-amber-100 text-amber-700"><AlertTriangle className="h-3 w-3 mr-1" />Fragile</Badge>}
                {job.requires_helpers && <Badge variant="secondary" className="bg-blue-100 text-blue-700"><Users className="h-3 w-3 mr-1" />Helpers</Badge>}
              </div>
              {job.special_instructions && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-100">
                  <p className="text-xs font-medium text-amber-800">Special Instructions</p>
                  <p className="text-sm text-amber-700 mt-0.5">{job.special_instructions}</p>
                </div>
              )}
              {job.item_photos && job.item_photos.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2">Photos</p>
                  <div className="flex gap-2 flex-wrap">
                    {job.item_photos.map((photo, i) => (
                      <div key={i} className="h-20 w-20 rounded-lg bg-gray-100 border flex items-center justify-center overflow-hidden">
                        <img src={photo} alt={`Item ${i + 1}`} className="h-full w-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {(!job.item_photos || job.item_photos.length === 0) && (
                <div className="flex gap-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-20 w-20 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center">
                      <Image className="h-5 w-5 text-gray-300" />
                    </div>
                  ))}
                </div>
              )}
              {job.estimated_price_low != null && job.estimated_price_high != null && (
                <div className="p-4 rounded-lg bg-gradient-to-r from-[#0F172A] to-[#1E293B] text-white">
                  <p className="text-xs text-blue-200 mb-0.5">Estimated Price Range</p>
                  <p className="text-xl font-bold">{formatCurrency(job.estimated_price_low)} &ndash; {formatCurrency(job.estimated_price_high)}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Quotes */}
        <div className="space-y-4">
          <Card className="rounded-xl shadow-sm border-0 bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-[#0F172A] flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-[#3B82F6]" />
                Quotes ({quotes.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {quotes.length === 0 ? (
                <div className="py-8 text-center">
                  <Clock className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Waiting for driver quotes...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {quotes.map((quote) => {
                    const qs = QUOTE_STATUS_MAP[quote.status] ?? { label: quote.status, className: "bg-gray-100" };
                    const isActionable = ["pending", "countered_by_driver"].includes(quote.status);
                    return (
                      <div key={quote.id} className={cn("p-4 rounded-lg border", isActionable ? "border-[#3B82F6]/20 bg-blue-50/20" : "border-gray-100")}>
                        <div className="flex items-center gap-3 mb-2">
                          <div className="h-9 w-9 rounded-full bg-[#0F172A]/10 flex items-center justify-center shrink-0">
                            <User className="h-4 w-4 text-[#0F172A]/60" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-[#0F172A] truncate">{quote.driver_profile?.full_name ?? "Driver"}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              {quote.driver_profile && (
                                <span className="flex items-center gap-0.5 text-amber-600">
                                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />{quote.driver_profile.rating.toFixed(1)}
                                </span>
                              )}
                              {quote.driver_profile && <span>{quote.driver_profile.total_deliveries} trips</span>}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xl font-bold text-[#0F172A]">{formatCurrency(quote.driver_counter_amount ?? quote.amount)}</p>
                          <Badge variant="secondary" className={cn("text-xs", qs.className)}>{qs.label}</Badge>
                        </div>

                        {quote.driver_note && <p className="text-xs text-gray-600 mb-2">{quote.driver_note}</p>}
                        {quote.estimated_pickup_eta_minutes && (
                          <p className="text-xs text-gray-500 mb-2 flex items-center gap-1"><Truck className="h-3 w-3" />ETA: {quote.estimated_pickup_eta_minutes} min</p>
                        )}

                        {/* Negotiation thread */}
                        {(quote.shipper_counter_amount || quote.driver_counter_amount) && (
                          <div className="border-t border-gray-100 pt-2 mt-2 space-y-1">
                            <p className="text-xs font-medium text-gray-400">Negotiation</p>
                            <p className="text-xs text-gray-600">Original: {formatCurrency(quote.amount)}</p>
                            {quote.shipper_counter_amount && (
                              <p className="text-xs text-purple-600">You: {formatCurrency(quote.shipper_counter_amount)} {quote.shipper_counter_note && `- "${quote.shipper_counter_note}"`}</p>
                            )}
                            {quote.driver_counter_amount && (
                              <p className="text-xs text-orange-600">Driver: {formatCurrency(quote.driver_counter_amount)} {quote.driver_counter_note && `- "${quote.driver_counter_note}"`}</p>
                            )}
                          </div>
                        )}

                        <div className="mt-2">
                          <ExpirationCountdown expiresAt={quote.expires_at} />
                        </div>

                        {isActionable && (
                          <div className="flex gap-2 mt-3 pt-2 border-t border-gray-100">
                            <Button size="sm" onClick={() => handleAccept(quote.id)} disabled={actionLoading} className="bg-green-600 hover:bg-green-700 text-white text-xs flex-1 gap-1">
                              <Check className="h-3 w-3" />Accept
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setCounterModal({ quoteId: quote.id, currentAmount: quote.driver_counter_amount ?? quote.amount })} disabled={actionLoading} className="text-xs flex-1 gap-1 text-[#3B82F6] border-[#3B82F6]/30">
                              <RefreshCw className="h-3 w-3" />Counter
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleDecline(quote.id)} disabled={actionLoading} className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 gap-1">
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Counter Offer Modal */}
      <Dialog open={!!counterModal} onOpenChange={() => setCounterModal(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Counter Offer</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            {counterModal && (
              <p className="text-sm text-gray-500">Current quote: <span className="font-semibold text-[#0F172A]">{formatCurrency(counterModal.currentAmount)}</span></p>
            )}
            <div>
              <Label htmlFor="counterAmt">Your Offer ($)</Label>
              <Input id="counterAmt" type="number" min="0" step="0.01" placeholder="0.00" value={counterAmount} onChange={(e) => setCounterAmount(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="counterNt">Note (optional)</Label>
              <Textarea id="counterNt" placeholder="Explain your counter offer..." value={counterNote} onChange={(e) => setCounterNote(e.target.value)} className="mt-1.5" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCounterModal(null)}>Cancel</Button>
            <Button onClick={handleCounter} disabled={!counterAmount || actionLoading} className="bg-[#3B82F6] hover:bg-[#2563EB] text-white">Send Counter Offer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
