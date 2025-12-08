"use client";

import { Employee } from "@/lib/models";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import IdleLogout from "@/components/idleLogout";
import TopNav from "@/components/TopNav";

// TODO: replace with models.ts definitions
type LoginResponse = Pick<Employee, "id" | "name" | "is_manager">;

/**
 * Login Page Component
 * @returns
 */
export default function LoginPage() {
    const router = useRouter();
    const [pin, setPin] = useState("");
    const [loginResponse, setLoginResponse] = useState<LoginResponse | null>(
        null,
    );

    const handleClick = (num: string) => {
        if (pin.length < 4) setPin(pin + num);
    };

    const handleClear = () => setPin("");
    const handleSubmit = async () => {
        const res = await fetch("/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pin }),
        });
        if (!res.ok) {
            let errorText;
            try {
                errorText = await res.text();
            } catch (e) {
                errorText = "<no response body>";
            }
            throw Error(
                `Failed to authenticate: POST /api/login returned status ${res.status} - ${errorText}`,
            );
        }
        const data: LoginResponse = await res.json();

        setLoginResponse(data);
        setPin("");
        alert(
            `Login Successful! Welcome, ${data.name} ${data.is_manager ? "(Manager)" : ""}`,
        );
        // TODO: Redirect to correct application page

        const result = await signIn("credentials", {
            id: data.id,
            role: data.is_manager ? "manager" : "cashier",
            redirect: false,
        });

        if (result?.error) {
            alert(`Sign in error: ${result.error}`);
            return;
        }

        if (data.is_manager) {
            router.push("/managerPage");
        } else {
            // TODO: Change to orderPage when implemented
            router.push("/CashierPage");
        }
    };

    const buttons = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];

    return (
        <div className="p-6">
            <TopNav subtitle="Login Page" />
            <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
                <div className="flex flex-col items-center gap-6 rounded-lg bg-white p-8 shadow-md dark:bg-zinc-900">
                    <h1 className="text-2xl font-semibold text-black dark:text-white">
                        Enter PIN
                    </h1>

                    {/* Display entered PIN as dots */}
                    <div className="text-3xl font-mono tracking-widest text-zinc-700 dark:text-zinc-200">
                        {pin.replace(/./g, "•") || "----"}
                    </div>

                    {/* Numeric keypad */}
                    <div className="grid grid-cols-3 gap-4">
                        {buttons.slice(0, 9).map((num) => (
                            <button
                                key={num}
                                onClick={() => handleClick(num)}
                                className="h-16 w-16 rounded-md bg-gray-200 text-xl font-bold text-black shadow-sm hover:bg-gray-300 active:bg-gray-400 dark:bg-zinc-700 dark:text-white"
                            >
                                {num}
                            </button>
                        ))}
                        <div></div> {/* empty spacer */}
                        <button
                            onClick={() => handleClick("0")}
                            className="h-16 w-16 rounded-md bg-gray-200 text-xl font-bold text-black shadow-sm hover:bg-gray-300 active:bg-gray-400 dark:bg-zinc-700 dark:text-white"
                        >
                            0
                        </button>
                        <button
                            onClick={handleClear}
                            className="h-16 w-16 rounded-md bg-red-500 text-xl font-bold text-white hover:bg-red-600 active:bg-red-700"
                        >
                            C
                        </button>
                    </div>

                    <button
                        onClick={handleSubmit}
                        className="mt-6 w-32 rounded-md bg-blue-600 py-2 text-white hover:bg-blue-700"
                    >
                        Submit
                    </button>
                </div>
            </div>
        </div>
    );
}
