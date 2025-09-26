// Utility to detect if browser is Brave, Firefox, or lacks Web Speech API
export function shouldUseMicFallback(): boolean {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent;
  const isFirefox = ua.includes("Firefox");
  const isBrave =
    (navigator as any).brave &&
    typeof (navigator as any).brave.isBrave === "function";
  const isSpeechSupported =
    "SpeechRecognition" in window || "webkitSpeechRecognition" in window;
  // Use fallback if Brave, Firefox, or no Web Speech API
  return isFirefox || isBrave || !isSpeechSupported;
}