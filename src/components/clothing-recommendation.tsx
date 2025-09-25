import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shirt, Umbrella, SunIcon, Clock, MapPin } from "lucide-react";

interface ClothingRecommendationProps {
  recommendation: string;
  location?: string;
  temperature?: number;
}

export default function ClothingRecommendation({
  recommendation,
  location,
  temperature,
}: ClothingRecommendationProps) {
  // Parse the recommendation to extract different sections
  const sections = recommendation.split("\n").filter((line) => line.trim());

  const getIconForSection = (section: string) => {
    if (
      section.includes("1.") ||
      section.includes("メインの服装") ||
      section.includes("Main outfit")
    ) {
      return <Shirt className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />;
    }
    if (
      section.includes("2.") ||
      section.includes("アクセサリー") ||
      section.includes("Accessories")
    ) {
      return (
        <Umbrella className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
      );
    }
    if (
      section.includes("3.") ||
      section.includes("追加アドバイス") ||
      section.includes("Additional advice")
    ) {
      return (
        <SunIcon className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
      );
    }
    return null;
  };

  const getTemperatureColor = (temp?: number) => {
    if (!temp) return "text-gray-600";
    if (temp < 10) return "text-blue-600";
    if (temp < 20) return "text-green-600";
    if (temp < 30) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-0 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-purple-800">
          <Shirt className="h-5 w-5" />
          服装アドバイス / Clothing Advice
        </CardTitle>
        {(location || temperature) && (
          <div className="flex items-center gap-4 text-sm text-gray-600">
            {location && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span>{location}</span>
              </div>
            )}
            {temperature && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span className={getTemperatureColor(temperature)}>
                  {temperature}°C
                </span>
              </div>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {sections.map((section, index) => {
          const icon = getIconForSection(section);
          return (
            <div key={index} className="text-sm leading-relaxed">
              {icon ? (
                <div className="flex items-start gap-2">
                  {icon}
                  <p className="text-gray-700">{section}</p>
                </div>
              ) : (
                <p className="text-gray-700 ml-6">{section}</p>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
