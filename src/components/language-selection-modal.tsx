"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Globe, Check } from "lucide-react";
import { useLanguage, type Language } from "@/context/language-context";

export default function LanguageSelectionModal() {
  const [showModal, setShowModal] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>("jp");
  const { setLanguage } = useLanguage();

  useEffect(() => {
    // Check if this is the user's first visit
    const hasSelectedLanguage = localStorage.getItem("weather-app-language");
    if (!hasSelectedLanguage) {
      setShowModal(true);
    }
  }, []);

  const handleLanguageSelect = (lang: Language) => {
    setSelectedLanguage(lang);
  };

  const handleContinue = () => {
    setLanguage(selectedLanguage);
    setShowModal(false);
  };

  return (
    <AnimatePresence>
      {showModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="bg-card border border-border rounded-lg p-8 max-w-md w-full shadow-lg">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                {selectedLanguage === "en" ? "Select Language" : "言語を選択"}
              </h2>
              <p className="text-muted-foreground">
                {selectedLanguage === "en"
                  ? "Choose your preferred language for your style assistant"
                  : "スタイルアシスタントの優先言語を選択してください"}
              </p>
            </div>

            <div className="space-y-3 mb-6">
              <button
                onClick={() => handleLanguageSelect("en")}
                className={`w-full p-4 rounded-lg border transition-all flex items-center justify-between ${
                  selectedLanguage === "en"
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border hover:border-primary/50 text-muted-foreground hover:text-foreground"
                }`}>
                <div className="flex items-center gap-3">
                  <div className="text-2xl">🇺🇸</div>
                  <div className="text-left">
                    <div className="font-medium">English</div>
                    <div className="text-sm opacity-70">Style Planner</div>
                  </div>
                </div>
                {selectedLanguage === "en" && (
                  <Check className="w-5 h-5 text-primary" />
                )}
              </button>

              <button
                onClick={() => handleLanguageSelect("jp")}
                className={`w-full p-4 rounded-lg border transition-all flex items-center justify-between ${
                  selectedLanguage === "jp"
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border hover:border-primary/50 text-muted-foreground hover:text-foreground"
                }`}>
                <div className="flex items-center gap-3">
                  <div className="text-2xl">🇯🇵</div>
                  <div className="text-left">
                    <div className="font-medium">日本語</div>
                    <div className="text-sm opacity-70">スタイルプランナー</div>
                  </div>
                </div>
                {selectedLanguage === "jp" && (
                  <Check className="w-5 h-5 text-primary" />
                )}
              </button>
            </div>

            <Button onClick={handleContinue} className="w-full" size="lg">
              {selectedLanguage === "en" ? "Continue" : "続行"}
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
