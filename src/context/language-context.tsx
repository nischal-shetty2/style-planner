"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

export type Language = "en" | "jp";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

// Translation dictionary
const translations = {
  en: {
    // App title and description
    appTitle: "Style Planner",
    appDescription:
      "Ask about your plans with your location using voice or text",

    // Main interface
    inputPlaceholder: "Ask about the weather...",
    exampleQuery1: "Visiting the SkyTree building today, what should I wear?",
    exampleQuery2: "What should I wear to McDonald's in Mangalore?",
    exampleQuery3: "I have a meeting in Burj Khalifa.",

    // Weather forecast section
    majorCitiesWeather: "Major Cities Weather",
    currentWeather: "Current",
    hoursLater: "hours later",
    futureWeather: "Future Forecast",
    windSpeed: "Wind Speed",
    humidity: "Humidity",
    precipitation: "Precipitation",

    // Step loader
    processingVoice: "Processing input...",
    fetchingLocation: "Fetching location details...",
    fetchingWeather: "Fetching weather data...",
    generatingOutfit: "Generating outfit suggestions...",

    // Outfit plan
    todaysOutfit: "Recommended Outfit",
    mainClothing: "Main Clothing",
    accessories: "Accessories",
    tips: "Tips & Notes",

    // Toast messages
    completed: "Completed",
    outfitGenerated: "Generated outfit advice for",
    error: "Error",
    weatherFetchFailed: "Failed to fetch weather information",

    // Error messages
    generalError: "Sorry, an error occurred. Please try again.",

    // Language selection
    selectLanguage: "Select Language",
    selectLanguageDescription:
      "Choose your preferred language for the weather assistant",
    english: "English",
    japanese: "Japanese",
    continue: "Continue",

    // Language toggle
    currentLanguage: "Current: English",
    switchToJapanese: "Switch to Japanese",
    switchToEnglish: "Switch to English",
  },
  jp: {
    // App title and description
    appTitle: "スタイルプランナー",
    appDescription:
      "音声またはテキストを使用して、現在地から予定について問い合わせる",

    // Main interface
    inputPlaceholder: "天気について聞いてください...",
    exampleQuery1: "今日の東京の天気はどうですか？",
    exampleQuery2: "明日の大阪は雨が降りますか？",
    exampleQuery3: "渋谷の気温はどのくらいですか？",

    // Weather forecast section
    majorCitiesWeather: "主要都市の天気",
    currentWeather: "現在",
    hoursLater: "時間後",
    futureWeather: "今後の予報",
    windSpeed: "風速",
    humidity: "湿度",
    precipitation: "降水確率",

    // Step loader
    processingVoice: "音声認識中…",
    fetchingLocation: "位置情報を取得中…",
    fetchingWeather: "天気情報を取得中…",
    generatingOutfit: "コーディネート提案を生成中…",

    // Outfit plan
    todaysOutfit: "今日のおすすめコーディネート",
    mainClothing: "メイン服装",
    accessories: "アクセサリー",
    tips: "アドバイス・注意点",

    // Toast messages
    completed: "完了",
    outfitGenerated: "の服装アドバイスを生成しました",
    error: "エラー",
    weatherFetchFailed: "天気情報の取得に失敗しました",

    // Error messages
    generalError:
      "申し訳ございません。エラーが発生しました。もう一度お試しください。",

    // Language selection
    selectLanguage: "言語を選択",
    selectLanguageDescription: "天気アシスタントの言語を選択してください",
    english: "English",
    japanese: "日本語",
    continue: "続行",

    // Language toggle
    currentLanguage: "現在: 日本語",
    switchToJapanese: "日本語に切り替え",
    switchToEnglish: "英語に切り替え",
  },
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("jp");
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Check if user has a saved language preference
    const savedLanguage = localStorage.getItem(
      "weather-app-language"
    ) as Language;
    if (savedLanguage && (savedLanguage === "en" || savedLanguage === "jp")) {
      setLanguageState(savedLanguage);
    }
    setIsInitialized(true);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("weather-app-language", lang);
  };

  const t = (key: string): string => {
    return (
      translations[language][
        key as keyof (typeof translations)[typeof language]
      ] || key
    );
  };

  if (!isInitialized) {
    return null; // or a loading spinner
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
