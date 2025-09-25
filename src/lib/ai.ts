import { generateText } from "ai";
import { google } from "@ai-sdk/google";

export async function extractLocationFromQuery(
  query: string,
  language: "en" | "jp" = "jp"
): Promise<string | null> {
  try {
    const prompts = {
      jp: `
あなたは天気に関する質問から「実在する地理的ロケーション」を厳密に抽出する専門家です。

ユーザーの質問: "${query}"

要件:
1) 都市名・地区名・国名・ランドマーク・施設名などが含まれる場合、必ずそのランドマーク/施設が属する「都市名, 国名」に正規化して返してください。
   例: "スカイツリー" → "Tokyo, Japan" / "大阪城" → "Osaka, Japan"
   例: "エッフェル塔" → "Paris, France"
2) ランドマークのみを返さないでください。必ず「都市名, 国名」の形式にしてください。
3) 質問が曖昧で場所が特定できない場合のみ "Tokyo, Japan" を返してください。
4) 出力は場所名のみ。説明や追加テキスト、記号は不要です。

良い例:
- "渋谷の天気は？" → "Tokyo, Japan"
- "京都駅は雨？" → "Kyoto, Japan"
- "Burj Khalifa" → "Dubai, United Arab Emirates"
- "Sky Tree building" → "Tokyo, Japan"
- "今日は寒い？" → "Tokyo, Japan"
`,
      en: `
You are an expert that extracts a precise, canonical geographic location from a weather-related query.

User question: "${query}"

Requirements:
1) If the query includes a landmark/facility/area, resolve it to its governing city and country, and return strictly in the form "City, Country".
   Examples: "Burj Khalifa" → "Dubai, United Arab Emirates"; "Eiffel Tower" → "Paris, France"; "Sky Tree building" → "Tokyo, Japan".
2) Do NOT return just the landmark name. Always return "City, Country".
3) Only when no location can be determined, return "Tokyo, Japan".
4) Output the location only. No explanations, no extra text, no punctuation beyond the comma.

Good examples:
- "What's the weather in Shibuya?" → "Tokyo, Japan"
- "Rain near Osaka Castle?" → "Osaka, Japan"
- "Burj Khalifa tomorrow" → "Dubai, United Arab Emirates"
- "Is it cold today?" → "Tokyo, Japan"
`,
    };

    const { text } = await generateText({
      model: google("gemini-1.5-flash"),
      prompt: prompts[language],
    });
    console.log("Location extraction text:", text);

    return text.trim() || (language === "en" ? "Tokyo, Japan" : "Tokyo, Japan");
  } catch (error) {
    console.error("Location extraction error:", error);
    return "Tokyo, Japan"; // Default fallback
  }
}

export async function extractDateFromQuery(
  query: string,
  language: "en" | "jp" = "jp"
): Promise<string | null> {
  try {
    const prompts = {
      jp: `
あなたはユーザーの天気に関する質問から「日付」を抽出する専門家です。

ユーザーの質問: "${query}"

要件:
1) ユーザーが具体的な日付/相対日付を含めている場合のみ抽出してください。
   例: "今日" → ISO 形式 YYYY-MM-DD / "明日" → YYYY-MM-DD / "あさって" → YYYY-MM-DD / "来週の火曜" → YYYY-MM-DD
2) 日付が含まれていない、または曖昧で特定できない場合は、厳密に "NONE" と出力してください。
3) 出力は日付のみ（YYYY-MM-DD）。説明や追加テキスト、記号は禁止です。
`,
      en: `
You extract a specific calendar date from a weather query when the user explicitly mentions one.

User question: "${query}"

Requirements:
1) If the query includes a concrete or relative date (e.g., today, tomorrow, day after tomorrow, next Tuesday), return the resolved date in strict ISO format YYYY-MM-DD.
2) If no date is mentioned or it's ambiguous, output exactly "NONE".
3) Output only the date string, nothing else.
`,
    };

    const { text } = await generateText({
      model: google("gemini-1.5-flash"),
      prompt: prompts[language],
    });

    const trimmed = text.trim();
    if (trimmed.toUpperCase() === "NONE") return null;
    // Basic ISO date sanity check YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
    return null;
  } catch (error) {
    console.error("Date extraction error:", error);
    return null;
  }
}

export interface ExtractedQueryInfo {
  location: string;
  date: string | null; // YYYY-MM-DD or null for today
  time: string | null; // HH:mm (24h) or null if not specified
}

function parseJsonLoose<T = any>(raw: string): T | null {
  try {
    const cleaned = raw
      .replace(/^```[a-zA-Z]*\n?/, "")
      .replace(/```\s*$/, "")
      .trim();
    try {
      return JSON.parse(cleaned);
    } catch {}

    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      const slice = cleaned.slice(start, end + 1);
      return JSON.parse(slice);
    }
    return null;
  } catch {
    return null;
  }
}

export async function extractLocationAndDateTime(
  query: string,
  language: "en" | "jp" = "jp",
  nowISODate: string,
  nowTime24h: string
): Promise<ExtractedQueryInfo> {
  try {
    const prompts = {
      jp: `
あなたは天気に関するユーザー質問から「都市, 国名」「日付」「時間」を抽出して正規化する専門家です。

現在日付: ${nowISODate}
現在時刻(24h): ${nowTime24h}
ユーザーの質問: "${query}"

要件:
1) 場所は必ず「都市名, 国名」の形式に正規化してください（例: "Tokyo, Japan"）。ランドマークは属する都市に解決。
2) 日付/相対日付がある場合は YYYY-MM-DD に解決。無い場合は null。
   例: 今日/明日/あさって/来週の火曜/今週末 など。
3) 時刻/時間帯（"朝/午前/昼/午後/夕方/夜/23時" 等）がある場合は最も妥当な HH:mm(24h) に正規化。無い場合は null。
4) 相対表現は与えられた現在日付・現在時刻を基準に解決。
5) 出力は次の厳密なJSONのみ（コードブロックや言語タグ、追加テキストは一切禁止）:
{
  "location": "City, Country",
  "date": "YYYY-MM-DD" | null,
  "time": "HH:mm" | null
}
JSON以外の文字は一切出力しないでください。
`,
      en: `
You extract "City, Country" location and an optional date/time from a weather query, resolving relative terms.

Current date: ${nowISODate}
Current time (24h): ${nowTime24h}
User question: "${query}"

Requirements:
1) Normalize the location to "City, Country"; resolve landmarks to their city.
2) If a date is mentioned (today/tomorrow/day after/next Tue/this weekend), resolve to YYYY-MM-DD; else null.
3) If a time or time-of-day is mentioned (morning/afternoon/evening/night/3pm/23:00), normalize to HH:mm 24h; else null.
4) Resolve relatives using the provided current date/time.
5) Output strictly this JSON only (do NOT wrap in code fences or add any extra text):
{
  "location": "City, Country",
  "date": "YYYY-MM-DD" | null,
  "time": "HH:mm" | null
}
No explanations, no code fences, no extra text.
`,
    };

    const { text } = await generateText({
      model: google("gemini-1.5-flash"),
      prompt: prompts[language],
    });

    const raw = text.trim();
    let parsed: any = parseJsonLoose(raw);
    if (!parsed) {
      console.error("Combined extraction JSON parse failed:", raw);
      // Fallback: return only location using previous extractor
      const loc = await extractLocationFromQuery(query, language);
      return { location: loc || "Tokyo, Japan", date: null, time: null };
    }

    const location: string = (parsed?.location || "").trim();
    const date: string | null =
      parsed?.date && /^\d{4}-\d{2}-\d{2}$/.test(parsed.date)
        ? parsed.date
        : null;
    const time: string | null =
      parsed?.time && /^\d{2}:\d{2}$/.test(parsed.time) ? parsed.time : null;

    if (!location) {
      const loc = await extractLocationFromQuery(query, language);
      return { location: loc || "Tokyo, Japan", date, time };
    }

    return { location, date, time };
  } catch (error) {
    console.error("Location+DateTime extraction error:", error);
    const loc = await extractLocationFromQuery(query, language);
    return { location: loc || "Tokyo, Japan", date: null, time: null };
  }
}

export async function generateClothingRecommendation(
  query: string,
  location: string,
  weatherData: any,
  language: "en" | "jp" = "jp"
): Promise<string> {
  try {
    const currentMonth = new Date().getMonth() + 1;
    const season = getSeason(currentMonth, language);

    const prompts = {
      jp: `
あなたは日本の気候と文化に精通した服装アドバイザーです。

ユーザーの質問: "${query}"
場所: ${location}
現在の季節: ${season}
天気データ:
- 気温: ${weatherData.temperature}°C
- 天気: ${weatherData.condition}
- 降水確率: ${weatherData.precipitation}%
- 風速: ${weatherData.windSpeed}m/s
- 湿度: ${weatherData.humidity}%

この情報に基づいて、日本の気候と文化に適した服装をアドバイスしてください。

出力は次の厳密なJSON形式で返してください。説明やMarkdown、追加テキストは一切含めないでください。コードブロックも禁止です。
{
  "main": "メインの服装を日本語で詳しく1-3文で。",
  "accessories": "アクセサリー・小物を日本語で詳しく1-3文で。",
  "tips": "追加アドバイスを日本語で詳しく1-3文で。"
}

要件:
- 値はすべてプレーンテキスト（改行可）。
- "Explanation"などのヘッダーや番号付けを含めない。
- JSON以外の文字は出力しない。
`,
      en: `
You are a clothing advisor familiar with Japanese climate and culture.

User question: "${query}"
Location: ${location}
Current season: ${season}
Weather data:
- Temperature: ${weatherData.temperature}°C
- Weather: ${weatherData.condition}
- Precipitation: ${weatherData.precipitation}%
- Wind speed: ${weatherData.windSpeed}m/s
- Humidity: ${weatherData.humidity}%

Based on this information, return clothing advice.

Return output in this strict JSON format only. Do not include Markdown, code fences, numbering, or any extra text before or after JSON.
{
  "main": "Main clothing details in English, 1-3 sentences.",
  "accessories": "Accessories details in English, 1-3 sentences.",
  "tips": "Additional advice in English, 1-3 sentences."
}

Requirements:
- Values must be plain text (newlines allowed).
- Do not include headings like "Explanation".
- Output JSON only.
`,
    };

    const { text } = await generateText({
      model: google("gemini-1.5-flash"),
      prompt: prompts[language],
    });

    return text;
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

export async function generateActivityBasedRecommendation(
  activity: string,
  weatherData: any,
  location: string,
  language: "en" | "jp" = "jp"
): Promise<string> {
  try {
    const prompts = {
      jp: `
活動: ${activity}
場所: ${location}
天気: 気温${weatherData.temperature}°C、${weatherData.condition}、降水確率${weatherData.precipitation}%

この活動に適した服装をアドバイスしてください。

活動別の考慮点:
- 通勤/通学: ビジネスカジュアル、電車内の温度
- 外出/買い物: 歩きやすさ、荷物の持ちやすさ
- 運動/スポーツ: 動きやすさ、汗対策
- デート: おしゃれさと実用性のバランス
- 旅行: 荷物の軽量化、様々な場面への対応

具体的で実用的なアドバイスを日本語で提供してください。
`,
      en: `
Activity: ${activity}
Location: ${location}
Weather: Temperature ${weatherData.temperature}°C, ${weatherData.condition}, Precipitation ${weatherData.precipitation}%

Please provide clothing advice suitable for this activity.

Activity considerations:
- Commuting/School: Business casual, train temperature
- Going out/Shopping: Walkability, carrying convenience
- Exercise/Sports: Mobility, sweat management
- Dating: Balance of style and practicality
- Travel: Lightweight luggage, versatility for various situations

Please provide specific and practical advice in English.
`,
    };

    const { text } = await generateText({
      model: google("gemini-1.5-flash"),
      prompt: prompts[language],
    });

    return text;
  } catch (error) {
    console.error("Activity-based recommendation error:", error);
    return language === "en"
      ? "Could not generate activity-based clothing advice."
      : "活動に応じた服装アドバイスを生成できませんでした。";
  }
}

export async function generateTimeBasedRecommendation(
  timeOfDay: string,
  weatherData: any,
  location: string,
  language: "en" | "jp" = "jp"
): Promise<string> {
  try {
    const prompts = {
      jp: `
時間帯: ${timeOfDay}
場所: ${location}
天気: 気温${weatherData.temperature}°C、${weatherData.condition}

この時間帯の天気に適した服装をアドバイスしてください。

時間帯別の考慮点:
- 朝: 気温の変化、通勤ラッシュ
- 昼: 日差しの強さ、活動量
- 夕方: 気温の下降、帰宅時間
- 夜: 冷え込み、室内外の温度差

日本の気候特性を考慮した実用的なアドバイスを提供してください。
`,
      en: `
Time of day: ${timeOfDay}
Location: ${location}
Weather: Temperature ${weatherData.temperature}°C, ${weatherData.condition}

Please provide clothing advice suitable for this time of day and weather.

Time-based considerations:
- Morning: Temperature changes, rush hour commute
- Afternoon: Sun intensity, activity level
- Evening: Temperature drop, commute home
- Night: Cooling down, indoor/outdoor temperature differences

Please provide practical advice considering Japanese climate characteristics.
`,
    };

    const { text } = await generateText({
      model: google("gemini-1.5-flash"),
      prompt: prompts[language],
    });

    return text;
  } catch (error) {
    console.error("Time-based recommendation error:", error);
    return language === "en"
      ? "Could not generate time-based clothing advice."
      : "時間帯に応じた服装アドバイスを生成できませんでした。";
  }
}
