"use client";

type SpeechRecognitionConstructor = new () => SpeechRecognition;

declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor;
    webkitSpeechRecognition: SpeechRecognitionConstructor;
  }
}

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/context/language-context";

interface MicButtonProps {
  onTranscript: (transcript: string) => void;
  onInterimTranscript?: (transcript: string) => void;
  isListening: boolean;
  setIsListening: (listening: boolean) => void;
  disabled: boolean;
}

export default function MicButton({
  onTranscript,
  onInterimTranscript,
  isListening,
  setIsListening,
  disabled,
}: MicButtonProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const recognitionRef = useRef<any>(null);
  const { language, t } = useLanguage();

  useEffect(() => {
    // Check if speech recognition is supported
    if (typeof window === "undefined") {
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSupported(true);
      recognitionRef.current = new SpeechRecognition();

      recognitionRef.current.lang = language === "en" ? "en-US" : "ja-JP";
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.maxAlternatives = 1;

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setIsProcessing(false);
      };

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        setInterimTranscript(interimTranscript || finalTranscript);

        if (interimTranscript && onInterimTranscript) {
          onInterimTranscript(interimTranscript);
        }

        if (finalTranscript) {
          setIsListening(false);
          setIsProcessing(true);
          if (onInterimTranscript) {
            onInterimTranscript("");
          }
          onTranscript(finalTranscript);
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        setIsProcessing(false);
        if (onInterimTranscript) {
          onInterimTranscript("");
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
        setIsProcessing(false);

        let errorMessage =
          language === "en"
            ? "Speech recognition error occurred"
            : "音声認識エラーが発生しました";

        switch (event.error) {
          case "no-speech":
            errorMessage =
              language === "en"
                ? "No speech detected. Please try again."
                : "音声が検出されませんでした。もう一度お試しください。";
            break;
          case "audio-capture":
            errorMessage =
              language === "en"
                ? "Cannot access microphone. Please check permissions."
                : "マイクにアクセスできません。権限を確認してください。";
            break;
          case "not-allowed":
            errorMessage =
              language === "en"
                ? "Microphone access not permitted."
                : "マイクの使用が許可されていません。";
            break;
          case "network":
            errorMessage =
              language === "en"
                ? "Network error. Please check your connection."
                : "ネットワークエラー。接続を確認してください。";
            break;
        }

        toast(
          (language === "en"
            ? "Speech Recognition Error: "
            : "音声認識エラー: ") + errorMessage
        );
      };
    } else {
      toast(
        language === "en"
          ? "Unsupported Browser: This browser does not support speech recognition. Please use Chrome."
          : "非対応ブラウザ: このブラウザは音声認識に対応していません。Chrome をお使いください。"
      );
    }
  }, [onTranscript, setIsListening, toast, language, t]);

  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = language === "en" ? "en-US" : "ja-JP";
    }
  }, [language]);

  const toggleListening = () => {
    if (!isSupported || !recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error("Failed to start speech recognition:", error);
        toast(
          (language === "en"
            ? "Speech Recognition Start Error: "
            : "音声認識開始エラー: ") +
            (language === "en"
              ? "Failed to start speech recognition."
              : "音声認識を開始できませんでした。")
        );
      }
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <div className="relative">
      {/* Real-time transcript display */}
      <TranscriptDisplay isListening={isListening} language={language} />

      {/* Enhanced mic button */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={toggleListening}
        disabled={isProcessing || disabled}
        className={`
          relative rounded-full w-12 h-12 transition-all duration-300 overflow-hidden
          ${
            isListening
              ? "bg-red-500/20 text-red-600 hover:bg-red-500/30 border-2 border-red-500/50 shadow-lg shadow-red-500/25"
              : isProcessing
              ? "bg-blue-500/20 text-blue-600 border-2 border-blue-500/50"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground border-2 border-transparent hover:border-accent/50"
          }
        `}>
        {/* Pulsing background effect when listening */}
        {isListening && (
          <div className="absolute inset-0 bg-red-500/10 rounded-full animate-ping" />
        )}

        {/* Main icon */}
        <div className="relative z-10">
          {isProcessing ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : isListening ? (
            <MicOff className="h-5 w-5" />
          ) : (
            <Mic className="h-5 w-5" />
          )}
        </div>

        {/* Glowing ring effect when active */}
        {(isListening || isProcessing) && (
          <div
            className={`
            absolute inset-0 rounded-full animate-pulse
            ${
              isListening
                ? "ring-2 ring-red-500/50 ring-offset-2 ring-offset-background"
                : "ring-2 ring-blue-500/50 ring-offset-2 ring-offset-background"
            }
          `}
          />
        )}
      </Button>
    </div>
  );
}

// Sound wave animation component
const SoundWave = ({ isListening }: { isListening: boolean }) => {
  return (
    <div className="flex items-center justify-center gap-1">
      {[...Array(15)].map((_, i) => (
        <div
          key={i}
          className={`bg-current rounded-full transition-all duration-150 ${
            isListening ? "animate-pulse" : "opacity-30"
          }`}
          style={{
            width: "2px",
            height: isListening
              ? `${8 + Math.sin(Date.now() * 0.01 + i) * 4}px`
              : "4px",
            animationDelay: `${i * 100}ms`,
            animationDuration: `${600 + i * 100}ms`,
          }}
        />
      ))}
    </div>
  );
};

// Real-time transcript display component
const TranscriptDisplay = ({
  isListening,
  language,
}: {
  isListening: boolean;
  language: string;
}) => {
  if (!isListening) return null;
  return (
    <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-background/95 backdrop-blur-sm border rounded-lg px-1 py-2 shadow-lg min-w-38 max-w-80">
      <div className=" flex flex-col items-center">
        <div className="text-xs text-muted-foreground mb-1">
          {language === "en" ? "Listening" : "聞いています"}
        </div>
        {/* Sound wave animation overlay when listening */}
        {isListening && <SoundWave isListening={isListening} />}
      </div>
    </div>
  );
};
