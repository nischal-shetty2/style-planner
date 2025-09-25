interface GeocodeResult {
  lat: number;
  lon: number;
  name: string;
  country: string;
}

export async function geocodeLocation(
  location: string
): Promise<GeocodeResult | null> {
  try {
    // Using OpenWeatherMap Geocoding API
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) {
      console.error("OpenWeatherMap API key not found");
      return null;
    }

    const response = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(
        location
      )}&limit=1&appid=${apiKey}`
    );

    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.length === 0) {
      // Fallback only when not found
      return {
        lat: 35.6762,
        lon: 139.6503,
        name: "Tokyo",
        country: "JP",
      };
    }

    const result = data[0];
    return {
      lat: result.lat,
      lon: result.lon,
      name: result.name,
      country: result.country,
    };
  } catch (error) {
    console.error("Geocoding error:", error);
    // Return Tokyo as fallback
    return {
      lat: 35.6762,
      lon: 139.6503,
      name: "Tokyo",
      country: "JP",
    };
  }
}
