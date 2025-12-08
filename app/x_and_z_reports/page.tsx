import { XReportRow, ZReportRow } from "@/lib/models";
import { fetch_x_report, fetch_z_report } from "@/lib/db";
import IdleLogout from "@/components/idleLogout";
import React from "react";

function XReportTable({ title, rows }: { title: string; rows: XReportRow[] }) {
    return (
        <section style={{ marginBottom: 24 }}>
            <h2 style={{ marginBottom: 8 }}>{title}</h2>

            <div
                style={{
                    overflowX: "auto",
                    border: "1px solid #e5e7eb",
                    borderRadius: 6,
                }}
            >
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead style={{ background: "#f9fafb" }}>
                        <tr>
                            <th style={thStyle}>Hour</th>
                            <th style={thStyle}>Number of Sales</th>
                            <th style={thStyle}>Total Sales</th>
                        </tr>
                    </thead>

                    <tbody>
                        {rows.map((r) => (
                            <tr
                                key={r.hour}
                                style={{ borderTop: "1px solid #eee" }}
                            >
                                <td style={tdStyle}>{r.hour}</td>
                                <td style={tdStyle}>{r.number_of_sales}</td>
                                <td style={tdStyle}>{r.total_sales}</td>
                                {/* TODO: Actions column could have buttons for viewing details or exporting data */}
                            </tr>
                        ))}
                        {rows.length === 0 && (
                            <tr>
                                <td style={tdStyle} colSpan={3}>
                                    No rows
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

function ZReportTable({ title, rows }: { title: string; rows: ZReportRow[] }) {
    return (
        <section style={{ marginBottom: 24 }}>
            <h2 style={{ marginBottom: 8 }}>{title}</h2>

            <div
                style={{
                    overflowX: "auto",
                    border: "1px solid #e5e7eb",
                    borderRadius: 6,
                }}
            >
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead style={{ background: "#f9fafb" }}>
                        <tr>
                            <th style={thStyle}>Metric</th>
                            <th style={thStyle}>Total</th>
                        </tr>
                    </thead>

                    <tbody>
                        {rows.map((r) => (
                            <tr
                                key={r.metric}
                                style={{ borderTop: "1px solid #eee" }}
                            >
                                <td style={tdStyle}>{r.metric}</td>
                                <td style={tdStyle}>{r.total}</td>
                                {/* TODO: Actions column could have buttons for viewing details or exporting data */}
                            </tr>
                        ))}
                        {rows.length === 0 && (
                            <tr>
                                <td style={tdStyle} colSpan={2}>
                                    No rows
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

const thStyle: React.CSSProperties = {
    textAlign: "left",
    padding: "12px 16px",
    fontSize: 13,
    color: "#374151",
};

const tdStyle: React.CSSProperties = {
    padding: "12px 16px",
    fontSize: 14,
    color: "#111827",
    verticalAlign: "middle",
};

const actionButtonStyle: React.CSSProperties = {
    background: "#fff",
    border: "1px solid #d1d5db",
    padding: "6px 10px",
    borderRadius: 4,
    cursor: "pointer",
    fontSize: 13,
};

export default async function XZReportsPage() {
    const xRows = await fetch_x_report();
    const zRows = await fetch_z_report();
    return (
        <main style={{ padding: 20 }}>
            <XReportTable title="X report" rows={xRows} />
            <ZReportTable title="Z report" rows={zRows} />
        </main>
    );
}
