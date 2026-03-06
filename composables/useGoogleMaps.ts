import { setOptions, importLibrary } from "@googlemaps/js-api-loader";

interface MapOptions {
  center: google.maps.LatLngLiteral;
  zoom: number;
  mapId?: string;
}

export const useGoogleMaps = () => {
  const config = useRuntimeConfig();
  const isLoaded = ref(false);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  let isInitialized = false;

  // Initialize Google Maps API options once
  const initializeAPI = () => {
    if (isInitialized) return;

    try {
      setOptions({
        key: config.public.googleMapsApiKey as string,
        v: "weekly",
      });
      isInitialized = true;
    } catch (err) {
      console.error("Failed to initialize Google Maps API:", err);
      error.value =
        err instanceof Error
          ? err.message
          : "Failed to initialize Google Maps API";
    }
  };

  // Load specific Google Maps libraries
  const loadLibrary = async (libraryName: string): Promise<any> => {
    try {
      const library = await importLibrary(libraryName);
      return library;
    } catch (err) {
      console.error(`Failed to load ${libraryName} library:`, err);
      throw err;
    }
  };

  const loadGoogleMaps = async (): Promise<typeof google.maps | null> => {
    if (isLoaded.value) {
      return google.maps;
    }

    if (isLoading.value) {
      // Wait for existing load to complete
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (!isLoading.value) {
            clearInterval(checkInterval);
            resolve(isLoaded.value ? google.maps : null);
          }
        }, 100);
      });
    }

    try {
      isLoading.value = true;
      error.value = null;

      // Initialize API options
      initializeAPI();

      // Load required libraries
      await loadLibrary("maps");
      await loadLibrary("marker");
      await loadLibrary("places");

      isLoaded.value = true;
      isLoading.value = false;
      return google.maps;
    } catch (err) {
      console.error("Failed to load Google Maps:", err);
      error.value =
        err instanceof Error ? err.message : "Failed to load Google Maps";
      isLoading.value = false;
      return null;
    }
  };

  const createMap = async (
    element: HTMLElement,
    options: MapOptions,
  ): Promise<google.maps.Map | null> => {
    const maps = await loadGoogleMaps();
    if (!maps) return null;

    try {
      // Default center (will be overridden by user location)
      const defaultCenter = { lat: 0, lng: 0 };
      const map = new maps.Map(element, {
        center: options.center || defaultCenter,
        zoom: options.zoom || 12,
        mapId: options.mapId || (config.public.googleMapsMapId as string),
        disableDefaultUI: true,
        zoomControl: true,
        mapTypeControl: false,
        scaleControl: false,
        streetViewControl: false,
        rotateControl: false,
        fullscreenControl: false,
        clickableIcons: false,
      });

      return map;
    } catch (err) {
      console.error("Failed to create map:", err);
      error.value = err instanceof Error ? err.message : "Failed to create map";
      return null;
    }
  };

  /**
   * Validates that coordinates are valid numbers within acceptable ranges
   */
  const isValidCoordinate = (lat: number, lng: number): boolean => {
    // Check for NaN, undefined, or non-numeric values
    if (typeof lat !== "number" || typeof lng !== "number") {
      return false;
    }
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return false;
    }
    // Validate ranges
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return false;
    }
    return true;
  };

  const createPinMarkerIcon = async (options: any) => {
    const maps = await loadGoogleMaps();
    if (!maps) return null;

    const { PinElement } = (await google.maps.importLibrary(
      "marker",
    )) as google.maps.MarkerLibrary;

    return new PinElement(options);
  };

  const createMarker = async (
    map: google.maps.Map,
    position: google.maps.LatLngLiteral,
    options?: Partial<google.maps.marker.AdvancedMarkerElementOptions>,
  ): Promise<google.maps.marker.AdvancedMarkerElement | null> => {
    try {
      // Validate coordinates before attempting to create marker
      if (!isValidCoordinate(position.lat, position.lng)) {
        console.error(
          "[useGoogleMaps] Invalid coordinates provided to createMarker:",
          {
            lat: position.lat,
            lng: position.lng,
            latType: typeof position.lat,
            lngType: typeof position.lng,
            isLatNaN: Number.isNaN(position.lat),
            isLngNaN: Number.isNaN(position.lng),
          },
        );
        return null;
      }

      const maps = await loadGoogleMaps();
      if (!maps) return null;

      const markerLib = await loadLibrary("marker");

      const { AdvancedMarkerElement } = markerLib;
      if (!AdvancedMarkerElement) {
        console.error(
          "[useGoogleMaps] AdvancedMarkerElement not found in marker library",
        );
        return null;
      }

      const marker = new AdvancedMarkerElement({
        map,
        position,
        ...options,
      });

      return marker;
    } catch (err) {
      console.error("Failed to create marker:", err);
      return null;
    }
  };

  const fitBounds = (
    map: google.maps.Map,
    bounds: google.maps.LatLngBounds | google.maps.LatLngBoundsLiteral,
  ) => {
    map.fitBounds(bounds);
  };

  const panTo = (map: google.maps.Map, position: google.maps.LatLngLiteral) => {
    map.panTo(position);
  };

  const setZoom = (map: google.maps.Map, zoom: number) => {
    map.setZoom(zoom);
  };

  return {
    isLoaded,
    isLoading,
    error,
    loadGoogleMaps,
    createMap,
    createMarker,
    createPinMarkerIcon,
    fitBounds,
    panTo,
    setZoom,
  };
};
