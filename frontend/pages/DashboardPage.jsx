import { useEffect, useMemo, useState } from "react";
import api from "../services/api";

export default function DashboardPage() {
    const [reports, setReports] = useState([]);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            const res = await api.get("/reports");
            setReports(res.data);
        } catch (error) {
            console.error("Failed to fetch reports:", error);
        }
    };

    const stats = useMemo(() => {
        const totalReports = reports.length;
        const anonymousReports = reports.filter((r) => r.is_anonymous).length;
        const pendingReports = reports.filter((r) => r.status === "pending").length;
        const resolvedReports = reports.filter((r) => r.status === "resolved").length;

        const byType = reports.reduce((acc, report) => {
            acc[report.incident_type] = (acc[report.incident_type] || 0) + 1;
            return acc;
        }, {});

        const bySuburb = reports.reduce((acc, report) => {
            acc[report.suburb] = (acc[report.suburb] || 0) + 1;
            return acc;
        }, {});

        const topIncidentTypes = Object.entries(byType)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        const hotspotAreas = Object.entries(bySuburb)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        return {
            totalReports,
            anonymousReports,
            pendingReports,
            resolvedReports,
            topIncidentTypes,
            hotspotAreas,
        };
    }, [reports]);

    return (
        <div className="space-y-6">
            <section className="card p-7">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-600">
                    Analytics Dashboard
                </p>
                <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-900">
                    Safety Statistics Overview
                </h1>
                <p className="mt-3 max-w-2xl text-slate-500">
                    Review reporting trends, incident categories, and current hotspot
                    areas across the platform.
                </p>
            </section>

            <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                <div className="card p-6">
                    <p className="text-sm text-slate-500">Total Reports</p>
                    <p className="mt-3 text-4xl font-bold text-slate-900">
                        {stats.totalReports}
                    </p>
                </div>

                <div className="card p-6">
                    <p className="text-sm text-slate-500">Anonymous Reports</p>
                    <p className="mt-3 text-4xl font-bold text-slate-900">
                        {stats.anonymousReports}
                    </p>
                </div>

                <div className="card p-6">
                    <p className="text-sm text-slate-500">Pending Reports</p>
                    <p className="mt-3 text-4xl font-bold text-slate-900">
                        {stats.pendingReports}
                    </p>
                </div>

                <div className="card p-6">
                    <p className="text-sm text-slate-500">Resolved Reports</p>
                    <p className="mt-3 text-4xl font-bold text-slate-900">
                        {stats.resolvedReports}
                    </p>
                </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
                <div className="card p-6">
                    <h2 className="text-xl font-semibold text-slate-900">
                        Top Incident Categories
                    </h2>
                    <p className="mt-1 text-slate-500">
                        Most reported incident types across the system.
                    </p>

                    <div className="mt-5 space-y-4">
                        {stats.topIncidentTypes.length > 0 ? (
                            stats.topIncidentTypes.map(([type, count]) => (
                                <div
                                    key={type}
                                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                                >
                                    <span className="font-medium text-slate-800">{type}</span>
                                    <span className="rounded-full bg-cyan-100 px-3 py-1 text-sm font-medium text-cyan-700">
                    {count}
                  </span>
                                </div>
                            ))
                        ) : (
                            <p className="text-slate-500">No incident data available yet.</p>
                        )}
                    </div>
                </div>

                <div className="card p-6">
                    <h2 className="text-xl font-semibold text-slate-900">
                        Hotspot Areas
                    </h2>
                    <p className="mt-1 text-slate-500">
                        Areas with the highest number of reported incidents.
                    </p>

                    <div className="mt-5 space-y-4">
                        {stats.hotspotAreas.length > 0 ? (
                            stats.hotspotAreas.map(([suburb, count]) => (
                                <div
                                    key={suburb}
                                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                                >
                                    <span className="font-medium text-slate-800">{suburb}</span>
                                    <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-700">
                    {count} reports
                  </span>
                                </div>
                            ))
                        ) : (
                            <p className="text-slate-500">No suburb data available yet.</p>
                        )}
                    </div>
                </div>
            </section>

            <section className="card overflow-hidden">
                <div className="border-b border-slate-200 px-6 py-5">
                    <h2 className="text-xl font-semibold text-slate-900">Recent Reports</h2>
                    <p className="mt-1 text-slate-500">
                        Latest incident entries submitted to the platform.
                    </p>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-slate-50">
                        <tr className="text-left text-sm text-slate-500">
                            <th className="px-6 py-4 font-medium">ID</th>
                            <th className="px-6 py-4 font-medium">Incident</th>
                            <th className="px-6 py-4 font-medium">Suburb</th>
                            <th className="px-6 py-4 font-medium">Status</th>
                            <th className="px-6 py-4 font-medium">Anonymous</th>
                        </tr>
                        </thead>
                        <tbody>
                        {reports.length > 0 ? (
                            reports.map((report) => (
                                <tr
                                    key={report.id}
                                    className="border-t border-slate-100 text-sm text-slate-700"
                                >
                                    <td className="px-6 py-4">{report.id}</td>
                                    <td className="px-6 py-4 font-medium">
                                        {report.incident_type}
                                    </td>
                                    <td className="px-6 py-4">{report.suburb}</td>
                                    <td className="px-6 py-4">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                        {report.status}
                      </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {report.is_anonymous ? "Yes" : "No"}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td
                                    colSpan="5"
                                    className="px-6 py-8 text-center text-slate-500"
                                >
                                    No reports available yet.
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}