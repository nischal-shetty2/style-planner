import { type NextRequest, NextResponse } from "next/server";
import { fetchWeatherData, fetchForecastData } from "@/lib/weather";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = Number.parseFloat(searchParams.get("lat") || "0");
    const lon = Number.parseFloat(searchParams.get("lon") || "0");
    const city = searchParams.get("city") || "";
    const cityJa = searchParams.get("cityJa") || "";

    if (!lat || !lon || !city) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const [currentWeather, forecastData] = await Promise.all([
      fetchWeatherData(lat, lon),
      fetchForecastData(lat, lon),
    ]);

    if (!currentWeather) {
      return NextResponse.json(
        { error: "Failed to fetch weather data" },
        { status: 500 }
      );
    }

    const detailedWeather = {
      name: city,
      nameJa: cityJa,
      temperature: currentWeather.temperature,
      condition: currentWeather.condition,
      description: currentWeather.description,
      icon: currentWeather.icon,
      humidity: currentWeather.humidity,
      windSpeed: currentWeather.windSpeed,
      precipitation: currentWeather.precipitation,
      forecast: forecastData || [],
    };

    return NextResponse.json(detailedWeather);
  } catch (error) {
    console.error("Detailed weather API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch detailed weather data" },
      { status: 500 }
    );
  }
}
