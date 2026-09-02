export const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

/**
 * Geocodes an address to retrieve { lat, lng } using Google Maps Geocoding API.
 * @param {string} address - The human-readable address.
 * @returns {Promise<Object>} An object containing { lat, lng }.
 */
export const geocodeAddress = async (address) => {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error("GOOGLE_MAPS_API_KEY is not defined in environment variables");
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
    address
  )}&key=${GOOGLE_MAPS_API_KEY}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Geocoding HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    if (data.status !== "OK") {
      throw new Error(`Geocoding API error! Status: ${data.status}. Details: ${data.error_message || "None"}`);
    }

    if (!data.results || data.results.length === 0) {
      throw new Error("Geocoding failed: No results found for the address");
    }

    const { lat, lng } = data.results[0].geometry.location;
    return { lat, lng };
  } catch (error) {
    throw new Error(`Geocoding failed: ${error.message}`);
  }
};
