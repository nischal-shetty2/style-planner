"use client";

import { Button } from "@/components/ui/button";
import { Globe, Plus } from "lucide-react";
import { useLanguage } from "@/context/language-context";

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

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

export function NewChatButton() {
  const handleNewChat = () => {
    window.location.reload();
  };

  return (
    <Button
      onClick={handleNewChat}
      variant="outline"
      size="sm"
      className="gap-2 bg-card hover:bg-card/80 border-border">
      <Plus className="w-4 h-4" />
      <span className="text-sm">New Chat</span>
    </Button>
  );
}
