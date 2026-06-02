import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api.js";
import {
    formatSeverity,
    formatStatus,
    severityStyles,
    statusStyles,
} from "../utils/reportPresentation.js";

export default function SafetyFeedPage() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        api.get("/reports")
            .then((result) => setReports(result.data))
            .catch((fetchError) =>
                setError(fetchError.response?.data?.message || "Unable to load community safety feed.")
            )
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return <div className="text-slate-600">Loading community safety feed...</div>;
    }

    return (
        <div className="space-y-6">
            <section className="card p-5 sm:p-7">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-600">
                    Community Updates
                </p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                    Safety Feed
                </h1>
                <p className="mt-3 max-w-2xl text-slate-500">
                    Recent incident reports shared for community awareness. Reporter identities
                    are not displayed.
                </p>
            </section>

            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
                    {error}
                </div>
            )}

            <section className="grid gap-4 lg:grid-cols-2">
                {reports.map((report) => (
                    <article key={report.id} className="card p-5 sm:p-6">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <h2 className="text-xl font-semibold text-slate-900">{report.incident_type}</h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    {report.suburb} &middot; {new Date(report.created_at).toLocaleString()}
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${severityStyles[report.severity] || severityStyles.medium}`}>
                                    {formatSeverity(report.severity)}
                                </span>
                                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[report.status] || statusStyles.pending}`}>
                                    {formatStatus(report.status)}
                                </span>
                            </div>
                        </div>

                        {report.image_url && (
                            <img
                                src={report.image_url}
                                alt=""
                                className="mt-4 h-40 w-full rounded-xl object-cover"
                            />
                        )}

                        <p className="mt-4 line-clamp-3 leading-7 text-slate-600">{report.description}</p>
                        <Link to={`/incidents/${report.id}`} className="btn-primary mt-5 min-h-11 text-sm">
                            View Details
                        </Link>
                    </article>
                ))}
            </section>

            {!error && reports.length === 0 && (
                <div className="card px-5 py-10 text-center text-slate-500">
                    No incidents have been reported yet.
                </div>
            )}
        </div>
    );
}
