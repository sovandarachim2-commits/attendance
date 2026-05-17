/** Reverse geocode lat/lng to a readable address (OpenStreetMap Nominatim). */
export async function reverseGeocode(latitude, longitude) {
  const params = new URLSearchParams({
    lat: String(latitude),
    lon: String(longitude),
    format: 'json',
    zoom: '14',
    addressdetails: '1',
  })

  const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`, {
    headers: {
      Accept: 'application/json',
      'Accept-Language': 'en',
      'User-Agent': 'AttendanceApp/1.0',
    },
  })

  if (!response.ok) throw new Error('Geocode failed')

  const data = await response.json()
  const addr = data.address || {}

  // Build a short label: "Sangkat/District, City" or fallback to display_name
  const district =
    addr.quarter ||
    addr.suburb ||
    addr.neighbourhood ||
    addr.village ||
    addr.town ||
    addr.county ||
    null

  const city = addr.city || addr.state || null

  const parts = [district, city].filter(Boolean)
  return parts.length > 0 ? parts.join(', ') : (data.display_name || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`)
}
