"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

type TopNavVariant = "manager" | "cashier" | "kiosk" | "login";

interface TopNavProps {
    subtitle?: string;
    variant?: TopNavVariant;
    hideBackButton?: boolean;
}

const variantLabel: Record<TopNavVariant, string> = {
    manager: "Manager Dashboard",
    cashier: "Cashier POS",
    kiosk: "Self-Service Kiosk",
    login: "Login Page",
};

export default function TopNav({
    subtitle,
    variant = "manager",
    hideBackButton = false,
}: TopNavProps) {
    const router = useRouter();
    const { data: session } = useSession();

    return (
        <header className="sticky top-0 z-40 flex w-full items-center justify-between border-b border-zinc-200 bg-white/80 px-6 py-3 shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/80">
            {/* Left: logo + title */}
            <div className="flex items-center gap-3">
                <Image
                    src="/sharetea.png"
                    alt="ShareTea"
                    width={120}
                    height={30}
                    className="h-auto w-[120px]"
                />
                <div className="flex flex-col leading-tight">
                    <span className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                        {variantLabel[variant]}
                    </span>
                    {subtitle && (
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                            {subtitle}
                        </span>
                    )}
                </div>
            </div>

            {/* Center: current user */}
            <div className="flex flex-col item-center">
                {/* GOOGLE USER INFO — only shows when logged in with Google */}
                {session?.user?.name && (
                    <div className="flex items-center gap-2 align-center">
                        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                            {session.user.name}
                        </span>
                    </div>
                )}
            </div>

            {/* Right side: user info + Back button */}
            <div className="flex items-center gap-4">
                {!hideBackButton && (
                    <button
                        onClick={() => router.push("/")}
                        className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
                    >
                        Back to Home
                    </button>
                )}
            </div>
        </header>
    );
}
