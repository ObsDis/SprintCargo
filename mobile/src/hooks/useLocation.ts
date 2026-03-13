import { useState, useEffect, useRef, useCallback } from "react";
import * as Location from "expo-location";
import { supabase } from "../lib/supabase";
import { LOCATION_TRACKING_INTERVAL_MS } from "../lib/constants";

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  heading: number | null;
  speed: number | null;
  accuracy: number | null;
  permissionGranted: boolean;
  loading: boolean;
  error: string | null;
}

interface UseLocationOptions {
  /** The active job ID to track delivery for */
  activeJobId?: string | null;
  /** The driver ID for tracking records */
  driverId?: string | null;
  /** Whether to enable background tracking */
  enableTracking?: boolean;
}

export function useLocation(options: UseLocationOptions = {}) {
  const { activeJobId, driverId, enableTracking = false } = options;

  const [location, setLocation] = useState<LocationState>({
    latitude: null,
    longitude: null,
    heading: null,
    speed: null,
    accuracy: null,
    permissionGranted: false,
    loading: true,
    error: null,
  });

  const trackingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const locationSubscriptionRef = useRef<Location.LocationSubscription | null>(null);

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      const { status: foregroundStatus } =
        await Location.requestForegroundPermissionsAsync();

      if (foregroundStatus !== "granted") {
        setLocation((prev) => ({
          ...prev,
          permissionGranted: false,
          loading: false,
          error: "Location permission is required to use this feature.",
        }));
        return false;
      }

      if (enableTracking) {
        const { status: backgroundStatus } =
          await Location.requestBackgroundPermissionsAsync();

        if (backgroundStatus !== "granted") {
          setLocation((prev) => ({
            ...prev,
            permissionGranted: true,
            loading: false,
            error:
              "Background location is needed for delivery tracking. Please enable it in Settings.",
          }));
          // Still return true since foreground works
        }
      }

      setLocation((prev) => ({
        ...prev,
        permissionGranted: true,
        error: null,
      }));
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to request permissions";
      setLocation((prev) => ({
        ...prev,
        permissionGranted: false,
        loading: false,
        error: message,
      }));
      return false;
    }
  }, [enableTracking]);

  const getCurrentLocation = useCallback(async () => {
    try {
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation((prev) => ({
        ...prev,
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        heading: currentLocation.coords.heading,
        speed: currentLocation.coords.speed,
        accuracy: currentLocation.coords.accuracy,
        loading: false,
      }));
      return currentLocation;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to get current location";
      setLocation((prev) => ({
        ...prev,
        loading: false,
        error: message,
      }));
      return null;
    }
  }, []);

  const sendLocationToSupabase = useCallback(
    async (lat: number, lng: number, speed: number | null, heading: number | null) => {
      if (!activeJobId || !driverId) return;

      try {
        await supabase.from("delivery_tracking").insert({
          job_id: activeJobId,
          driver_id: driverId,
          lat,
          lng,
          speed_mph: speed != null ? Math.round(speed * 2.237) : null, // m/s to mph
          heading: heading != null ? Math.round(heading) : null,
        });

        // Also update driver_profiles with current location
        await supabase
          .from("driver_profiles")
          .update({
            current_lat: lat,
            current_lng: lng,
            last_location_update: new Date().toISOString(),
          })
          .eq("id", driverId);
      } catch {
        // Silently fail on tracking errors to avoid disrupting the driver
      }
    },
    [activeJobId, driverId]
  );

  // Start watching location and tracking
  useEffect(() => {
    let mounted = true;

    async function startTracking() {
      const hasPermission = await requestPermissions();
      if (!hasPermission || !mounted) return;

      await getCurrentLocation();

      // Subscribe to location updates
      const sub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 10, // meters
          timeInterval: 5000, // ms
        },
        (newLocation) => {
          if (!mounted) return;
          setLocation((prev) => ({
            ...prev,
            latitude: newLocation.coords.latitude,
            longitude: newLocation.coords.longitude,
            heading: newLocation.coords.heading,
            speed: newLocation.coords.speed,
            accuracy: newLocation.coords.accuracy,
            loading: false,
          }));
        }
      );

      locationSubscriptionRef.current = sub;
    }

    startTracking();

    return () => {
      mounted = false;
      if (locationSubscriptionRef.current) {
        locationSubscriptionRef.current.remove();
        locationSubscriptionRef.current = null;
      }
    };
  }, [requestPermissions, getCurrentLocation]);

  // Send position to Supabase at interval when actively tracking a delivery
  useEffect(() => {
    if (!enableTracking || !activeJobId || !driverId) {
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
        trackingIntervalRef.current = null;
      }
      return;
    }

    // Send immediately
    if (location.latitude != null && location.longitude != null) {
      sendLocationToSupabase(
        location.latitude,
        location.longitude,
        location.speed,
        location.heading
      );
    }

    trackingIntervalRef.current = setInterval(async () => {
      try {
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        sendLocationToSupabase(
          pos.coords.latitude,
          pos.coords.longitude,
          pos.coords.speed,
          pos.coords.heading
        );
      } catch {
        // Skip this interval if location fetch fails
      }
    }, LOCATION_TRACKING_INTERVAL_MS);

    return () => {
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
        trackingIntervalRef.current = null;
      }
    };
  }, [
    enableTracking,
    activeJobId,
    driverId,
    location.latitude,
    location.longitude,
    location.speed,
    location.heading,
    sendLocationToSupabase,
  ]);

  return {
    ...location,
    requestPermissions,
    getCurrentLocation,
  };
}
