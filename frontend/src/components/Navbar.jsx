import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Navbar() {
    const location = useLocation();
    const { user, logout, authLoading } = useAuth();

    if (authLoading) {
        return null;
    }

    const navLinkClass = (path) =>
        `transition hover:text-cyan-600 ${
            location.pathname === path ? "text-cyan-600 font-semibold" : "text-slate-700"
        }`;

    return (
        <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                <Link to="/" className="text-2xl font-bold tracking-tight text-cyan-600">
                    SafeVic
                </Link>

                <nav className="flex items-center gap-6 text-sm md:text-base">
                    <Link to="/" className={navLinkClass("/")}>
                        Map
                    </Link>

                    {user && (
                        <Link to="/report" className={navLinkClass("/report")}>
                            Report
                        </Link>
                    )}

                    {user && ["council", "police_admin"].includes(user.role) && (
                        <Link to="/dashboard" className={navLinkClass("/dashboard")}>
                            Dashboard
                        </Link>
                    )}

                    {!user ? (
                        <Link to="/login" className={navLinkClass("/login")}>
                            Login
                        </Link>
                    ) : (
                        <button
                            onClick={logout}
                            className="text-slate-700 transition hover:text-cyan-600"
                        >
                            Logout
                        </button>
                    )}
                </nav>
            </div>
        </header>
    );
}