import { NextResponse } from "next/server";
import { fetchWeatherData } from "@/lib/weather";

const JAPANESE_CITIES = [
  { name: "Tokyo", nameJa: "東京", lat: 35.6762, lon: 139.6503 },
  { name: "Osaka", nameJa: "大阪", lat: 34.6937, lon: 135.5023 },
  { name: "Kyoto", nameJa: "京都", lat: 35.0116, lon: 135.7681 },
  { name: "Sapporo", nameJa: "札幌", lat: 43.0642, lon: 141.3469 },
];

export async function GET() {
  try {
    const weatherPromises = JAPANESE_CITIES.map(async (city) => {
      const weather = await fetchWeatherData(city.lat, city.lon);
      if (weather) {
        return {
          name: city.name,
          nameJa: city.nameJa,
          temperature: weather.temperature,
          condition: weather.condition,
          description: weather.description,
          icon: weather.icon,
        };
      }
      return null;
    });

    const results = await Promise.all(weatherPromises);
    const validResults = results.filter((result) => result !== null);

    return NextResponse.json(validResults);
  } catch (error) {
    console.error("Cities weather API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch weather data" },
      { status: 500 }
    );
  }
}
