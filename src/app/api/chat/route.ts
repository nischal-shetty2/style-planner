import { type NextRequest, NextResponse } from "next/server";
import {
  extractLocationAndDateTime,
  generateClothingRecommendation,
} from "@/lib/ai";
import { geocodeLocation } from "@/lib/geocode";
import { fetchWeatherData } from "@/lib/weather";

export async function POST(request: NextRequest) {
  try {
    const { message, language = "jp" } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    console.log("[v0] Processing message:", message, "Language:", language);

    // Step 1: Extract location and date/time in one AI call. Provide current context.
    const now = new Date();
    const nowDate = new Date(now.getTime());
    const nowISODate = new Date(nowDate.setHours(0, 0, 0, 0))
      .toISOString()
      .slice(0, 10);
    const nowTime = `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes()
    ).padStart(2, "0")}`;

    const extracted = await extractLocationAndDateTime(
      message,
      language as "en" | "jp",
      nowISODate,
      nowTime
    );

    const location = extracted.location;
    const useDate = extracted.date || nowISODate;
    const useTime = extracted.time || null;

    if (!location) {
      return NextResponse.json(
        { error: "Could not extract location" },
        { status: 400 }
      );
    }

    console.log("[v0] Extracted location:", location);
    console.log("[v0] Extracted date:", useDate, "time:", useTime);

    // Step 2: Geocode location to get coordinates
    const coordinates = await geocodeLocation(location);
    if (!coordinates) {
      return NextResponse.json(
        { error: "Could not geocode location" },
        { status: 400 }
      );
    }

    console.log("[v0] Geocoded coordinates:", coordinates);

    // Step 3: Fetch weather data (date/time aware)
    const weatherData = await fetchWeatherData(
      coordinates.lat,
      coordinates.lon,
      { date: useDate, time: useTime || undefined }
    );
    if (!weatherData) {
      return NextResponse.json(
        { error: "Could not fetch weather data" },
        { status: 400 }
      );
    }

    console.log("[v0] Weather data retrieved:", weatherData);

    // Step 4: Generate clothing recommendation
    const recommendation = await generateClothingRecommendation(
      message,
      coordinates.name,
      weatherData,
      language
    );

    console.log("[v0] Generated recommendation");

    return NextResponse.json({
      location: coordinates.name,
      date: useDate,
      time: useTime,
      weather: weatherData,
      recommendation,
      coordinates: {
        lat: coordinates.lat,
        lon: coordinates.lon,
      },
    });
  } catch (error) {
    console.error("[v0] Chat API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
