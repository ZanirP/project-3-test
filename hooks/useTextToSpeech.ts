"use client";

import { LargeNumberLike } from "crypto";
import { useCallback, useEffect, useState } from "react";

// options for speaking
type SpeakOptions = {
    lang?: string;
    rate?: number;
    pitch?: number;
};

export function useTextToSpeech(defaultLang: string = "en-US") {
    const [supported, setSupported] = useState(false);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [lang, setLang] = useState(defaultLang);

    // now lets load the voice we want
    useEffect(() => {
        // if the window doesn't have speech systhesis then set state of supported to false so nothing tries to run.
        if (typeof window === "undefined" || !("speechSynthesis" in window)) {
            setSupported(false);
            return;
        }

        const synth = window.speechSynthesis;

        const loadVoices = () => {
            const v = synth.getVoices();
            setVoices(v);
            setSupported(v.length > 0);
        };

        loadVoices();

        synth.onvoiceschanged = loadVoices;

        return () => {
            synth.onvoiceschanged = null;
        };
    }, []);

    const getVoiceForLang = useCallback(
        (targetLang: string) => {
            if (!voices.length) return undefined;
            // try exact match
            return (
                voices.find((v) => v.lang === targetLang) ||
                voices.find((v) =>
                    v.lang.startsWith(targetLang.split("-")[0]),
                ) ||
                voices[0]
            );
        },
        [voices],
    );

    const speak = useCallback(
        (text: string, options: SpeakOptions = {}) => {
            if (
                typeof window === "undefined" ||
                !("speechSynthesis" in window)
            ) {
                console.warn(
                    "Speech synthesis is not supported in this browser!",
                );
                return;
            }

            if (!text.trim()) return;

            const synth = window.speechSynthesis;
            synth.cancel();

            const utterance = new SpeechSynthesisUtterance(text);

            const targetLang = options.lang || lang;
            utterance.lang = targetLang;

            const voice = getVoiceForLang(targetLang);
            if (voice) utterance.voice = voice;

            utterance.rate = options.rate ?? 1;
            utterance.pitch = options.pitch ?? 1;

            synth.speak(utterance);
        },
        [lang, getVoiceForLang],
    );

    const cancel = useCallback(() => {
        if (typeof window === "undefined" || !("speechSynthesis" in window)) {
            return;
        }
        window.speechSynthesis.cancel();
    }, []);

    return {
        supported,
        speak,
        cancel,
        setLang,
        voices,
        currentLang: lang,
    };
}
