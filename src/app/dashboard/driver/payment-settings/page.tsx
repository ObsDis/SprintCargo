"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CreditCard,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Loader2,
  Building2,
  DollarSign,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import type { Profile } from "@/types/database";

type PayoutSchedule = "daily" | "weekly" | "monthly";

export default function PaymentSettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [payoutSchedule, setPayoutSchedule] =
    useState<PayoutSchedule>("weekly");
  const [saving, setSaving] = useState(false);

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

  const isConnected = profile?.stripe_connect_onboarding_complete === true;

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-9 w-56" />
          <Skeleton className="mt-2 h-5 w-72" />
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#0F172A]">
          Payment Settings
        </h1>
        <p className="mt-1 text-muted-foreground">
          Manage your payout account and view disbursements.
        </p>
      </div>

      {/* Stripe Connect Status */}
      <Card className="rounded-xl shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#0F172A]">
            <Building2 className="h-5 w-5" />
            Stripe Connect Account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            {isConnected ? (
              <>
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                <div>
                  <p className="font-medium text-emerald-700">
                    Account Connected
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Your Stripe account is set up and ready to receive payouts.
                  </p>
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="h-6 w-6 text-amber-500" />
                <div>
                  <p className="font-medium text-amber-700">
                    Account Not Connected
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Connect your Stripe account to start receiving payouts.
                  </p>
                </div>
              </>
            )}
          </div>
          <Separator />
          <Button
            variant={isConnected ? "outline" : "default"}
            className={!isConnected ? "bg-[#3B82F6] hover:bg-[#2563EB]" : ""}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            {isConnected
              ? "Open Stripe Dashboard"
              : "Set Up Stripe Connect"}
          </Button>
          {isConnected && profile?.stripe_connected_account_id && (
            <p className="text-xs text-muted-foreground">
              Account ID: {profile.stripe_connected_account_id}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Payout Schedule */}
      <Card className="rounded-xl shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#0F172A]">
            <Clock className="h-5 w-5" />
            Payout Schedule
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Current Payout Type</Label>
            <Select
              value={payoutSchedule}
              onValueChange={(v) => setPayoutSchedule(v as PayoutSchedule)}
            >
              <SelectTrigger className="mt-1 w-full max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly (Default)</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
            <p className="mt-1 text-xs text-muted-foreground">
              Payouts are processed according to this schedule once funds clear.
            </p>
          </div>
          <Button
            variant="outline"
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              // Placeholder: save payout schedule via API
              await new Promise((r) => setTimeout(r, 500));
              setSaving(false);
            }}
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Schedule
          </Button>
        </CardContent>
      </Card>

      {/* Quick link to disbursements */}
      <Card className="rounded-xl shadow-md">
        <CardContent className="flex items-center justify-between p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-emerald-500/10 p-2.5">
              <DollarSign className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="font-medium text-[#0F172A]">
                Disbursement History
              </p>
              <p className="text-sm text-muted-foreground">
                View all past payouts, fees, and net amounts.
              </p>
            </div>
          </div>
          <Link href="/dashboard/driver/payment-settings/disbursements">
            <Button variant="outline">
              View History
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
