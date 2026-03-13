"use client";

import { useEffect, useState, useCallback } from "react";
import {
  MapPin,
  ArrowRight,
  Calendar,
  DollarSign,
  Filter,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Package,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import type { Job } from "@/types/database";

const PAGE_SIZE = 10;

type HistoryJob = Job & { shipper_name?: string };

export default function DeliveryHistoryPage() {
  const [jobs, setJobs] = useState<HistoryJob[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [filterApplied, setFilterApplied] = useState(false);

  const loadHistory = useCallback(
    async (currentPage: number) => {
      setLoading(true);
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from("jobs")
        .select("*", { count: "exact" })
        .eq("assigned_driver_id", user.id)
        .in("status", ["delivered", "completed", "cancelled"])
        .order("completed_at", { ascending: false })
        .range(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE - 1);

      if (dateFrom) {
        query = query.gte(
          "completed_at",
          new Date(dateFrom).toISOString()
        );
      }
      if (dateTo) {
        const end = new Date(dateTo);
        end.setDate(end.getDate() + 1);
        query = query.lt("completed_at", end.toISOString());
      }

      const { data, count } = await query;

      if (data && data.length > 0) {
        const shipperIds = [...new Set(data.map((j) => j.shipper_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", shipperIds);
        const nameMap = new Map(
          profiles?.map((p) => [p.id, p.full_name]) || []
        );
        setJobs(
          data.map((j) => ({
            ...j,
            shipper_name: nameMap.get(j.shipper_id) || "Unknown",
          }))
        );
      } else {
        setJobs([]);
      }
      setTotalCount(count || 0);
      setLoading(false);
    },
    [dateFrom, dateTo]
  );

  useEffect(() => {
    loadHistory(page);
  }, [page, loadHistory]);

  function applyFilter() {
    setPage(0);
    setFilterApplied(true);
    loadHistory(0);
  }

  function clearFilter() {
    setDateFrom("");
    setDateTo("");
    setFilterApplied(false);
    setPage(0);
    loadHistory(0);
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#0F172A]">
          Delivery History
        </h1>
        <p className="mt-1 text-muted-foreground">
          View your past deliveries and earnings.
        </p>
      </div>

      {/* Date filter */}
      <Card className="rounded-xl shadow-md">
        <CardContent className="flex flex-wrap items-end gap-4 p-4">
          <div>
            <Label htmlFor="date-from" className="text-sm">
              From
            </Label>
            <Input
              id="date-from"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="mt-1 w-40"
            />
          </div>
          <div>
            <Label htmlFor="date-to" className="text-sm">
              To
            </Label>
            <Input
              id="date-to"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="mt-1 w-40"
            />
          </div>
          <Button
            variant="outline"
            onClick={applyFilter}
            disabled={!dateFrom && !dateTo}
          >
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          {filterApplied && (
            <Button variant="ghost" onClick={clearFilter}>
              Clear
            </Button>
          )}
          <div className="ml-auto text-sm text-muted-foreground">
            {totalCount} delivery{totalCount !== 1 && "ies"} found
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {loading ? (
        <HistorySkeleton />
      ) : jobs.length === 0 ? (
        <Card className="rounded-xl shadow-md">
          <CardContent className="py-16 text-center">
            <Package className="mx-auto h-12 w-12 text-muted-foreground/40" />
            <p className="mt-4 text-lg font-medium text-muted-foreground">
              No delivery history
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Completed deliveries will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => {
            const isExpanded = expandedJob === job.id;
            return (
              <Card
                key={job.id}
                className="overflow-hidden rounded-xl shadow-md"
              >
                <CardContent className="p-0">
                  <div
                    className="flex cursor-pointer items-center justify-between p-4"
                    onClick={() =>
                      setExpandedJob(isExpanded ? null : job.id)
                    }
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3">
                        <p className="font-medium text-[#0F172A]">
                          {job.title}
                        </p>
                        <Badge
                          variant={
                            job.status === "cancelled"
                              ? "destructive"
                              : "default"
                          }
                          className={
                            job.status !== "cancelled"
                              ? "bg-emerald-600"
                              : ""
                          }
                        >
                          {job.status === "cancelled"
                            ? "Cancelled"
                            : "Completed"}
                        </Badge>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {job.completed_at
                            ? formatDate(job.completed_at)
                            : job.cancelled_at
                            ? formatDate(job.cancelled_at)
                            : "N/A"}
                        </span>
                        <span>Shipper: {job.shipper_name}</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {job.pickup_address.split(",")[0]}
                          <ArrowRight className="h-3 w-3" />
                          {job.dropoff_address.split(",")[0]}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4 flex items-center gap-3">
                      {job.final_price != null && (
                        <span className="text-lg font-bold text-emerald-600">
                          {formatCurrency(job.final_price)}
                        </span>
                      )}
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t bg-muted/30 p-5">
                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm font-medium text-[#0F172A]">
                              Pickup
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {job.pickup_address}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[#0F172A]">
                              Drop-off
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {job.dropoff_address}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[#0F172A]">
                              Item
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {job.item_description}
                            </p>
                          </div>
                          {job.cancellation_reason && (
                            <div>
                              <p className="text-sm font-medium text-red-700">
                                Cancellation Reason
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {job.cancellation_reason}
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="space-y-3">
                          {job.loading_photos &&
                            job.loading_photos.length > 0 && (
                              <div>
                                <p className="text-sm font-medium text-[#0F172A]">
                                  Loading Photos
                                </p>
                                <div className="mt-1 flex gap-2">
                                  {job.loading_photos.map((_, i) => (
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
                          {job.delivery_photos &&
                            job.delivery_photos.length > 0 && (
                              <div>
                                <p className="text-sm font-medium text-[#0F172A]">
                                  Delivery Photos
                                </p>
                                <div className="mt-1 flex gap-2">
                                  {job.delivery_photos.map((_, i) => (
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
                          {job.estimated_distance_miles && (
                            <p className="text-sm text-muted-foreground">
                              Distance: {job.estimated_distance_miles.toFixed(1)} mi
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
                Prev
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page + 1} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function HistorySkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i} className="rounded-xl shadow-md">
          <CardContent className="p-4">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="mt-2 h-4 w-72" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
