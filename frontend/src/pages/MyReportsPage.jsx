import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext.jsx";

export default function MyReportsPage() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const { logout } = useAuth();

    useEffect(() => {
        const fetchMyReports = async () => {
            try {
                const res = await api.get("/reports/mine");

                setReports(res.data);
                setLoading(false);
            } catch (error) {
                console.error(error);

                if (error.response?.status === 401) {
                    logout();
                    navigate("/login", { replace: true });
                    return;
                }

                setError(error.response?.data?.message || "Failed to load your reports");
                setLoading(false);
            }
        };

        fetchMyReports();
    }, [logout, navigate]);

    if (loading) {
        return <div className="text-slate-600">Loading your reports...</div>;
    }

    if (error) {
        return <div className="text-red-600">{error}</div>;
    }

    return (
        <div className="space-y-6">
            <section className="card p-7">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-600">
                    My Activity
                </p>
                <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-900">
                    My Reports
                </h1>
                <p className="mt-3 max-w-2xl text-slate-500">
                    View and track all incidents you have submitted to the SafeVic platform.
                </p>
            </section>

            <section className="card overflow-hidden">
                <div className="border-b border-slate-200 px-6 py-5">
                    <h2 className="text-xl font-semibold text-slate-900">
                        Submitted Reports
                    </h2>
                    <p className="mt-1 text-slate-500">
                        Total reports submitted by you: {reports.length}
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
                            <th className="px-6 py-4 font-medium">Date</th>
                            <th className="px-6 py-4 font-medium">Action</th>
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
                                        {new Date(report.created_at).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <Link
                                            to={`/incidents/${report.id}`}
                                            className="inline-flex items-center justify-center rounded-lg bg-cyan-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-cyan-700"
                                            style={{ color: "#ffffff", textDecoration: "none" }}
                                        >
                                            View
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td
                                    colSpan="6"
                                    className="px-6 py-8 text-center text-slate-500"
                                >
                                    You have not submitted any reports yet.
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
