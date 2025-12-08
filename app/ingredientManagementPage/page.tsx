"use client";

import React, { useEffect, useMemo, useState } from "react";

import { Ingredient } from "@/lib/models";
import IdleLogout from "@/components/idleLogout";

const ToolbarButton: React.FC<
    React.ButtonHTMLAttributes<HTMLButtonElement>
> = ({ children, className = "", ...props }) => (
    <button
        className={`px-3 py-2 text-sm rounded-md border border-gray-300 shadow-sm hover:bg-gray-50 active:scale-[.99] ${className}`}
        {...props}
    >
        {children}
    </button>
);

const Tag: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <span className="inline-flex items-center rounded-md border border-gray-300 px-2 py-0.5 text-xs text-gray-700 bg-white">
        {children}
    </span>
);

const Th: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <th className="px-3 py-2 font-semibold text-gray-700 border-r last:border-r-0">
        {children}
    </th>
);
const Td: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <td className="px-3 py-2 text-gray-800 border-r last:border-r-0">
        {children}
    </td>
);

function Dialog({
    open,
    onClose,
    title,
    children,
}: {
    open: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}) {
    if (!open) return null;
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            aria-modal="true"
            role="dialog"
            onKeyDown={(e) => {
                if (e.key === "Escape") onClose();
            }}
        >
            {/* Backdrop - so that if someone clicks off of the dialog pane then it closes. */}
            <button
                className="absolute inset-0 bg-black/30"
                onClick={onClose}
                aria-label="Close dialog backdrop"
            />

            {/* Panel */}
            <div className="relative w-full max-w-md rounded-x1 bg-white shadow-x1 border p-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">
                        {title}
                    </h2>
                    <button
                        onClick={onClose}
                        className="rounded-md px-2 py-1 text-sm text-gray-600 hover:bg-gray-100"
                        aria-label="Close dialog"
                    >
                        x
                    </button>
                </div>
                <div className="mt-3">{children}</div>
            </div>
        </div>
    );
}

export default function MenuManagerPage() {
    const [rows, setRows] = useState<Ingredient[]>([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState("");
    const [error, setError] = useState<string | null>(null);

    // dialog visibility for adding an item
    const [addOpen, setAddOpen] = useState(false);

    // set the form to have these variables but initially as strings as it is more lightweight. will convert on "submit"
    const [form, setForm] = useState({
        name: "",
        stock: "0",
        cost: "0",
    });

    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    // dialog visibility for deleting an item
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteSubmitting, setDeleteSubmitting] = useState(false);
    const [deleteFormError, setDeleteFormError] = useState<string | null>(null);
    const [deleteForm, setDeleteForm] = useState({ id: "0" });

    // dialog visibility + form state for editing
    const [editOpen, setEditOpen] = useState(false);
    const [editSubmitting, setEditSubmitting] = useState(false);
    const [editError, setEditError] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({
        id: 0,
        name: "",
        stock: "0",
        cost: "0",
    });

    const fetchMenu = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await fetch("/api/ingredient", { cache: "no-store" });
            if (!res.ok) throw new Error(`GET /api/ingredient ${res.status}`);
            const data: Ingredient[] = await res.json();
            setRows(data);
        } catch (e: any) {
            setError(e?.message ?? "Failed to load menu");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMenu();
    }, []);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return rows.filter(
            (r) =>
                !q ||
                r.name.toLowerCase().includes(q) ||
                String(r.id).includes(q),
        );
    }, [rows, query]);

    // Add → POST /api/ingredient

    // trigger dialog to open by changing the addOpen to true which causes UI to refresh dialog component.
    const openAddDialog = () => {
        setForm({ name: "", stock: "0", cost: "0" });
        setFormError(null);
        setAddOpen(true);
    };

    // validate -> convert types -> POST -> updateTable -> close
    const onSubmitNewItem: React.FormEventHandler<HTMLFormElement> = async (
        e,
    ) => {
        e.preventDefault();
        setFormError(null);

        // Validate UI Strings
        if (!form.name.trim()) {
            setFormError("Name is required.");
            return;
        }
        const stockNum = Number(form.stock);
        const costNum = Number(form.cost);
        if (!Number.isFinite(stockNum) || stockNum < 0) {
            setFormError("Stock must be a non-negative number.");
            return;
        }
        if (!Number.isFinite(costNum) || costNum < 0) {
            setFormError("Cost must be a non-negative number.");
            return;
        }

        // now lets post to API that will add to database
        try {
            setSubmitting(true);
            setError(null);

            const body = {
                name: form.name.trim(),
                stock: stockNum,
                cost: costNum,
            };

            const res = await fetch("/api/ingredient", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (!res.ok) throw new Error(`POST /api/ingredient ${res.status}`);

            const created: Ingredient = await res.json();

            // Append to table
            setRows((prev) => [...prev, created]);

            // close Dialog
            setAddOpen(false);
        } catch (e: any) {
            setFormError(e?.message ?? "Failed to add item.");
        } finally {
            setSubmitting(false);
        }
    };

    const openDeleteDialog = () => {
        setDeleteForm({ id: "0" });
        setDeleteFormError(null);
        setDeleteOpen(true);
    };

    const onSubmitDeleteItem: React.FormEventHandler<HTMLFormElement> = async (
        e,
    ) => {
        e.preventDefault();
        setDeleteFormError(null);

        const idNum = Number(deleteForm.id);

        if (!Number.isFinite(idNum) || idNum < 0) {
            setDeleteFormError("Please enter a valid non-negative numeric ID.");
            return;
        }

        // now lets post to API that will add to database
        try {
            setDeleteSubmitting(true);
            setDeleteFormError(null);

            const body = {
                id: idNum,
            };

            const res = await fetch("/api/ingredient", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (!res.ok)
                throw new Error(`DELETE /api/ingredient ${res.status}`);

            // ser the rows in the table
            setRows((prev) => prev.filter((x) => x.id !== idNum));

            // close Dialog
            setDeleteOpen(false);
        } catch (e: any) {
            setDeleteFormError(e?.message ?? "Failed to delete item.");
        } finally {
            setDeleteSubmitting(false);
        }
    };

    const openEditDialog = (row: Ingredient) => {
        setEditError(null);
        setEditForm({
            id: row.id,
            name: row.name,
            stock: String(row.stock ?? 0),
            cost: String(row.cost ?? 0),
        });
        setEditOpen(true);
    };

    const onSubmitEditItem: React.FormEventHandler<HTMLFormElement> = async (
        e,
    ) => {
        e.preventDefault();
        setEditError(null);

        // Validate UI Strings

        const idNum = Number(editForm.id);

        if (!editForm.name.trim()) {
            setEditError("Name is required.");
            return;
        }
        const stockNum = Number(editForm.stock);
        const costNum = Number(editForm.cost);
        if (!Number.isFinite(stockNum) || stockNum < 0) {
            setEditError("Stock must be a non-negative number.");
            return;
        }
        if (!Number.isFinite(costNum) || costNum < 0) {
            setEditError("Cost must be a non-negative number.");
            return;
        }

        // now lets post to API that will add to database
        try {
            setEditSubmitting(true);
            setEditError(null);

            const body = {
                id: idNum,
                name: editForm.name.trim(),
                stock: stockNum,
                cost: costNum,
            };

            const res = await fetch("/api/ingredient", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (!res.ok) throw new Error(`PUT /api/ingredient ${res.status}`);

            const updated: Ingredient = await res.json();

            // Edit table
            setRows((prev) =>
                prev.map((x) => (x.id === updated.id ? updated : x)),
            );

            // close Dialog
            setEditOpen(false);
        } catch (e: any) {
            setEditError(e?.message ?? "Failed to update item.");
        } finally {
            setEditSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-neutral-100 text-gray-900">
            <div className="w-full h-8 bg-neutral-800 text-gray-100 flex items-center justify-center text-sm">
                Manager — Ingredients
            </div>

            {/* Toolbar */}
            <div className="mx-auto max-w-6xl mt-4 rounded-xl border bg-white p-3 shadow-sm">
                <div className="flex flex-wrap items-center gap-2">
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search name, ID, categoryId"
                        className="flex-1 min-w-[220px] px-3 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-neutral-300"
                    />
                    <ToolbarButton onClick={fetchMenu}>Refresh</ToolbarButton>
                    <ToolbarButton onClick={openAddDialog}>
                        Add Item
                    </ToolbarButton>
                    <ToolbarButton onClick={openDeleteDialog}>
                        Delete Item
                    </ToolbarButton>
                    {/* Edit/Delete can be added after you implement PUT/DELETE */}
                </div>
                {error && (
                    <div className="mt-2 text-xs text-red-600">
                        Error: {error}
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="mx-auto max-w-6xl mt-3">
                <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
                    <table className="w-full text-sm">
                        <thead className="bg-neutral-100 border-b">
                            <tr className="text-left">
                                <Th>ID</Th>
                                <Th>Name</Th>
                                <Th>Stock</Th>
                                <Th>Cost</Th>
                                <Th>Edit Ingredient</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="p-6 text-center text-gray-500"
                                    >
                                        Loading…
                                    </td>
                                </tr>
                            ) : filtered.length ? (
                                filtered.map((r) => (
                                    <tr
                                        key={r.id}
                                        className="border-b last:border-b-0 hover:bg-neutral-50"
                                    >
                                        <Td>{r.id}</Td>
                                        <Td>{r.name}</Td>
                                        <Td>{r.stock}</Td>
                                        <Td>${r.cost.toFixed(2)}</Td>
                                        <Td>
                                            <button
                                                onClick={() =>
                                                    openEditDialog(r)
                                                }
                                                className="px-2 py-1 text-xs rounded-md border hover:bg-gray-50"
                                            >
                                                Edit
                                            </button>
                                        </Td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="p-6 text-center text-gray-500"
                                    >
                                        No items found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="mt-2 text-xs text-gray-500 flex items-center gap-2">
                    <Tag>{filtered.length} shown</Tag>
                    <Tag>{rows.length} total</Tag>
                </div>
            </div>

            {/* ADD ITEM DIALOG PANE */}
            <Dialog
                open={addOpen}
                onClose={() => setAddOpen(false)}
                title="Add New Menu Item"
            >
                <form onSubmit={onSubmitNewItem} className="space-y-3">
                    <div>
                        <label className="block text-sm text-gray-700 mb-1">
                            Name *
                        </label>
                        <input
                            value={form.name}
                            onChange={(e) =>
                                setForm({ ...form, name: e.target.value })
                            }
                            className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-300"
                            placeholder="e.g., Thai Milk Tea"
                            autoFocus
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm text-gray-700 mb-1">
                                Stock *
                            </label>
                            <input
                                value={form.stock}
                                onChange={(e) =>
                                    setForm({ ...form, stock: e.target.value })
                                }
                                className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-300"
                                placeholder="e.g., 24"
                                inputMode="numeric"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-700 mb-1">
                                Cost *
                            </label>
                            <input
                                value={form.cost}
                                onChange={(e) =>
                                    setForm({ ...form, cost: e.target.value })
                                }
                                className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-300"
                                placeholder="e.g., 4.50"
                                inputMode="decimal"
                                required
                            />
                        </div>
                    </div>

                    {formError && (
                        <p className="text-xs text-red-600 mt-1">
                            Error: {formError}
                        </p>
                    )}

                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={() => setAddOpen(false)}
                            className="px-3 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-3 py-2 text-sm rounded-md bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-50"
                        >
                            {submitting ? "Adding..." : "Add Item"}
                        </button>
                    </div>
                </form>
            </Dialog>

            {/* DELETE ITEM DIALOG PANE */}
            <Dialog
                open={deleteOpen}
                onClose={() => setDeleteOpen(false)}
                title="Remove Menu Item"
            >
                <form onSubmit={onSubmitDeleteItem} className="space-y-3">
                    <div>
                        <label className="block text-sm text-gray-700 mb-1">
                            ID *
                        </label>
                        <input
                            value={deleteForm.id}
                            onChange={(e) =>
                                setDeleteForm({
                                    ...deleteForm,
                                    id: e.target.value,
                                })
                            }
                            className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-300"
                            placeholder="0"
                            autoFocus
                            required
                        />
                    </div>

                    {deleteFormError && (
                        <p className="text-xs text-red-600 mt-1">
                            Error: {deleteFormError}
                        </p>
                    )}

                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={() => setDeleteOpen(false)}
                            className="px-3 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={deleteSubmitting}
                            className="px-3 py-2 text-sm rounded-md bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-50"
                        >
                            {deleteSubmitting ? "Deleting..." : "Delete Item"}
                        </button>
                    </div>
                </form>
            </Dialog>

            <Dialog
                open={editOpen}
                onClose={() => setEditOpen(false)}
                title="Edit Ingredient"
            >
                <form onSubmit={onSubmitEditItem} className="space-y-3">
                    <div className="text-xs text-gray-500">
                        Editing ID: {editForm.id}
                    </div>

                    <div>
                        <label className="block text-sm text-gray-700 mb-1">
                            Name *
                        </label>
                        <input
                            value={editForm.name}
                            onChange={(e) =>
                                setEditForm({
                                    ...editForm,
                                    name: e.target.value,
                                })
                            }
                            className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-300"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm text-gray-700 mb-1">
                                Stock *
                            </label>
                            <input
                                value={editForm.stock}
                                onChange={(e) =>
                                    setEditForm({
                                        ...editForm,
                                        stock: e.target.value,
                                    })
                                }
                                className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-300"
                                inputMode="numeric"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-700 mb-1">
                                Cost *
                            </label>
                            <input
                                value={editForm.cost}
                                onChange={(e) =>
                                    setEditForm({
                                        ...editForm,
                                        cost: e.target.value,
                                    })
                                }
                                className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-300"
                                inputMode="decimal"
                                required
                            />
                        </div>
                    </div>

                    {editError && (
                        <p className="text-xs text-red-600 mt-1">
                            Error: {editError}
                        </p>
                    )}

                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={() => setEditOpen(false)}
                            className="px-3 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={editSubmitting}
                            className="px-3 py-2 text-sm rounded-md bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-50"
                        >
                            {editSubmitting ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </Dialog>
        </div>
    );
}
