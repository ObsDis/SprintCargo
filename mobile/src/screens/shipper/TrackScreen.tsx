import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker, Polyline } from "react-native-maps";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";
import { Job, DeliveryTracking, AdditionalStop } from "../../types/database";
import { COLORS, JOB_STATUS_CONFIG, ACTIVE_DELIVERY_STATUSES } from "../../lib/constants";

export default function TrackScreen() {
  const { user } = useAuth();
  const [activeJobs, setActiveJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [driverLocation, setDriverLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchActiveDeliveries = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("shipper_id", user.id)
      .in("status", ACTIVE_DELIVERY_STATUSES)
      .order("updated_at", { ascending: false });

    if (!error && data) {
      const jobs = data as Job[];
      setActiveJobs(jobs);
      if (jobs.length > 0 && !selectedJob) {
        setSelectedJob(jobs[0]);
      }
    }
  }, [user, selectedJob]);

  const fetchDriverLocation = useCallback(async () => {
    if (!selectedJob?.assigned_driver_id) return;

    const { data, error } = await supabase
      .from("delivery_tracking")
      .select("*")
      .eq("job_id", selectedJob.id)
      .eq("driver_id", selectedJob.assigned_driver_id)
      .order("recorded_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      const tracking = data as DeliveryTracking;
      setDriverLocation({ lat: tracking.lat, lng: tracking.lng });
    }
  }, [selectedJob]);

  useEffect(() => {
    fetchActiveDeliveries().finally(() => setLoading(false));
  }, [fetchActiveDeliveries]);

  // Poll driver location every 10 seconds
  useEffect(() => {
    if (!selectedJob) return;

    fetchDriverLocation();
    pollIntervalRef.current = setInterval(fetchDriverLocation, 10_000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [selectedJob, fetchDriverLocation]);

  // Also subscribe to realtime updates for driver location
  useEffect(() => {
    if (!selectedJob) return;

    const channel = supabase
      .channel(`tracking-${selectedJob.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "delivery_tracking",
          filter: `job_id=eq.${selectedJob.id}`,
        },
        (payload) => {
          const newRecord = payload.new as DeliveryTracking;
          setDriverLocation({ lat: newRecord.lat, lng: newRecord.lng });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedJob]);

  const additionalStops: AdditionalStop[] = selectedJob?.additional_stops
    ? (selectedJob.additional_stops as unknown as AdditionalStop[])
    : [];

  const estimateETA = (): string | null => {
    if (!driverLocation || !selectedJob) return null;

    // Rough ETA based on distance (very simplified)
    const targetLat =
      selectedJob.status === "driver_en_route_pickup" ||
      selectedJob.status === "accepted"
        ? selectedJob.pickup_lat
        : selectedJob.dropoff_lat;
    const targetLng =
      selectedJob.status === "driver_en_route_pickup" ||
      selectedJob.status === "accepted"
        ? selectedJob.pickup_lng
        : selectedJob.dropoff_lng;

    const R = 3959;
    const dLat = ((targetLat - driverLocation.lat) * Math.PI) / 180;
    const dLng = ((targetLng - driverLocation.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((driverLocation.lat * Math.PI) / 180) *
        Math.cos((targetLat * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const etaMinutes = Math.round(dist * 2.5); // ~24mph avg in city

    if (etaMinutes < 1) return "< 1 min";
    if (etaMinutes < 60) return `${etaMinutes} min`;
    const hours = Math.floor(etaMinutes / 60);
    const mins = etaMinutes % 60;
    return `${hours}h ${mins}m`;
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

  if (activeJobs.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.screenHeader}>
          <Text style={styles.screenTitle}>Live Tracking</Text>
        </View>
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>No Active Deliveries</Text>
          <Text style={styles.emptyText}>
            When a driver is actively delivering your shipment, you can track
            their location in real time here.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const mapRegion = driverLocation
    ? {
        latitude: driverLocation.lat,
        longitude: driverLocation.lng,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }
    : selectedJob
    ? {
        latitude:
          (selectedJob.pickup_lat + selectedJob.dropoff_lat) / 2,
        longitude:
          (selectedJob.pickup_lng + selectedJob.dropoff_lng) / 2,
        latitudeDelta:
          Math.abs(selectedJob.pickup_lat - selectedJob.dropoff_lat) * 1.5 +
          0.02,
        longitudeDelta:
          Math.abs(selectedJob.pickup_lng - selectedJob.dropoff_lng) * 1.5 +
          0.02,
      }
    : {
        latitude: 37.78,
        longitude: -122.41,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      };

  const eta = estimateETA();
  const statusConfig = selectedJob
    ? JOB_STATUS_CONFIG[selectedJob.status]
    : null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.screenHeader}>
        <Text style={styles.screenTitle}>Live Tracking</Text>
      </View>

      {/* Job Selector (if multiple active) */}
      {activeJobs.length > 1 && (
        <FlatList
          data={activeJobs}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.jobSelector}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.jobSelectorItem,
                selectedJob?.id === item.id && styles.jobSelectorItemActive,
              ]}
              onPress={() => {
                setSelectedJob(item);
                setDriverLocation(null);
              }}
            >
              <Text
                style={[
                  styles.jobSelectorText,
                  selectedJob?.id === item.id && styles.jobSelectorTextActive,
                ]}
                numberOfLines={1}
              >
                {item.title}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView style={styles.map} region={mapRegion}>
          {driverLocation && (
            <Marker
              coordinate={{
                latitude: driverLocation.lat,
                longitude: driverLocation.lng,
              }}
              title="Driver"
              pinColor={COLORS.blue}
            />
          )}
          {selectedJob && (
            <>
              <Marker
                coordinate={{
                  latitude: selectedJob.pickup_lat,
                  longitude: selectedJob.pickup_lng,
                }}
                title="Pickup"
                description={selectedJob.pickup_address}
                pinColor={COLORS.green}
              />
              {additionalStops.map((stop, idx) => (
                <Marker
                  key={`stop-${idx}`}
                  coordinate={{ latitude: stop.lat, longitude: stop.lng }}
                  title={`Stop ${idx + 1}`}
                  description={stop.address}
                  pinColor={COLORS.orange}
                />
              ))}
              <Marker
                coordinate={{
                  latitude: selectedJob.dropoff_lat,
                  longitude: selectedJob.dropoff_lng,
                }}
                title="Dropoff"
                description={selectedJob.dropoff_address}
                pinColor={COLORS.red}
              />
              <Polyline
                coordinates={[
                  {
                    latitude: selectedJob.pickup_lat,
                    longitude: selectedJob.pickup_lng,
                  },
                  ...additionalStops.map((s) => ({
                    latitude: s.lat,
                    longitude: s.lng,
                  })),
                  {
                    latitude: selectedJob.dropoff_lat,
                    longitude: selectedJob.dropoff_lng,
                  },
                ]}
                strokeColor={COLORS.blue}
                strokeWidth={3}
              />
            </>
          )}
        </MapView>
      </View>

      {/* Status Info Panel */}
      {selectedJob && statusConfig && (
        <View style={styles.infoPanel}>
          <View style={styles.infoPanelHeader}>
            <View>
              <Text style={styles.infoPanelTitle}>{selectedJob.title}</Text>
              <View style={styles.infoStatusRow}>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: statusConfig.bgColor },
                  ]}
                >
                  <Text
                    style={[styles.statusBadgeText, { color: statusConfig.color }]}
                  >
                    {statusConfig.label}
                  </Text>
                </View>
              </View>
            </View>
            {eta && (
              <View style={styles.etaContainer}>
                <Text style={styles.etaLabel}>ETA</Text>
                <Text style={styles.etaValue}>{eta}</Text>
              </View>
            )}
          </View>

          <View style={styles.routeInfo}>
            <View style={styles.routeRow}>
              <View style={[styles.routeDot, { backgroundColor: COLORS.green }]} />
              <Text style={styles.routeText} numberOfLines={1}>
                {selectedJob.pickup_address}
              </Text>
            </View>
            <View style={styles.routeConnector} />
            <View style={styles.routeRow}>
              <View style={[styles.routeDot, { backgroundColor: COLORS.red }]} />
              <Text style={styles.routeText} numberOfLines={1}>
                {selectedJob.dropoff_address}
              </Text>
            </View>
          </View>

          {!driverLocation &&
            (selectedJob.status === "driver_en_route_pickup" ||
              selectedJob.status === "in_transit") && (
              <View style={styles.waitingBanner}>
                <ActivityIndicator size="small" color={COLORS.blue} />
                <Text style={styles.waitingText}>
                  Waiting for driver location updates...
                </Text>
              </View>
            )}
        </View>
      )}
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
  jobSelector: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  jobSelectorItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    marginRight: 8,
  },
  jobSelectorItemActive: {
    backgroundColor: COLORS.blue,
    borderColor: COLORS.blue,
  },
  jobSelectorText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.gray600,
  },
  jobSelectorTextActive: {
    color: COLORS.white,
  },
  mapContainer: {
    flex: 1,
    minHeight: 300,
  },
  map: {
    flex: 1,
  },
  infoPanel: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  infoPanelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  infoPanelTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.navy,
    marginBottom: 8,
  },
  infoStatusRow: {
    flexDirection: "row",
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
  etaContainer: {
    alignItems: "center",
    backgroundColor: COLORS.blueLight,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  etaLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.blue,
    marginBottom: 2,
  },
  etaValue: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.blue,
  },
  routeInfo: {
    marginBottom: 8,
  },
  routeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  routeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  routeConnector: {
    width: 2,
    height: 12,
    backgroundColor: COLORS.gray200,
    marginLeft: 4,
  },
  routeText: {
    fontSize: 14,
    color: COLORS.gray600,
    flex: 1,
  },
  waitingBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.blueLight,
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  waitingText: {
    fontSize: 13,
    color: COLORS.blue,
    fontWeight: "500",
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
});
