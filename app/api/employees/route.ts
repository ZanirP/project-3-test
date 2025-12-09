// app/api/employees/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
    fetch_employee_data,
    createEmployee,
    updateEmployee,
    deleteEmployee,
} from "@/lib/db"; // adjust to your actual function names

export async function GET() {
    const employees = await fetch_employee_data();
    return NextResponse.json(employees);
}

export async function POST(req: NextRequest) {
    const body = await req.json();
    const employee = await createEmployee(body); // name, hours_worked, pin, is_manager
    return NextResponse.json(employee, { status: 201 });
}

export async function PUT(req: NextRequest) {
    const body = await req.json();
    const updated = await updateEmployee(body); // id, name, hours_worked, pin, is_manager
    return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
    const body = await req.json();
    await deleteEmployee(body.id);
    return NextResponse.json({ ok: true });
}
