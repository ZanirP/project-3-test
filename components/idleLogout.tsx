"use client";

import { signOut } from "next-auth/react";
import { useEffect } from "react";

export default function IdleLogout() {
    // Set your timeout time here:
    const INACTIVITY_TIME = 5 * 60 * 1000; // 5 minutes

    useEffect(() => {
        let timer: NodeJS.Timeout;

        const resetTimer = () => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                signOut({ callbackUrl: "/loginPage" });
            }, INACTIVITY_TIME);
        };

        // Activity listeners
        window.addEventListener("mousemove", resetTimer);
        window.addEventListener("keydown", resetTimer);
        window.addEventListener("click", resetTimer);
        window.addEventListener("touchstart", resetTimer);

        resetTimer(); // start timer immediately

        // Cleanup
        return () => {
            window.removeEventListener("mousemove", resetTimer);
            window.removeEventListener("keydown", resetTimer);
            window.removeEventListener("click", resetTimer);
            window.removeEventListener("touchstart", resetTimer);
            clearTimeout(timer);
        };
    }, []);

    return null;
}
