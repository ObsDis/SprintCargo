import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";
import { Job } from "../../types/database";
import { COLORS } from "../../lib/constants";

export default function ShipperProfileScreen() {
  const { profile, signOut } = useAuth();
  const [stats, setStats] = useState({
    totalShipments: 0,
    activeShipments: 0,
    completedShipments: 0,
    totalSpent: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!profile) return;

    const { data, error } = await supabase
      .from("jobs")
      .select("id, status, final_price")
      .eq("shipper_id", profile.id);

    if (!error && data) {
      const jobs = data as Pick<Job, "id" | "status" | "final_price">[];
      const active = jobs.filter(
        (j) =>
          !["completed", "cancelled", "disputed", "draft"].includes(j.status)
      ).length;
      const completed = jobs.filter(
        (j) => j.status === "completed" || j.status === "delivered"
      ).length;
      const spent = jobs
        .filter((j) => j.final_price != null)
        .reduce((sum, j) => sum + (j.final_price ?? 0), 0);

      setStats({
        totalShipments: jobs.length,
        activeShipments: active,
        completedShipments: completed,
        totalSpent: spent,
      });
    }
  }, [profile]);

  useEffect(() => {
    fetchStats().finally(() => setLoading(false));
  }, [fetchStats]);

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: signOut },
    ]);
  };

  const handleSupport = () => {
    Linking.openURL("mailto:support@sprintcargo.com?subject=Support%20Request");
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
          {profile?.company_name && (
            <Text style={styles.companyName}>{profile.company_name}</Text>
          )}
          {profile?.phone && (
            <Text style={styles.phoneText}>{profile.phone}</Text>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.totalShipments}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: COLORS.blue }]}>
                {stats.activeShipments}
              </Text>
              <Text style={styles.statLabel}>Active</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: COLORS.green }]}>
                {stats.completedShipments}
              </Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                ${stats.totalSpent.toFixed(0)}
              </Text>
              <Text style={styles.statLabel}>Spent</Text>
            </View>
          </View>
        </View>

        {/* Account Settings */}
        <View style={styles.settingsCard}>
          <Text style={styles.cardTitle}>Account</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Subscription</Text>
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

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Payment Method</Text>
            <Text style={styles.infoValue}>
              {profile?.stripe_customer_id ? "Configured" : "Not set"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Member Since</Text>
            <Text style={styles.infoValue}>
              {profile?.created_at
                ? new Date(profile.created_at).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })
                : "N/A"}
            </Text>
          </View>
        </View>

        {/* Support */}
        <TouchableOpacity style={styles.menuItem} onPress={handleSupport}>
          <Text style={styles.menuItemText}>Contact Support</Text>
          <Text style={styles.menuItemArrow}>{">"}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() =>
            Linking.openURL("https://sprintcargo.com/terms")
          }
        >
          <Text style={styles.menuItemText}>Terms of Service</Text>
          <Text style={styles.menuItemArrow}>{">"}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() =>
            Linking.openURL("https://sprintcargo.com/privacy")
          }
        >
          <Text style={styles.menuItemText}>Privacy Policy</Text>
          <Text style={styles.menuItemArrow}>{">"}</Text>
        </TouchableOpacity>

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>SprintCargo v1.0.0</Text>

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
  },
  companyName: {
    fontSize: 14,
    color: COLORS.blue,
    fontWeight: "600",
    marginTop: 4,
  },
  phoneText: {
    fontSize: 14,
    color: COLORS.gray500,
    marginTop: 2,
  },
  statsCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    padding: 20,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  statItem: {
    alignItems: "center",
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
  settingsCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    padding: 20,
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
    paddingVertical: 10,
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
  menuItem: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginBottom: 2,
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 12,
  },
  menuItemText: {
    fontSize: 15,
    color: COLORS.navy,
    fontWeight: "500",
  },
  menuItemArrow: {
    fontSize: 16,
    color: COLORS.gray400,
    fontWeight: "600",
  },
  signOutButton: {
    marginHorizontal: 16,
    marginTop: 20,
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
  versionText: {
    textAlign: "center",
    color: COLORS.gray400,
    fontSize: 12,
    marginTop: 16,
  },
  bottomSpacer: {
    height: 40,
  },
});
