"use client";

import { useRouter } from "next/navigation";

export default function KitchenButton() {
    const router = useRouter();

    const goToKitchen = () => {
        router.push("/KitchenPage");
    };

    return (
        <button
            onClick={goToKitchen}
            className="
        fixed bottom-20 right-6   /* sits above the logout button */
        flex items-center gap-2
        rounded-full border border-zinc-300
        bg-white px-4 py-2 text-sm font-medium text-zinc-700
        shadow-md backdrop-blur-sm
        transition hover:bg-zinc-100 active:scale-95
        dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800
      "
        >
            {/* kitchen icon (inline SVG of utensils) */}
            <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                className="h-4 w-4"
            >
                <path d="M4 3v7a2 2 0 0 0 2 2h1v9" />
                <path d="M10 3v18" />
                <path d="M14 3h5l-1 9h-3l-1-9z" />
            </svg>
            Kitchen
        </button>
    );
}
