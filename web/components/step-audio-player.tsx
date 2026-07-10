"use client";

import {
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Square,
  Volume2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { normalizeLanguage, type LanguageCode } from "@/lib/i18n";

type PlaybackState = "idle" | "playing" | "paused";

const audioCopy: Record<
  LanguageCode,
  {
    listen: string;
    pause: string;
    resume: string;
    stop: string;
    previous: string;
    next: string;
    unsupported: string;
    stepLabel: string;
    status: (current: number, total: number) => string;
  }
> = {
  en: {
    listen: "Listen to all steps",
    pause: "Pause",
    resume: "Resume",
    stop: "Stop",
    previous: "Previous",
    next: "Next",
    unsupported: "Audio reading is not available in this browser.",
    stepLabel: "Step",
    status: (current, total) => `Step ${current} of ${total}`,
  },
  "zh-Hans": {
    listen: "朗读全部步骤",
    pause: "暂停",
    resume: "继续",
    stop: "停止",
    previous: "上一步",
    next: "下一步",
    unsupported: "这个浏览器暂时不支持朗读功能。",
    stepLabel: "第",
    status: (current, total) => `第 ${current} / ${total} 步`,
  },
  "zh-Hant": {
    listen: "朗讀全部步驟",
    pause: "暫停",
    resume: "繼續",
    stop: "停止",
    previous: "上一步",
    next: "下一步",
    unsupported: "這個瀏覽器暫時不支援朗讀功能。",
    stepLabel: "第",
    status: (current, total) => `第 ${current} / ${total} 步`,
  },
  es: {
    listen: "Escuchar todos los pasos",
    pause: "Pausar",
    resume: "Continuar",
    stop: "Detener",
    previous: "Anterior",
    next: "Siguiente",
    unsupported: "La lectura de audio no está disponible en este navegador.",
    stepLabel: "Paso",
    status: (current, total) => `Paso ${current} de ${total}`,
  },
};

const speechLanguageByCode: Record<LanguageCode, string> = {
  en: "en-US",
  "zh-Hans": "zh-CN",
  "zh-Hant": "zh-TW",
  es: "es-ES",
};

function getStepSpeechText(step: string, index: number, language: LanguageCode) {
  if (language === "zh-Hans" || language === "zh-Hant") {
    return `第 ${index + 1} 步。${step}`;
  }

  if (language === "es") {
    return `Paso ${index + 1}. ${step}`;
  }

  return `Step ${index + 1}. ${step}`;
}

export function StepAudioPlayer({
  steps,
  language,
  className,
}: {
  steps: string[];
  language: string | null | undefined;
  className?: string;
}) {
  const normalizedLanguage = normalizeLanguage(language);
  const copy = audioCopy[normalizedLanguage];
  const speechLanguage = speechLanguageByCode[normalizedLanguage];
  const cleanSteps = useMemo(
    () => steps.map((step) => step.trim()).filter(Boolean),
    [steps],
  );
  const [isSupported, setIsSupported] = useState(true);
  const [playbackState, setPlaybackState] = useState<PlaybackState>("idle");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const tokenRef = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setIsSupported(false);
      return;
    }

    const loadVoices = () => setVoices(window.speechSynthesis.getVoices());
    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);

    return () => {
      tokenRef.current += 1;
      window.speechSynthesis.cancel();
      window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
    };
  }, []);

  useEffect(() => {
    tokenRef.current += 1;
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setPlaybackState("idle");
    setCurrentIndex(0);
  }, [cleanSteps, speechLanguage]);

  const selectedVoice = useMemo(() => {
    const exactMatch = voices.find((voice) => voice.lang === speechLanguage);

    if (exactMatch) {
      return exactMatch;
    }

    return voices.find((voice) =>
      voice.lang.toLowerCase().startsWith(speechLanguage.slice(0, 2)),
    );
  }, [speechLanguage, voices]);

  function speakStep(index: number) {
    if (
      typeof window === "undefined" ||
      !("speechSynthesis" in window) ||
      cleanSteps.length === 0
    ) {
      return;
    }

    const boundedIndex = Math.min(Math.max(index, 0), cleanSteps.length - 1);
    tokenRef.current += 1;
    const token = tokenRef.current;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(
      getStepSpeechText(cleanSteps[boundedIndex], boundedIndex, normalizedLanguage),
    );
    utterance.lang = speechLanguage;
    utterance.rate = 0.86;
    utterance.pitch = 1;
    utterance.volume = 1;

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.onend = () => {
      if (tokenRef.current !== token) {
        return;
      }

      if (boundedIndex < cleanSteps.length - 1) {
        speakStep(boundedIndex + 1);
        return;
      }

      setPlaybackState("idle");
      setCurrentIndex(0);
    };

    utterance.onerror = () => {
      if (tokenRef.current !== token) {
        return;
      }

      setPlaybackState("idle");
    };

    setCurrentIndex(boundedIndex);
    setPlaybackState("playing");
    window.speechSynthesis.speak(utterance);
  }

  function pause() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    window.speechSynthesis.pause();
    setPlaybackState("paused");
  }

  function resume() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    window.speechSynthesis.resume();
    setPlaybackState("playing");
  }

  function stop() {
    tokenRef.current += 1;
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setPlaybackState("idle");
    setCurrentIndex(0);
  }

  if (cleanSteps.length === 0) {
    return null;
  }

  if (!isSupported) {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        {copy.unsupported}
      </p>
    );
  }

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border/70 bg-background/70 p-2 shadow-sm">
        {playbackState === "idle" ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={() => speakStep(0)}
          >
            <Volume2 className="size-4" />
            {copy.listen}
          </Button>
        ) : (
          <>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="rounded-xl"
              onClick={() => speakStep(currentIndex - 1)}
              disabled={currentIndex === 0}
              aria-label={copy.previous}
              title={copy.previous}
            >
              <SkipBack className="size-4" />
            </Button>
            {playbackState === "playing" ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl"
                onClick={pause}
              >
                <Pause className="size-4" />
                {copy.pause}
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl"
                onClick={resume}
              >
                <Play className="size-4" />
                {copy.resume}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="rounded-xl"
              onClick={() => speakStep(currentIndex + 1)}
              disabled={currentIndex >= cleanSteps.length - 1}
              aria-label={copy.next}
              title={copy.next}
            >
              <SkipForward className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-xl"
              onClick={stop}
              aria-label={copy.stop}
              title={copy.stop}
            >
              <Square className="size-4" />
            </Button>
            <span className="text-xs font-medium text-muted-foreground">
              {copy.status(currentIndex + 1, cleanSteps.length)}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
