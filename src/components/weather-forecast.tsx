"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Cloud,
  Sun,
  CloudRain,
  CloudSnow,
  Zap,
  Eye,
  X,
  Wind,
  Droplets,
} from "lucide-react";
import { useLanguage } from "@/context/language-context";

interface CityWeather {
  name: string;
  nameJa: string;
  temperature: number;
  condition: string;
  description: string;
  icon: string;
  humidity?: number;
  windSpeed?: number;
  precipitation?: number;
}

interface DetailedWeather extends CityWeather {
  forecast?: CityWeather[];
}

const JAPANESE_CITIES = [
  { name: "Tokyo", nameJa: "東京", lat: 35.6762, lon: 139.6503 },
  { name: "Osaka", nameJa: "大阪", lat: 34.6937, lon: 135.5023 },
  { name: "Kyoto", nameJa: "京都", lat: 35.0116, lon: 135.7681 },
  { name: "Sapporo", nameJa: "札幌", lat: 43.0642, lon: 141.3469 },
];

function getWeatherIcon(condition: string, iconCode: string) {
  const iconMap: { [key: string]: any } = {
    Clear: Sun,
    Clouds: Cloud,
    Rain: CloudRain,
    Drizzle: CloudRain,
    Snow: CloudSnow,
    Thunderstorm: Zap,
    Mist: Eye,
    Fog: Eye,
  };

  const IconComponent = iconMap[condition] || Cloud;
  return <IconComponent className="w-5 h-5" />;
}

export default function WeatherForecast() {
  const [weatherData, setWeatherData] = useState<CityWeather[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedCity, setExpandedCity] = useState<string | null>(null);
  const [detailedWeather, setDetailedWeather] =
    useState<DetailedWeather | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const { t, language } = useLanguage();

  useEffect(() => {
    const fetchCityWeather = async () => {
      try {
        const response = await fetch("/api/cities-weather");
        if (response.ok) {
          const data = await response.json();
          setWeatherData(data);
        }
      } catch (error) {
        console.error("Failed to fetch city weather:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCityWeather();
  }, []);

  const fetchDetailedWeather = async (cityName: string) => {
    setLoadingDetails(true);
    try {
      const city = JAPANESE_CITIES.find((c) => c.name === cityName);
      if (!city) return;

      const response = await fetch(
        `/api/detailed-weather?lat=${city.lat}&lon=${city.lon}&city=${cityName}&cityJa=${city.nameJa}`
      );
      if (response.ok) {
        const data = await response.json();
        setDetailedWeather(data);
      }
    } catch (error) {
      console.error("Failed to fetch detailed weather:", error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleCityClick = (cityName: string) => {
    setExpandedCity(cityName);
    fetchDetailedWeather(cityName);
  };

  const handleClose = () => {
    setExpandedCity(null);
    setDetailedWeather(null);
  };

  if (isLoading) {
    return (
      <div className="mb-12">
        <h2 className="text-xl font-semibold text-foreground mb-6 text-center">
          {t("majorCitiesWeather")}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-card border border-border rounded-lg p-4 animate-pulse">
              <div className="h-4 bg-muted rounded mb-2"></div>
              <div className="h-6 bg-muted rounded mb-2"></div>
              <div className="h-4 bg-muted rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-12">
      <h2 className="text-xl font-semibold text-foreground mb-6 text-center">
        {t("majorCitiesWeather")}
      </h2>

      <AnimatePresence mode="wait">
        {expandedCity ? (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="bg-card border border-border rounded-lg p-6 relative overflow-hidden">
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 hover:bg-muted rounded-full transition-colors">
              <X className="w-4 h-4" />
            </button>

            {loadingDetails ? (
              <div className="animate-pulse">
                <div className="h-8 bg-muted rounded mb-4 w-32"></div>
                <div className="h-12 bg-muted rounded mb-6 w-48"></div>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-muted rounded"></div>
                  ))}
                </div>
              </div>
            ) : detailedWeather ? (
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-foreground">
                      {language === "en"
                        ? detailedWeather.name
                        : detailedWeather.nameJa}
                    </h3>
                    <p className="text-muted-foreground">
                      {language === "en"
                        ? detailedWeather.nameJa
                        : detailedWeather.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-auto">
                    <div className="text-primary">
                      {getWeatherIcon(
                        detailedWeather.condition,
                        detailedWeather.icon
                      )}
                    </div>
                    <span className="text-3xl font-bold text-foreground">
                      {detailedWeather.temperature}°C
                    </span>
                  </div>
                </div>

                <p className="text-muted-foreground mb-6">
                  {detailedWeather.description}
                </p>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-muted/50 rounded-lg p-4 text-center">
                    <Wind className="w-5 h-5 mx-auto mb-2 text-primary" />
                    <div className="text-sm text-muted-foreground">
                      {t("windSpeed")}
                    </div>
                    <div className="font-semibold">
                      {detailedWeather.windSpeed || 0} m/s
                    </div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 text-center">
                    <Droplets className="w-5 h-5 mx-auto mb-2 text-primary" />
                    <div className="text-sm text-muted-foreground">
                      {t("humidity")}
                    </div>
                    <div className="font-semibold">
                      {detailedWeather.humidity || 0}%
                    </div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 text-center">
                    <CloudRain className="w-5 h-5 mx-auto mb-2 text-primary" />
                    <div className="text-sm text-muted-foreground">
                      {t("precipitation")}
                    </div>
                    <div className="font-semibold">
                      {detailedWeather.precipitation || 0}%
                    </div>
                  </div>
                </div>

                {detailedWeather.forecast &&
                  detailedWeather.forecast.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold mb-4">
                        {t("futureWeather")}
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {detailedWeather.forecast
                          .slice(0, 4)
                          .map((forecast, index) => (
                            <div
                              key={index}
                              className="bg-muted/30 rounded-lg p-3 text-center">
                              <div className="text-xs text-muted-foreground mb-1">
                                {index === 0
                                  ? t("currentWeather")
                                  : `${(index + 1) * 3}${t("hoursLater")}`}
                              </div>
                              <div className="flex justify-center mb-2 text-primary">
                                {getWeatherIcon(
                                  forecast.condition,
                                  forecast.icon
                                )}
                              </div>
                              <div className="font-semibold text-sm">
                                {forecast.temperature}°C
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {forecast.description}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
              </div>
            ) : null}
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {weatherData.map((city, index) => (
              <motion.div
                key={city.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleCityClick(city.name)}
                className="bg-card border border-border rounded-lg p-4 hover:bg-card/80 transition-colors cursor-pointer group">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-card-foreground">
                    {language === "en" ? city.name : city.nameJa}
                  </h3>
                  <div className="text-muted-foreground group-hover:text-primary transition-colors">
                    {getWeatherIcon(city.condition, city.icon)}
                  </div>
                </div>
                <div className="text-2xl font-bold text-foreground mb-1">
                  {city.temperature}°C
                </div>
                <div className="text-sm text-muted-foreground">
                  {city.description}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
