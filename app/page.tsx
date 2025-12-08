"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Image from "next/image";
import GoogleTranslate from "@/components/GoogleTranslate";

type WeatherData = {
    daily: {
        time: string[];
        temperature_2m_max: number[];
        temperature_2m_min: number[];
    };
};

export default function Home() {
    const router = useRouter();

    // Local state for weather
    const [weather, setWeather] = useState<WeatherData | null>(null);

    useEffect(() => {
        async function loadWeather() {
            const res = await fetch("/api/weather");
            const data = await res.json();
            setWeather(data);
        }

        loadWeather();
    }, []);

    // If not loaded, show placeholder
    if (!weather) return <div>Loading...</div>;

    const days = weather.daily.time;
    const maxTemps = weather.daily.temperature_2m_max;
    const minTemps = weather.daily.temperature_2m_min;

    const recommendedDrinks = {
        cold: [
            "Oreo w/ Pearl",
            "Taro w/ Pudding",
            "Thai Tea w/ Pearl",
            "Coffee w/ Ice Cream",
            "Classic Pearl Milk Tea",
            "Honey Pearl Milk Tea",
            "Hokkaido Pearl Milk Tea",
            "Pumpkin Chai",
            "Honey and Cinnamon Milk Tea",
            "Red Bean Matcha",
        ],
        cool: [
            "Mango Green Milk Tea",
            "Coffee Creama",
            "Tiger Boba",
            "Wintermelon w/ Fresh Milk",
            "Mango w/ Ice Cream",
            "Strawberry w/ Ice Cream",
            "Halo Halo",
        ],
        warm: [
            "Mango Green Tea",
            "Peach Tea With Honey Jelly",
            "Passion Chess",
            "Mango & Passion Fruit",
            "Berry Lychee Burst",
            "Wintermelon Lemonade",
        ],
        hot: [
            "Honey Lemonade",
            "Strawberry Coconut",
            "Strawberry Coconut Ice Blended",
            "Mango & Passion Fruit",
            "Mango Green Tea",
            "Berry Lychee Burst",
            "Halo Halo",
        ],
    };

    const getDrinkForTemp = (temp: number) => {
        let category = "warm";

        if (temp < 50) category = "cold";
        else if (temp < 65) category = "cool";
        else if (temp < 80) category = "warm";
        else category = "hot";

        const drinks =
            recommendedDrinks[category as keyof typeof recommendedDrinks];
        const drink = drinks[Math.floor(Math.random() * drinks.length)];
        return { category, drink };
    };

    return (
        <div className="min-h-screen bg-zinc-50 pb-10 font-sans dark:bg-zinc-950">
            {/* NAVBAR */}
            <nav className="flex w-full items-center justify-start border-b border-zinc-200 bg-white/80 px-6 py-3 shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/70">
                <div className="flex items-center gap-3">
                    <Image
                        src="/sharetea.png"
                        alt="ShareTea"
                        width={120}
                        height={30}
                    />
                </div>
            </nav>

            <div className="flex justify-end m-4">
                <GoogleTranslate />
            </div>

            {/* PAGE CONTENT */}
            <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-10 md:flex-row md:items-center md:justify-between">
                {/* Left: Branding + intro + menu preview */}
                <section className="flex flex-1 flex-col gap-6">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                            ShareTea Ordering System
                        </h1>
                        <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                            A unified interface for staff and customers.
                            Cashiers and managers can log in to manage orders
                            and inventory, while customers can browse the
                            digital menu and place orders easily.
                        </p>
                    </div>

                    {/* Menu preview card */}
                    <div className="mt-2 rounded-2xl border border-zinc-200 bg-white/90 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/90">
                        <button
                            onClick={() => router.push("/menuBoard")}
                            className="w-full rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-zinc-800 hover:shadow-md active:translate-y-0 dark:bg-zinc-800 dark:hover:bg-zinc-700"
                        >
                            Menu Board
                        </button>
                    </div>
                </section>

                {/* Right: Action card */}
                <section className="flex flex-1 items-center justify-center">
                    <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white/95 p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-900/95">
                        <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                            Continue
                        </h2>
                        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                            Select how you want to use the system.
                        </p>

                        <div className="mt-6 flex flex-col gap-3">
                            {/* Staff login */}
                            <button
                                onClick={() => router.push("/loginPage")}
                                className="w-full rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-zinc-800 hover:shadow-md active:translate-y-0 dark:bg-zinc-800 dark:hover:bg-zinc-700"
                            >
                                Login for Cashier or Manager
                                <p className="mt-1 text-[11px] font-normal text-zinc-300 dark:text-zinc-300/90">
                                    Enter staff PIN to access POS or dashboard.
                                </p>
                            </button>

                            {/* Customer guest order */}
                            <button
                                onClick={() =>
                                    router.push("/customerOrderTest")
                                }
                                className="w-full rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-600 hover:shadow-md active:translate-y-0"
                            >
                                Customer (Guest)
                                <p className="mt-1 text-[11px] font-normal text-emerald-100/90">
                                    Browse the menu and order.
                                </p>
                            </button>

                            {/* Google sign-in */}
                            <button
                                onClick={() =>
                                    signIn("google", {
                                        callbackUrl: "/customerOrderTest",
                                    })
                                }
                                className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-900 shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-300 hover:bg-zinc-50 hover:shadow-md active:translate-y-0 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:border-zinc-600 dark:hover:bg-zinc-900"
                            >
                                Sign in with Google
                                <p className="mt-1 text-[11px] font-normal text-zinc-500 dark:text-zinc-400">
                                    Save your preferences and history.
                                </p>
                            </button>
                        </div>
                    </div>
                </section>
            </main>
            {/* Bottom: Weather widget */}
            <section className="mx-auto mt-10 w-full max-w-6xl rounded-3xl border border-zinc-200 bg-white/95 p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-900/95">
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
                    Weather & Drink Recommendations
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {days.map((day: string, index: number) => {
                        const max = maxTemps[index];
                        const min = minTemps[index];
                        const drink = getDrinkForTemp((max + min) / 2).drink;
                        return (
                            <div
                                key={day}
                                className="rounded-2xl border border-zinc-200 bg-white/80 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80"
                            >
                                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                    {new Date(day).toLocaleDateString("en-US", {
                                        weekday: "short",
                                        month: "short",
                                        day: "numeric",
                                    })}
                                </p>
                                <p className="mt-1 text-lg font-bold text-zinc-900 dark:text-zinc-50">
                                    {max}°F / {min}°F
                                </p>
                                <p className="mt-2 text-emerald-600 dark:text-emerald-400 font-medium">
                                    Recommended: {drink}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </section>
        </div>
    );
}
