"use client";

import { useState, useEffect, useMemo } from "react";
import TopNav from "@/components/TopNav";
import { CupSoda } from "lucide-react";
import { MenuItem, Category } from "@/lib/models";

interface MenuData {
    [categoryName: string]: MenuItem[];
}

const emptyMenuData: MenuData = {};

const CATEGORY_ORDER = [
    "Fruit Tea",
    "Ice Blended",
    "Milky",
    "Non Caffenated",
    "Fall Seasonals",
    "Uncategorized",
] as const;

type CategoryName = (typeof CATEGORY_ORDER)[number];

function CategoryPills({
    categories,
    selected,
}: {
    categories: CategoryName[];
    selected: CategoryName;
}) {
    return (
        <div className="flex gap-3 overflow-x-auto pb-2 px-1">
            {categories.map((c) => (
                <div
                    key={c}
                    className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold border
                        transition-all cursor-default
                        ${
                            selected === c
                                ? "bg-[#9d8189] text-white border-transparent shadow-md"
                                : "bg-white/70 text-[#4d4a55] border-[#e5c2cf]"
                        }`}
                >
                    {c}
                </div>
            ))}
        </div>
    );
}

function DrinkCard({ item }: { item: MenuItem }) {
    const hasImage = item.image_url && item.image_url.trim() !== "";

    return (
        <div className="group rounded-2xl bg-white/80 shadow-md hover:shadow-xl transition transform hover:-translate-y-1 flex flex-col overflow-hidden border border-[#f1c4d8]">
            <div className="relative w-full aspect-[4/3] bg-[#ffe5f1] flex items-center justify-center">
                {hasImage && item.image_url ? (
                    <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <CupSoda className="w-16 h-16 text-[#c48ca4]" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/5 to-transparent opacity-0 group-hover:opacity-100 transition" />
                <div className="absolute bottom-2 left-3 right-3 flex justify-between items-end text-black drop-shadow">
                    <p className="font-semibold text-lg">{item.name}</p>
                    <p className="font-bold text-xl">${item.cost.toFixed(2)}</p>
                </div>
            </div>
            <div className="px-4 py-3 flex items-center justify-between text-sm text-[#6d6875]">
                <span>Signature Drink</span>
            </div>
        </div>
    );
}

export default function MenuBoardPage() {
    const [selectedCategory, setSelectedCategory] = useState<CategoryName>(
        CATEGORY_ORDER[0],
    );

    const [menuData, setMenuData] = useState<MenuData>(emptyMenuData);
    const [menuDataReady, setMenuDataReady] = useState<boolean>(false);

    const loadMenuData = async () => {
        try {
            setMenuDataReady(false);
            setMenuData({});
            console.log("loading menu");
            const catRes = await fetch("/api/cashier/categories", {
                method: "GET",
                headers: { "Content-Type": "application/json" },
            });
            if (!catRes.ok) {
                throw new Error(`GET /api/cashier/categories ${catRes.status}`);
            }
            const cats: Category[] = await catRes.json();

            const entries = await Promise.all(
                cats.map(async (cat) => {
                    const queryRes = await fetch(
                        "/api/cashier/menu_by_category",
                        {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ id: cat.id }),
                        },
                    );

                    if (!queryRes.ok) {
                        throw new Error(
                            `POST /api/cashier/menu_by_category ${queryRes.status}`,
                        );
                    }

                    const items: MenuItem[] = await queryRes.json();
                    return [cat.name, items] as const;
                }),
            );
            setMenuData(Object.fromEntries(entries));
        } catch (err) {
            console.error("Failed to load menu data:", err);
        } finally {
            setMenuDataReady(true);
        }

        console.log("done");
    };

    useEffect(() => {
        loadMenuData();
    }, []);

    // Only show categories that actually have items, in the fixed order
    const categories = useMemo<CategoryName[]>(
        () =>
            CATEGORY_ORDER.filter(
                (c) => menuData[c] && menuData[c].length > 0,
            ) as CategoryName[],
        [menuData],
    );

    // Auto-rotate categories every 8 seconds once data is ready
    useEffect(() => {
        if (!menuDataReady || categories.length === 0) return;

        const interval = setInterval(() => {
            setSelectedCategory((prev) => {
                const idx = categories.indexOf(prev);
                const nextIdx = idx === -1 ? 0 : (idx + 1) % categories.length;
                return categories[nextIdx];
            });
        }, 5000); // 5 seconds per category

        return () => clearInterval(interval);
    }, [menuDataReady, categories]);

    const drinksToShow = menuData[selectedCategory] ?? [];

    return (
        <div className="min-h-screen bg-[#ffddd233] dark:bg-black font-sans flex flex-col">
            <TopNav subtitle="Menu Board" />

            <main className="flex-1 px-6 py-4 flex flex-col">
                <div className="mx-auto w-full max-w-6xl flex flex-col gap-4">
                    {/* Header row */}
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#6d6875]">
                                Our Drinks
                            </h1>
                            <p className="text-sm sm:text-base text-[#7f7a86] mt-1">
                                Full Menu
                            </p>
                        </div>
                    </div>

                    {/* Category pills (non-interactive) */}
                    {menuDataReady && categories.length > 0 && (
                        <div className="mt-2">
                            <CategoryPills
                                categories={categories}
                                selected={selectedCategory}
                            />
                        </div>
                    )}

                    {/* Category label */}
                    <div className="flex items-center justify-between mt-4">
                        <h2 className="text-2xl font-bold text-[#6d6875]">
                            {selectedCategory}
                        </h2>
                        <div className="h-px flex-1 mx-4 bg-gradient-to-r from-[#f4acb7] to-transparent" />
                    </div>

                    {/* Drinks grid */}
                    <div className="mt-4 grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                        {drinksToShow.map((item) => (
                            <DrinkCard key={item.id} item={item} />
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
