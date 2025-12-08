"use client";

import { useEffect } from "react";

declare global {
    interface Window {
        googleTranslateElementInit?: () => void;
        google?: any;
    }
}

// module-level flag so it survives re-renders and re-mounts
let googleTranslateLoaded = false;

export default function GoogleTranslate() {
    useEffect(() => {
        // If we've already loaded Google Translate, do nothing
        if (googleTranslateLoaded) return;
        googleTranslateLoaded = true;

        // Define the callback Google will call when their script is ready
        window.googleTranslateElementInit = () => {
            if (window.google && window.google.translate) {
                new window.google.translate.TranslateElement(
                    {
                        pageLanguage: "en",
                        includedLanguages: "en,es,ar",
                        // layout: window.google.translate.TranslateElement.InlineLayout.HORIZONTAL,
                    },
                    "google_translate_element",
                );
            }
        };

        // If the script is already present (e.g., hot reload), don't add another
        if (
            !document.querySelector(
                'script[src*="translate.google.com/translate_a/element.js"]',
            )
        ) {
            const script = document.createElement("script");
            script.src =
                "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
            script.async = true;
            document.body.appendChild(script);
        }
    }, []);

    return <div id="google_translate_element" />;
}
