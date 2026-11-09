export interface Coordinates {
  latitude: number;
  longitude: number;
}

// Shared state across all useLocation() instances
export const _sharedLocation = ref<Coordinates | null>(null);
const _lastReportedLocation = ref<Coordinates | null>(null);
const _watchId = ref<number | null>(null);

function getBackendLocation(): Coordinates | null {
  try {
    const authStore = useAuthStore();
    const loc = authStore.userProfile?.location;
    if (loc?.latitude != null && loc?.longitude != null) {
      return { latitude: loc.latitude, longitude: loc.longitude };
    }
  } catch {
    // Auth store may not be available yet
  }
  return null;
}

export const useLocation = () => {
  const currentLocation = ref<Coordinates | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const permissionDenied = ref(false);
  const isSupported = ref(
    typeof navigator !== "undefined" && !!navigator.geolocation,
  );

  // Request location permission explicitly
  const requestLocationPermission = async (): Promise<boolean> => {
    if (!isSupported.value) {
      error.value = "Geolocation is not supported by your browser";
      return false;
    }

    // Check if Permissions API is available
    if (navigator.permissions && navigator.permissions.query) {
      try {
        const result = await navigator.permissions.query({
          name: "geolocation",
        });

        if (result.state === "denied") {
          permissionDenied.value = true;
          error.value =
            "Location permission is denied. Please enable it in your browser settings.";
          return false;
        }

        if (result.state === "granted") {
          permissionDenied.value = false;
          error.value = null;
          return true;
        }

        // 'prompt' state - permission will be requested when we call getCurrentPosition
        return true;
      } catch (err) {
        console.warn(
          "Permission API not available, will request on position call:",
          err,
        );
        return true;
      }
    }

    // Fallback if Permissions API is not available
    return true;
  };

  const applyBackendFallback = (): Coordinates | null => {
    const fallback = getBackendLocation();
    if (fallback) {
      console.info("[Location] Using backend profile location as fallback");
      currentLocation.value = fallback;
      _sharedLocation.value = fallback;
      error.value = null;
    }
    return fallback;
  };

  const getCurrentPosition = async (): Promise<Coordinates | null> => {
    return new Promise((resolve, reject) => {
      if (!isSupported.value) {
        const fallback = applyBackendFallback();
        if (!fallback) {
          error.value = "Geolocation is not supported by your browser";
          permissionDenied.value = true;
        }
        loading.value = false;
        resolve(fallback);
        return;
      }

      loading.value = true;
      error.value = null;

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: Coordinates = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          currentLocation.value = coords;
          _sharedLocation.value = coords;
          loading.value = false;
          permissionDenied.value = false;
          resolve(coords);
        },
        (err) => {
          loading.value = false;
          console.error("Geolocation error:", err);

          // Try backend profile location as fallback
          const fallback = applyBackendFallback();
          if (fallback) {
            resolve(fallback);
            return;
          }

          // No fallback available — set error
          if (err.code === 1) {
            permissionDenied.value = true;
            error.value =
              "Location permission denied. Please enable it in your browser settings.";
          } else if (err.code === 2) {
            error.value = "Location information is unavailable.";
          } else if (err.code === 3) {
            error.value = "Location request timed out.";
          } else {
            error.value = `Error getting location: ${err.message}`;
          }

          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        },
      );
    });
  };

  // Alias for consistency
  const getCurrentLocation = getCurrentPosition;

  const watchPosition = (callback: (coords: Coordinates) => void) => {
    if (!navigator.geolocation) {
      console.error("Geolocation is not supported by your browser");
      return null;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const coords: Coordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        currentLocation.value = coords;
        callback(coords);
      },
      (err) => {
        console.error("Error watching location:", err);
        error.value = err.message;
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );

    return watchId;
  };

  const clearWatch = (watchId: number) => {
    if (navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId);
    }
  };

  const SIGNIFICANT_MOVEMENT_METERS = 10;

  const startLocationTracking = () => {
    if (_watchId.value !== null) return; // Already tracking
    if (!navigator?.geolocation) {
      console.warn(
        "Geolocation not available, falling back to backend location",
      );
      applyBackendFallback();
      return;
    }

    // Get initial position
    getCurrentPosition();

    _watchId.value = navigator.geolocation.watchPosition(
      (position) => {
        const coords: Coordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        currentLocation.value = coords;
        _sharedLocation.value = coords;

        // Check for significant movement
        if (_lastReportedLocation.value) {
          const distanceKm = calculateDistance(
            _lastReportedLocation.value,
            coords,
          );
          const distanceMeters = distanceKm * 1000;
          if (distanceMeters > SIGNIFICANT_MOVEMENT_METERS) {
            _lastReportedLocation.value = coords;
            reportLocationToServer(coords);
          }
        } else {
          _lastReportedLocation.value = coords;
          reportLocationToServer(coords);
        }
      },
      (err) => {
        console.error("Location tracking error:", err);
        applyBackendFallback();
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000,
      },
    );
  };

  const stopLocationTracking = () => {
    if (_watchId.value !== null && navigator?.geolocation) {
      navigator.geolocation.clearWatch(_watchId.value);
      _watchId.value = null;
    }
  };

  const reportLocationToServer = async (coords: Coordinates) => {
    try {
      const api = useApi();
      await api.post("/location", {
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
    } catch (err) {
      // Non-critical — silently fail
      console.warn("Failed to report location:", err);
    }
  };

  const getSharedLocation = (): Coordinates | null => {
    return _sharedLocation.value;
  };

  const calculateDistance = (
    coord1: Coordinates,
    coord2: Coordinates,
  ): number => {
    const R = 6371; // Radius of the Earth in km
    const dLat = toRad(coord2.latitude - coord1.latitude);
    const dLon = toRad(coord2.longitude - coord1.longitude);

    const lat1 = toRad(coord1.latitude);
    const lat2 = toRad(coord2.latitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
  };

  const toRad = (value: number): number => {
    return (value * Math.PI) / 180;
  };

  const formatDistance = (distanceKm: number): string => {
    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)}m`;
    }
    return `${distanceKm.toFixed(1)}km`;
  };

  return {
    currentLocation: readonly(currentLocation),
    loading: readonly(loading),
    error: readonly(error),
    permissionDenied: readonly(permissionDenied),
    isSupported: readonly(isSupported),
    requestLocationPermission,
    getCurrentPosition,
    getCurrentLocation,
    watchPosition,
    clearWatch,
    startLocationTracking,
    stopLocationTracking,
    getSharedLocation,
    calculateDistance,
    formatDistance,
  };
};
