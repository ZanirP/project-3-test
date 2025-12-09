"use client";

import React, { useEffect, useState } from "react";
import type { Order, OrderStatus, MenuItem } from "@/lib/models";
import LogoutButton from "@/components/LogoutButton";

interface KitchenOrderCardProps {
    order: Order;
    isUpdating: boolean;
    onAdvance: () => void;
}

const KitchenOrderCard: React.FC<KitchenOrderCardProps> = ({
    order,
    isUpdating,
    onAdvance,
}) => {
    const getButtonLabel = (status: OrderStatus): string => {
        if (status === "not_working_on") return "Start Order";
        if (status === "working") return "Mark as Completed";
        return "Completed";
    };

    const disabled = isUpdating || order.order_status === "completed";
    const placedTime = new Date(order.placed_at);

    // Group items by id to show quantity
    const grouped = order.items.reduce(
        (acc, item) => {
            const key = item.id;
            if (!acc[key]) {
                acc[key] = { item, qty: 0 };
            }
            acc[key].qty += 1;
            return acc;
        },
        {} as Record<number, { item: MenuItem; qty: number }>,
    );

    const groupedItems = Object.values(grouped);

    return (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 shadow-md flex flex-col gap-3">
            {/* Header: Order, Time, Payment */}
            <div className="flex items-baseline justify-between gap-2">
                <div>
                    <h2 className="text-lg font-semibold text-white">
                        Order #{order.id}
                    </h2>
                    <p className="text-xs text-neutral-400">
                        {placedTime.toLocaleTimeString(undefined, {
                            hour: "2-digit",
                            minute: "2-digit",
                        })}
                    </p>
                </div>

                <div className="text-right">
                    <p className="text-[11px] uppercase tracking-wide text-neutral-400">
                        {order.payment_method}
                    </p>
                    <p className="text-xs text-neutral-500">
                        Employee #{order.employee_id}
                    </p>
                </div>
            </div>

            {/* Items list */}
            <div>
                <p className="text-xs uppercase tracking-wide text-neutral-500 mb-1">
                    Items ({groupedItems.length})
                </p>
                <ul className="max-h-32 overflow-y-auto pr-1 space-y-1 text-sm text-neutral-100">
                    {groupedItems.map(({ item, qty }) => (
                        <li key={item.id} className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                                {item.image_url && (
                                    <img
                                        src={item.image_url}
                                        alt={item.name}
                                        className="w-8 h-8 rounded object-cover"
                                    />
                                )}
                                <span>
                                    {item.name}
                                    {qty > 1 && (
                                        <span className="text-xs text-neutral-400">
                                            {" "}
                                            × {qty}
                                        </span>
                                    )}
                                </span>
                                <span className="ml-auto text-xs text-neutral-400">
                                    ${item.cost.toFixed(2)}
                                </span>
                            </div>

                            {/* Customizations / ingredients */}
                            {item.ingredients &&
                                item.ingredients.length > 0 && (
                                    <p className="text-[11px] text-neutral-400 ml-10">
                                        {item.ingredients
                                            .map(
                                                (ing) =>
                                                    `${ing.name} x${ing.servings}`,
                                            )
                                            .join(" • ")}
                                    </p>
                                )}
                        </li>
                    ))}
                </ul>
            </div>

            {/* Total */}
            <div className="flex items-baseline justify-between">
                <span className="text-xs uppercase tracking-wide text-neutral-500">
                    Total
                </span>
                <span className="text-xl font-semibold text-emerald-300">
                    ${order.cost.toFixed(2)}
                </span>
            </div>

            {/* Status + Action */}
            <div className="mt-2 flex items-center justify-between gap-2">
                <span className="inline-flex items-center rounded-full border border-neutral-700 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-neutral-300">
                    {order.order_status}
                </span>

                <button
                    disabled={disabled}
                    onClick={onAdvance}
                    className={`rounded-full px-4 py-1.5 text-xs font-semibold transition 
            ${
                order.order_status === "completed"
                    ? "bg-emerald-700/40 text-emerald-300 cursor-default"
                    : "bg-amber-500 text-black hover:bg-amber-400 disabled:opacity-60 disabled:cursor-wait"
            }`}
                >
                    {isUpdating
                        ? "Updating..."
                        : getButtonLabel(order.order_status)}
                </button>
            </div>
        </div>
    );
};

export default function KitchenPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<number | null>(null);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                // adjust query param name if your API expects something else
                const res = await fetch(
                    "/api/orders?order_status=not_working_on",
                );
                if (!res.ok) throw new Error("Failed to fetch orders");
                const data: Order[] = await res.json();
                setOrders(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, []);

    const getNextStatus = (status: OrderStatus): OrderStatus => {
        if (status === "not_working_on") return "working";
        if (status === "working") return "completed";
        return "completed";
    };

    const handleAdvanceStatus = async (order: Order) => {
        const nextStatus = getNextStatus(order.order_status);
        setUpdatingId(order.id);

        try {
            const res = await fetch(`/api/orders/${order.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ order_status: nextStatus }),
            });

            if (!res.ok) {
                console.error(
                    "Failed to update order status",
                    await res.json(),
                );
                return;
            }

            const updated = await res.json(); // updated order from DB

            // Update status in UI using what DB says
            setOrders((prev) =>
                prev
                    .map((o) =>
                        o.id === order.id
                            ? { ...o, order_status: updated.order_status }
                            : o,
                    )
                    // remove only when completed
                    .filter(
                        (o) =>
                            !(
                                o.id === order.id &&
                                updated.order_status === "completed"
                            ),
                    ),
            );
        } catch (err) {
            console.error(err);
        } finally {
            setUpdatingId(null);
        }
    };

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col">
            {/* Top bar */}
            <div className="w-full h-10 bg-neutral-800 text-gray-100 flex items-center justify-center text-sm tracking-[0.2em] uppercase">
                KITCHEN PAGE
            </div>

            <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-6">
                {/* Header */}
                <div className="mb-4 flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-semibold">
                            Incoming Orders
                        </h1>
                        <p className="text-sm text-neutral-400">
                            Showing orders with status{" "}
                            <span className="font-mono">not_working_on</span>
                        </p>
                    </div>
                    <div className="text-sm text-neutral-300">
                        {loading
                            ? "Loading..."
                            : `${orders.length} order(s) in queue`}
                    </div>
                </div>

                {/* Grid */}
                {orders.length === 0 && !loading ? (
                    <div className="mt-10 text-center text-neutral-400">
                        No new orders right now.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {orders.map((order) => (
                            <KitchenOrderCard
                                key={order.id}
                                order={order}
                                isUpdating={updatingId === order.id}
                                onAdvance={() => handleAdvanceStatus(order)}
                            />
                        ))}
                    </div>
                )}
            </main>
            <LogoutButton />
        </div>
    );
}
