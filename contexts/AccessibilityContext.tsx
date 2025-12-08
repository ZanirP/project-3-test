"use client";

import React, { createContext, useContext, useMemo, useState } from "react";

type AccessibilityContextValue = {
    isHighContrast: boolean;
    setIsHighContrast: React.Dispatch<React.SetStateAction<boolean>>;
    textMultipler: number;
    setTextMultipler: React.Dispatch<React.SetStateAction<number>>;
    isZoom: boolean;
    setIsZoom: React.Dispatch<React.SetStateAction<boolean>>;
};

const AccessibilityContext = createContext<
    AccessibilityContextValue | undefined
>(undefined);

export function AccessibilityProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isHighContrast, setIsHighContrast] = useState<boolean>(false);
    const [isZoom, setIsZoom] = useState<boolean>(false);
    const [textMultipler, setTextMultipler] = useState<number>(1);

    const value = useMemo(
        () => ({
            isHighContrast,
            setIsHighContrast,
            textMultipler,
            setTextMultipler,
            isZoom,
            setIsZoom,
        }),
        [isHighContrast, textMultipler, isZoom],
    );

    return (
        <AccessibilityContext.Provider value={value}>
            {children}
        </AccessibilityContext.Provider>
    );
}

export function useAccessibility() {
    const context = useContext(AccessibilityContext);
    if (!context) {
        throw new Error(
            "useAccessibility must be used within an AccessibilityProvider",
        );
    }
    return context;
}
