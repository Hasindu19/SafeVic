import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext.jsx";

export default function DashboardPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [suburbFilter, setSuburbFilter] = useState("all");
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

      return 0;
    });

    return data;
  }, [reports, search, typeFilter, suburbFilter, sortBy]);

  const stats = useMemo(() => {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    return {
      total: reports.length,
      last24h: reports.filter((r) => new Date(r.created_at) >= last24Hours)
        .length,
      pending: reports.filter((r) => r.status === "pending").length,
      resolved: reports.filter((r) => r.status === "resolved").length,
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
          Police Admin Dashboard
        </p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-900">
          Incident Management
        </h1>
        <p className="mt-3 max-w-2xl text-slate-500">
          Search, filter, sort, and review submitted incident reports.
        </p>
      </section>

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <div className="card p-6">
          <p className="text-sm text-slate-500">Total Incidents</p>
          <p className="mt-3 text-4xl font-bold text-slate-900">
            {stats.total}
          </p>
        </div>

        <div className="card p-6">
          <p className="text-sm text-slate-500">Last 24 Hours</p>
          <p className="mt-3 text-4xl font-bold text-slate-900">
            {stats.last24h}
          </p>
        </div>

        <div className="card p-6">
          <p className="text-sm text-slate-500">Pending</p>
          <p className="mt-3 text-4xl font-bold text-slate-900">
            {stats.pending}
          </p>
        </div>

        <div className="card p-6">
          <p className="text-sm text-slate-500">Resolved</p>
          <p className="mt-3 text-4xl font-bold text-slate-900">
            {stats.resolved}
          </p>
        </div>
      </section>

      <section className="card p-6">
        <div className="grid gap-4 lg:grid-cols-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reports..."
            className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
          />

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
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
            className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
          >
            <option value="all">All Suburbs</option>
            {suburbs.map((suburb) => (
              <option key={suburb} value={suburb}>
                {suburb}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="type_az">Type A-Z</option>
            <option value="type_za">Type Z-A</option>
            <option value="suburb_az">Suburb A-Z</option>
            <option value="suburb_za">Suburb Z-A</option>
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
            Police admins can open each record to review and update status.
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
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          report.status === "resolved"
                            ? "bg-emerald-100 text-emerald-700"
                            : report.status === "under_review"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {report.status}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      {new Date(report.created_at).toLocaleString()}
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
                    colSpan="6"
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
