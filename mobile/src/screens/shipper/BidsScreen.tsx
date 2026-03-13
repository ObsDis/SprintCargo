import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";
import { Job, JobQuote, Profile } from "../../types/database";
import { COLORS, JOB_STATUS_CONFIG } from "../../lib/constants";

interface QuoteWithDriver extends JobQuote {
  driver_profile?: Profile;
}

interface JobWithQuotes extends Job {
  quotes: QuoteWithDriver[];
}

export default function BidsScreen() {
  const { user } = useAuth();
  const [jobsWithQuotes, setJobsWithQuotes] = useState<JobWithQuotes[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [counterModalVisible, setCounterModalVisible] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<QuoteWithDriver | null>(null);
  const [counterAmount, setCounterAmount] = useState("");
  const [counterNote, setCounterNote] = useState("");
  const [processing, setProcessing] = useState(false);

  const fetchJobsAndQuotes = useCallback(async () => {
    if (!user) return;

    const { data: jobs, error: jobsError } = await supabase
      .from("jobs")
      .select("*")
      .eq("shipper_id", user.id)
      .in("status", ["posted", "quoted"])
      .order("created_at", { ascending: false });

    if (jobsError || !jobs) return;

    const jobIds = jobs.map((j) => j.id);
    if (jobIds.length === 0) {
      setJobsWithQuotes([]);
      return;
    }

    const { data: quotes, error: quotesError } = await supabase
      .from("job_quotes")
      .select("*")
      .in("job_id", jobIds)
      .in("status", ["pending", "countered_by_shipper", "countered_by_driver"])
      .order("created_at", { ascending: false });

    if (quotesError || !quotes) return;

    // Fetch driver profiles for quotes
    const driverIds = [...new Set(quotes.map((q) => q.driver_id))];
    let driverProfiles: Record<string, Profile> = {};

    if (driverIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .in("id", driverIds);

      if (profiles) {
        driverProfiles = Object.fromEntries(
          profiles.map((p) => [p.id, p as Profile])
        );
      }
    }

    const enrichedQuotes: QuoteWithDriver[] = quotes.map((q) => ({
      ...(q as JobQuote),
      driver_profile: driverProfiles[q.driver_id],
    }));

    const result: JobWithQuotes[] = (jobs as Job[]).map((job) => ({
      ...job,
      quotes: enrichedQuotes.filter((q) => q.job_id === job.id),
    }));

    setJobsWithQuotes(result.filter((j) => j.quotes.length > 0));
  }, [user]);

  useEffect(() => {
    fetchJobsAndQuotes().finally(() => setLoading(false));
  }, [fetchJobsAndQuotes]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchJobsAndQuotes();
    setRefreshing(false);
  };

  const handleAcceptQuote = async (quote: QuoteWithDriver) => {
    Alert.alert(
      "Accept Quote",
      `Accept ${quote.driver_profile?.full_name || "this driver"}'s quote of $${quote.amount.toFixed(2)}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Accept",
          onPress: async () => {
            setProcessing(true);

            // Accept the quote
            const { error: quoteError } = await supabase
              .from("job_quotes")
              .update({ status: "accepted", updated_at: new Date().toISOString() })
              .eq("id", quote.id);

            if (quoteError) {
              Alert.alert("Error", quoteError.message);
              setProcessing(false);
              return;
            }

            // Update the job
            const { error: jobError } = await supabase
              .from("jobs")
              .update({
                status: "accepted",
                assigned_driver_id: quote.driver_id,
                accepted_quote_id: quote.id,
                final_price: quote.amount,
                updated_at: new Date().toISOString(),
              })
              .eq("id", quote.job_id);

            if (jobError) {
              Alert.alert("Error", jobError.message);
            } else {
              Alert.alert("Quote Accepted", "The driver has been assigned to your shipment.");
              await fetchJobsAndQuotes();
            }

            // Decline other pending quotes for this job
            await supabase
              .from("job_quotes")
              .update({ status: "declined", updated_at: new Date().toISOString() })
              .eq("job_id", quote.job_id)
              .neq("id", quote.id)
              .in("status", ["pending", "countered_by_shipper", "countered_by_driver"]);

            setProcessing(false);
          },
        },
      ]
    );
  };

  const handleDeclineQuote = async (quote: QuoteWithDriver) => {
    setProcessing(true);
    const { error } = await supabase
      .from("job_quotes")
      .update({ status: "declined", updated_at: new Date().toISOString() })
      .eq("id", quote.id);

    if (error) {
      Alert.alert("Error", error.message);
    } else {
      await fetchJobsAndQuotes();
    }
    setProcessing(false);
  };

  const handleCounter = async () => {
    if (!selectedQuote) return;
    const amount = parseFloat(counterAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid counter amount.");
      return;
    }

    setProcessing(true);
    const { error } = await supabase
      .from("job_quotes")
      .update({
        status: "countered_by_shipper",
        shipper_counter_amount: amount,
        shipper_counter_note: counterNote.trim() || null,
        negotiation_round: selectedQuote.negotiation_round + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", selectedQuote.id);

    setProcessing(false);
    setCounterModalVisible(false);
    setCounterAmount("");
    setCounterNote("");
    setSelectedQuote(null);

    if (error) {
      Alert.alert("Error", error.message);
    } else {
      Alert.alert("Counter Sent", "Your counter offer has been sent to the driver.");
      await fetchJobsAndQuotes();
    }
  };

  const openCounterModal = (quote: QuoteWithDriver) => {
    setSelectedQuote(quote);
    setCounterAmount(quote.amount.toFixed(2));
    setCounterModalVisible(true);
  };

  const getQuoteStatusLabel = (quote: QuoteWithDriver): string => {
    switch (quote.status) {
      case "pending":
        return "Pending";
      case "countered_by_shipper":
        return "You Countered";
      case "countered_by_driver":
        return "Driver Countered";
      default:
        return quote.status;
    }
  };

  const getDisplayAmount = (quote: QuoteWithDriver): number => {
    if (quote.status === "countered_by_driver" && quote.driver_counter_amount != null) {
      return quote.driver_counter_amount;
    }
    if (quote.status === "countered_by_shipper" && quote.shipper_counter_amount != null) {
      return quote.shipper_counter_amount;
    }
    return quote.amount;
  };

  const renderQuote = (quote: QuoteWithDriver) => {
    const displayAmount = getDisplayAmount(quote);
    return (
      <View key={quote.id} style={styles.quoteItem}>
        <View style={styles.quoteHeader}>
          <View style={styles.quoteDriverInfo}>
            <View style={styles.quoteAvatar}>
              <Text style={styles.quoteAvatarText}>
                {quote.driver_profile?.full_name?.[0]?.toUpperCase() || "?"}
              </Text>
            </View>
            <View>
              <Text style={styles.quoteDriverName}>
                {quote.driver_profile?.full_name || "Unknown Driver"}
              </Text>
              <Text style={styles.quoteStatus}>
                {getQuoteStatusLabel(quote)}
                {quote.estimated_pickup_eta_minutes != null &&
                  ` | ETA: ${quote.estimated_pickup_eta_minutes} min`}
              </Text>
            </View>
          </View>
          <Text style={styles.quoteAmount}>${displayAmount.toFixed(2)}</Text>
        </View>

        {quote.driver_note && (
          <Text style={styles.quoteNote}>"{quote.driver_note}"</Text>
        )}
        {quote.status === "countered_by_driver" && quote.driver_counter_note && (
          <Text style={styles.quoteNote}>
            Driver's counter note: "{quote.driver_counter_note}"
          </Text>
        )}

        <View style={styles.quoteActions}>
          <TouchableOpacity
            style={styles.acceptButton}
            onPress={() => handleAcceptQuote(quote)}
            disabled={processing}
          >
            <Text style={styles.acceptButtonText}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.counterButton}
            onPress={() => openCounterModal(quote)}
            disabled={processing}
          >
            <Text style={styles.counterButtonText}>Counter</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.declineButton}
            onPress={() => handleDeclineQuote(quote)}
            disabled={processing}
          >
            <Text style={styles.declineButtonText}>Decline</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderJobItem = ({ item }: { item: JobWithQuotes }) => {
    const statusConfig = JOB_STATUS_CONFIG[item.status];
    return (
      <View style={styles.jobCard}>
        <View style={styles.jobHeader}>
          <Text style={styles.jobTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <View
            style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}
          >
            <Text style={[styles.statusBadgeText, { color: statusConfig.color }]}>
              {item.quotes.length} quote{item.quotes.length !== 1 ? "s" : ""}
            </Text>
          </View>
        </View>
        <Text style={styles.jobRoute} numberOfLines={1}>
          {item.pickup_address.split(",")[0]} →{" "}
          {item.dropoff_address.split(",")[0]}
        </Text>

        {item.quotes.map(renderQuote)}
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
        <Text style={styles.screenTitle}>Quotes & Bids</Text>
        <Text style={styles.screenSubtitle}>
          Review and manage driver quotes
        </Text>
      </View>

      <FlatList
        data={jobsWithQuotes}
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
            <Text style={styles.emptyTitle}>No Quotes Yet</Text>
            <Text style={styles.emptyText}>
              Post a shipment and wait for drivers to send you quotes.
            </Text>
          </View>
        }
      />

      {/* Counter Offer Modal */}
      <Modal
        visible={counterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCounterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Counter Offer</Text>
            <Text style={styles.modalSubtitle}>
              Original: ${selectedQuote?.amount.toFixed(2)}
            </Text>

            <Text style={styles.label}>Your Counter Amount</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter amount"
              placeholderTextColor={COLORS.gray400}
              value={counterAmount}
              onChangeText={setCounterAmount}
              keyboardType="decimal-pad"
            />

            <Text style={styles.label}>Note (optional)</Text>
            <TextInput
              style={[styles.input, { height: 60, textAlignVertical: "top" }]}
              placeholder="Add a note to the driver"
              placeholderTextColor={COLORS.gray400}
              value={counterNote}
              onChangeText={setCounterNote}
              multiline
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setCounterModalVisible(false);
                  setSelectedQuote(null);
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSubmitButton, processing && styles.buttonDisabled]}
                onPress={handleCounter}
                disabled={processing}
              >
                {processing ? (
                  <ActivityIndicator color={COLORS.white} size="small" />
                ) : (
                  <Text style={styles.modalSubmitText}>Send Counter</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  jobCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  jobHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  jobTitle: {
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
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  jobRoute: {
    fontSize: 13,
    color: COLORS.gray500,
    marginBottom: 14,
  },
  quoteItem: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  quoteHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  quoteDriverInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  quoteAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.navy,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  quoteAvatarText: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: 14,
  },
  quoteDriverName: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.navy,
  },
  quoteStatus: {
    fontSize: 12,
    color: COLORS.gray500,
  },
  quoteAmount: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.green,
  },
  quoteNote: {
    fontSize: 13,
    color: COLORS.gray600,
    fontStyle: "italic",
    marginTop: 8,
  },
  quoteActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: COLORS.green,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  acceptButtonText: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: 13,
  },
  counterButton: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.blue,
  },
  counterButtonText: {
    color: COLORS.blue,
    fontWeight: "700",
    fontSize: 13,
  },
  declineButton: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.red,
  },
  declineButtonText: {
    color: COLORS.red,
    fontWeight: "700",
    fontSize: 13,
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
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.navy,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: COLORS.gray500,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.navy,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: COLORS.lightGray,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.navy,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  modalCancelText: {
    color: COLORS.gray600,
    fontWeight: "600",
    fontSize: 15,
  },
  modalSubmitButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: COLORS.blue,
  },
  modalSubmitText: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: 15,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
