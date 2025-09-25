import { Card, CardContent } from "@/components/ui/card";
import {
  Cloud,
  Sun,
  CloudRain,
  CloudSnow,
  Wind,
  Droplets,
  Thermometer,
} from "lucide-react";

interface WeatherCardProps {
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
}

const getWeatherIcon = (condition: string, iconCode: string) => {
  const iconClass = "h-8 w-8";

  switch (condition.toLowerCase()) {
    case "clear":
      return <Sun className={`${iconClass} text-yellow-500`} />;
    case "clouds":
      return <Cloud className={`${iconClass} text-gray-500`} />;
    case "rain":
    case "drizzle":
      return <CloudRain className={`${iconClass} text-blue-500`} />;
    case "snow":
      return <CloudSnow className={`${iconClass} text-blue-200`} />;
    default:
      return <Cloud className={`${iconClass} text-gray-500`} />;
  }
};

export default function WeatherCard({ location, weather }: WeatherCardProps) {
  return (
    <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold text-gray-800">{location}</h3>
            <p className="text-sm text-gray-600 capitalize">
              {weather.description}
            </p>
          </div>
          {getWeatherIcon(weather.condition, weather.icon)}
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Thermometer className="h-4 w-4 text-red-500" />
            <span className="text-gray-700">{weather.temperature}°C</span>
          </div>

          <div className="flex items-center gap-2">
            <Droplets className="h-4 w-4 text-blue-500" />
            <span className="text-gray-700">{weather.humidity}%</span>
          </div>

          <div className="flex items-center gap-2">
            <CloudRain className="h-4 w-4 text-blue-600" />
            <span className="text-gray-700">{weather.precipitation}%</span>
          </div>

          <div className="flex items-center gap-2">
            <Wind className="h-4 w-4 text-gray-600" />
            <span className="text-gray-700">{weather.windSpeed}m/s</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
