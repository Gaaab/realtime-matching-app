/**
 * Composable for interacting with Google Places API (New Place class)
 * Using the new google.maps.places.Place API (recommended as of March 2025)
 * Documentation: https://developers.google.com/maps/documentation/javascript/place-class
 */

export interface PlaceResult {
  id: string
  displayName: string
  formattedAddress: string
  location: google.maps.LatLng
  types: string[]
  rating?: number
  priceLevel?: string
  photos?: google.maps.places.Photo[]
  nationalPhoneNumber?: string
  websiteURI?: string
  regularOpeningHours?: {
    weekdayDescriptions: string[]
  }
  addressComponents?: google.maps.places.AddressComponent[]
}

export const useGooglePlaces = () => {
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Fetch nearby places using the new Place API searchNearby method
   */
  const fetchNearbyPlaces = async (
    map: google.maps.Map,
    location: google.maps.LatLngLiteral,
    radius: number = 500
  ): Promise<PlaceResult[]> => {
    try {
      isLoading.value = true
      error.value = null

      console.log('[GooglePlaces] Fetching nearby places using new Place API...')

      // Use the new searchNearby method
      const { Place } = await google.maps.importLibrary('places') as google.maps.PlacesLibrary

      const request = {
        fields: [
          'id',
          'displayName',
          'formattedAddress',
          'location',
          'types',
          'rating',
          'priceLevel',
          'photos',
          'nationalPhoneNumber',
          'websiteURI',
          'regularOpeningHours',
          'addressComponents',
        ],
        locationRestriction: {
          center: location,
          radius: radius,
        },
        // Include various place types for dating/social venues
        includedTypes: [
          'restaurant',
          'cafe',
          'bar',
          'night_club',
          'park',
          'museum',
          'art_gallery',
          'shopping_mall',
          'movie_theater',
          'library',
          'gym',
          'spa',
        ],
        maxResultCount: 20,
      }

      // @ts-ignore - searchNearby is the new API method
      const { places } = await Place.searchNearby(request)

      if (!places || places.length === 0) {
        console.log('[GooglePlaces] No places found in this area')
        return []
      }

      console.log(`[GooglePlaces] Found ${places.length} nearby places`)

      // Convert to our PlaceResult format
      const results: PlaceResult[] = places.map((place: any) => ({
        id: place.id,
        displayName: place.displayName,
        formattedAddress: place.formattedAddress,
        location: place.location,
        types: place.types || [],
        rating: place.rating,
        priceLevel: place.priceLevel,
        photos: place.photos,
        nationalPhoneNumber: place.nationalPhoneNumber,
        websiteURI: place.websiteURI,
        regularOpeningHours: place.regularOpeningHours,
        addressComponents: place.addressComponents,
      }))

      return results
    } catch (err) {
      console.error('[GooglePlaces] Error:', err)
      error.value = err instanceof Error ? err.message : 'Failed to fetch places'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Get detailed information about a specific place using the new Place API
   */
  const getPlaceDetails = async (
    placeId: string
  ): Promise<PlaceResult | null> => {
    try {
      const { Place } = await google.maps.importLibrary('places') as google.maps.PlacesLibrary

      // Create a Place instance
      const place = new Place({
        id: placeId,
      })

      // Fetch all fields
      await place.fetchFields({
        fields: [
          'id',
          'displayName',
          'formattedAddress',
          'location',
          'types',
          'rating',
          'priceLevel',
          'photos',
          'nationalPhoneNumber',
          'websiteURI',
          'regularOpeningHours',
          'addressComponents',
        ],
      })

      return {
        id: place.id!,
        displayName: place.displayName!,
        formattedAddress: place.formattedAddress!,
        location: place.location!,
        types: place.types || [],
        rating: place.rating,
        priceLevel: place.priceLevel,
        photos: place.photos,
        nationalPhoneNumber: place.nationalPhoneNumber,
        websiteURI: place.websiteURI,
        regularOpeningHours: place.regularOpeningHours,
        addressComponents: place.addressComponents,
      }
    } catch (err) {
      console.error('[GooglePlaces] Error getting details:', err)
      throw err
    }
  }

  /**
   * Parse address components from Google Place result
   */
  const parseAddressComponents = (addressComponents?: google.maps.places.AddressComponent[]) => {
    if (!addressComponents) {
      return {
        street: '',
        city: '',
        state: '',
        country: '',
        postal_code: '',
      }
    }

    const result = {
      street: '',
      city: '',
      state: '',
      country: '',
      postal_code: '',
    }

    for (const component of addressComponents) {
      const types = component.types

      if (types.includes('street_number')) {
        result.street = component.longText + ' '
      } else if (types.includes('route')) {
        result.street += component.longText
      } else if (types.includes('locality')) {
        result.city = component.longText
      } else if (types.includes('administrative_area_level_1')) {
        result.state = component.shortText
      } else if (types.includes('country')) {
        result.country = component.shortText
      } else if (types.includes('postal_code')) {
        result.postal_code = component.longText
      }
    }

    return result
  }

  /**
   * Determine venue type from Google Place types
   */
  const getVenueType = (types?: string[]): string => {
    if (!types || types.length === 0) return 'other'

    // Priority order for venue types
    const typeMapping: Record<string, string> = {
      restaurant: 'restaurant',
      cafe: 'cafe',
      bar: 'bar',
      night_club: 'nightclub',
      gym: 'gym',
      park: 'park',
      museum: 'museum',
      movie_theater: 'cinema',
      shopping_mall: 'shopping',
      library: 'library',
      book_store: 'bookstore',
      art_gallery: 'gallery',
      spa: 'spa',
    }

    for (const type of types) {
      if (typeMapping[type]) {
        return typeMapping[type]
      }
    }

    return 'other'
  }

  /**
   * Get photo URL from Google Place photo
   */
  const getPhotoUrl = (photo: google.maps.places.Photo, maxWidth: number = 800): string => {
    return photo.getURI({ maxWidth })
  }

  return {
    fetchNearbyPlaces,
    getPlaceDetails,
    parseAddressComponents,
    getVenueType,
    getPhotoUrl,
    isLoading,
    error,
  }
}
