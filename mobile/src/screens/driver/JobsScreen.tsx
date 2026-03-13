import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";
import { useLocation } from "../../hooks/useLocation";
import { Job } from "../../types/database";
import {
  COLORS,
  JOB_STATUS_CONFIG,
  SIZE_CATEGORY_LABELS,
  DELIVERY_SPEED_LABELS,
  DELIVERY_SPEED_COLORS,
} from "../../lib/constants";

function getDistanceMiles(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3959; // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function JobCard({
  job,
  driverLat,
  driverLng,
  driverId,
}: {
  job: Job;
  driverLat: number | null;
  driverLng: number | null;
  driverId: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [quoteAmount, setQuoteAmount] = useState("");
  const [quoteNote, setQuoteNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const distanceToPickup =
    driverLat != null && driverLng != null
      ? getDistanceMiles(driverLat, driverLng, job.pickup_lat, job.pickup_lng)
      : null;

  const statusConfig = JOB_STATUS_CONFIG[job.status];

  const handleSubmitQuote = async () => {
    const amount = parseFloat(quoteAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid quote amount.");
      return;
    }

    setSubmitting(true);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const { error } = await supabase.from("job_quotes").insert({
      job_id: job.id,
      driver_id: driverId,
      amount,
      driver_note: quoteNote.trim() || null,
      estimated_pickup_eta_minutes: distanceToPickup
        ? Math.round(distanceToPickup * 2.5)
        : null,
      expires_at: expiresAt.toISOString(),
    });

    setSubmitting(false);

    if (error) {
      Alert.alert("Error", error.message);
    } else {
      Alert.alert("Quote Submitted", "Your quote has been sent to the shipper.");
      setExpanded(false);
      setQuoteAmount("");
      setQuoteNote("");
    }
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {job.title}
          </Text>
          <View
            style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}
          >
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>
        </View>

        <View style={styles.addressRow}>
          <Text style={styles.addressLabel}>Pickup</Text>
          <Text style={styles.addressText} numberOfLines={1}>
            {job.pickup_address}
          </Text>
        </View>
        <View style={styles.addressRow}>
          <Text style={styles.addressLabel}>Dropoff</Text>
          <Text style={styles.addressText} numberOfLines={1}>
            {job.dropoff_address}
          </Text>
        </View>

        <View style={styles.metaRow}>
          {distanceToPickup != null && (
            <View style={styles.metaChip}>
              <Text style={styles.metaText}>
                {distanceToPickup.toFixed(1)} mi away
              </Text>
            </View>
          )}
          <View style={styles.metaChip}>
            <Text style={styles.metaText}>
              {SIZE_CATEGORY_LABELS[job.size_category].split(" (")[0]}
            </Text>
          </View>
          <View
            style={[
              styles.metaChip,
              { backgroundColor: DELIVERY_SPEED_COLORS[job.delivery_speed] + "20" },
            ]}
          >
            <Text
              style={[
                styles.metaText,
                { color: DELIVERY_SPEED_COLORS[job.delivery_speed] },
              ]}
            >
              {DELIVERY_SPEED_LABELS[job.delivery_speed].split(" (")[0]}
            </Text>
          </View>
          {job.estimated_distance_miles != null && (
            <View style={styles.metaChip}>
              <Text style={styles.metaText}>
                {job.estimated_distance_miles.toFixed(1)} mi route
              </Text>
            </View>
          )}
        </View>

        {job.estimated_price_low != null && job.estimated_price_high != null && (
          <Text style={styles.priceRange}>
            Est. ${job.estimated_price_low.toFixed(0)} - $
            {job.estimated_price_high.toFixed(0)}
          </Text>
        )}
      </View>

      {expanded && (
        <View style={styles.expandedSection}>
          <View style={styles.divider} />

          <Text style={styles.detailLabel}>Item Description</Text>
          <Text style={styles.detailValue}>{job.item_description}</Text>

          <View style={styles.detailRow}>
            <View style={styles.detailCol}>
              <Text style={styles.detailLabel}>Items</Text>
              <Text style={styles.detailValue}>{job.num_items}</Text>
            </View>
            {job.estimated_weight_lbs != null && (
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Weight</Text>
                <Text style={styles.detailValue}>
                  {job.estimated_weight_lbs} lbs
                </Text>
              </View>
            )}
            <View style={styles.detailCol}>
              <Text style={styles.detailLabel}>Fragile</Text>
              <Text style={styles.detailValue}>{job.fragile ? "Yes" : "No"}</Text>
            </View>
          </View>

          {job.special_instructions && (
            <>
              <Text style={styles.detailLabel}>Special Instructions</Text>
              <Text style={styles.detailValue}>{job.special_instructions}</Text>
            </>
          )}

          <Text style={styles.detailLabel}>Pickup Window</Text>
          <Text style={styles.detailValue}>
            {new Date(job.pickup_window_start).toLocaleString()} -{" "}
            {new Date(job.pickup_window_end).toLocaleTimeString()}
          </Text>

          <View style={styles.quoteSection}>
            <Text style={styles.quoteSectionTitle}>Submit Your Quote</Text>
            <TextInput
              style={styles.quoteInput}
              placeholder="Quote amount ($)"
              placeholderTextColor={COLORS.gray400}
              value={quoteAmount}
              onChangeText={setQuoteAmount}
              keyboardType="decimal-pad"
              editable={!submitting}
            />
            <TextInput
              style={[styles.quoteInput, styles.quoteNoteInput]}
              placeholder="Add a note (optional)"
              placeholderTextColor={COLORS.gray400}
              value={quoteNote}
              onChangeText={setQuoteNote}
              multiline
              numberOfLines={2}
              editable={!submitting}
            />
            <TouchableOpacity
              style={[styles.quoteButton, submitting && styles.buttonDisabled]}
              onPress={handleSubmitQuote}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color={COLORS.white} size="small" />
              ) : (
                <Text style={styles.quoteButtonText}>Submit Quote</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function JobsScreen() {
  const { user } = useAuth();
  const { latitude, longitude } = useLocation();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchJobs = useCallback(async () => {
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .in("status", ["posted", "quoted"])
      .order("created_at", { ascending: false })
      .limit(50);

    if (!error && data) {
      let sortedJobs = data as Job[];
      // Sort by distance if we have driver location
      if (latitude != null && longitude != null) {
        sortedJobs = sortedJobs.sort((a, b) => {
          const distA = getDistanceMiles(latitude, longitude, a.pickup_lat, a.pickup_lng);
          const distB = getDistanceMiles(latitude, longitude, b.pickup_lat, b.pickup_lng);
          return distA - distB;
        });
      }
      setJobs(sortedJobs);
    }
  }, [latitude, longitude]);

  useEffect(() => {
    fetchJobs().finally(() => setLoading(false));
  }, [fetchJobs]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchJobs();
    setRefreshing(false);
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
        <Text style={styles.screenTitle}>Available Jobs</Text>
        <Text style={styles.screenSubtitle}>
          {jobs.length} job{jobs.length !== 1 ? "s" : ""} near you
        </Text>
      </View>

      <FlatList
        data={jobs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <JobCard
            job={item}
            driverLat={latitude}
            driverLng={longitude}
            driverId={user?.id ?? ""}
          />
        )}
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
            <Text style={styles.emptyTitle}>No Jobs Available</Text>
            <Text style={styles.emptyText}>
              Pull down to refresh or check back later for new jobs.
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
  screenSubtitle: {
    fontSize: 14,
    color: COLORS.gray300,
    marginTop: 4,
  },
  list: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    padding: 16,
  },
  cardTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
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
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  addressLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.gray400,
    width: 54,
  },
  addressText: {
    fontSize: 14,
    color: COLORS.gray600,
    flex: 1,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 10,
  },
  metaChip: {
    backgroundColor: COLORS.gray100,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  metaText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.gray600,
  },
  priceRange: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.green,
    marginTop: 10,
  },
  expandedSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.gray200,
    marginBottom: 14,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.gray400,
    marginBottom: 4,
    marginTop: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 14,
    color: COLORS.navy,
  },
  detailRow: {
    flexDirection: "row",
    gap: 24,
    marginTop: 4,
  },
  detailCol: {},
  quoteSection: {
    marginTop: 20,
    padding: 16,
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
  },
  quoteSectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.navy,
    marginBottom: 12,
  },
  quoteInput: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.navy,
    marginBottom: 10,
  },
  quoteNoteInput: {
    height: 64,
    textAlignVertical: "top",
  },
  quoteButton: {
    backgroundColor: COLORS.green,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  quoteButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "700",
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
  },
});
