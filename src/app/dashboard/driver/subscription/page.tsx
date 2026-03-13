"use client";

import { useEffect, useState } from "react";
import {
  CreditCard,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ExternalLink,
  Shield,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import type { Profile, SubscriptionStatus } from "@/types/database";

export default function SubscriptionPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      setProfile(data);
      setLoading(false);
    }
    load();
  }, []);

  async function handleCancelSubscription() {
    if (!profile) return;
    setCancelling(true);
    const supabase = createClient();
    // Placeholder: in production, call Stripe API to cancel
    await supabase
      .from("profiles")
      .update({ subscription_status: "cancelled" })
      .eq("id", profile.id);
    setProfile((p) => (p ? { ...p, subscription_status: "cancelled" } : null));
    setCancelling(false);
    setShowCancelDialog(false);
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-9 w-56" />
          <Skeleton className="mt-2 h-5 w-72" />
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  const status = profile?.subscription_status || "inactive";

  // Simulated next billing date (30 days from now)
  const nextBilling = new Date();
  nextBilling.setDate(nextBilling.getDate() + 30);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#0F172A]">Subscription</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your SprintCargo driver subscription.
        </p>
      </div>

      {/* Current Plan */}
      <Card className="rounded-xl shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#0F172A]">
            <Shield className="h-5 w-5" />
            Current Plan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold text-[#0F172A]">
                SprintCargo Driver Pro
              </p>
              <p className="text-sm text-muted-foreground">
                Full access to all driver features, unlimited quotes, and
                priority job matching.
              </p>
            </div>
            <SubscriptionStatusBadge status={status} />
          </div>
          <Separator />
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="font-medium capitalize text-[#0F172A]">
                {status.replace("_", " ")}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                Next Billing Date
              </p>
              <p className="font-medium text-[#0F172A]">
                {status === "active" || status === "trial"
                  ? formatDate(nextBilling)
                  : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                Monthly Price
              </p>
              <p className="font-medium text-[#0F172A]">$29.99/mo</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card className="rounded-xl shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#0F172A]">
            <CreditCard className="h-5 w-5" />
            Payment Method
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-16 items-center justify-center rounded border bg-muted text-xs font-medium text-muted-foreground">
              VISA
            </div>
            <div>
              <p className="font-medium text-[#0F172A]">
                **** **** **** 4242
              </p>
              <p className="text-xs text-muted-foreground">Expires 12/2027</p>
            </div>
          </div>
          <Button variant="outline">
            <ExternalLink className="mr-2 h-4 w-4" />
            Update Payment Method
          </Button>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card className="rounded-xl shadow-md">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-[#0F172A]">
                Cancel Subscription
              </p>
              <p className="text-sm text-muted-foreground">
                Cancel your subscription. You will retain access until the end of
                your billing period.
              </p>
            </div>
            <Button
              variant="destructive"
              disabled={
                status === "cancelled" || status === "inactive"
              }
              onClick={() => setShowCancelDialog(true)}
            >
              Cancel Subscription
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Cancel Subscription
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your subscription?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              If you cancel:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
              <li>You will lose access to job matching after your billing period ends.</li>
              <li>Active deliveries will not be affected.</li>
              <li>Outstanding payouts will still be processed.</li>
              <li>You can resubscribe at any time.</li>
            </ul>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
            >
              Keep Subscription
            </Button>
            <Button
              variant="destructive"
              disabled={cancelling}
              onClick={handleCancelSubscription}
            >
              {cancelling && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Yes, Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SubscriptionStatusBadge({
  status,
}: {
  status: SubscriptionStatus;
}) {
  const map: Record<
    SubscriptionStatus,
    { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className?: string }
  > = {
    active: { label: "Active", variant: "default", className: "bg-emerald-600" },
    trial: { label: "Trial", variant: "default", className: "bg-blue-600" },
    past_due: { label: "Past Due", variant: "destructive" },
    cancelled: { label: "Cancelled", variant: "outline" },
    inactive: { label: "Inactive", variant: "secondary" },
  };
  const info = map[status];
  return (
    <Badge variant={info.variant} className={info.className}>
      {info.label}
    </Badge>
  );
}
