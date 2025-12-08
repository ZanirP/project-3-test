"use client";

import { SessionProvider } from "next-auth/react";
import { AccessibilityProvider } from "@/contexts/AccessibilityContext";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <AccessibilityProvider>
            <SessionProvider>{children}</SessionProvider>
        </AccessibilityProvider>
    );
}
