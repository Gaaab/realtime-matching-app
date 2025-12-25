export interface MarkerIcon {
  path: string
  fillColor: string
  fillOpacity: number
  strokeColor: string
  strokeWeight: number
  scale: number
  anchor?: google.maps.Point
}

export interface MarkerColors {
  primary: string
  secondary: string
  active: string
  inactive: string
  userLocation: string
}

// Centralized color definitions for markers
export const MARKER_COLORS: MarkerColors = {
  primary: '#0050FF',
  secondary: '#0040CC',
  active: '#10B981', // Green for active/checked-in
  inactive: '#6B7280', // Gray for inactive
  userLocation: '#00D9FF' // Cyan for user location
}

export const createVenueMarkerIcon = (isActive: boolean): MarkerIcon => {
  // SVG path for a map pin
  const pinPath = 'M12 0C7.58 0 4 3.58 4 8c0 5.25 8 13 8 13s8-7.75 8-13c0-4.42-3.58-8-8-8zm0 11c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z'

  return {
    path: pinPath,
    fillColor: isActive ? MARKER_COLORS.primary : MARKER_COLORS.inactive,
    fillOpacity: 1,
    strokeColor: '#FFFFFF',
    strokeWeight: 2,
    scale: 1.5,
    anchor: new google.maps.Point(12, 24)
  }
}

export const createUserLocationIcon = (): MarkerIcon => {
  // Circle for user location
  const circlePath = 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z'

  return {
    path: circlePath,
    fillColor: MARKER_COLORS.userLocation,
    fillOpacity: 0.8,
    strokeColor: '#FFFFFF',
    strokeWeight: 3,
    scale: 1.2,
    anchor: new google.maps.Point(12, 12)
  }
}

/**
 * Creates an HTML element for venue markers with user count badge
 */
export const createVenueMarkerElement = (
  venueId: number | string,
  venueName: string,
  isActive: boolean,
  userCount: number = 0,
  distance?: number
): HTMLElement => {
  const container = document.createElement('div')
  container.className = 'venue-marker-container'
  container.style.cssText = `
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    cursor: pointer;
    transition: transform 0.2s ease;
  `

  // Marker pin
  const primaryColor = isActive ? MARKER_COLORS.primary : MARKER_COLORS.inactive
  const secondaryColor = isActive ? MARKER_COLORS.secondary : '#4B5563'

  const pin = document.createElement('div')
  pin.className = `marker-pin ${isActive ? 'marker-active' : ''}`
  pin.style.cssText = `
    position: relative;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
  `
  pin.innerHTML = `
    <svg width="40" height="48" viewBox="0 0 40 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="markerGradient${venueId}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${primaryColor}"/>
          <stop offset="100%" style="stop-color:${secondaryColor}"/>
        </linearGradient>
      </defs>
      <path d="M20 0C11.7157 0 5 6.71573 5 15c0 10 15 33 15 33s15-23 15-33c0-8.28427-6.7157-15-15-15z"
            fill="url(#markerGradient${venueId})"
            stroke="white"
            stroke-width="2.5"/>
      <circle cx="20" cy="15" r="6" fill="white"/>
      ${isActive ? `<circle cx="20" cy="15" r="3" fill="${primaryColor}"/>` : ''}
    </svg>
  `

  // User count badge
  if (isActive && userCount > 0) {
    const badge = document.createElement('div')
    badge.style.cssText = `
      position: absolute;
      top: -6px;
      right: -6px;
      background: linear-gradient(135deg, ${MARKER_COLORS.active} 0%, #059669 100%);
      color: white;
      border-radius: 12px;
      min-width: 20px;
      height: 18px;
      padding: 0 5px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 10px;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      font-family: system-ui, -apple-system, sans-serif;
    `
    badge.textContent = userCount.toString()
    pin.appendChild(badge)
  }

  container.appendChild(pin)

  // Venue name label
  const label = document.createElement('div')
  label.style.cssText = `
    background-color: white;
    border-radius: 12px;
    padding: 3px 8px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
    font-size: 10px;
    white-space: nowrap;
    font-weight: 600;
    color: #1F2937;
    font-family: system-ui, -apple-system, sans-serif;
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
  `
  label.textContent = venueName.length > 15 ? venueName.substring(0, 13) + '...' : venueName
  container.appendChild(label)

  // Add hover effect
  container.addEventListener('mouseenter', () => {
    container.style.transform = 'scale(1.1)'
  })
  container.addEventListener('mouseleave', () => {
    container.style.transform = 'scale(1)'
  })

  return container
}

export const createClusterIcon = (count: number): string => {
  // Return HTML for custom cluster marker
  const size = count < 10 ? 40 : count < 100 ? 50 : 60

  return `
    <div style="
      width: ${size}px;
      height: ${size}px;
      background: linear-gradient(135deg, ${MARKER_COLORS.primary} 0%, ${MARKER_COLORS.secondary} 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: ${size / 3}px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      border: 3px solid white;
    ">
      ${count}
    </div>
  `
}

export const createPulseAnimation = (): string => {
  // CSS for pulsing animation on active venue markers
  return `
    @keyframes pulse {
      0% {
        filter: drop-shadow(0 0 0 rgba(0, 80, 255, 0.7));
      }
      70% {
        filter: drop-shadow(0 0 10px rgba(0, 80, 255, 0.3));
      }
      100% {
        filter: drop-shadow(0 0 0 rgba(0, 80, 255, 0));
      }
    }

    .marker-active {
      animation: pulse 2s infinite;
    }
  `
}

/**
 * Formats distance for display in markers
 */
export const formatMarkerDistance = (km: number): string => {
  if (km < 1) {
    return `${Math.round(km * 1000)}m`
  }
  return `${km.toFixed(1)}km`
}
