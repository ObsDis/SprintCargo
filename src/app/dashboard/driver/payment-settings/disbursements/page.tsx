"use client";

import { useEffect, useState, useCallback } from "react";
import {
  DollarSign,
  Download,
  Calendar,
  TrendingUp,
  ArrowDownToLine,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import type { Job } from "@/types/database";

interface Disbursement {
  id: string;
  jobId: string;
  jobTitle: string;
  completedAt: string;
  grossAmount: number;
  processingFee: number;
  netAmount: number;
  status: "paid" | "pending" | "processing";
}

interface MonthlySummary {
  month: string;
  gross: number;
  fees: number;
  net: number;
  count: number;
}

const PROCESSING_FEE_RATE = 0.029;
const PROCESSING_FEE_FLAT = 0.3;

function calculateFee(amount: number): number {
  return Math.round((amount * PROCESSING_FEE_RATE + PROCESSING_FEE_FLAT) * 100) / 100;
}

export default function DisbursementsPage() {
  const [disbursements, setDisbursements] = useState<Disbursement[]>([]);
  const [monthlySummaries, setMonthlySummaries] = useState<MonthlySummary[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: jobs } = await supabase
      .from("jobs")
      .select("*")
      .eq("assigned_driver_id", user.id)
      .in("status", ["delivered", "completed"])
      .not("final_price", "is", null)
      .order("completed_at", { ascending: false });

    if (jobs) {
      const items: Disbursement[] = jobs.map((j) => {
        const gross = j.final_price || 0;
        const fee = calculateFee(gross);
        return {
          id: j.id,
          jobId: j.id,
          jobTitle: j.title,
          completedAt: j.completed_at || j.updated_at,
          grossAmount: gross,
          processingFee: fee,
          netAmount: Math.round((gross - fee) * 100) / 100,
          status: j.stripe_transfer_id ? "paid" : "pending",
        };
      });
      setDisbursements(items);

      // Build monthly summaries
      const monthMap = new Map<string, MonthlySummary>();
      items.forEach((d) => {
        const date = new Date(d.completedAt);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        const label = formatDate(d.completedAt, "MMMM yyyy");
        if (!monthMap.has(key)) {
          monthMap.set(key, {
            month: label,
            gross: 0,
            fees: 0,
            net: 0,
            count: 0,
          });
        }
        const s = monthMap.get(key)!;
        s.gross += d.grossAmount;
        s.fees += d.processingFee;
        s.net += d.netAmount;
        s.count += 1;
      });
      setMonthlySummaries(
        Array.from(monthMap.values()).map((s) => ({
          ...s,
          gross: Math.round(s.gross * 100) / 100,
          fees: Math.round(s.fees * 100) / 100,
          net: Math.round(s.net * 100) / 100,
        }))
      );
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function exportCSV() {
    const header = "Date,Job Title,Gross Amount,Processing Fee,Net Amount,Status\n";
    const rows = disbursements
      .map(
        (d) =>
          `${formatDate(d.completedAt, "yyyy-MM-dd")},"${d.jobTitle}",${d.grossAmount},${d.processingFee},${d.netAmount},${d.status}`
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `disbursements-${formatDate(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-9 w-56" />
          <Skeleton className="mt-2 h-5 w-72" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  const totalGross = disbursements.reduce((s, d) => s + d.grossAmount, 0);
  const totalFees = disbursements.reduce((s, d) => s + d.processingFee, 0);
  const totalNet = disbursements.reduce((s, d) => s + d.netAmount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A]">
            Disbursements
          </h1>
          <p className="mt-1 text-muted-foreground">
            Track your payouts and processing fees.
          </p>
        </div>
        <Button variant="outline" onClick={exportCSV} disabled={disbursements.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="rounded-xl shadow-md">
          <CardContent className="p-5">
            <p className="text-sm font-medium text-muted-foreground">
              Total Gross Earnings
            </p>
            <p className="mt-1 text-2xl font-bold text-[#0F172A]">
              {formatCurrency(totalGross)}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-xl shadow-md">
          <CardContent className="p-5">
            <p className="text-sm font-medium text-muted-foreground">
              Total Processing Fees
            </p>
            <p className="mt-1 text-2xl font-bold text-red-600">
              -{formatCurrency(totalFees)}
            </p>
            <p className="text-xs text-muted-foreground">2.9% + $0.30 per payout</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl shadow-md">
          <CardContent className="p-5">
            <p className="text-sm font-medium text-muted-foreground">
              Total Net Earnings
            </p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">
              {formatCurrency(totalNet)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Summaries */}
      {monthlySummaries.length > 0 && (
        <Card className="rounded-xl shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#0F172A]">
              <TrendingUp className="h-5 w-5" />
              Monthly Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 font-medium">Month</th>
                    <th className="pb-2 font-medium">Deliveries</th>
                    <th className="pb-2 text-right font-medium">Gross</th>
                    <th className="pb-2 text-right font-medium">Fees</th>
                    <th className="pb-2 text-right font-medium">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlySummaries.map((s) => (
                    <tr key={s.month} className="border-b last:border-0">
                      <td className="py-3 font-medium text-[#0F172A]">
                        {s.month}
                      </td>
                      <td className="py-3">{s.count}</td>
                      <td className="py-3 text-right">
                        {formatCurrency(s.gross)}
                      </td>
                      <td className="py-3 text-right text-red-600">
                        -{formatCurrency(s.fees)}
                      </td>
                      <td className="py-3 text-right font-medium text-emerald-600">
                        {formatCurrency(s.net)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Disbursement List */}
      <Card className="rounded-xl shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#0F172A]">
            <ArrowDownToLine className="h-5 w-5" />
            Payout History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {disbursements.length === 0 ? (
            <div className="py-12 text-center">
              <DollarSign className="mx-auto h-12 w-12 text-muted-foreground/40" />
              <p className="mt-4 text-muted-foreground">
                No disbursements yet. Complete deliveries to earn.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {disbursements.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-[#0F172A]">
                      {d.jobTitle}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatDate(d.completedAt)}
                    </p>
                  </div>
                  <div className="ml-4 flex items-center gap-6 text-sm">
                    <div className="text-right">
                      <p className="text-muted-foreground">Gross</p>
                      <p className="font-medium">
                        {formatCurrency(d.grossAmount)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-muted-foreground">Fee</p>
                      <p className="font-medium text-red-600">
                        -{formatCurrency(d.processingFee)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-muted-foreground">Net</p>
                      <p className="font-bold text-emerald-600">
                        {formatCurrency(d.netAmount)}
                      </p>
                    </div>
                    <PayoutStatusBadge status={d.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PayoutStatusBadge({
  status,
}: {
  status: "paid" | "pending" | "processing";
}) {
  const map = {
    paid: { label: "Paid", variant: "default" as const, className: "bg-emerald-600" },
    pending: { label: "Pending", variant: "secondary" as const, className: "" },
    processing: { label: "Processing", variant: "outline" as const, className: "" },
  };
  const info = map[status];
  return (
    <Badge variant={info.variant} className={info.className}>
      {info.label}
    </Badge>
  );
}
