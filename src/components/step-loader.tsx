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
            <div key={index} className="flex items-center gap-3">
              <div className="flex-shrink-0">
                {index < currentStep ? (
                  <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center step-complete">
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </div>
                ) : index === currentStep ? (
                  <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                    <Loader2 className="w-3 h-3 text-primary-foreground animate-spin" />
                  </div>
                ) : (
                  <div className="w-5 h-5 bg-muted rounded-full" />
                )}
              </div>
              <span
                className={`text-sm ${
                  index <= currentStep
                    ? "text-foreground"
                    : "text-muted-foreground"
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
