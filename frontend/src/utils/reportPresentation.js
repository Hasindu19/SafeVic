export const statusStyles = {
    pending: "bg-amber-100 text-amber-700",
    under_review: "bg-blue-100 text-blue-700",
    resolved: "bg-emerald-100 text-emerald-700",
};

export const severityStyles = {
    low: "bg-emerald-100 text-emerald-700",
    medium: "bg-blue-100 text-blue-700",
    high: "bg-amber-100 text-amber-700",
    critical: "bg-red-100 text-red-700",
};

export const formatStatus = (status = "pending") =>
    status === "under_review"
        ? "Under Review"
        : `${status.charAt(0).toUpperCase()}${status.slice(1)}`;

export const formatSeverity = (severity = "medium") =>
    `${severity.charAt(0).toUpperCase()}${severity.slice(1)}`;
