import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Cloud, User } from "lucide-react";
import WeatherCard from "./weather-card";
import ClothingRecommendation from "./clothing-recommendation";

interface ChatBubbleProps {
  message: string;
  isUser: boolean;
  timestamp: Date;
  weatherData?: {
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
  };
}

export default function ChatBubble({
  message,
  isUser,
  timestamp,
  weatherData,
}: ChatBubbleProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <Avatar className="h-8 w-8 bg-white/90 flex-shrink-0">
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
            <Cloud className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}

      <div
        className={`max-w-xs lg:max-w-md xl:max-w-lg ${
          isUser ? "order-1" : "order-2"
        }`}>
        <div
          className={`px-4 py-3 rounded-2xl ${
            isUser
              ? "chat-bubble-user text-white rounded-br-md"
              : "chat-bubble-ai text-gray-800 rounded-bl-md"
          }`}>
          <p className="text-sm leading-relaxed whitespace-pre-line">
            {message}
          </p>
        </div>

        {!isUser && weatherData && (
          <div className="mt-3 space-y-3">
            <WeatherCard
              location={weatherData.location}
              weather={weatherData.weather}
            />
            <ClothingRecommendation
              recommendation={weatherData.recommendation}
              location={weatherData.location}
              temperature={weatherData.weather.temperature}
            />
          </div>
        )}

        <p
          className={`text-xs text-white/60 mt-1 ${
            isUser ? "text-right" : "text-left"
          }`}>
          {formatTime(timestamp)}
        </p>
      </div>

      {isUser && (
        <Avatar className="h-8 w-8 bg-white/90 flex-shrink-0">
          <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-600 text-white">
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
