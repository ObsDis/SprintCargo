"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Briefcase,
  Truck,
  DollarSign,
  Star,
  ArrowRight,
  MapPin,
  Clock,
  TrendingUp,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import type { Job, DriverProfile } from "@/types/database";

interface DashboardStats {
  availableJobs: number;
  activeDeliveries: number;
  earningsThisMonth: number;
  rating: number;
  totalDeliveries: number;
}

export default function DriverDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activeJobs, setActiveJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch driver profile
      const { data: driverProfile } = await supabase
        .from("driver_profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      // Fetch available jobs count (posted/quoted)
      const { count: availableCount } = await supabase
        .from("jobs")
        .select("*", { count: "exact", head: true })
        .in("status", ["posted", "quoted"]);

      // Fetch active deliveries
      const { data: activeData, count: activeCount } = await supabase
        .from("jobs")
        .select("*", { count: "exact" })
        .eq("assigned_driver_id", user.id)
        .in("status", [
          "accepted",
          "driver_en_route_pickup",
          "at_pickup",
          "loaded",
          "in_transit",
          "at_dropoff",
        ])
        .order("updated_at", { ascending: false })
        .limit(3);

      // Fetch earnings this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: completedJobs } = await supabase
        .from("jobs")
        .select("final_price")
        .eq("assigned_driver_id", user.id)
        .in("status", ["delivered", "completed"])
        .gte("completed_at", startOfMonth.toISOString());

      const earningsThisMonth =
        completedJobs?.reduce((sum, j) => sum + (j.final_price || 0), 0) || 0;

      setStats({
        availableJobs: availableCount || 0,
        activeDeliveries: activeCount || 0,
        earningsThisMonth,
        rating: driverProfile?.rating || 0,
        totalDeliveries: driverProfile?.total_deliveries || 0,
      });
      setActiveJobs(activeData || []);
      setLoading(false);
    }

    loadDashboard();
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
  }

  const statCards = [
    {
      title: "Available Jobs",
      value: stats?.availableJobs.toString() || "0",
      icon: Briefcase,
      href: "/dashboard/driver/bids",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Active Deliveries",
      value: stats?.activeDeliveries.toString() || "0",
      icon: Truck,
      href: "/dashboard/driver/deliveries",
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
    {
      title: "Earnings This Month",
      value: formatCurrency(stats?.earningsThisMonth || 0),
      icon: DollarSign,
      href: "/dashboard/driver/payment-settings/disbursements",
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      title: "Rating",
      value: stats?.rating ? `${stats.rating.toFixed(1)} / 5.0` : "N/A",
      subtitle: `${stats?.totalDeliveries || 0} deliveries`,
      icon: Star,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
    },
  ];

  const quickActions = [
    {
      label: "Browse Available Jobs",
      href: "/dashboard/driver/bids",
      icon: Briefcase,
      description: "Find new delivery opportunities nearby",
    },
    {
      label: "Edit Rate Card",
      href: "/dashboard/driver/rate-card",
      icon: DollarSign,
      description: "Adjust your pricing and surcharges",
    },
    {
      label: "View Earnings",
      href: "/dashboard/driver/payment-settings/disbursements",
      icon: TrendingUp,
      description: "Track your disbursements and payouts",
    },
    {
      label: "Update Profile",
      href: "/dashboard/driver/profile",
      icon: Truck,
      description: "Manage vehicle info and service area",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[#0F172A]">Driver Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Welcome back. Here is your overview.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.title} className="rounded-xl shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </p>
                  <p className="mt-1 text-2xl font-bold text-[#0F172A]">
                    {card.value}
                  </p>
                  {card.subtitle && (
                    <p className="text-xs text-muted-foreground">
                      {card.subtitle}
                    </p>
                  )}
                </div>
                <div className={`rounded-full p-3 ${card.bgColor}`}>
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                </div>
              </div>
              {card.href && (
                <Link
                  href={card.href}
                  className="mt-3 flex items-center text-sm font-medium text-[#3B82F6] hover:underline"
                >
                  View details
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Active Deliveries */}
      <Card className="rounded-xl shadow-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-[#0F172A]">Active Deliveries</CardTitle>
          <Link href="/dashboard/driver/deliveries">
            <Button variant="outline" size="sm">
              View All
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {activeJobs.length === 0 ? (
            <div className="py-12 text-center">
              <Truck className="mx-auto h-12 w-12 text-muted-foreground/40" />
              <p className="mt-4 text-muted-foreground">
                No active deliveries right now.
              </p>
              <Link href="/dashboard/driver/bids">
                <Button className="mt-4 bg-[#3B82F6] hover:bg-[#2563EB]">
                  Browse Available Jobs
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {activeJobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-[#0F172A]">{job.title}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {job.pickup_address.split(",")[0]}
                      </span>
                      <ArrowRight className="h-3 w-3" />
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {job.dropoff_address.split(",")[0]}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4 flex items-center gap-3">
                    <StatusBadge status={job.status} />
                    <Link href="/dashboard/driver/deliveries">
                      <Button size="sm" variant="outline">
                        Manage
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-[#0F172A]">
          Quick Actions
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href}>
              <Card className="h-full rounded-xl shadow-md transition-shadow hover:shadow-lg">
                <CardContent className="flex items-start gap-4 p-5">
                  <div className="rounded-full bg-[#3B82F6]/10 p-2.5">
                    <action.icon className="h-5 w-5 text-[#3B82F6]" />
                  </div>
                  <div>
                    <p className="font-medium text-[#0F172A]">
                      {action.label}
                    </p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {action.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    accepted: { label: "Accepted", variant: "default" },
    driver_en_route_pickup: { label: "En Route to Pickup", variant: "secondary" },
    at_pickup: { label: "At Pickup", variant: "secondary" },
    loaded: { label: "Loaded", variant: "default" },
    in_transit: { label: "In Transit", variant: "default" },
    at_dropoff: { label: "At Drop-off", variant: "secondary" },
  };
  const info = map[status] || { label: status, variant: "outline" as const };
  return <Badge variant={info.variant}>{info.label}</Badge>;
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-9 w-56" />
        <Skeleton className="mt-2 h-5 w-72" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="rounded-xl shadow-md">
            <CardContent className="p-6">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-2 h-8 w-20" />
              <Skeleton className="mt-3 h-4 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="rounded-xl shadow-md">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
