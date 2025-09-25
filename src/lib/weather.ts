import type { WeatherData } from "@/lib/ai";

export async function fetchWeatherData(
  lat: number,
  lon: number,
  options?: { date?: string; time?: string }
): Promise<WeatherData | null> {
  try {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) {
      console.error("OpenWeatherMap API key not found");
      return null;
    }

    // If a date in the future or past is requested, use the 5-day/3-hour forecast for future dates,
    // or fallback to current weather for today. OpenWeather's free tier doesn't provide past dates;
    // for simplicity, handle future dates within 5 days via forecast.
    const requestedDate = options?.date ? new Date(options.date) : null;
    const requestedTime = options?.time || null; // HH:mm
    const today = new Date();
    let useForecast = false;
    if (requestedDate) {
      const diffMs =
        requestedDate.setHours(0, 0, 0, 0) - today.setHours(0, 0, 0, 0);
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      useForecast = diffDays > 0 && diffDays <= 5; // next 5 days supported
    }

    if (useForecast && requestedDate) {
      const forecastRes = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=ja`
      );
      if (!forecastRes.ok) {
        throw new Error(`Forecast API error: ${forecastRes.status}`);
      }
      console.log("Forecast response:", forecastRes);
      const forecastData = await forecastRes.json();
      // Find the forecast entry closest to requested time on requested date (default to 12:00)
      const target = new Date(options!.date!);
      const targetMid = new Date(target);
      if (requestedTime) {
        const [hh, mm] = requestedTime.split(":").map((n) => parseInt(n, 10));
        targetMid.setHours(hh, mm, 0, 0);
      } else {
        targetMid.setHours(12, 0, 0, 0);
      }
      let best = forecastData.list[0];
      let bestDelta = Infinity;
      for (const item of forecastData.list) {
        const itemTime = new Date(item.dt * 1000);
        const delta = Math.abs(itemTime.getTime() - targetMid.getTime());
        if (delta < bestDelta) {
          best = item;
          bestDelta = delta;
        }
      }
      return {
        temperature: Math.round(best.main.temp),
        condition: best.weather[0].main,
        precipitation: (best.pop || 0) * 100,
        windSpeed: Math.round(best.wind?.speed || 0),
        humidity: best.main.humidity,
        description: best.weather[0].description,
        icon: best.weather[0].icon,
      };
    }

    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=ja`
    );

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      temperature: Math.round(data.main.temp),
      condition: data.weather[0].main,
      precipitation: data.clouds?.all || 0, // Using cloudiness as precipitation proxy
      windSpeed: Math.round(data.wind?.speed || 0),
      humidity: data.main.humidity,
      description: data.weather[0].description,
      icon: data.weather[0].icon,
    };
  } catch (error) {
    console.error("Weather fetch error:", error);
    return null;
  }
}

export async function fetchForecastData(
  lat: number,
  lon: number
): Promise<WeatherData[] | null> {
  try {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) {
      console.error("OpenWeatherMap API key not found");
      return null;
    }

    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=ja`
    );

    if (!response.ok) {
      throw new Error(`Forecast API error: ${response.status}`);
    }

    const data = await response.json();
    interface ForecastItem {
      main: { temp: number; humidity: number };
      weather: { main: string; description: string; icon: string }[];
      pop: number;
      wind?: { speed: number };
      dt: number;
    }

    // Get next 24 hours of forecasts (8 x 3-hour intervals)
    return data.list.slice(0, 8).map((item: ForecastItem) => ({
      temperature: Math.round(item.main.temp),
      condition: item.weather[0].main,
      precipitation: item.pop * 100, // Probability of precipitation
      windSpeed: Math.round(item.wind?.speed || 0),
      humidity: item.main.humidity,
      description: item.weather[0].description,
      icon: item.weather[0].icon,
    }));
  } catch (error) {
    console.error("Forecast fetch error:", error);
    return null;
  }
}
