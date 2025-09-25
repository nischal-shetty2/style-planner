"use client";

import { Check, Loader2 } from "lucide-react";
import { useLanguage } from "@/context/language-context";

interface StepLoaderProps {
  currentStep: number;
}

export default function StepLoader({ currentStep }: StepLoaderProps) {
  const { t } = useLanguage();

  const steps = [
    t("processingVoice"),
    t("fetchingLocation"),
    t("fetchingWeather"),
    t("generatingOutfit"),
  ];

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-card border border-border rounded-lg p-6 shadow-md">
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`flex items-center gap-3 transition-all duration-300 ${
                index < currentStep ? "scale-95 opacity-80" : ""
              }`}>
              <div className="flex-shrink-0">
                {index < currentStep ? (
                  <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center transition-all duration-300">
                    <Check className="w-2.5 h-2.5 text-primary-foreground" />
                  </div>
                ) : index === currentStep ? (
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center transition-all duration-300">
                    <Loader2 className="w-4 h-4 text-primary-foreground animate-spin" />
                  </div>
                ) : (
                  <div className="w-5 h-5 bg-muted rounded-full transition-all duration-300" />
                )}
              </div>
              <span
                className={`transition-all duration-300 ${
                  index < currentStep
                    ? "text-xs text-muted-foreground"
                    : index === currentStep
                    ? "text-base font-medium text-foreground"
                    : "text-sm text-muted-foreground"
                }`}>
                {step}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
