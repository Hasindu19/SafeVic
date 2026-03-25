import { useEffect, useMemo, useState } from "react";
import api from "../services/api.js";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from "recharts";

const PIE_COLORS = ["#06b6d4", "#3b82f6", "#8b5cf6", "#f59e0b", "#22c55e", "#ef4444"];

export default function DashboardPage() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            const res = await api.get("/reports");
            setReports(res.data);
            setLoading(false);
        } catch (error) {
            console.error("Failed to fetch reports:", error);
            setError("Failed to load dashboard data");
            setLoading(false);
        }
    };

    const stats = useMemo(() => {
        const now = new Date();
        const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        const totalIncidents = reports.length;
        const last24hIncidents = reports.filter(
            (report) => new Date(report.created_at) >= last24Hours
        ).length;
        const anonymousReports = reports.filter((report) => report.is_anonymous).length;
        const resolvedReports = reports.filter(
            (report) => report.status?.toLowerCase() === "resolved"
        ).length;

        const categoryMap = {};
        const suburbMap = {};

        reports.forEach((report) => {
            const category = report.incident_type || "Unknown";
            const suburb = report.suburb || "Unknown";

            categoryMap[category] = (categoryMap[category] || 0) + 1;
            suburbMap[suburb] = (suburbMap[suburb] || 0) + 1;
        });

        const incidentsByCategory = Object.entries(categoryMap).map(([name, value]) => ({
            name,
            value,
        }));

        const incidentsBySuburb = Object.entries(suburbMap)
            .map(([name, value]) => ({
                name,
                value,
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 8);

        const recentIncidents = [...reports]
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 8);

        return {
            totalIncidents,
            last24hIncidents,
            anonymousReports,
            resolvedReports,
            incidentsByCategory,
            incidentsBySuburb,
            recentIncidents,
        };
    }, [reports]);

    if (loading) {
        return <div className="text-slate-600">Loading dashboard...</div>;
    }

    if (error) {
        return <div className="text-red-600">{error}</div>;
    }

    return (
        <div className="space-y-6">
            <section className="card p-7">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-600">
                    Safety Analytics
                </p>
                <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-900">
                    Dashboard Overview
                </h1>
                <p className="mt-3 max-w-2xl text-slate-500">
                    Monitor incident trends, reporting activity, and suburb-level safety insights.
                </p>
            </section>

            <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                <div className="card p-6">
                    <p className="text-sm text-slate-500">Total Incidents</p>
                    <p className="mt-3 text-4xl font-bold text-slate-900">
                        {stats.totalIncidents}
                    </p>
                </div>

                <div className="card p-6">
                    <p className="text-sm text-slate-500">Last 24 Hours</p>
                    <p className="mt-3 text-4xl font-bold text-slate-900">
                        {stats.last24hIncidents}
                    </p>
                </div>

                <div className="card p-6">
                    <p className="text-sm text-slate-500">Anonymous Reports</p>
                    <p className="mt-3 text-4xl font-bold text-slate-900">
                        {stats.anonymousReports}
                    </p>
                </div>

                <div className="card p-6">
                    <p className="text-sm text-slate-500">Resolved Reports</p>
                    <p className="mt-3 text-4xl font-bold text-slate-900">
                        {stats.resolvedReports}
                    </p>
                </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
                <div className="card p-6">
                    <h2 className="text-xl font-semibold text-slate-900">
                        Incidents by Category
                    </h2>
                    <p className="mt-1 text-slate-500">
                        Distribution of reported incident types.
                    </p>

                    <div className="mt-6 h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.incidentsByCategory}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                <Bar dataKey="value" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="card p-6">
                    <h2 className="text-xl font-semibold text-slate-900">
                        Incidents by Suburb
                    </h2>
                    <p className="mt-1 text-slate-500">
                        Top suburbs with the highest number of reported incidents.
                    </p>

                    <div className="mt-6 h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.incidentsBySuburb}
                                    dataKey="value"
                                    nameKey="name"
                                    outerRadius={110}
                                    innerRadius={55}
                                    paddingAngle={3}
                                    label
                                >
                                    {stats.incidentsBySuburb.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={PIE_COLORS[index % PIE_COLORS.length]}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </section>

            <section className="card overflow-hidden">
                <div className="border-b border-slate-200 px-6 py-5">
                    <h2 className="text-xl font-semibold text-slate-900">
                        Recent Incidents
                    </h2>
                    <p className="mt-1 text-slate-500">
                        Latest reports submitted to the platform.
                    </p>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-slate-50">
                        <tr className="text-left text-sm text-slate-500">
                            <th className="px-6 py-4 font-medium">ID</th>
                            <th className="px-6 py-4 font-medium">Type</th>
                            <th className="px-6 py-4 font-medium">Suburb</th>
                            <th className="px-6 py-4 font-medium">Status</th>
                            <th className="px-6 py-4 font-medium">Created</th>
                        </tr>
                        </thead>
                        <tbody>
                        {stats.recentIncidents.length > 0 ? (
                            stats.recentIncidents.map((report) => (
                                <tr
                                    key={report.id}
                                    className="border-t border-slate-100 text-sm text-slate-700"
                                >
                                    <td className="px-6 py-4">{report.id}</td>
                                    <td className="px-6 py-4 font-medium">{report.incident_type}</td>
                                    <td className="px-6 py-4">{report.suburb}</td>
                                    <td className="px-6 py-4">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                        {report.status}
                      </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {new Date(report.created_at).toLocaleString()}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td
                                    colSpan="5"
                                    className="px-6 py-8 text-center text-slate-500"
                                >
                                    No incident data available.
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