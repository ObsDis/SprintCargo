"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { cn, formatCurrency, formatDate, formatRelativeTime } from "@/lib/utils";
import type { Job, JobStatus } from "@/types/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Package,
  MessageSquareQuote,
  DollarSign,
  CheckCircle2,
  ArrowRight,
  Plus,
  MapPin,
  Clock,
  Eye,
} from "lucide-react";

interface DashboardStats {
  activeShipments: number;
  pendingQuotes: number;
  totalSpentThisMonth: number;
  completedDeliveries: number;
}

const STATUS_BADGE_MAP: Record<
  string,
  { label: string; className: string }
> = {
  draft: { label: "Draft", className: "bg-gray-100 text-gray-700" },
  posted: { label: "Posted", className: "bg-blue-100 text-blue-700" },
  quoted: { label: "Quoted", className: "bg-indigo-100 text-indigo-700" },
  accepted: { label: "Accepted", className: "bg-emerald-100 text-emerald-700" },
  driver_en_route_pickup: { label: "Driver En Route", className: "bg-amber-100 text-amber-700" },
  at_pickup: { label: "At Pickup", className: "bg-orange-100 text-orange-700" },
  loaded: { label: "Loaded", className: "bg-cyan-100 text-cyan-700" },
  in_transit: { label: "In Transit", className: "bg-purple-100 text-purple-700" },
  at_dropoff: { label: "At Dropoff", className: "bg-teal-100 text-teal-700" },
  delivered: { label: "Delivered", className: "bg-green-100 text-green-700" },
  completed: { label: "Completed", className: "bg-green-100 text-green-700" },
  cancelled: { label: "Cancelled", className: "bg-red-100 text-red-700" },
  disputed: { label: "Disputed", className: "bg-rose-100 text-rose-700" },
};

function StatusBadge({ status }: { status: JobStatus }) {
  const config = STATUS_BADGE_MAP[status] ?? {
    label: status,
    className: "bg-gray-100 text-gray-700",
  };
  return (
    <Badge variant="secondary" className={cn("text-xs font-medium", config.className)}>
      {config.label}
    </Badge>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  loading,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  loading: boolean;
}) {
  return (
    <Card className="rounded-xl shadow-sm border-0 bg-white">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            {loading ? (
              <Skeleton className="h-8 w-24 mt-1" />
            ) : (
              <p className="text-2xl font-bold text-[#0F172A] mt-1">{value}</p>
            )}
          </div>
          <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center">
            <Icon className="h-6 w-6 text-[#3B82F6]" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ShipperDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    activeShipments: 0,
    pendingQuotes: 0,
    totalSpentThisMonth: 0,
    completedDeliveries: 0,
  });
  const [activeJobs, setActiveJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const activeStatuses: JobStatus[] = [
        "posted",
        "quoted",
        "accepted",
        "driver_en_route_pickup",
        "at_pickup",
        "loaded",
        "in_transit",
        "at_dropoff",
      ];

      const [jobsResult, quotedResult, completedResult] = await Promise.all([
        supabase
          .from("jobs")
          .select("*")
          .eq("shipper_id", user.id)
          .in("status", activeStatuses)
          .order("created_at", { ascending: false }),
        supabase
          .from("jobs")
          .select("id", { count: "exact", head: true })
          .eq("shipper_id", user.id)
          .in("status", ["posted", "quoted"]),
        supabase
          .from("jobs")
          .select("final_price")
          .eq("shipper_id", user.id)
          .eq("status", "completed"),
      ]);

      const jobs = (jobsResult.data as Job[]) ?? [];
      const pendingQuotes = quotedResult.count ?? 0;

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const monthlyResult = await supabase
        .from("jobs")
        .select("final_price")
        .eq("shipper_id", user.id)
        .eq("status", "completed")
        .gte("completed_at", startOfMonth);

      const monthlySpent = (monthlyResult.data ?? []).reduce(
        (sum, j) => sum + (j.final_price ?? 0),
        0
      );

      setStats({
        activeShipments: jobs.length,
        pendingQuotes,
        totalSpentThisMonth: monthlySpent,
        completedDeliveries: completedResult.data?.length ?? 0,
      });
      setActiveJobs(jobs);
      setLoading(false);
    }

    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Dashboard</h1>
          <p className="text-gray-500 mt-1">Overview of your shipping activity</p>
        </div>
        <Link href="/dashboard/shipper/create-shipment">
          <Button className="bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-lg">
            <Plus className="h-4 w-4 mr-2" />
            New Shipment
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Shipments"
          value={stats.activeShipments}
          icon={Package}
          loading={loading}
        />
        <StatCard
          title="Pending Quotes"
          value={stats.pendingQuotes}
          icon={MessageSquareQuote}
          loading={loading}
        />
        <StatCard
          title="Spent This Month"
          value={formatCurrency(stats.totalSpentThisMonth)}
          icon={DollarSign}
          loading={loading}
        />
        <StatCard
          title="Completed Deliveries"
          value={stats.completedDeliveries}
          icon={CheckCircle2}
          loading={loading}
        />
      </div>

      {/* Active Shipments */}
      <Card className="rounded-xl shadow-sm border-0 bg-white">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-[#0F172A]">
              Active Shipments
            </CardTitle>
            <Link
              href="/dashboard/shipper/shipment-bids"
              className="text-sm text-[#3B82F6] hover:underline flex items-center gap-1"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-lg border">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-72" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          ) : activeJobs.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No active shipments</p>
              <p className="text-sm text-gray-400 mt-1">
                Create your first shipment to get started
              </p>
              <Link href="/dashboard/shipper/create-shipment">
                <Button className="mt-4 bg-[#3B82F6] hover:bg-[#2563EB] text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Shipment
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {activeJobs.map((job) => (
                <Link
                  key={job.id}
                  href={`/dashboard/shipper/shipment-bids/${job.id}`}
                  className="flex items-center gap-4 p-4 rounded-lg border border-gray-100 hover:border-[#3B82F6]/30 hover:bg-blue-50/30 transition-all group"
                >
                  <div className="h-12 w-12 rounded-lg bg-[#0F172A]/5 flex items-center justify-center shrink-0">
                    <Package className="h-5 w-5 text-[#0F172A]/60" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[#0F172A] truncate">{job.title}</p>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1 truncate">
                        <MapPin className="h-3 w-3 shrink-0" />
                        {job.pickup_address.split(",")[0]}
                      </span>
                      <ArrowRight className="h-3 w-3 shrink-0 text-gray-300" />
                      <span className="truncate">
                        {job.dropoff_address.split(",")[0]}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right hidden sm:block">
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock className="h-3 w-3" />
                        {formatRelativeTime(job.created_at)}
                      </div>
                    </div>
                    <StatusBadge status={job.status} />
                    <Eye className="h-4 w-4 text-gray-300 group-hover:text-[#3B82F6] transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
