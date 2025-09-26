"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Loader2, Pause } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/context/language-context";
import { TranscriptDisplay } from "./mic-button";

interface MicButtonFallbackProps {
  onTranscript: (transcript: string) => void;
  isListening: boolean;
  setIsListening: (listening: boolean) => void;
  disabled: boolean;
}

export default function MicButtonFallback({
  onTranscript,
  isListening,
  setIsListening,
  disabled,
}: MicButtonFallbackProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [mediaSupported] = useState(
    typeof window !== "undefined" &&
      !!(window.navigator.mediaDevices && window.MediaRecorder)
  );
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { language } = useLanguage();

  const startRecording = async () => {
    if (!mediaSupported) {
      toast(
        language === "en"
          ? "This browser does not support audio recording."
          : "このブラウザは音声録音に対応していません。"
      );
      return;
    }
    setIsProcessing(false);
    setIsListening(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      mediaRecorder.onstop = async () => {
        setIsListening(false);
        setIsProcessing(true);
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        try {
          const formData = new FormData();
          formData.append("audio", audioBlob, "recording.webm");
          formData.append("language", language);
          const res = await fetch("/api/transcribe", {
            method: "POST",
            body: formData,
          });
          if (!res.ok) throw new Error("Transcription failed");
          const data = await res.json();
          if (data.transcript) {
            onTranscript(data.transcript);
          } else {
            toast(
              language === "en"
                ? "Could not transcribe audio."
                : "音声を認識できませんでした。"
            );
          }
        } catch (err) {
          toast(
            language === "en" ? "Transcription error." : "音声認識エラー。"
          );
          console.error(err);
        } finally {
          setIsProcessing(false);
        }
      };
      mediaRecorder.start();
    } catch (err) {
      console.error(err);
      setIsListening(false);
      toast(
        language === "en"
          ? "Microphone access denied."
          : "マイクへのアクセスが拒否されました。"
      );
    }
  };

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
    }
  };

  const toggleRecording = () => {
    if (isListening) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  if (!mediaSupported) return null;

  return (
    <div className="relative flex flex-col items-center group">
      <TranscriptDisplay isListening={isListening} language={language} />
      {/* Tooltip (placed above the button for visibility) */}
      {!isListening && (
        <span
          className="pointer-events-none mb-2 absolute -top-9 left-1/2 -translate-x-1/2 z-30 whitespace-nowrap rounded bg-black px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg"
          style={{ minWidth: "120px" }}>
          {language === "en" ? "Ask in English" : "英語で尋ねる"}
        </span>
      )}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={toggleRecording}
        disabled={isProcessing || disabled}
        className={`
          relative rounded-full w-12 h-12 transition-all duration-300
          ${
            isListening
              ? "bg-red-500/20 text-red-600 hover:bg-red-500/30 border-2 border-red-500/50 shadow-lg shadow-red-500/25"
              : isProcessing
              ? "bg-blue-500/20 text-blue-600 border-2 border-blue-500/50"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground border-2 border-transparent hover:border-accent/50"
          }
        `}
        aria-label={
          language === "en" ? "Speak in English" : "日本語で話してください"
        }>
        <div className="relative z-10">
          {isProcessing ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : isListening ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Mic className="h-5 w-5" />
          )}
        </div>
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
