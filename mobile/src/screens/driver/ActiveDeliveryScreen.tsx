import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker, Polyline } from "react-native-maps";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";
import { useLocation } from "../../hooks/useLocation";
import { Job, JobStatus, AdditionalStop } from "../../types/database";
import {
  COLORS,
  DRIVER_DELIVERY_STEPS,
  ACTIVE_DELIVERY_STATUSES,
} from "../../lib/constants";

const NEXT_STATUS_MAP: Partial<Record<JobStatus, JobStatus>> = {
  accepted: "driver_en_route_pickup",
  driver_en_route_pickup: "at_pickup",
  at_pickup: "loaded",
  loaded: "in_transit",
  in_transit: "at_dropoff",
  at_dropoff: "delivered",
};

const NEXT_STATUS_LABELS: Partial<Record<JobStatus, string>> = {
  accepted: "Start Driving to Pickup",
  driver_en_route_pickup: "Arrived at Pickup",
  at_pickup: "Confirm Loaded",
  loaded: "Start Delivery",
  in_transit: "Arrived at Dropoff",
  at_dropoff: "Confirm Delivered",
};

const PHOTO_REQUIRED_TRANSITIONS: JobStatus[] = ["at_pickup", "at_dropoff"];

export default function ActiveDeliveryScreen() {
  const { user } = useAuth();
  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [advancing, setAdvancing] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);

  const { latitude, longitude } = useLocation({
    activeJobId: activeJob?.id,
    driverId: user?.id,
    enableTracking: activeJob != null,
  });

  const fetchActiveJob = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("assigned_driver_id", user.id)
      .in("status", ACTIVE_DELIVERY_STATUSES)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error) {
      setActiveJob(data as Job | null);
    }
  }, [user]);

  useEffect(() => {
    fetchActiveJob().finally(() => setLoading(false));
  }, [fetchActiveJob]);

  const takePhoto = async (): Promise<string | null> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      const cameraResult = await ImagePicker.requestCameraPermissionsAsync();
      if (cameraResult.status !== "granted") {
        Alert.alert("Permission Needed", "Camera permission is required to take photos.");
        return null;
      }
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets[0]) {
      return result.assets[0].uri;
    }
    return null;
  };

  const uploadPhoto = async (uri: string, jobId: string, type: "loading" | "delivery"): Promise<string | null> => {
    try {
      const fileName = `${type}_${jobId}_${Date.now()}.jpg`;
      const response = await fetch(uri);
      const blob = await response.blob();

      const { data, error } = await supabase.storage
        .from("delivery-photos")
        .upload(fileName, blob, { contentType: "image/jpeg" });

      if (error) {
        console.error("Upload error:", error);
        return null;
      }

      const { data: urlData } = supabase.storage
        .from("delivery-photos")
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    } catch {
      return null;
    }
  };

  const handleCapturePhoto = async () => {
    const uri = await takePhoto();
    if (uri) {
      setCapturedPhotos((prev) => [...prev, uri]);
    }
  };

  const advanceStatus = async () => {
    if (!activeJob || !user) return;

    const nextStatus = NEXT_STATUS_MAP[activeJob.status];
    if (!nextStatus) return;

    // Check if photos are required for this transition
    if (PHOTO_REQUIRED_TRANSITIONS.includes(activeJob.status) && capturedPhotos.length === 0) {
      Alert.alert(
        "Photo Required",
        activeJob.status === "at_pickup"
          ? "Please take a photo of the loaded cargo before proceeding."
          : "Please take a photo confirming delivery before proceeding."
      );
      return;
    }

    setAdvancing(true);

    // Upload captured photos
    const photoType = activeJob.status === "at_pickup" ? "loading" : "delivery";
    const uploadedUrls: string[] = [];
    for (const uri of capturedPhotos) {
      const url = await uploadPhoto(uri, activeJob.id, photoType as "loading" | "delivery");
      if (url) uploadedUrls.push(url);
    }

    const updateData: Record<string, unknown> = {
      status: nextStatus,
      updated_at: new Date().toISOString(),
    };

    if (activeJob.status === "at_pickup" && uploadedUrls.length > 0) {
      updateData.loading_photos = [
        ...(activeJob.loading_photos || []),
        ...uploadedUrls,
      ];
    }
    if (activeJob.status === "at_dropoff" && uploadedUrls.length > 0) {
      updateData.delivery_photos = [
        ...(activeJob.delivery_photos || []),
        ...uploadedUrls,
      ];
    }
    if (nextStatus === "delivered") {
      updateData.completed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("jobs")
      .update(updateData)
      .eq("id", activeJob.id);

    setAdvancing(false);

    if (error) {
      Alert.alert("Error", error.message);
    } else {
      setCapturedPhotos([]);
      if (nextStatus === "delivered") {
        Alert.alert("Delivery Complete", "Great job! The delivery has been marked as completed.");
        setActiveJob(null);
      } else {
        await fetchActiveJob();
      }
    }
  };

  const currentStepIndex = activeJob
    ? DRIVER_DELIVERY_STEPS.findIndex((s) => s.status === activeJob.status)
    : -1;

  const additionalStops: AdditionalStop[] = activeJob?.additional_stops
    ? (activeJob.additional_stops as unknown as AdditionalStop[])
    : [];

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.blue} />
        </View>
      </SafeAreaView>
    );
  }

  if (!activeJob) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.screenHeader}>
          <Text style={styles.screenTitle}>Active Delivery</Text>
        </View>
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>No Active Delivery</Text>
          <Text style={styles.emptyText}>
            Accept a job quote to start a delivery. Your active delivery will appear
            here.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const mapRegion = {
    latitude: latitude ?? activeJob.pickup_lat,
    longitude: longitude ?? activeJob.pickup_lng,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.screenHeader}>
        <Text style={styles.screenTitle}>Active Delivery</Text>
        <Text style={styles.screenSubtitle}>{activeJob.title}</Text>
      </View>

      <ScrollView style={styles.scrollContent}>
        {/* Map */}
        <View style={styles.mapContainer}>
          <MapView style={styles.map} region={mapRegion}>
            {/* Driver position */}
            {latitude != null && longitude != null && (
              <Marker
                coordinate={{ latitude, longitude }}
                title="Your Location"
                pinColor={COLORS.blue}
              />
            )}
            {/* Pickup */}
            <Marker
              coordinate={{
                latitude: activeJob.pickup_lat,
                longitude: activeJob.pickup_lng,
              }}
              title="Pickup"
              description={activeJob.pickup_address}
              pinColor={COLORS.green}
            />
            {/* Additional Stops */}
            {additionalStops.map((stop, idx) => (
              <Marker
                key={`stop-${idx}`}
                coordinate={{ latitude: stop.lat, longitude: stop.lng }}
                title={`Stop ${idx + 1}`}
                description={stop.address}
                pinColor={COLORS.orange}
              />
            ))}
            {/* Dropoff */}
            <Marker
              coordinate={{
                latitude: activeJob.dropoff_lat,
                longitude: activeJob.dropoff_lng,
              }}
              title="Dropoff"
              description={activeJob.dropoff_address}
              pinColor={COLORS.red}
            />
            {/* Route line */}
            <Polyline
              coordinates={[
                {
                  latitude: activeJob.pickup_lat,
                  longitude: activeJob.pickup_lng,
                },
                ...additionalStops.map((s) => ({
                  latitude: s.lat,
                  longitude: s.lng,
                })),
                {
                  latitude: activeJob.dropoff_lat,
                  longitude: activeJob.dropoff_lng,
                },
              ]}
              strokeColor={COLORS.blue}
              strokeWidth={3}
            />
          </MapView>
        </View>

        {/* Status Stepper */}
        <View style={styles.stepperContainer}>
          <Text style={styles.sectionTitle}>Delivery Progress</Text>
          {DRIVER_DELIVERY_STEPS.map((step, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            return (
              <View key={step.status} style={styles.stepRow}>
                <View style={styles.stepIndicatorCol}>
                  <View
                    style={[
                      styles.stepDot,
                      isCompleted && styles.stepDotCompleted,
                      isCurrent && styles.stepDotCurrent,
                    ]}
                  >
                    {isCompleted && <Text style={styles.stepCheck}>OK</Text>}
                  </View>
                  {idx < DRIVER_DELIVERY_STEPS.length - 1 && (
                    <View
                      style={[
                        styles.stepLine,
                        isCompleted && styles.stepLineCompleted,
                      ]}
                    />
                  )}
                </View>
                <Text
                  style={[
                    styles.stepLabel,
                    isCompleted && styles.stepLabelCompleted,
                    isCurrent && styles.stepLabelCurrent,
                  ]}
                >
                  {step.label}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Waypoints */}
        <View style={styles.waypointsContainer}>
          <Text style={styles.sectionTitle}>Route</Text>
          <View style={styles.waypointItem}>
            <View style={[styles.waypointDot, { backgroundColor: COLORS.green }]} />
            <View style={styles.waypointInfo}>
              <Text style={styles.waypointLabel}>Pickup</Text>
              <Text style={styles.waypointAddress}>{activeJob.pickup_address}</Text>
              <Text style={styles.waypointContact}>
                {activeJob.pickup_contact_name} - {activeJob.pickup_contact_phone}
              </Text>
            </View>
          </View>

          {additionalStops.map((stop, idx) => (
            <View key={`wp-${idx}`} style={styles.waypointItem}>
              <View
                style={[styles.waypointDot, { backgroundColor: COLORS.orange }]}
              />
              <View style={styles.waypointInfo}>
                <Text style={styles.waypointLabel}>Stop {idx + 1}</Text>
                <Text style={styles.waypointAddress}>{stop.address}</Text>
                <Text style={styles.waypointContact}>
                  {stop.contact_name} - {stop.contact_phone}
                </Text>
              </View>
            </View>
          ))}

          <View style={styles.waypointItem}>
            <View style={[styles.waypointDot, { backgroundColor: COLORS.red }]} />
            <View style={styles.waypointInfo}>
              <Text style={styles.waypointLabel}>Dropoff</Text>
              <Text style={styles.waypointAddress}>{activeJob.dropoff_address}</Text>
              <Text style={styles.waypointContact}>
                {activeJob.dropoff_contact_name} - {activeJob.dropoff_contact_phone}
              </Text>
            </View>
          </View>
        </View>

        {/* Photo capture for loading/delivery */}
        {PHOTO_REQUIRED_TRANSITIONS.includes(activeJob.status) && (
          <View style={styles.photoSection}>
            <Text style={styles.sectionTitle}>
              {activeJob.status === "at_pickup"
                ? "Loading Photos"
                : "Delivery Photos"}
            </Text>
            <Text style={styles.photoHint}>
              Take photos to confirm{" "}
              {activeJob.status === "at_pickup" ? "loading" : "delivery"}
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.photoScroll}
            >
              {capturedPhotos.map((uri, idx) => (
                <Image
                  key={`photo-${idx}`}
                  source={{ uri }}
                  style={styles.photoThumbnail}
                />
              ))}
              <TouchableOpacity
                style={styles.addPhotoButton}
                onPress={handleCapturePhoto}
              >
                <Text style={styles.addPhotoText}>+</Text>
                <Text style={styles.addPhotoLabel}>Add Photo</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

        {/* Advance Status Button */}
        {NEXT_STATUS_MAP[activeJob.status] && (
          <View style={styles.advanceContainer}>
            <TouchableOpacity
              style={[styles.advanceButton, advancing && styles.buttonDisabled]}
              onPress={advanceStatus}
              disabled={advancing}
            >
              {advancing ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.advanceButtonText}>
                  {NEXT_STATUS_LABELS[activeJob.status]}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

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
    paddingHorizontal: 40,
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
  scrollContent: {
    flex: 1,
  },
  mapContainer: {
    height: 250,
    margin: 16,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: COLORS.gray200,
  },
  map: {
    flex: 1,
  },
  stepperContainer: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.navy,
    marginBottom: 16,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  stepIndicatorCol: {
    alignItems: "center",
    width: 28,
    marginRight: 12,
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.gray300,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
  },
  stepDotCompleted: {
    borderColor: COLORS.green,
    backgroundColor: COLORS.green,
  },
  stepDotCurrent: {
    borderColor: COLORS.blue,
    backgroundColor: COLORS.blueLight,
  },
  stepCheck: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: "800",
  },
  stepLine: {
    width: 2,
    height: 24,
    backgroundColor: COLORS.gray200,
  },
  stepLineCompleted: {
    backgroundColor: COLORS.green,
  },
  stepLabel: {
    fontSize: 14,
    color: COLORS.gray400,
    paddingTop: 2,
    paddingBottom: 18,
  },
  stepLabelCompleted: {
    color: COLORS.green,
    fontWeight: "600",
  },
  stepLabelCurrent: {
    color: COLORS.blue,
    fontWeight: "700",
  },
  waypointsContainer: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  waypointItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  waypointDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
    marginRight: 12,
  },
  waypointInfo: {
    flex: 1,
  },
  waypointLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.gray500,
    marginBottom: 2,
  },
  waypointAddress: {
    fontSize: 14,
    color: COLORS.navy,
    marginBottom: 2,
  },
  waypointContact: {
    fontSize: 13,
    color: COLORS.gray400,
  },
  photoSection: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  photoHint: {
    fontSize: 13,
    color: COLORS.gray500,
    marginBottom: 12,
    marginTop: -8,
  },
  photoScroll: {
    flexDirection: "row",
  },
  photoThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 10,
  },
  addPhotoButton: {
    width: 80,
    height: 80,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.gray200,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  addPhotoText: {
    fontSize: 24,
    color: COLORS.gray400,
    fontWeight: "300",
  },
  addPhotoLabel: {
    fontSize: 10,
    color: COLORS.gray400,
    marginTop: 2,
  },
  advanceContainer: {
    paddingHorizontal: 16,
    marginTop: 4,
  },
  advanceButton: {
    backgroundColor: COLORS.blue,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  advanceButtonText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: "700",
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
  },
  bottomSpacer: {
    height: 40,
  },
});
