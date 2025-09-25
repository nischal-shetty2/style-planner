"use client";

import {
  Shirt,
  Umbrella,
  MessageCircle,
  MapPin,
  Thermometer,
} from "lucide-react";
import { useLanguage } from "@/context/language-context";

interface OutfitPlanProps {
  location: string;
  weather: {
    temperature: number;
    condition: string;
    precipitation: number;
    windSpeed: number;
    humidity: number;
    description: string;
    icon: string;
  };
  recommendation: string;
}

export default function OutfitPlan({
  location,
  weather,
  recommendation,
}: OutfitPlanProps) {
  const { t, language } = useLanguage();

  // Parse the recommendation to extract structured data (JSON-first with robust fallbacks)
  const parseRecommendation = (text: string) => {
    const result = { main: "", accessories: "", tips: "" } as {
      main: string;
      accessories: string;
      tips: string;
    };

    if (!text) return result;

    // 1) Try strict JSON parse
    try {
      const trimmed = text.trim();
      const jsonStart = trimmed.indexOf("{");
      const jsonEnd = trimmed.lastIndexOf("}");
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        const jsonSlice = trimmed.slice(jsonStart, jsonEnd + 1);
        const parsed = JSON.parse(jsonSlice);
        if (parsed && typeof parsed === "object") {
          result.main = String(parsed.main || "").trim();
          result.accessories = String(parsed.accessories || "").trim();
          result.tips = String(parsed.tips || "").trim();
          if (result.main || result.accessories || result.tips) {
            return result;
          }
        }
      }
    } catch {}

    // 2) Fallback: remove lines starting with Explanation and parse labeled/numbered sections
    const cleaned = text
      .split("\n")
      .filter((l) => !/^\s*\*\*?Explanation/i.test(l.replace(/^\s*-\s*/, "")))
      .join("\n");

    // Patterns for section headers (EN/JP)
    const patterns = [
      { key: "main", regex: /(1\.|Main\s*Clothing|メインの服装)/i },
      { key: "accessories", regex: /(2\.|Accessories|アクセサリー)/i },
      {
        key: "tips",
        regex: /(3\.|Additional\s*Advice|追加アドバイス|注意|ヒント|Tips)/i,
      },
    ] as const;

    const lines = cleaned.split("\n");
    let current: "main" | "accessories" | "tips" = "main";
    for (const raw of lines) {
      const line = raw.trim();
      if (!line) continue;
      const matched = patterns.find((p) => p.regex.test(line));
      if (matched) {
        current = matched.key;
        // Remove any leading numbering/labels and colon-like separators
        const normalized = line
          .replace(/^(\d+\.|\*\s*)\s*/i, "")
          .replace(
            /^(Main\s*Clothing|Accessories|Additional\s*Advice|メインの服装|アクセサリー|追加アドバイス)\s*[:：-]?\s*/i,
            ""
          );
        if (normalized) {
          (result as any)[current] += normalized + "\n";
        }
        continue;
      }
      (result as any)[current] += line + "\n";
    }

    // 3) Final heuristic: if everything empty, take first 3 lines as main
    if (!result.main && !result.accessories && !result.tips) {
      result.main = text.split("\n").slice(0, 3).join("\n");
    }

    return result;
  };

  const sections = parseRecommendation(recommendation);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          {t("todaysOutfit")}
        </h2>
        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            <span>{location}</span>
          </div>
          <div className="flex items-center gap-1">
            <Thermometer className="w-4 h-4" />
            <span>{weather.temperature}°C</span>
          </div>
        </div>
      </div>

      <div className="outfit-card bg-card border border-border rounded-lg p-6 shadow-md">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Shirt className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-card-foreground">
            {t("mainClothing")}
          </h3>
        </div>
        <div className="text-card-foreground leading-relaxed whitespace-pre-line">
          {sections.main || recommendation.split("\n").slice(0, 3).join("\n")}
        </div>
      </div>

      <div className="outfit-card bg-card border border-border rounded-lg p-6 shadow-md">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
            <Umbrella className="w-5 h-5 text-accent" />
          </div>
          <h3 className="text-lg font-semibold text-card-foreground">
            {t("accessories")}
          </h3>
        </div>
        <div className="text-card-foreground leading-relaxed whitespace-pre-line">
          {sections.accessories ||
            (language === "en"
              ? `Umbrella: ${
                  weather.precipitation > 30 ? "Needed" : "Not needed"
                }\nHat: Recommended if sunny\nBag: Lightweight and waterproof`
              : `傘: ${
                  weather.precipitation > 30 ? "必要" : "不要"
                }\n帽子: 日差しが強い場合は推奨\nバッグ: 軽量で防水性のあるもの`)}
        </div>
      </div>

      <div className="outfit-card bg-card border border-border rounded-lg p-6 shadow-md">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-secondary-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-card-foreground">
            {t("tips")}
          </h3>
        </div>
        <div className="text-card-foreground leading-relaxed whitespace-pre-line">
          {sections.tips ||
            (language === "en"
              ? `Humidity: ${weather.humidity}%\nWind Speed: ${weather.windSpeed}m/s\n${weather.description}`
              : `湿度: ${weather.humidity}%\n風速: ${weather.windSpeed}m/s\n${weather.description}`)}
        </div>
      </div>
    </div>
  );
}
