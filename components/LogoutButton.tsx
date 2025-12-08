"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
    const handleLogout = async () => {
        await signOut({ redirect: false });

        const iframe = document.createElement("iframe");
        iframe.style.display = "none";
        iframe.src = "https://accounts.google.com/Logout";

        document.body.appendChild(iframe);

        setTimeout(() => {
            window.location.href = "/";
        }, 800);
    };

    return (
        <button
            onClick={handleLogout}
            className="
        fixed bottom-6 right-6
        flex items-center gap-2
        rounded-full border border-zinc-300
        bg-white px-4 py-2 text-sm font-medium text-zinc-700
        shadow-md backdrop-blur-sm
        transition hover:bg-zinc-100 active:scale-95
        dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800
      "
        >
            {/* logout icon (inline SVG) */}
            <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                className="h-4 w-4"
            >
                <path d="M15 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h9" />
                <polyline points="10 17 15 12 10 7" />
            </svg>
            Logout
        </button>
    );
}
