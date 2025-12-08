"use client";

import { Employee } from "@/lib/models";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Pencil, RefreshCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { updateEmployeeAction } from "./page";

function RemoveEmployeeAlertDialog({ employee }: { employee: Employee }) {
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button
                    variant="destructive"
                    size="icon"
                    className="cursor-pointer"
                >
                    <X />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Remove {employee.name}</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to remove {employee.name} from the
                        records? This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction>Confirm</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

function EditEmployeeDialog({ employee }: { employee: Employee }) {
    const [name, setName] = useState(employee.name);
    const [hoursWorked, setHoursWorked] = useState(employee.hours_worked);
    const [pin, setPin] = useState(employee.pin);

    const generatePin = () => setPin(Math.floor(1000 + Math.random() * 9000));
    const setState = (employee: Employee) => {
        setName(employee.name);
        setHoursWorked(employee.hours_worked);
        setPin(employee.pin);
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    size="icon"
                    className="cursor-pointer"
                >
                    <Pencil />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit {employee.name}</DialogTitle>
                </DialogHeader>
                <div className="grid w-full max-w-sm items-center gap-3">
                    <Label htmlFor="nameInput">Name</Label>
                    <Input
                        type="text"
                        placeholder="Name"
                        id="nameInput"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />

                    <Label htmlFor="hoursWorkedInput">Hours Worked</Label>
                    <Input
                        type="number"
                        placeholder="Hours Worked"
                        id="hoursWorkedInput"
                        value={hoursWorked}
                        onChange={(e) =>
                            setHoursWorked(parseInt(e.target.value))
                        }
                    />

                    <Label htmlFor="pinInput">Pin</Label>
                    <span className="flex gap-2 w-full">
                        <Input
                            type="number"
                            placeholder="Pin"
                            id="pinInput"
                            value={pin}
                            readOnly
                            className="flex-1"
                        />
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={generatePin}
                        >
                            <RefreshCcw />
                        </Button>
                    </span>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button
                            variant="outline"
                            onClick={() => setState(employee)}
                        >
                            Cancel
                        </Button>
                    </DialogClose>
                    <DialogClose asChild>
                        <Button
                            type="submit"
                            onClick={async () => {
                                const newEmployeeData =
                                    await updateEmployeeAction(
                                        employee.id,
                                        name,
                                        hoursWorked,
                                        pin,
                                    );
                                setState(newEmployeeData!);
                            }}
                        >
                            Save
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export const columns: ColumnDef<Employee>[] = [
    {
        accessorKey: "id",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() =>
                        column.toggleSorting(column.getIsSorted() === "asc")
                    }
                >
                    ID
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
    },
    {
        accessorKey: "name",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() =>
                        column.toggleSorting(column.getIsSorted() === "asc")
                    }
                >
                    Name
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
    },
    {
        accessorKey: "hours_worked",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() =>
                        column.toggleSorting(column.getIsSorted() === "asc")
                    }
                >
                    Hours Worked
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
    },
    {
        accessorKey: "is_manager",
        cell: ({ row }) =>
            row.getValue("is_manager") ? "Manager" : "Employee",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() =>
                        column.toggleSorting(column.getIsSorted() === "asc")
                    }
                >
                    Role
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const employee = row.original;

            return (
                <div className="space-x-4">
                    <RemoveEmployeeAlertDialog employee={employee} />
                    <EditEmployeeDialog employee={employee} />
                </div>
            );
        },
    },
];
