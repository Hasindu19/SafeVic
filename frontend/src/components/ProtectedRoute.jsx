import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function ProtectedRoute({ children, allowedRoles }) {
    const { user, authLoading } = useAuth();

    // Wait until localStorage auth is restored
    if (authLoading) {
        return (
            <div className="flex min-h-[40vh] items-center justify-center text-slate-600">
                Checking login...
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to="/" replace />;
    }

    return children;
}