import Groq from "groq-sdk";
import { z } from "zod";

const groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
const GROQ_MODEL = "llama-3.3-70b-versatile";

export async function extractLocationFromQuery(
  query: string,
  language: "en" | "jp" = "jp"
): Promise<string | null> {
  try {
    const system =
      language === "jp"
        ? "あなたは天気の質問から都市, 国名を厳密に一つ抽出します。ランドマークは属する都市に解決。形式は必ず City, Country。判断不能なら Tokyo, Japan。JSONのみで回答。"
        : "Extract exactly one location in the form 'City, Country'. Resolve landmarks to their city. If undetermined, return 'Tokyo, Japan'. Respond with JSON only.";

    const schema = z.object({ location: z.string() });

    const completion = await groqClient.chat.completions.create({
      model: GROQ_MODEL,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content:
            language === "jp"
              ? `ユーザーの質問: "${query}"\nスキーマ: { "location": "City, Country" }`
              : `User question: "${query}"\nSchema: { "location": "City, Country" }`,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(content);
    const validated = schema.safeParse(parsed);
    const location = (validated.success ? validated.data.location : "").trim();
    return location || "Tokyo, Japan";
  } catch (error) {
    console.error("Location extraction error:", error);
    return "Tokyo, Japan";
  }
}
export interface ExtractedQueryInfo {
  location: string;
  date: string | null; // YYYY-MM-DD or null for today
  time: string | null; // HH:mm (24h) or null if not specified
}

export async function extractLocationAndDateTime(
  query: string,
  language: "en" | "jp" = "jp",
  nowISODate: string,
  nowTime24h: string
): Promise<ExtractedQueryInfo> {
  try {
    const system =
      language === "jp"
        ? "天気の質問から『都市, 国名』『YYYY-MM-DD または null』『HH:mm または null』を抽出して返します。JSONのみで回答。"
        : "Extract 'City, Country', optional YYYY-MM-DD date, and optional HH:mm time. Respond JSON only.";

    const schema = z.object({
      location: z.string(),
      date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .nullable(),
      time: z
        .string()
        .regex(/^\d{2}:\d{2}$/)
        .nullable(),
    });

    const completion = await groqClient.chat.completions.create({
      model: GROQ_MODEL,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content:
            language === "jp"
              ? `現在日付: ${nowISODate}\n現在時刻(24h): ${nowTime24h}\nユーザーの質問: "${query}"\nスキーマ: { "location": "City, Country", "date": "YYYY-MM-DD|null", "time": "HH:mm|null" }`
              : `Current date: ${nowISODate}\nCurrent time (24h): ${nowTime24h}\nUser question: "${query}"\nSchema: { "location": "City, Country", "date": "YYYY-MM-DD|null", "time": "HH:mm|null" }`,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(content);
    const validated = schema.safeParse(parsed);
    const result: ExtractedQueryInfo = validated.success
      ? (validated.data as ExtractedQueryInfo)
      : { location: "", date: null, time: null };
    const location = (result.location || "").trim();
    if (!location) {
      const loc = await extractLocationFromQuery(query, language);
      return {
        location: loc || "Tokyo, Japan",
        date: result.date,
        time: result.time,
      };
    }

    return { location, date: result.date, time: result.time };
  } catch (error) {
    console.error("Location+DateTime extraction error:", error);
    const loc = await extractLocationFromQuery(query, language);
    return { location: loc || "Tokyo, Japan", date: null, time: null };
  }
}

export interface WeatherData {
  temperature: number;
  condition: string;
  precipitation?: number;
  [key: string]: unknown;
}

export async function generateClothingRecommendation(
  query: string,
  location: string,
  weatherData: WeatherData,
  language: "en" | "jp" = "jp"
): Promise<string> {
  try {
    const currentMonth = new Date().getMonth() + 1;
    const season = getSeason(currentMonth, language);

    const system =
      language === "jp"
        ? "日本の気候と文化に適した服装アドバイスをJSONで返します。JSONのみで回答。"
        : "Return clothing advice as strict JSON. Respond JSON only.";

    const schema = z.object({
      main: z.string(),
      accessories: z.string(),
      tips: z.string(),
    });

    const weatherLines = [
      `Temperature: ${weatherData.temperature}°C`,
      `Weather: ${String((weatherData as WeatherData).condition ?? "")}`,
      `Precipitation: ${String(
        (weatherData as WeatherData).precipitation ?? "0"
      )} %`,
      `Wind speed: ${String(
        (weatherData as WeatherData).windSpeed ?? "0"
      )} m/s`,
      `Humidity: ${String((weatherData as WeatherData).humidity ?? "0")} %`,
    ].join("\n");

    const completion = await groqClient.chat.completions.create({
      model: GROQ_MODEL,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content:
            language === "jp"
              ? `ユーザーの質問: "${query}"\n場所: ${location}\n季節: ${season}\n天気データ:\n${weatherLines}\nスキーマ: { "main": string, "accessories": string, "tips": string }`
              : `User question: "${query}"\nLocation: ${location}\nSeason: ${season}\nWeather data:\n${weatherLines}\nSchema: { "main": string, "accessories": string, "tips": string }`,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(content);
    const validated = schema.safeParse(parsed);
    const object = validated.success
      ? validated.data
      : { main: "", accessories: "", tips: "" };

    return JSON.stringify(object);
  } catch (error) {
    console.error("Clothing recommendation error:", error);
    return language === "en"
      ? "Sorry, I couldn't generate clothing advice at this time."
      : "申し訳ございませんが、服装のアドバイスを生成できませんでした。";
  }
}

function getSeason(month: number, language: "en" | "jp" = "jp"): string {
  const seasons = {
    jp: {
      spring: "春",
      summer: "夏",
      autumn: "秋",
      winter: "冬",
    },
    en: {
      spring: "Spring",
      summer: "Summer",
      autumn: "Autumn",
      winter: "Winter",
    },
  };

  const lang = seasons[language];

  if (month >= 3 && month <= 5) return lang.spring;
  if (month >= 6 && month <= 8) return lang.summer;
  if (month >= 9 && month <= 11) return lang.autumn;
  return lang.winter;
}
