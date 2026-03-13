import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";
import { Job } from "../../types/database";
import { COLORS, JOB_STATUS_CONFIG } from "../../lib/constants";

export default function HomeScreen() {
  const { user, profile } = useAuth();
  const navigation = useNavigation<any>();
  const [activeJobs, setActiveJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchActiveJobs = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("shipper_id", user.id)
      .not("status", "in", '("completed","cancelled","disputed")')
      .order("updated_at", { ascending: false });

    if (!error && data) {
      setActiveJobs(data as Job[]);
    }
  }, [user]);

  useEffect(() => {
    fetchActiveJobs().finally(() => setLoading(false));
  }, [fetchActiveJobs]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchActiveJobs();
    setRefreshing(false);
  };

  const renderJobCard = ({ item }: { item: Job }) => {
    const statusConfig = JOB_STATUS_CONFIG[item.status];
    return (
      <TouchableOpacity style={styles.card} activeOpacity={0.7}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <View
            style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}
          >
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>
        </View>

        <View style={styles.addressSection}>
          <View style={styles.addressRow}>
            <View style={[styles.dot, { backgroundColor: COLORS.green }]} />
            <Text style={styles.addressText} numberOfLines={1}>
              {item.pickup_address}
            </Text>
          </View>
          <View style={styles.addressConnector} />
          <View style={styles.addressRow}>
            <View style={[styles.dot, { backgroundColor: COLORS.red }]} />
            <Text style={styles.addressText} numberOfLines={1}>
              {item.dropoff_address}
            </Text>
          </View>
        </View>

        <View style={styles.cardMeta}>
          {item.estimated_distance_miles != null && (
            <Text style={styles.metaText}>
              {item.estimated_distance_miles.toFixed(1)} mi
            </Text>
          )}
          {item.final_price != null && (
            <Text style={styles.priceText}>
              ${item.final_price.toFixed(2)}
            </Text>
          )}
          {item.final_price == null &&
            item.estimated_price_low != null &&
            item.estimated_price_high != null && (
              <Text style={styles.priceText}>
                ${item.estimated_price_low.toFixed(0)} - $
                {item.estimated_price_high.toFixed(0)}
              </Text>
            )}
        </View>

        <Text style={styles.dateText}>
          Created {new Date(item.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        </Text>
      </TouchableOpacity>
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
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>
              Hello, {profile?.full_name?.split(" ")[0] || "there"}
            </Text>
            <Text style={styles.screenSubtitle}>
              {activeJobs.length} active shipment
              {activeJobs.length !== 1 ? "s" : ""}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() =>
              navigation.navigate("Create", { screen: "CreateMain" })
            }
          >
            <Text style={styles.createButtonText}>+ New</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={activeJobs}
        keyExtractor={(item) => item.id}
        renderItem={renderJobCard}
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
            <Text style={styles.emptyTitle}>No Active Shipments</Text>
            <Text style={styles.emptyText}>
              Create a new shipment to get started with SprintCargo.
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() =>
                navigation.navigate("Create", { screen: "CreateMain" })
              }
            >
              <Text style={styles.emptyButtonText}>Create Shipment</Text>
            </TouchableOpacity>
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
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greeting: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.white,
  },
  screenSubtitle: {
    fontSize: 14,
    color: COLORS.gray300,
    marginTop: 4,
  },
  createButton: {
    backgroundColor: COLORS.blue,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  createButtonText: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: 14,
  },
  list: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.navy,
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  addressSection: {
    marginBottom: 12,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  addressConnector: {
    width: 2,
    height: 14,
    backgroundColor: COLORS.gray200,
    marginLeft: 4,
  },
  addressText: {
    fontSize: 14,
    color: COLORS.gray600,
    flex: 1,
  },
  cardMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  metaText: {
    fontSize: 13,
    color: COLORS.gray500,
    fontWeight: "600",
  },
  priceText: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.green,
  },
  dateText: {
    fontSize: 12,
    color: COLORS.gray400,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
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
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: COLORS.blue,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: 15,
  },
});
