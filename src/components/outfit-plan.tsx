"use client";

import {
  Shirt,
  Umbrella,
  MessageCircle,
  MapPin,
  Thermometer,
} from "lucide-react";
import { motion } from "framer-motion";
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
          (result as Record<string, string>)[current] += normalized + "\n";
        }
        continue;
      }
      (result as Record<string, string>)[current] += line + "\n";
    }

    // 3) Final heuristic: if everything empty, take first 3 lines as main
    if (!result.main && !result.accessories && !result.tips) {
      result.main = text.split("\n").slice(0, 3).join("\n");
    }

    return result;
  };

  const sections = parseRecommendation(recommendation);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: {
      opacity: 0,
      y: 20,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.1, 0.25, 1] as const,
      },
    },
  };

  const iconVariants = {
    hover: {
      scale: 1.1,
      rotate: 5,
      transition: { duration: 0.2 },
    },
  };

  const cardHover = {
    scale: 1.01,
    y: -1,
    transition: {
      duration: 0.1,
      ease: [0.2, 0.5, 0.8, 1] as const,
    },
  };

  return (
    <motion.div
      className="max-w-2xl mx-auto space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible">
      <motion.div className="text-center" variants={cardVariants}>
        <motion.div
          className="flex items-center justify-center gap-6 text-sm text-muted-foreground mb-3"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.6,
            delay: 0.2,
            ease: [0.25, 0.1, 0.25, 1],
          }}>
          <div className="flex items-center gap-2 bg-background/50 backdrop-blur-sm px-3 py-1.5 rounded-full border border-border/50">
            <MapPin className="w-4 h-4 text-blue-500" />
            <span className="font-medium">{location}</span>
          </div>
          <div className="flex items-center gap-2 bg-background/50 backdrop-blur-sm px-3 py-1.5 rounded-full border border-border/50">
            <Thermometer className="w-4 h-4 text-orange-500" />
            <span className="font-medium">{weather.temperature}°C</span>
          </div>
        </motion.div>
        <motion.h2
          className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 0.6,
            delay: 0.3,
            ease: [0.25, 0.1, 0.25, 1],
          }}>
          {t("todaysOutfit")}
        </motion.h2>
      </motion.div>

      <motion.div
        className="group outfit-card bg-gradient-to-br from-card via-card to-card/95 border border-border/80 rounded-xl p-6 shadow-lg hover:shadow-xl backdrop-blur-sm"
        variants={cardVariants}
        whileHover={cardHover}
        layout>
        <div className="flex items-center gap-3 mb-4">
          <motion.div
            className="w-12 h-12 bg-gradient-to-br from-blue-500/10 to-blue-600/20 rounded-xl flex items-center justify-center ring-1 ring-blue-500/20"
            variants={iconVariants}
            whileHover="hover">
            <Shirt className="w-6 h-6 text-blue-600" />
          </motion.div>
          <h3 className="text-xl font-semibold text-card-foreground group-hover:text-blue-600 transition-colors duration-300">
            {t("mainClothing")}
          </h3>
        </div>
        <motion.div
          className="text-card-foreground/90 leading-relaxed whitespace-pre-line"
          initial={{ opacity: 0.8 }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.2 }}>
          {sections.main || recommendation.split("\n").slice(0, 3).join("\n")}
        </motion.div>
      </motion.div>

      <motion.div
        className="group outfit-card bg-gradient-to-br from-card via-card to-card/95 border border-border/80 rounded-xl p-6 shadow-lg hover:shadow-xl backdrop-blur-sm"
        variants={cardVariants}
        whileHover={cardHover}
        layout>
        <div className="flex items-center gap-3 mb-4">
          <motion.div
            className="w-12 h-12 bg-gradient-to-br from-emerald-500/10 to-emerald-600/20 rounded-xl flex items-center justify-center ring-1 ring-emerald-500/20"
            variants={iconVariants}
            whileHover="hover">
            <Umbrella className="w-6 h-6 text-emerald-600" />
          </motion.div>
          <h3 className="text-xl font-semibold text-card-foreground group-hover:text-emerald-600 transition-colors duration-300">
            {t("accessories")}
          </h3>
        </div>
        <motion.div
          className="text-card-foreground/90 leading-relaxed whitespace-pre-line"
          initial={{ opacity: 0.8 }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.2 }}>
          {sections.accessories ||
            (language === "en"
              ? `Umbrella: ${
                  weather.precipitation > 30 ? "Needed" : "Not needed"
                }\nHat: Recommended if sunny\nBag: Lightweight and waterproof`
              : `傘: ${
                  weather.precipitation > 30 ? "必要" : "不要"
                }\n帽子: 日差しが強い場合は推奨\nバッグ: 軽量で防水性のあるもの`)}
        </motion.div>
      </motion.div>

      <motion.div
        className="group outfit-card bg-gradient-to-br from-card via-card to-card/95 border border-border/80 rounded-xl p-6 shadow-lg hover:shadow-xl backdrop-blur-sm"
        variants={cardVariants}
        whileHover={cardHover}
        layout>
        <div className="flex items-center gap-3 mb-4">
          <motion.div
            className="w-12 h-12 bg-gradient-to-br from-amber-500/10 to-amber-600/20 rounded-xl flex items-center justify-center ring-1 ring-amber-500/20"
            variants={iconVariants}
            whileHover="hover">
            <MessageCircle className="w-6 h-6 text-amber-600" />
          </motion.div>
          <h3 className="text-xl font-semibold text-card-foreground group-hover:text-amber-600 transition-colors duration-300">
            {t("tips")}
          </h3>
        </div>
        <motion.div
          className="text-card-foreground/90 leading-relaxed whitespace-pre-line"
          initial={{ opacity: 0.8 }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.2 }}>
          {sections.tips ||
            (language === "en"
              ? `Humidity: ${weather.humidity}%\nWind Speed: ${weather.windSpeed}m/s\n${weather.description}`
              : `湿度: ${weather.humidity}%\n風速: ${weather.windSpeed}m/s\n${weather.description}`)}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
