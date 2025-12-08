"use client";

import React, { useState } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    CartesianGrid,
    ResponsiveContainer,
} from "recharts";

import { SalesDatum, InventoryUsageDatum } from "@/lib/models";

// data type of each row entry in restock table
type RestockRow = {
    ingredientName: string;
    stock: number;
};

export default function ReportsPage() {
    // Restock state
    const [restockData, setRestockData] = useState<RestockRow[]>([]);
    const [isRestockLoading, setIsRestockLoading] = useState(false);

    async function handleGenerateRestock() {
        try {
            setIsRestockLoading(true);
            const res = await fetch("/api/reports/restock", {
                method: "GET",
            });
            if (!res.ok) throw new Error("Failed to fetch restock report");

            const json = (await res.json()) as RestockRow[];
            setRestockData(json);
        } catch (err) {
            console.error(err);
        } finally {
            setIsRestockLoading(false);
        }
    }

    // --- Product Sales (design only, no implementation) ---
    const [salesStart, setSalesStart] = useState<string>("");
    const [salesEnd, setSalesEnd] = useState<string>("");
    const [salesData, setSalesData] = useState<SalesDatum[]>([]);
    const [isSalesLoading, setIsSalesLoading] = useState(false);

    async function handleGenerateSales() {
        if (!salesStart || !salesEnd) {
            alert("Please select both a start and end date.");
            return;
        }

        try {
            setIsSalesLoading(true);

            // lets build expected request body (considering salesStart and salesEnd should have values)
            const body = {
                startDate: salesStart || null,
                endDate: salesEnd || null,
            };

            // now we make fetch request here
            const res = await fetch("/api/reports/sales", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
            });

            // check if response is not okay. If so, throw an error.
            if (!res.ok) throw new Error("Failed to fetch sales chart.");

            // take response and make sure it converts into sales datum
            const json = (await res.json()) as SalesDatum[];

            setSalesData(json);

            console.log("Generate Product Sales report", {
                salesStart,
                salesEnd,
            });
        } catch (err) {
            console.error(err);
        } finally {
            setIsSalesLoading(false);
        }
    }

    // --- Inventory Usage (design only, no implementation) ---
    const [usageStart, setUsageStart] = useState<string>("");
    const [usageEnd, setUsageEnd] = useState<string>("");
    const [usageData, setUsageData] = useState<InventoryUsageDatum[]>([]); // no seed data
    const [isUsageLoading, setIsUsageLoading] = useState(false);

    async function handleGenerateUsage() {
        // make sure a usage start and end is provided.
        if (!usageStart || !usageEnd) {
            alert("Please select both a start and end date.");
            return;
        }

        try {
            setIsUsageLoading(true);

            // lets build expected request body (considering usageStart and uageEnd should have values)
            const body = {
                startDate: usageStart || null,
                endDate: usageEnd || null,
            };

            // now we make fetch request here
            const res = await fetch("/api/reports/usage", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
            });

            // check if response is not okay. If so, throw an error.
            if (!res.ok)
                throw new Error("Failed to fetch inventory usage chart.");

            // take response and make sure it converts into sales datum
            const json = (await res.json()) as InventoryUsageDatum[];

            setUsageData(json);

            console.log("Generate Inventory Usage report", {
                usageStart,
                usageEnd,
            });
        } catch (err) {
            console.error(err);
        } finally {
            setIsUsageLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 px-6 py-8">
            <div className="mx-auto max-w-6xl space-y-8">
                <header>
                    <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                        Reports
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        View product sales, inventory usage, and restock
                        recommendations.
                    </p>
                </header>

                {/* Top row: Product Sales + Inventory Usage */}
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Product Sales */}
                    <div className="flex flex-col rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="mb-3 flex items-center justify-between gap-3">
                            <h2 className="text-lg font-semibold text-slate-900">
                                Product Sales
                            </h2>
                        </div>
                        <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
                            <div className="flex items-center gap-2">
                                <label
                                    htmlFor="salesStart"
                                    className="text-slate-600"
                                >
                                    Start
                                </label>
                                <input
                                    id="salesStart"
                                    type="date"
                                    value={salesStart}
                                    onChange={(e) =>
                                        setSalesStart(e.target.value)
                                    }
                                    className="rounded-md border border-slate-300 px-2 py-1 text-sm shadow-sm focus:border-slate-500 focus:outline-none"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <label
                                    htmlFor="salesEnd"
                                    className="text-slate-600"
                                >
                                    End
                                </label>
                                <input
                                    id="salesEnd"
                                    type="date"
                                    value={salesEnd}
                                    onChange={(e) =>
                                        setSalesEnd(e.target.value)
                                    }
                                    className="rounded-md border border-slate-300 px-2 py-1 text-sm shadow-sm focus:border-slate-500 focus:outline-none"
                                />
                            </div>
                            <button
                                onClick={handleGenerateSales}
                                className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                            >
                                {isSalesLoading ? "Generating..." : "Generate"}
                            </button>
                        </div>

                        <div className="h-80 w-full overflow-auto rounded-md border border-slate-200 bg-slate-50">
                            <div className="min-w-[800px] h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={salesData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis
                                            dataKey="menuItem"
                                            label={{
                                                value: "Menu Item",
                                                position: "insideBottom",
                                                offset: -5,
                                            }}
                                        />
                                        <YAxis
                                            label={{
                                                value: "Sales (Dollars)",
                                                angle: -90,
                                                position: "insideLeft",
                                            }}
                                        />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="sales" name="Sales ($)" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Inventory Usage */}
                    <div className="flex flex-col rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="mb-3 flex items-center justify-between gap-3">
                            <h2 className="text-lg font-semibold text-slate-900">
                                Inventory Usage
                            </h2>
                        </div>
                        <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
                            <div className="flex items-center gap-2">
                                <label
                                    htmlFor="usageStart"
                                    className="text-slate-600"
                                >
                                    Start
                                </label>
                                <input
                                    id="usageStart"
                                    type="date"
                                    value={usageStart}
                                    onChange={(e) =>
                                        setUsageStart(e.target.value)
                                    }
                                    className="rounded-md border border-slate-300 px-2 py-1 text-sm shadow-sm focus:border-slate-500 focus:outline-none"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <label
                                    htmlFor="usageEnd"
                                    className="text-slate-600"
                                >
                                    End
                                </label>
                                <input
                                    id="usageEnd"
                                    type="date"
                                    value={usageEnd}
                                    onChange={(e) =>
                                        setUsageEnd(e.target.value)
                                    }
                                    className="rounded-md border border-slate-300 px-2 py-1 text-sm shadow-sm focus:border-slate-500 focus:outline-none"
                                />
                            </div>
                            <button
                                onClick={handleGenerateUsage}
                                className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                            >
                                {isUsageLoading ? "Generating..." : "Generate"}
                            </button>
                        </div>

                        <div className="h-80 w-full overflow-auto rounded-md border border-slate-200 bg-slate-50">
                            <div className="min-w-[800px] h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={usageData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis
                                            dataKey="ingredient"
                                            label={{
                                                value: "Ingredient",
                                                position: "insideBottom",
                                                offset: -5,
                                            }}
                                        />
                                        <YAxis
                                            label={{
                                                value: "Usage / Stock",
                                                angle: -90,
                                                position: "insideLeft",
                                            }}
                                        />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="used" name="Used" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Restock Report */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-slate-900">
                            Restock Report
                        </h2>
                        <button
                            onClick={handleGenerateRestock}
                            className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                        >
                            {isRestockLoading
                                ? "Generating..."
                                : "Generate Restock Report"}
                        </button>
                    </div>

                    <div className="overflow-x-auto rounded-md border border-slate-200 bg-white">
                        <table className="min-w-full text-left text-sm">
                            <thead className="border-b bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                                <tr>
                                    <th className="px-4 py-2">
                                        Ingredient Name
                                    </th>
                                    <th className="px-4 py-2">Stock</th>
                                </tr>
                            </thead>
                            <tbody>
                                {restockData.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={2}
                                            className="px-4 py-4 text-center text-slate-400"
                                        >
                                            No data yet. Click
                                            &quot;Generate&quot; to load the
                                            restock report.
                                        </td>
                                    </tr>
                                ) : (
                                    restockData.map((row) => (
                                        <tr
                                            key={row.ingredientName}
                                            className="border-t hover:bg-slate-50"
                                        >
                                            <td className="px-4 py-2">
                                                {row.ingredientName}
                                            </td>
                                            <td className="px-4 py-2">
                                                {row.stock}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </div>
    );
}
