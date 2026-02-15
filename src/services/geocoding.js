/*
  geocoding.js
  - Muuntaa osoitteen koordinaateiksi Nominatim OpenStreetMap -APIn avulla.
  - Ilmainen, ei vaadi API-avainta.
  - Palauttaa { lat, lon } onnistuessa tai null virheessa.
*/

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org/search'

/**
 * Hakee koordinaatit osoitteelle.
 * @param {string} address Haettava osoite tekstina.
 * @returns {Promise<{ lat: number; lon: number } | null>} Koordinaatit tai null virheessa.
 */
export const geocodeAddress = async (address) => {
  if (!address || !address.trim()) {
    return null
  }

  try {
    const params = new URLSearchParams({
      q: address.trim(),
      format: 'json',
      limit: '1',
      addressdetails: '1',
    })

    const response = await fetch(`${NOMINATIM_BASE_URL}?${params.toString()}`, {
      headers: {
        // Nominatim vaatii User-Agent -headerin epaonnistuneiden pyyntojen valttamiseksi.
        'User-Agent': 'QuoteFlow-WebForm/1.0',
      },
    })

    if (!response.ok) {
      console.error('Geocoding API virhe:', response.status)
      return null
    }

    const data = await response.json()

    if (!data || data.length === 0) {
      console.warn('Osoitetta ei loydetty:', address)
      return null
    }

    const result = data[0]
    return {
      lat: parseFloat(result.lat),
      lon: parseFloat(result.lon),
    }
  } catch (error) {
    console.error('Geocoding epaonnistui:', error)
    return null
  }
}
