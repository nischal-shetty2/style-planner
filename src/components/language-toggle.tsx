"use client";

import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";
import { useLanguage } from "@/context/language-context";

export default function LanguageToggle() {
  const { language, setLanguage, t } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "jp" : "en");
  };

  return (
    <Button
      onClick={toggleLanguage}
      variant="outline"
      size="sm"
      className="gap-2 bg-card hover:bg-card/80 border-border">
      <Globe className="w-4 h-4" />
      <span className="text-sm">
        {language === "en" ? "日本語" : "English"}
      </span>
    </Button>
  );
}
