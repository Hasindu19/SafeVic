import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import api from "../services/api";
import { useAuth } from "../context/AuthContext.jsx";
import {
  formatSeverity,
  formatStatus,
  severityStyles,
  statusStyles,
} from "../utils/reportPresentation.js";

const PIE_COLORS = ["#0891b2", "#2563eb", "#14b8a6", "#6366f1", "#f59e0b"];

const SEVERITY_ORDER = { low: 1, medium: 2, high: 3, critical: 4 };

export default function DashboardPage() {
  const [riskEvaluationTime] = useState(() => Date.now());
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [suburbFilter, setSuburbFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await api.get("/reports");
        setReports(res.data);
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch reports:", error);

        if (error.response?.status === 401) {
          logout();
          navigate("/login", { replace: true });
          return;
        }

        setError(error.response?.data?.message || "Failed to load dashboard data");
        setLoading(false);
      }
    };

    fetchReports();
  }, [logout, navigate]);

  const incidentTypes = useMemo(() => {
    return [...new Set(reports.map((r) => r.incident_type).filter(Boolean))];
  }, [reports]);

  const suburbs = useMemo(() => {
    return [...new Set(reports.map((r) => r.suburb).filter(Boolean))];
  }, [reports]);

  const filteredReports = useMemo(() => {
    let data = [...reports];

    if (search.trim()) {
      const q = search.toLowerCase();

      data = data.filter((report) =>
        [
          report.incident_type,
          report.suburb,
          report.description,
          report.status,
          report.severity,
          String(report.id),
        ]
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }

    if (typeFilter !== "all") {
      data = data.filter((report) => report.incident_type === typeFilter);
    }

    if (suburbFilter !== "all") {
      data = data.filter((report) => report.suburb === suburbFilter);
    }

    if (statusFilter !== "all") {
      data = data.filter((report) => report.status === statusFilter);
    }

    if (severityFilter !== "all") {
      data = data.filter((report) => (report.severity || "medium") === severityFilter);
    }

    data.sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.created_at) - new Date(a.created_at);
      }

      if (sortBy === "oldest") {
        return new Date(a.created_at) - new Date(b.created_at);
      }

      if (sortBy === "type_az") {
        return (a.incident_type || "").localeCompare(b.incident_type || "");
      }

      if (sortBy === "type_za") {
        return (b.incident_type || "").localeCompare(a.incident_type || "");
      }

      if (sortBy === "suburb_az") {
        return (a.suburb || "").localeCompare(b.suburb || "");
      }

      if (sortBy === "suburb_za") {
        return (b.suburb || "").localeCompare(a.suburb || "");
      }

      if (sortBy === "severity_high") {
        return (SEVERITY_ORDER[b.severity || "medium"] || 0) - (SEVERITY_ORDER[a.severity || "medium"] || 0);
      }

      return 0;
    });

    return data;
  }, [reports, search, typeFilter, suburbFilter, statusFilter, severityFilter, sortBy]);

  const stats = useMemo(() => {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    return {
      total: reports.length,
      last24h: reports.filter((r) => new Date(r.created_at) >= last24Hours)
        .length,
      pending: reports.filter((r) => r.status === "pending").length,
      underReview: reports.filter((r) => r.status === "under_review").length,
      resolved: reports.filter((r) => r.status === "resolved").length,
    };
  }, [reports]);

  const categoryData = useMemo(
    () =>
      incidentTypes.map((type) => ({
        name: type,
        incidents: reports.filter((report) => report.incident_type === type).length,
      })),
    [incidentTypes, reports]
  );

  const suburbData = useMemo(
    () =>
      suburbs
        .map((suburb) => ({
          name: suburb,
          value: reports.filter((report) => report.suburb === suburb).length,
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6),
    [reports, suburbs]
  );

  const riskScores = useMemo(() => {
    const sevenDaysAgo = riskEvaluationTime - 7 * 24 * 60 * 60 * 1000;

    return suburbs
      .map((suburb) => {
        const suburbReports = reports.filter((report) => report.suburb === suburb);
        const recent = suburbReports.filter((report) => new Date(report.created_at).getTime() >= sevenDaysAgo).length;
        const unresolved = suburbReports.filter((report) => report.status !== "resolved").length;
        const serious = suburbReports.filter((report) => ["high", "critical"].includes(report.severity)).length;
        const score = Math.min(100, recent * 18 + unresolved * 12 + serious * 20 + suburbReports.length * 4);
        const signals = [];

        if (recent > 0) signals.push("recent activity");
        if (unresolved > 0) signals.push("unresolved reports");
        if (serious > 0) signals.push("high severity incidents");

        return {
          suburb,
          score,
          explanation: signals.length > 0 ? signals.join(" + ") : "recorded incident activity",
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [reports, riskEvaluationTime, suburbs]);

  if (loading) {
    return <div className="text-slate-600">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="text-red-600">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <section className="card p-5 md:p-7">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-600">
          Safety Management Dashboard
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
          Incident Management
        </h1>
        <p className="mt-3 max-w-2xl text-slate-500">
          Search, filter, sort, and review submitted incident reports.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div className="card p-6">
          <p className="text-sm text-slate-500">Total Incidents</p>
          <p className="mt-3 text-4xl font-bold text-slate-900">
            {stats.total}
          </p>
        </div>

        <div className="card border-amber-100 p-6">
          <p className="text-sm text-slate-500">Pending</p>
          <p className="mt-3 text-4xl font-bold text-slate-900">
            {stats.pending}
          </p>
        </div>

        <div className="card border-blue-100 p-6">
          <p className="text-sm text-slate-500">Under Review</p>
          <p className="mt-3 text-4xl font-bold text-slate-900">
            {stats.underReview}
          </p>
        </div>

        <div className="card border-emerald-100 p-6">
          <p className="text-sm text-slate-500">Resolved</p>
          <p className="mt-3 text-4xl font-bold text-slate-900">
            {stats.resolved}
          </p>
        </div>

        <div className="card p-6 sm:col-span-2 xl:col-span-1">
          <p className="text-sm text-slate-500">Last 24 Hours</p>
          <p className="mt-3 text-4xl font-bold text-slate-900">
            {stats.last24h}
          </p>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="card p-5 md:p-6">
          <h2 className="text-xl font-semibold text-slate-900">Incidents By Category</h2>
          <p className="mt-1 text-sm text-slate-500">Distribution across reported incident types.</p>
          <div className="mt-6 h-72">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} margin={{ top: 5, right: 6, left: -22, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" angle={-28} textAnchor="end" interval={0} height={60} fontSize={12} />
                  <YAxis allowDecimals={false} fontSize={12} />
                  <Tooltip cursor={{ fill: "#f1f5f9" }} />
                  <Bar dataKey="incidents" fill="#0891b2" radius={[7, 7, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="flex h-full items-center justify-center text-sm text-slate-500">No incident data yet.</p>
            )}
          </div>
        </div>

        <div className="card p-5 md:p-6">
          <h2 className="text-xl font-semibold text-slate-900">Top Suburbs</h2>
          <p className="mt-1 text-sm text-slate-500">Locations with the most submitted incidents.</p>
          <div className="mt-6 h-72">
            {suburbData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={suburbData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="48%"
                    outerRadius={86}
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {suburbData.map((entry, index) => (
                      <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="flex h-full items-center justify-center text-sm text-slate-500">No suburb data yet.</p>
            )}
          </div>
        </div>
      </section>

      <section className="card p-5 md:p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-600">
          Rule-Based Risk Score
        </p>
        <h2 className="mt-2 text-xl font-semibold text-slate-900">Suburb Risk Scores</h2>
        <p className="mt-2 text-sm text-slate-500">
          Explainable score based on seven-day activity, unresolved reports, severity, and total volume.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {riskScores.map((risk) => (
            <div key={risk.suburb} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-slate-900">{risk.suburb}</p>
                <p className="text-lg font-bold text-cyan-700">{risk.score}</p>
              </div>
              <div className="mt-3 h-2 rounded-full bg-slate-200">
                <div className="h-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600" style={{ width: `${risk.score}%` }} />
              </div>
              <p className="mt-3 text-xs leading-5 text-slate-500">{risk.explanation}</p>
            </div>
          ))}
          {riskScores.length === 0 && <p className="text-sm text-slate-500">No suburb data yet.</p>}
        </div>
      </section>

      <section className="card p-4 md:p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reports..."
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
          />

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
          >
            <option value="all">All Types</option>
            {incidentTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>

          <select
            value={suburbFilter}
            onChange={(e) => setSuburbFilter(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
          >
            <option value="all">All Suburbs</option>
            {suburbs.map((suburb) => (
              <option key={suburb} value={suburb}>
                {suburb}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="under_review">Under Review</option>
            <option value="resolved">Resolved</option>
          </select>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
          >
            <option value="all">All Severities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="type_az">Type A-Z</option>
            <option value="type_za">Type Z-A</option>
            <option value="suburb_az">Suburb A-Z</option>
            <option value="suburb_za">Suburb Z-A</option>
            <option value="severity_high">Highest Severity</option>
          </select>
        </div>

        <p className="mt-4 text-sm text-slate-500">
          Showing {filteredReports.length} of {reports.length} reports.
        </p>
      </section>

      <section className="card overflow-hidden">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-xl font-semibold text-slate-900">
            Incident Records
          </h2>
          <p className="mt-1 text-slate-500">
            Open each record to review its location, timeline, and current status.
          </p>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="min-w-[920px]">
            <thead className="bg-slate-50">
              <tr className="text-left text-sm text-slate-500">
                <th className="px-6 py-4 font-medium">ID</th>
                <th className="px-6 py-4 font-medium">Type</th>
                <th className="px-6 py-4 font-medium">Suburb</th>
                <th className="px-6 py-4 font-medium">Severity</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredReports.length > 0 ? (
                filteredReports.map((report) => (
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
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${severityStyles[report.severity] || severityStyles.medium}`}>
                        {formatSeverity(report.severity)}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${statusStyles[report.status] || statusStyles.pending}`}
                      >
                        {formatStatus(report.status)}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      {new Date(report.created_at).toLocaleString()}
                      {report.image_url && (
                        <span className="ml-2 rounded bg-slate-100 px-2 py-1 text-xs text-slate-600">Photo</span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <Link
                        to={`/incidents/${report.id}`}
                        className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-2 text-sm font-semibold shadow transition hover:from-cyan-700 hover:to-blue-700 hover:shadow-lg"
                        style={{ color: "#ffffff", textDecoration: "none" }}
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-8 text-center text-slate-500"
                  >
                    No matching reports found.
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
