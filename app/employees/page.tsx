// app/employees/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";

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

// Local Employee type so we don't accidentally pull in any server/pg stuff
interface Employee {
    id: number;
    name: string;
    hours_worked: number;
    pin: number;
    is_manager: boolean;
}

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
            {/* Backdrop */}
            <button
                className="absolute inset-0 bg-black/30"
                onClick={onClose}
                aria-label="Close dialog backdrop"
            />

            {/* Panel */}
            <div className="relative w-full max-w-md rounded-xl bg-white shadow-xl border p-4">
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

export default function EmployeesPage() {
    const [rows, setRows] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState("");
    const [error, setError] = useState<string | null>(null);

    // ADD dialog
    const [addOpen, setAddOpen] = useState(false);
    const [addForm, setAddForm] = useState({
        name: "",
        hours_worked: "0",
        pin: "",
        is_manager: false,
    });
    const [addSubmitting, setAddSubmitting] = useState(false);
    const [addError, setAddError] = useState<string | null>(null);

    // DELETE dialog
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteSubmitting, setDeleteSubmitting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [deleteForm, setDeleteForm] = useState({ id: "0" });

    // EDIT dialog
    const [editOpen, setEditOpen] = useState(false);
    const [editSubmitting, setEditSubmitting] = useState(false);
    const [editError, setEditError] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({
        id: 0,
        name: "",
        hours_worked: "0",
        pin: "",
        is_manager: false,
    });

    const fetchEmployees = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await fetch("/api/employees", { cache: "no-store" });
            if (!res.ok) throw new Error(`GET /api/employees ${res.status}`);
            const data: Employee[] = await res.json();
            setRows(data);
        } catch (e: any) {
            setError(e?.message ?? "Failed to load employees");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, []);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return rows.filter(
            (r) =>
                !q ||
                r.name.toLowerCase().includes(q) ||
                String(r.id).includes(q) ||
                String(r.pin).includes(q),
        );
    }, [rows, query]);

    // ---------- ADD EMPLOYEE ----------

    const openAddDialog = () => {
        setAddForm({
            name: "",
            hours_worked: "0",
            pin: "",
            is_manager: false,
        });
        setAddError(null);
        setAddOpen(true);
    };

    const handleGeneratePin = () => {
        const fourDigit = Math.floor(1000 + Math.random() * 9000);
        setAddForm((prev) => ({ ...prev, pin: String(fourDigit) }));
    };

    const onSubmitAdd: React.FormEventHandler<HTMLFormElement> = async (e) => {
        e.preventDefault();
        setAddError(null);

        if (!addForm.name.trim()) {
            setAddError("Name is required.");
            return;
        }

        const hoursNum = Number(addForm.hours_worked);
        const pinNum = Number(addForm.pin);

        if (!Number.isFinite(hoursNum) || hoursNum < 0) {
            setAddError("Hours worked must be a non-negative number.");
            return;
        }

        if (!Number.isFinite(pinNum) || pinNum < 0) {
            setAddError("PIN must be a non-negative number.");
            return;
        }

        try {
            setAddSubmitting(true);
            const body = {
                name: addForm.name.trim(),
                hours_worked: hoursNum,
                pin: pinNum,
                is_manager: addForm.is_manager,
            };

            const res = await fetch("/api/employees", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (!res.ok) throw new Error(`POST /api/employees ${res.status}`);

            const created: Employee = await res.json();
            setRows((prev) => [...prev, created]);
            setAddOpen(false);
        } catch (e: any) {
            setAddError(e?.message ?? "Failed to add employee.");
        } finally {
            setAddSubmitting(false);
        }
    };

    // ---------- DELETE EMPLOYEE ----------

    const openDeleteDialog = () => {
        setDeleteForm({ id: "0" });
        setDeleteError(null);
        setDeleteOpen(true);
    };

    const onSubmitDelete: React.FormEventHandler<HTMLFormElement> = async (
        e,
    ) => {
        e.preventDefault();
        setDeleteError(null);

        const idNum = Number(deleteForm.id);
        if (!Number.isFinite(idNum) || idNum < 0) {
            setDeleteError("Please enter a valid non-negative numeric ID.");
            return;
        }

        try {
            setDeleteSubmitting(true);

            const res = await fetch("/api/employees", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: idNum }),
            });

            if (!res.ok) throw new Error(`DELETE /api/employees ${res.status}`);

            setRows((prev) => prev.filter((x) => x.id !== idNum));
            setDeleteOpen(false);
        } catch (e: any) {
            setDeleteError(e?.message ?? "Failed to delete employee.");
        } finally {
            setDeleteSubmitting(false);
        }
    };

    // ---------- EDIT EMPLOYEE ----------

    const openEditDialog = (row: Employee) => {
        setEditError(null);
        setEditForm({
            id: row.id,
            name: row.name,
            hours_worked: String(row.hours_worked ?? 0),
            pin: String(row.pin ?? ""),
            is_manager: row.is_manager,
        });
        setEditOpen(true);
    };

    const handleEditGeneratePin = () => {
        const fourDigit = Math.floor(1000 + Math.random() * 9000);
        setEditForm((prev) => ({ ...prev, pin: String(fourDigit) }));
    };

    const onSubmitEdit: React.FormEventHandler<HTMLFormElement> = async (e) => {
        e.preventDefault();
        setEditError(null);

        if (!editForm.name.trim()) {
            setEditError("Name is required.");
            return;
        }

        const hoursNum = Number(editForm.hours_worked);
        const pinNum = Number(editForm.pin);

        if (!Number.isFinite(hoursNum) || hoursNum < 0) {
            setEditError("Hours worked must be a non-negative number.");
            return;
        }

        if (!Number.isFinite(pinNum) || pinNum < 0) {
            setEditError("PIN must be a non-negative number.");
            return;
        }

        try {
            setEditSubmitting(true);

            const body = {
                id: editForm.id,
                name: editForm.name.trim(),
                hours_worked: hoursNum,
                pin: pinNum,
                is_manager: editForm.is_manager,
            };

            const res = await fetch("/api/employees", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (!res.ok) throw new Error(`PUT /api/employees ${res.status}`);

            const updated: Employee = await res.json();

            setRows((prev) =>
                prev.map((x) => (x.id === updated.id ? updated : x)),
            );
            setEditOpen(false);
        } catch (e: any) {
            setEditError(e?.message ?? "Failed to update employee.");
        } finally {
            setEditSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-neutral-100 text-gray-900">
            <div className="w-full h-8 bg-neutral-800 text-gray-100 flex items-center justify-center text-sm">
                Manager — Employees
            </div>

            {/* Toolbar */}
            <div className="mx-auto max-w-6xl mt-4 rounded-xl border bg-white p-3 shadow-sm">
                <div className="flex flex-wrap items-center gap-2">
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search name, ID, PIN"
                        className="flex-1 min-w-[220px] px-3 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-neutral-300"
                    />
                    <ToolbarButton onClick={fetchEmployees}>
                        Refresh
                    </ToolbarButton>
                    <ToolbarButton onClick={openAddDialog}>
                        Add Employee
                    </ToolbarButton>
                    <ToolbarButton onClick={openDeleteDialog}>
                        Delete Employee
                    </ToolbarButton>
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
                                <Th>Hours Worked</Th>
                                <Th>PIN</Th>
                                <Th>Role</Th>
                                <Th>Edit</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td
                                        colSpan={6}
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
                                        <Td>{r.hours_worked}</Td>
                                        <Td>{r.pin}</Td>
                                        <Td>
                                            {r.is_manager
                                                ? "Manager"
                                                : "Employee"}
                                        </Td>
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
                                        colSpan={6}
                                        className="p-6 text-center text-gray-500"
                                    >
                                        No employees found.
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

            {/* ADD EMPLOYEE DIALOG */}
            <Dialog
                open={addOpen}
                onClose={() => setAddOpen(false)}
                title="Add New Employee"
            >
                <form onSubmit={onSubmitAdd} className="space-y-3">
                    <div>
                        <label className="block text-sm text-gray-700 mb-1">
                            Name *
                        </label>
                        <input
                            value={addForm.name}
                            onChange={(e) =>
                                setAddForm({
                                    ...addForm,
                                    name: e.target.value,
                                })
                            }
                            className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-300"
                            placeholder="e.g., Alice"
                            autoFocus
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm text-gray-700 mb-1">
                                Hours Worked *
                            </label>
                            <input
                                value={addForm.hours_worked}
                                onChange={(e) =>
                                    setAddForm({
                                        ...addForm,
                                        hours_worked: e.target.value,
                                    })
                                }
                                className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-300"
                                inputMode="numeric"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-700 mb-1">
                                PIN *
                            </label>
                            <div className="flex gap-2">
                                <input
                                    value={addForm.pin}
                                    onChange={(e) =>
                                        setAddForm({
                                            ...addForm,
                                            pin: e.target.value,
                                        })
                                    }
                                    className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-300"
                                    inputMode="numeric"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={handleGeneratePin}
                                    className="px-3 py-2 text-xs rounded-md border hover:bg-gray-50"
                                >
                                    Generate
                                </button>
                            </div>
                        </div>
                    </div>

                    <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                            type="checkbox"
                            checked={addForm.is_manager}
                            onChange={(e) =>
                                setAddForm({
                                    ...addForm,
                                    is_manager: e.target.checked,
                                })
                            }
                        />
                        Is Manager
                    </label>

                    {addError && (
                        <p className="text-xs text-red-600 mt-1">
                            Error: {addError}
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
                            disabled={addSubmitting}
                            className="px-3 py-2 text-sm rounded-md bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-50"
                        >
                            {addSubmitting ? "Adding..." : "Add Employee"}
                        </button>
                    </div>
                </form>
            </Dialog>

            {/* DELETE EMPLOYEE DIALOG */}
            <Dialog
                open={deleteOpen}
                onClose={() => setDeleteOpen(false)}
                title="Remove Employee"
            >
                <form onSubmit={onSubmitDelete} className="space-y-3">
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

                    {deleteError && (
                        <p className="text-xs text-red-600 mt-1">
                            Error: {deleteError}
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
                            {deleteSubmitting ? "Deleting..." : "Delete"}
                        </button>
                    </div>
                </form>
            </Dialog>

            {/* EDIT EMPLOYEE DIALOG */}
            <Dialog
                open={editOpen}
                onClose={() => setEditOpen(false)}
                title="Edit Employee"
            >
                <form onSubmit={onSubmitEdit} className="space-y-3">
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
                                Hours Worked *
                            </label>
                            <input
                                value={editForm.hours_worked}
                                onChange={(e) =>
                                    setEditForm({
                                        ...editForm,
                                        hours_worked: e.target.value,
                                    })
                                }
                                className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-300"
                                inputMode="numeric"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-700 mb-1">
                                PIN *
                            </label>
                            <div className="flex gap-2">
                                <input
                                    value={editForm.pin}
                                    onChange={(e) =>
                                        setEditForm({
                                            ...editForm,
                                            pin: e.target.value,
                                        })
                                    }
                                    className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-300"
                                    inputMode="numeric"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={handleEditGeneratePin}
                                    className="px-3 py-2 text-xs rounded-md border hover:bg-gray-50"
                                >
                                    Generate
                                </button>
                            </div>
                        </div>
                    </div>

                    <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                            type="checkbox"
                            checked={editForm.is_manager}
                            onChange={(e) =>
                                setEditForm({
                                    ...editForm,
                                    is_manager: e.target.checked,
                                })
                            }
                        />
                        Is Manager
                    </label>

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
