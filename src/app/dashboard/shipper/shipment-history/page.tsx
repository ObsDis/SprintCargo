"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn, formatCurrency, formatDate, formatRelativeTime } from "@/lib/utils";
import type { Job, JobStatus } from "@/types/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Package,
  MapPin,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Image,
  Calendar,
  Filter,
  User,
  DollarSign,
  Clock,
  Truck,
  CheckCircle2,
  XCircle,
  History,
} from "lucide-react";

type JobWithDriver = Job & { driver_name?: string };

const HISTORY_STATUSES: JobStatus[] = ["delivered", "completed", "cancelled"];

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  delivered: { label: "Delivered", className: "bg-green-100 text-green-700" },
  completed: { label: "Completed", className: "bg-green-100 text-green-700" },
  cancelled: { label: "Cancelled", className: "bg-red-100 text-red-700" },
};

const PAGE_SIZE = 10;

export default function ShipmentHistoryPage() {
  const [jobs, setJobs] = useState<JobWithDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchJobs = useCallback(async (pageNum: number) => {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    let query = supabase
      .from("jobs")
      .select("*", { count: "exact" })
      .eq("shipper_id", user.id)
      .order("created_at", { ascending: false })
      .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1);

    if (statusFilter === "all") {
      query = query.in("status", HISTORY_STATUSES);
    } else {
      query = query.eq("status", statusFilter as JobStatus);
    }

    if (dateFrom) {
      query = query.gte("created_at", new Date(dateFrom).toISOString());
    }
    if (dateTo) {
      const end = new Date(dateTo);
      end.setDate(end.getDate() + 1);
      query = query.lt("created_at", end.toISOString());
    }

    const { data, count, error } = await query;
    if (error) { setLoading(false); return; }

    const jobsData = (data ?? []) as Job[];
    setTotalCount(count ?? 0);
    setHasMore(jobsData.length === PAGE_SIZE);

    // Fetch driver names
    const driverIds = [...new Set(jobsData.map((j) => j.assigned_driver_id).filter(Boolean))] as string[];
    let driverMap: Record<string, string> = {};
    if (driverIds.length > 0) {
      const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", driverIds);
      (profiles ?? []).forEach((p) => { driverMap[p.id] = p.full_name; });
    }

    setJobs(jobsData.map((j) => ({ ...j, driver_name: j.assigned_driver_id ? driverMap[j.assigned_driver_id] : undefined })));
    setLoading(false);
  }, [statusFilter, dateFrom, dateTo]);

  useEffect(() => {
    setPage(0);
    fetchJobs(0);
  }, [fetchJobs]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchJobs(newPage);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A]">Shipment History</h1>
        <p className="text-gray-500 mt-1">View your past and cancelled shipments</p>
      </div>

      {/* Filters */}
      <Card className="rounded-xl shadow-sm border-0 bg-white">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Filter className="h-4 w-4" />
              Filters
            </div>
            <div className="w-44">
              <Label className="text-xs text-gray-500">Status</Label>
              <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val ?? "all")}>
                <SelectTrigger className="mt-1 h-9">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-40">
              <Label className="text-xs text-gray-500">From Date</Label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="mt-1 h-9" />
            </div>
            <div className="w-40">
              <Label className="text-xs text-gray-500">To Date</Label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="mt-1 h-9" />
            </div>
            {(statusFilter !== "all" || dateFrom || dateTo) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setStatusFilter("all"); setDateFrom(""); setDateTo(""); }}
                className="text-xs text-gray-500"
              >
                Clear filters
              </Button>
            )}
            <div className="flex-1" />
            <p className="text-sm text-gray-400">{totalCount} result{totalCount !== 1 ? "s" : ""}</p>
          </div>
        </CardContent>
      </Card>

      {/* Jobs List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="rounded-xl shadow-sm border-0 bg-white">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-72" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <Card className="rounded-xl shadow-sm border-0 bg-white">
          <CardContent className="py-16 text-center">
            <History className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No shipment history</p>
            <p className="text-sm text-gray-400 mt-1">Completed and cancelled shipments will appear here</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => {
            const isExpanded = expandedJob === job.id;
            const badge = STATUS_BADGE[job.status] ?? { label: job.status, className: "bg-gray-100 text-gray-700" };

            return (
              <Card key={job.id} className="rounded-xl shadow-sm border-0 bg-white overflow-hidden">
                <CardContent className="p-0">
                  <button
                    type="button"
                    onClick={() => setExpandedJob(isExpanded ? null : job.id)}
                    className="w-full p-5 flex items-center gap-4 text-left hover:bg-gray-50/50 transition-colors"
                  >
                    <div className={cn(
                      "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
                      job.status === "cancelled" ? "bg-red-50" : "bg-green-50"
                    )}>
                      {job.status === "cancelled" ? (
                        <XCircle className="h-5 w-5 text-red-400" />
                      ) : (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#0F172A] truncate">{job.title}</p>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(job.created_at)}
                        </span>
                        {job.driver_name && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {job.driver_name}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {job.final_price != null && (
                        <p className="font-semibold text-[#0F172A]">{formatCurrency(job.final_price)}</p>
                      )}
                      <Badge variant="secondary" className={cn("text-xs", badge.className)}>{badge.label}</Badge>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t px-5 pb-5 pt-4 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-3 rounded-lg bg-gray-50 space-y-1">
                          <p className="text-xs font-medium text-gray-400 uppercase">Pickup</p>
                          <p className="text-sm font-medium text-[#0F172A]">{job.pickup_address}</p>
                          <p className="text-xs text-gray-500">{job.pickup_contact_name} &middot; {job.pickup_contact_phone}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-gray-50 space-y-1">
                          <p className="text-xs font-medium text-gray-400 uppercase">Drop-off</p>
                          <p className="text-sm font-medium text-[#0F172A]">{job.dropoff_address}</p>
                          <p className="text-xs text-gray-500">{job.dropoff_contact_name} &middot; {job.dropoff_contact_phone}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">{job.size_category}</Badge>
                        <Badge variant="secondary">{job.delivery_speed.replace("_", " ")}</Badge>
                        <Badge variant="secondary">{job.num_items} item(s)</Badge>
                        {job.estimated_weight_lbs && <Badge variant="secondary">{job.estimated_weight_lbs} lbs</Badge>}
                      </div>

                      {/* Delivery Photos */}
                      {job.delivery_photos && job.delivery_photos.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-2">Delivery Photos</p>
                          <div className="flex gap-2 flex-wrap">
                            {job.delivery_photos.map((photo, i) => (
                              <div key={i} className="h-24 w-24 rounded-lg bg-gray-100 border overflow-hidden">
                                <img src={photo} alt={`Delivery ${i + 1}`} className="h-full w-full object-cover" />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Tracking Info */}
                      {job.completed_at && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Clock className="h-4 w-4" />
                          Completed {formatDate(job.completed_at, "MMM d, yyyy 'at' h:mm a")}
                        </div>
                      )}
                      {job.cancelled_at && (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-red-500">
                            <XCircle className="h-4 w-4" />
                            Cancelled {formatDate(job.cancelled_at, "MMM d, yyyy 'at' h:mm a")}
                          </div>
                          {job.cancellation_reason && (
                            <p className="text-sm text-gray-500 ml-6">Reason: {job.cancellation_reason}</p>
                          )}
                        </div>
                      )}

                      {job.estimated_distance_miles && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Truck className="h-4 w-4" />
                          {job.estimated_distance_miles.toFixed(1)} miles
                          {job.estimated_duration_minutes && ` (${Math.round(job.estimated_duration_minutes)} min)`}
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

      {/* Pagination */}
      {totalCount > PAGE_SIZE && (
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 0}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-500">
            Page {page + 1} of {Math.ceil(totalCount / PAGE_SIZE)}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(page + 1)}
            disabled={!hasMore}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
