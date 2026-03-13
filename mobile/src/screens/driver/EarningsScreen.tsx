import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";
import { Job } from "../../types/database";
import { COLORS, PLATFORM_FEE_PERCENTAGE } from "../../lib/constants";

type TimePeriod = "today" | "week" | "month";

function getStartOfPeriod(period: TimePeriod): Date {
  const now = new Date();
  switch (period) {
    case "today":
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    case "week": {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      return new Date(now.getFullYear(), now.getMonth(), diff);
    }
    case "month":
      return new Date(now.getFullYear(), now.getMonth(), 1);
  }
}

export default function EarningsScreen() {
  const { user } = useAuth();
  const [completedJobs, setCompletedJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>("week");

  const fetchCompletedJobs = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("assigned_driver_id", user.id)
      .in("status", ["delivered", "completed"])
      .order("completed_at", { ascending: false })
      .limit(100);

    if (!error && data) {
      setCompletedJobs(data as Job[]);
    }
  }, [user]);

  useEffect(() => {
    fetchCompletedJobs().finally(() => setLoading(false));
  }, [fetchCompletedJobs]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCompletedJobs();
    setRefreshing(false);
  };

  const periodStart = getStartOfPeriod(selectedPeriod);
  const periodJobs = completedJobs.filter(
    (job) =>
      job.completed_at && new Date(job.completed_at) >= periodStart
  );

  const grossEarnings = periodJobs.reduce(
    (sum, job) => sum + (job.final_price ?? 0),
    0
  );
  const platformFees = grossEarnings * PLATFORM_FEE_PERCENTAGE;
  const netEarnings = grossEarnings - platformFees;

  const renderJobItem = ({ item }: { item: Job }) => {
    const driverNet = (item.final_price ?? 0) * (1 - PLATFORM_FEE_PERCENTAGE);
    return (
      <View style={styles.jobItem}>
        <View style={styles.jobItemLeft}>
          <Text style={styles.jobTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.jobDate}>
            {item.completed_at
              ? new Date(item.completed_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })
              : "Pending"}
          </Text>
          <Text style={styles.jobRoute} numberOfLines={1}>
            {item.pickup_address.split(",")[0]} →{" "}
            {item.dropoff_address.split(",")[0]}
          </Text>
        </View>
        <Text style={styles.jobEarning}>+${driverNet.toFixed(2)}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.blue} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.screenHeader}>
        <Text style={styles.screenTitle}>Earnings</Text>
      </View>

      {/* Period Selector */}
      <View style={styles.periodRow}>
        {(["today", "week", "month"] as TimePeriod[]).map((period) => (
          <TouchableOpacity
            key={period}
            style={[
              styles.periodButton,
              selectedPeriod === period && styles.periodButtonActive,
            ]}
            onPress={() => setSelectedPeriod(period)}
          >
            <Text
              style={[
                styles.periodButtonText,
                selectedPeriod === period && styles.periodButtonTextActive,
              ]}
            >
              {period === "today" ? "Today" : period === "week" ? "This Week" : "This Month"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Earnings Summary */}
      <View style={styles.summaryCard}>
        <View style={styles.mainEarningRow}>
          <Text style={styles.mainEarningLabel}>Net Earnings</Text>
          <Text style={styles.mainEarningAmount}>${netEarnings.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryDetailsRow}>
          <View style={styles.summaryDetail}>
            <Text style={styles.summaryDetailLabel}>Gross</Text>
            <Text style={styles.summaryDetailValue}>
              ${grossEarnings.toFixed(2)}
            </Text>
          </View>
          <View style={styles.summaryDetail}>
            <Text style={styles.summaryDetailLabel}>Platform Fee</Text>
            <Text style={[styles.summaryDetailValue, { color: COLORS.red }]}>
              -${platformFees.toFixed(2)}
            </Text>
          </View>
          <View style={styles.summaryDetail}>
            <Text style={styles.summaryDetailLabel}>Deliveries</Text>
            <Text style={styles.summaryDetailValue}>{periodJobs.length}</Text>
          </View>
        </View>
      </View>

      {/* Delivery History */}
      <View style={styles.historyHeader}>
        <Text style={styles.historySectionTitle}>Delivery History</Text>
      </View>

      <FlatList
        data={completedJobs}
        keyExtractor={(item) => item.id}
        renderItem={renderJobItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.blue}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No Deliveries Yet</Text>
            <Text style={styles.emptyText}>
              Completed deliveries and earnings will appear here.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  screenHeader: {
    backgroundColor: COLORS.navy,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.white,
  },
  periodRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 8,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  periodButtonActive: {
    backgroundColor: COLORS.blue,
    borderColor: COLORS.blue,
  },
  periodButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.gray600,
  },
  periodButtonTextActive: {
    color: COLORS.white,
  },
  summaryCard: {
    backgroundColor: COLORS.white,
    margin: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  mainEarningRow: {
    alignItems: "center",
    marginBottom: 16,
  },
  mainEarningLabel: {
    fontSize: 14,
    color: COLORS.gray500,
    fontWeight: "600",
    marginBottom: 4,
  },
  mainEarningAmount: {
    fontSize: 36,
    fontWeight: "800",
    color: COLORS.green,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: COLORS.gray200,
    marginBottom: 16,
  },
  summaryDetailsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  summaryDetail: {
    alignItems: "center",
  },
  summaryDetailLabel: {
    fontSize: 12,
    color: COLORS.gray400,
    fontWeight: "600",
    marginBottom: 4,
  },
  summaryDetailValue: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.navy,
  },
  historyHeader: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
  },
  historySectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.navy,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  jobItem: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  jobItemLeft: {
    flex: 1,
    marginRight: 12,
  },
  jobTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.navy,
    marginBottom: 4,
  },
  jobDate: {
    fontSize: 12,
    color: COLORS.gray400,
    marginBottom: 2,
  },
  jobRoute: {
    fontSize: 13,
    color: COLORS.gray500,
  },
  jobEarning: {
    fontSize: 17,
    fontWeight: "800",
    color: COLORS.green,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.navy,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.gray500,
    textAlign: "center",
    paddingHorizontal: 40,
  },
});
