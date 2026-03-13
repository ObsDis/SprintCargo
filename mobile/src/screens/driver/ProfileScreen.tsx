import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";
import { DriverProfile, DriverRateCard } from "../../types/database";
import { COLORS } from "../../lib/constants";

export default function ProfileScreen() {
  const { profile, signOut } = useAuth();
  const [driverProfile, setDriverProfile] = useState<DriverProfile | null>(null);
  const [rateCard, setRateCard] = useState<DriverRateCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  const fetchDriverData = useCallback(async () => {
    if (!profile) return;

    const [dpResult, rcResult] = await Promise.all([
      supabase
        .from("driver_profiles")
        .select("*")
        .eq("id", profile.id)
        .single(),
      supabase
        .from("driver_rate_cards")
        .select("*")
        .eq("driver_id", profile.id)
        .maybeSingle(),
    ]);

    if (!dpResult.error && dpResult.data) {
      setDriverProfile(dpResult.data as DriverProfile);
    }
    if (!rcResult.error && rcResult.data) {
      setRateCard(rcResult.data as DriverRateCard);
    }
  }, [profile]);

  useEffect(() => {
    fetchDriverData().finally(() => setLoading(false));
  }, [fetchDriverData]);

  const toggleAvailability = async () => {
    if (!driverProfile) return;
    setToggling(true);

    const { error } = await supabase
      .from("driver_profiles")
      .update({ is_available: !driverProfile.is_available })
      .eq("id", driverProfile.id);

    if (!error) {
      setDriverProfile((prev) =>
        prev ? { ...prev, is_available: !prev.is_available } : prev
      );
    } else {
      Alert.alert("Error", error.message);
    }
    setToggling(false);
  };

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: signOut },
    ]);
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
      <ScrollView>
        <View style={styles.screenHeader}>
          <Text style={styles.screenTitle}>Profile</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {profile?.full_name
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase() || "?"}
            </Text>
          </View>
          <Text style={styles.profileName}>{profile?.full_name}</Text>
          <Text style={styles.profileEmail}>{profile?.email}</Text>

          {driverProfile && (
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {driverProfile.rating.toFixed(1)}
                </Text>
                <Text style={styles.statLabel}>Rating</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {driverProfile.total_deliveries}
                </Text>
                <Text style={styles.statLabel}>Deliveries</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text
                  style={[
                    styles.statValue,
                    {
                      color: driverProfile.verified
                        ? COLORS.green
                        : COLORS.orange,
                    },
                  ]}
                >
                  {driverProfile.verified ? "Yes" : "No"}
                </Text>
                <Text style={styles.statLabel}>Verified</Text>
              </View>
            </View>
          )}
        </View>

        {/* Availability Toggle */}
        {driverProfile && (
          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View>
                <Text style={styles.settingTitle}>Available for Jobs</Text>
                <Text style={styles.settingDesc}>
                  Toggle off to stop receiving new job requests
                </Text>
              </View>
              <Switch
                value={driverProfile.is_available}
                onValueChange={toggleAvailability}
                disabled={toggling}
                trackColor={{ false: COLORS.gray300, true: COLORS.green }}
                thumbColor={COLORS.white}
              />
            </View>
          </View>
        )}

        {/* Vehicle Info */}
        {driverProfile && (
          <View style={styles.settingCard}>
            <Text style={styles.cardTitle}>Vehicle Information</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Vehicle</Text>
              <Text style={styles.infoValue}>
                {driverProfile.vehicle_year}{" "}
                {driverProfile.vehicle_make}{" "}
                {driverProfile.vehicle_model}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Color</Text>
              <Text style={styles.infoValue}>
                {driverProfile.vehicle_color || "Not set"}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>License Plate</Text>
              <Text style={styles.infoValue}>
                {driverProfile.license_plate || "Not set"}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Cargo Space</Text>
              <Text style={styles.infoValue}>
                {driverProfile.cargo_length_inches != null
                  ? `${driverProfile.cargo_length_inches}" x ${driverProfile.cargo_width_inches}" x ${driverProfile.cargo_height_inches}"`
                  : "Not set"}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Max Weight</Text>
              <Text style={styles.infoValue}>
                {driverProfile.max_weight_lbs != null
                  ? `${driverProfile.max_weight_lbs} lbs`
                  : "Not set"}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Service Radius</Text>
              <Text style={styles.infoValue}>
                {driverProfile.service_radius_miles} miles
              </Text>
            </View>
          </View>
        )}

        {/* Rate Card */}
        {rateCard && (
          <View style={styles.settingCard}>
            <Text style={styles.cardTitle}>Rate Card</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Base Rate</Text>
              <Text style={styles.infoValue}>
                ${rateCard.base_rate.toFixed(2)}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Per Mile</Text>
              <Text style={styles.infoValue}>
                ${rateCard.per_mile_rate.toFixed(2)}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Rush Multiplier</Text>
              <Text style={styles.infoValue}>
                {rateCard.rush_multiplier}x
              </Text>
            </View>
          </View>
        )}

        {/* Subscription Status */}
        <View style={styles.settingCard}>
          <Text style={styles.cardTitle}>Subscription</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status</Text>
            <View
              style={[
                styles.subscriptionBadge,
                {
                  backgroundColor:
                    profile?.subscription_status === "active"
                      ? COLORS.greenLight
                      : profile?.subscription_status === "trial"
                      ? COLORS.blueLight
                      : COLORS.redLight,
                },
              ]}
            >
              <Text
                style={[
                  styles.subscriptionText,
                  {
                    color:
                      profile?.subscription_status === "active"
                        ? COLORS.green
                        : profile?.subscription_status === "trial"
                        ? COLORS.blue
                        : COLORS.red,
                  },
                ]}
              >
                {profile?.subscription_status?.replace("_", " ").toUpperCase() ||
                  "INACTIVE"}
              </Text>
            </View>
          </View>
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>
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
  profileCard: {
    backgroundColor: COLORS.white,
    margin: 16,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.navy,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.white,
  },
  profileName: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.navy,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: COLORS.gray500,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    justifyContent: "center",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
  },
  statItem: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.navy,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.gray400,
    fontWeight: "600",
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: COLORS.gray200,
  },
  settingCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    padding: 20,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.navy,
    marginBottom: 4,
  },
  settingDesc: {
    fontSize: 13,
    color: COLORS.gray500,
    maxWidth: 240,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.navy,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  infoLabel: {
    fontSize: 14,
    color: COLORS.gray500,
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 14,
    color: COLORS.navy,
    fontWeight: "600",
  },
  subscriptionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  subscriptionText: {
    fontSize: 12,
    fontWeight: "700",
  },
  signOutButton: {
    marginHorizontal: 16,
    marginTop: 8,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.red,
    alignItems: "center",
  },
  signOutText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.red,
  },
  bottomSpacer: {
    height: 40,
  },
});
