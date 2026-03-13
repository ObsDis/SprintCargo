"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  MapPin,
  ArrowRight,
  Navigation,
  Camera,
  CheckCircle2,
  Truck,
  Package,
  Clock,
  Loader2,
  X,
  User,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { JOB_STATUSES } from "@/lib/constants";
import type { Job, JobStatus } from "@/types/database";

type JobWithShipper = Job & { shipper_name?: string };

const STATUS_STEPS: JobStatus[] = [
  "accepted",
  "driver_en_route_pickup",
  "at_pickup",
  "loaded",
  "in_transit",
  "at_dropoff",
  "delivered",
];

const STEP_LABELS: Record<string, string> = {
  accepted: "Accepted",
  driver_en_route_pickup: "En Route",
  at_pickup: "At Pickup",
  loaded: "Loaded",
  in_transit: "In Transit",
  at_dropoff: "At Drop-off",
  delivered: "Delivered",
};

export default function DeliveriesPage() {
  const [jobs, setJobs] = useState<JobWithShipper[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingJob, setUpdatingJob] = useState<string | null>(null);
  const [photoPreviews, setPhotoPreviews] = useState<Record<string, string[]>>(
    {}
  );
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const loadJobs = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("jobs")
      .select("*")
      .eq("assigned_driver_id", user.id)
      .in("status", [
        "accepted",
        "driver_en_route_pickup",
        "at_pickup",
        "loaded",
        "in_transit",
        "at_dropoff",
      ])
      .order("updated_at", { ascending: false });

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
    setLoading(false);
  }, []);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  async function updateJobStatus(jobId: string, newStatus: JobStatus) {
    setUpdatingJob(jobId);
    const supabase = createClient();
    const updateData: Record<string, unknown> = { status: newStatus };
    if (newStatus === "delivered") {
      updateData.completed_at = new Date().toISOString();
    }
    await supabase.from("jobs").update(updateData).eq("id", jobId);
    await loadJobs();
    setUpdatingJob(null);
  }

  function handleFileSelect(
    jobId: string,
    type: "loading" | "delivery",
    files: FileList | null
  ) {
    if (!files) return;
    const previews: string[] = [];
    Array.from(files).forEach((file) => {
      const url = URL.createObjectURL(file);
      previews.push(url);
    });
    setPhotoPreviews((prev) => ({
      ...prev,
      [`${jobId}-${type}`]: [
        ...(prev[`${jobId}-${type}`] || []),
        ...previews,
      ],
    }));
  }

  function removePhoto(jobId: string, type: string, index: number) {
    setPhotoPreviews((prev) => {
      const key = `${jobId}-${type}`;
      const updated = [...(prev[key] || [])];
      URL.revokeObjectURL(updated[index]);
      updated.splice(index, 1);
      return { ...prev, [key]: updated };
    });
  }

  function getActionButtons(job: JobWithShipper) {
    const isUpdating = updatingJob === job.id;
    const btnClass = "bg-[#3B82F6] hover:bg-[#2563EB]";

    switch (job.status) {
      case "accepted":
        return (
          <Button
            className={btnClass}
            disabled={isUpdating}
            onClick={() =>
              updateJobStatus(job.id, "driver_en_route_pickup")
            }
          >
            {isUpdating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Navigation className="mr-2 h-4 w-4" />
            )}
            Start Navigation to Pickup
          </Button>
        );

      case "driver_en_route_pickup":
        return (
          <Button
            className={btnClass}
            disabled={isUpdating}
            onClick={() => updateJobStatus(job.id, "at_pickup")}
          >
            {isUpdating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <MapPin className="mr-2 h-4 w-4" />
            )}
            Arrived at Pickup
          </Button>
        );

      case "at_pickup":
        return (
          <div className="space-y-3">
            <div>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                ref={(el) => {
                  fileInputRefs.current[`${job.id}-loading`] = el;
                }}
                onChange={(e) =>
                  handleFileSelect(job.id, "loading", e.target.files)
                }
              />
              <Button
                variant="outline"
                onClick={() =>
                  fileInputRefs.current[`${job.id}-loading`]?.click()
                }
              >
                <Camera className="mr-2 h-4 w-4" />
                Upload Loading Photos
              </Button>
              {photoPreviews[`${job.id}-loading`]?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {photoPreviews[`${job.id}-loading`].map((url, i) => (
                    <div key={i} className="group relative">
                      <img
                        src={url}
                        alt={`Loading photo ${i + 1}`}
                        className="h-16 w-16 rounded-lg border object-cover"
                      />
                      <button
                        onClick={() => removePhoto(job.id, "loading", i)}
                        className="absolute -right-1 -top-1 hidden rounded-full bg-destructive p-0.5 text-destructive-foreground group-hover:block"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Button
              className={btnClass}
              disabled={isUpdating}
              onClick={() => updateJobStatus(job.id, "loaded")}
            >
              {isUpdating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              Confirm Loaded
            </Button>
          </div>
        );

      case "loaded":
      case "in_transit":
        return (
          <div className="space-y-3">
            {/* Map placeholder */}
            <div className="flex h-32 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50">
              <p className="text-sm text-muted-foreground">
                Live map tracking
              </p>
            </div>
            <Button
              className={btnClass}
              disabled={isUpdating}
              onClick={() => updateJobStatus(job.id, "at_dropoff")}
            >
              {isUpdating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <MapPin className="mr-2 h-4 w-4" />
              )}
              Arrived at Drop-off
            </Button>
          </div>
        );

      case "at_dropoff":
        return (
          <div className="space-y-3">
            <div>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                ref={(el) => {
                  fileInputRefs.current[`${job.id}-delivery`] = el;
                }}
                onChange={(e) =>
                  handleFileSelect(job.id, "delivery", e.target.files)
                }
              />
              <Button
                variant="outline"
                onClick={() =>
                  fileInputRefs.current[`${job.id}-delivery`]?.click()
                }
              >
                <Camera className="mr-2 h-4 w-4" />
                Upload Delivery Photos
              </Button>
              {photoPreviews[`${job.id}-delivery`]?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {photoPreviews[`${job.id}-delivery`].map((url, i) => (
                    <div key={i} className="group relative">
                      <img
                        src={url}
                        alt={`Delivery photo ${i + 1}`}
                        className="h-16 w-16 rounded-lg border object-cover"
                      />
                      <button
                        onClick={() => removePhoto(job.id, "delivery", i)}
                        className="absolute -right-1 -top-1 hidden rounded-full bg-destructive p-0.5 text-destructive-foreground group-hover:block"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              disabled={isUpdating}
              onClick={() => updateJobStatus(job.id, "delivered")}
            >
              {isUpdating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              Mark Delivered
            </Button>
          </div>
        );

      default:
        return null;
    }
  }

  if (loading) return <DeliveriesSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#0F172A]">
          Active Deliveries
        </h1>
        <p className="mt-1 text-muted-foreground">
          Manage your current delivery assignments.
        </p>
      </div>

      {jobs.length === 0 ? (
        <Card className="rounded-xl shadow-md">
          <CardContent className="py-16 text-center">
            <Truck className="mx-auto h-12 w-12 text-muted-foreground/40" />
            <p className="mt-4 text-lg font-medium text-muted-foreground">
              No active deliveries
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Browse available jobs to start your next delivery.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {jobs.map((job) => {
            const currentStepIndex = STATUS_STEPS.indexOf(job.status);
            return (
              <Card key={job.id} className="overflow-hidden rounded-xl shadow-md">
                <CardContent className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-[#0F172A]">
                        {job.title}
                      </h3>
                      <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-3.5 w-3.5" />
                        {job.shipper_name}
                      </div>
                    </div>
                    <Badge
                      variant="default"
                      className={cn(
                        job.status === "in_transit" &&
                          "bg-cyan-600",
                        job.status === "at_dropoff" &&
                          "bg-teal-600",
                        job.status === "at_pickup" &&
                          "bg-orange-600"
                      )}
                    >
                      {JOB_STATUSES[job.status]?.label || job.status}
                    </Badge>
                  </div>

                  {/* Route info */}
                  <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="h-4 w-4 text-emerald-500" />
                      {job.pickup_address.split(",")[0]}
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="h-4 w-4 text-red-500" />
                      {job.dropoff_address.split(",")[0]}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      Pickup: {formatDate(job.pickup_window_start, "MMM d, h:mm a")}
                    </span>
                  </div>

                  {/* Status Stepper */}
                  <div className="mt-6">
                    <div className="flex items-center">
                      {STATUS_STEPS.map((step, i) => {
                        const isCompleted = i < currentStepIndex;
                        const isCurrent = i === currentStepIndex;
                        return (
                          <div key={step} className="flex flex-1 items-center">
                            <div className="flex flex-col items-center">
                              <div
                                className={cn(
                                  "flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-medium",
                                  isCompleted &&
                                    "border-emerald-500 bg-emerald-500 text-white",
                                  isCurrent &&
                                    "border-[#3B82F6] bg-[#3B82F6] text-white",
                                  !isCompleted &&
                                    !isCurrent &&
                                    "border-muted-foreground/30 text-muted-foreground"
                                )}
                              >
                                {isCompleted ? (
                                  <CheckCircle2 className="h-4 w-4" />
                                ) : (
                                  i + 1
                                )}
                              </div>
                              <p
                                className={cn(
                                  "mt-1 text-[10px] leading-tight",
                                  isCurrent
                                    ? "font-medium text-[#0F172A]"
                                    : "text-muted-foreground"
                                )}
                              >
                                {STEP_LABELS[step]}
                              </p>
                            </div>
                            {i < STATUS_STEPS.length - 1 && (
                              <div
                                className={cn(
                                  "mx-1 h-0.5 flex-1",
                                  i < currentStepIndex
                                    ? "bg-emerald-500"
                                    : "bg-muted-foreground/20"
                                )}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="mt-6 border-t pt-4">
                    {getActionButtons(job)}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DeliveriesSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-9 w-52" />
        <Skeleton className="mt-2 h-5 w-72" />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="rounded-xl shadow-md">
          <CardContent className="p-6">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="mt-2 h-4 w-32" />
            <Skeleton className="mt-4 h-4 w-80" />
            <Skeleton className="mt-6 h-8 w-full" />
            <Skeleton className="mt-4 h-10 w-48" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
