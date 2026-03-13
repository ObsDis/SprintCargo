"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { Job } from "@/types/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CreditCard,
  DollarSign,
  Download,
  ExternalLink,
  FileText,
  Plus,
  Receipt,
  Wallet,
} from "lucide-react";

interface Transaction {
  id: string;
  jobId: string;
  jobTitle: string;
  amount: number;
  status: "paid" | "pending" | "refunded";
  date: string;
  paymentIntentId: string | null;
}

export default function BillingPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalSpent, setTotalSpent] = useState(0);

  useEffect(() => {
    async function fetchBillingData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data: jobs } = await supabase
        .from("jobs")
        .select("id, title, final_price, status, completed_at, cancelled_at, stripe_payment_intent_id, created_at")
        .eq("shipper_id", user.id)
        .not("final_price", "is", null)
        .order("created_at", { ascending: false });

      const txns: Transaction[] = (jobs ?? []).map((j) => ({
        id: j.id,
        jobId: j.id,
        jobTitle: j.title,
        amount: j.final_price ?? 0,
        status: j.status === "cancelled" ? "refunded" : j.status === "completed" ? "paid" : "pending",
        date: j.completed_at ?? j.created_at,
        paymentIntentId: j.stripe_payment_intent_id,
      }));

      setTransactions(txns);
      setTotalSpent(txns.filter((t) => t.status === "paid").reduce((sum, t) => sum + t.amount, 0));
      setLoading(false);
    }
    fetchBillingData();
  }, []);

  const STATUS_BADGE: Record<string, { label: string; className: string }> = {
    paid: { label: "Paid", className: "bg-green-100 text-green-700" },
    pending: { label: "Pending", className: "bg-amber-100 text-amber-700" },
    refunded: { label: "Refunded", className: "bg-red-100 text-red-700" },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A]">Billing</h1>
        <p className="text-gray-500 mt-1">Manage payments and view transaction history</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-xl shadow-sm border-0 bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Spent</p>
                {loading ? (
                  <Skeleton className="h-7 w-28 mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-[#0F172A] mt-1">{formatCurrency(totalSpent)}</p>
                )}
              </div>
              <div className="h-11 w-11 rounded-xl bg-green-50 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl shadow-sm border-0 bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Transactions</p>
                {loading ? (
                  <Skeleton className="h-7 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-[#0F172A] mt-1">{transactions.length}</p>
                )}
              </div>
              <div className="h-11 w-11 rounded-xl bg-blue-50 flex items-center justify-center">
                <Receipt className="h-5 w-5 text-[#3B82F6]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl shadow-sm border-0 bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending</p>
                {loading ? (
                  <Skeleton className="h-7 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-[#0F172A] mt-1">
                    {transactions.filter((t) => t.status === "pending").length}
                  </p>
                )}
              </div>
              <div className="h-11 w-11 rounded-xl bg-amber-50 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Methods */}
      <Card className="rounded-xl shadow-sm border-0 bg-white">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg text-[#0F172A] flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-[#3B82F6]" />
              Payment Methods
            </CardTitle>
            <Button variant="outline" size="sm" className="text-xs gap-1 text-[#3B82F6] border-[#3B82F6]/30">
              <Plus className="h-3 w-3" /> Add Method
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="p-6 rounded-lg border-2 border-dashed border-gray-200 text-center">
            <CreditCard className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500 font-medium">Manage payment methods through Stripe</p>
            <p className="text-xs text-gray-400 mt-1">Add, remove, or update your payment methods securely</p>
            <Button variant="outline" size="sm" className="mt-4 gap-1 text-sm">
              <ExternalLink className="h-3 w-3" />
              Open Stripe Portal
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card className="rounded-xl shadow-sm border-0 bg-white">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg text-[#0F172A] flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#3B82F6]" />
              Transaction History
            </CardTitle>
            <Button variant="outline" size="sm" className="text-xs gap-1">
              <Download className="h-3 w-3" /> Download All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-lg">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-5 w-16" />
                </div>
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-12 text-center">
              <Receipt className="h-10 w-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-1">
              {transactions.map((txn) => {
                const badge = STATUS_BADGE[txn.status];
                return (
                  <div
                    key={txn.id}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className={cn(
                      "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
                      txn.status === "paid" ? "bg-green-50" : txn.status === "refunded" ? "bg-red-50" : "bg-amber-50"
                    )}>
                      <DollarSign className={cn(
                        "h-4 w-4",
                        txn.status === "paid" ? "text-green-600" : txn.status === "refunded" ? "text-red-500" : "text-amber-600"
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#0F172A] truncate">{txn.jobTitle}</p>
                      <p className="text-xs text-gray-400">{formatDate(txn.date)}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <p className={cn(
                        "font-semibold text-sm",
                        txn.status === "refunded" ? "text-red-600" : "text-[#0F172A]"
                      )}>
                        {txn.status === "refunded" ? "-" : ""}{formatCurrency(txn.amount)}
                      </p>
                      <Badge variant="secondary" className={cn("text-xs", badge.className)}>
                        {badge.label}
                      </Badge>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-[#3B82F6]">
                        <Receipt className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
