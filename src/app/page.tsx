"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// BrowserSpeechDisclaimer component (must be outside main export)
function BrowserSpeechDisclaimer({ language }: { language: string }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const isSpeechSupported =
      "SpeechRecognition" in window || "webkitSpeechRecognition" in window;
    // Detect Brave or Firefox or other unsupported browsers
    const ua = navigator.userAgent;
    const isBrave =
      (navigator as any).brave &&
      typeof (navigator as any).brave.isBrave === "function";
    const isFirefox = ua.includes("Firefox");

    if (!isSpeechSupported || isBrave || isFirefox) {
      setShow(true);
    }
  }, []);
  if (!show) return null;
  return (
    <div className="mb-4 p-3 rounded-lg bg-yellow-100 border border-yellow-300 text-yellow-900 text-sm text-center">
      {language === "en"
        ? "Voice input may not work in this browser. For best results, use Google Chrome or Safari. Brave and Firefox etc do not fully support the Web Speech API."
        : "このブラウザでは音声入力が正しく動作しない場合があります。Google ChromeまたはSafariのご利用を推奨します。Brave、FirefoxはWeb Speech APIに完全対応していません。"}
    </div>
  );
}

import MicButton from "@/components/mic-button";
import MicButtonFallback from "@/components/mic-button-fallback";
import { shouldUseMicFallback } from "@/lib/browser-utils";
import StepLoader from "@/components/step-loader";
import OutfitPlan from "@/components/outfit-plan";
import WeatherForecast from "@/components/weather-forecast";
import LanguageSelectionModal from "@/components/language-selection-modal";
import { LanguageToggle, NewChatButton } from "@/components/util-buttons";
import { Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { useLanguage } from "@/context/language-context";
import { Send, Cloud } from "lucide-react";
import MapPreview from "@/components/map-preview";

interface Message {
  id: string;
  content: string;
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

export default function WeatherChatApp() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [useFallback, setUseFallback] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  // Detect browser support for Web Speech API or fallback
  useEffect(() => {
    if (typeof window !== "undefined") {
      setUseFallback(shouldUseMicFallback());
    }
  }, []);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const { t, language } = useLanguage();
  const dictationBaseRef = useRef("");
  const [previewCoords, setPreviewCoords] = useState<{
    lat: number;
    lon: number;
  } | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Capture the current input as the dictation base when mic starts
  useEffect(() => {
    if (isListening) {
      dictationBaseRef.current = inputValue;
    }
  }, [isListening]); // eslint-disable-line react-hooks/exhaustive-deps

  // Autosize textarea to fit content
  const autosizeTextarea = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  useEffect(() => {
    autosizeTextarea();
  }, [inputValue, autosizeTextarea]);

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isProcessing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue("");
    setIsProcessing(true);
    setCurrentStep(0);
    setIsLocating(false);

    try {
      setCurrentStep(1); // Processing voice input
      await new Promise((resolve) => setTimeout(resolve, 800));

      setCurrentStep(2); // Fetching location
      await new Promise((resolve) => setTimeout(resolve, 1000));

      (async () => {
        try {
          setIsLocating(true);
          const q = encodeURIComponent(currentInput);
          const res = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`,
            { headers: { "Accept-Language": language === "en" ? "en" : "ja" } }
          );
          if (res.ok) {
            const arr = await res.json();
            if (Array.isArray(arr) && arr.length > 0) {
              const item = arr[0];
              const lat = Number.parseFloat(item.lat);
              const lon = Number.parseFloat(item.lon);
              if (Number.isFinite(lat) && Number.isFinite(lon)) {
                setPreviewCoords({ lat, lon });
              }
            }
          }
        } catch (e) {
          console.error("Geocode error:", e);
        }
      })();

      setCurrentStep(3); // Fetching weather
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: currentInput,
          language: language, // Pass language to API
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      setCurrentStep(4); // Generating suggestions
      await new Promise((resolve) => setTimeout(resolve, 1200));

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content:
          language === "en"
            ? `Weather information and outfit advice for ${data.location}`
            : `${data.location}の天気情報と服装アドバイス`,
        isUser: false,
        timestamp: new Date(),
        weatherData: {
          location: data.location,
          weather: data.weather,
          recommendation: data.recommendation,
        },
      };

      setMessages((prev) => [...prev, aiMessage]);

      // Update preview to authoritative API coordinates
      if (data?.coordinates?.lat && data?.coordinates?.lon) {
        setPreviewCoords({
          lat: data.coordinates.lat,
          lon: data.coordinates.lon,
        });
      }

      toast(t("completed"), {
        description:
          language === "en"
            ? `Generated outfit advice for ${data.location}`
            : `${data.location}${t("outfitGenerated")}`,
      });
    } catch (error) {
      console.error("Chat error:", error);

      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        content: t("generalError"),
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);

      toast(t("error"), {
        description: t("weatherFetchFailed"),
      });
    } finally {
      setIsProcessing(false);
      setCurrentStep(0);
      setIsLocating(false);
    }
  }, [
    inputValue,
    isProcessing,
    setMessages,
    setInputValue,
    setIsProcessing,
    setCurrentStep,
    setIsLocating,
    t,
    language,
    setPreviewCoords,
  ]);

  const handleVoiceInput = (transcript: string) => {
    if (!transcript) return;
    const base = (dictationBaseRef.current || inputValue).trimEnd();
    const needsSpace = base.length > 0 && !base.endsWith(" ");
    const newValue = `${base}${needsSpace ? " " : ""}${transcript}`;
    dictationBaseRef.current = newValue;
    setInputValue(newValue);
    // Do not auto-send on each mic result; let user continue dictation
  };

  const handleInterimVoiceInput = (interim: string) => {
    // Use only the stable base captured at mic start or after final results
    const base = dictationBaseRef.current.trimEnd();
    const needsSpace = base.length > 0 && !base.endsWith(" ");
    const newValue = interim
      ? `${base}${needsSpace ? " " : ""}${interim}`
      : base;
    setInputValue(newValue);
  };

  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === "Enter" &&
        !event.shiftKey &&
        !(event.target instanceof HTMLInputElement) &&
        !(event.target instanceof HTMLTextAreaElement)
      ) {
        event.preventDefault(); // Important to prevent default browser behavior
        handleSendMessage();
      }
    };

    document.addEventListener("keydown", handleGlobalKeyDown);

    return () => {
      document.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, [isProcessing, handleSendMessage]);

  return (
    <div className="min-h-screen bg-background">
      <LanguageSelectionModal />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex gap-4 justify-end mb-4">
          <LanguageToggle />
          <NewChatButton />
        </div>

        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <Cloud className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">
              {t("appTitle")}
            </h1>
          </div>
          <p className="text-muted-foreground">{t("appDescription")}</p>
        </div>

        {messages.length === 0 && <WeatherForecast />}

        <div className="space-y-8 mb-8">
          {messages.map((message) => (
            <div key={message.id} className="space-y-6">
              {message.isUser ? (
                <div className="max-w-md mx-auto">
                  <div className="bg-primary text-primary-foreground rounded-lg px-4 py-3 text-center">
                    <p className="font-medium">{message.content}</p>
                  </div>
                </div>
              ) : (
                <div>
                  {message.weatherData ? (
                    <OutfitPlan
                      location={message.weatherData.location}
                      weather={message.weatherData.weather}
                      recommendation={message.weatherData.recommendation}
                    />
                  ) : (
                    <div className="max-w-md mx-auto text-center">
                      <p className="text-muted-foreground">{message.content}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Show map during loading (skeleton) or when coordinates are known */}
        {(isProcessing || previewCoords) && (
          <div className=" mt-5 mb-10">
            <MapPreview
              coordinates={previewCoords || undefined}
              isLoading={isLocating || isProcessing}
            />
          </div>
        )}

        {isProcessing && <StepLoader currentStep={currentStep} />}
        {!isProcessing && (
          <div className="max-w-2xl mx-auto">
            {/* Browser compatibility disclaimer */}
            <BrowserSpeechDisclaimer language={language} />
            <div className="flex items-center gap-3 bg-card border border-border rounded-lg p-3 shadow-md">
              <Textarea
                ref={textareaRef as any}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onInput={autosizeTextarea}
                placeholder={t("inputPlaceholder")}
                autoFocus
                rows={1}
                className="border-0 bg-transparent focus-visible:ring-0 text-card-foreground placeholder:text-muted-foreground max-h-48 overflow-y-auto"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (!isProcessing) handleSendMessage();
                  }
                }}
                disabled={isProcessing}
              />
              {useFallback ? (
                <MicButtonFallback
                  onTranscript={handleVoiceInput}
                  isListening={isListening}
                  setIsListening={setIsListening}
                  disabled={isProcessing}
                />
              ) : (
                <MicButton
                  onTranscript={handleVoiceInput}
                  onInterimTranscript={handleInterimVoiceInput}
                  isListening={isListening}
                  setIsListening={setIsListening}
                  disabled={isProcessing}
                />
              )}
              <Button
                onClick={handleSendMessage}
                size="icon"
                disabled={isProcessing || !inputValue.trim()}
                className="rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50">
                <Send className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              <Button
                onClick={() => setInputValue(t("exampleQuery1"))}
                className="px-3 py-1 bg-secondary text-secondary-foreground text-sm rounded-md hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isProcessing}>
                {t("exampleQuery1")}
              </Button>
              <Button
                onClick={() => setInputValue(t("exampleQuery2"))}
                className="px-3 py-1 bg-secondary text-secondary-foreground text-sm rounded-md hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isProcessing}>
                {t("exampleQuery2")}
              </Button>
              <Button
                onClick={() => setInputValue(t("exampleQuery3"))}
                className="px-3 py-1 bg-secondary text-secondary-foreground text-sm rounded-md hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isProcessing}>
                {t("exampleQuery3")}
              </Button>
            </div>
          </div>
        )}
      </div>

      <Toaster />
    </div>
  );
}
