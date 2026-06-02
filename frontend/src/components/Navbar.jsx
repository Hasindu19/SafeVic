import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

export default function Navbar() {
    const location = useLocation();
    const { user, logout, authLoading } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);

    if (authLoading) {
        return null;
    }

    const navLinkClass = (path) =>
        `block rounded-lg px-3 py-2 transition hover:bg-slate-50 hover:text-cyan-600 md:inline md:rounded-none md:px-0 md:py-0 md:hover:bg-transparent ${
            location.pathname === path ? "font-semibold text-cyan-600" : "text-slate-700"
        }`;

    const navigationLink = (to, label) => (
        <Link to={to} onClick={() => setMenuOpen(false)} className={navLinkClass(to)}>
            {label}
        </Link>
    );

    const handleLogout = () => {
        setMenuOpen(false);
        logout();
    };

    const navItems = (
        <>
            {navigationLink("/", "Home")}
            {navigationLink("/map", "Map")}
            {navigationLink("/feed", "Feed")}

            {user && (
                navigationLink("/report", "Report")
            )}

            {user && (
                navigationLink("/my-reports", "My Reports")
            )}

            {user && (
                navigationLink("/alert-settings", "Alerts")
            )}

            {user && ["council", "police_admin"].includes(user.role) && (
                navigationLink("/dashboard", "Dashboard")
            )}

            {!user ? (
                <>
                    {navigationLink("/login", "Login")}
                    {navigationLink("/signup", "Sign Up")}
                </>
            ) : (
                <button
                    onClick={handleLogout}
                    className="block rounded-lg px-3 py-2 text-left text-slate-700 transition hover:bg-slate-50 hover:text-cyan-600 md:inline md:rounded-none md:px-0 md:py-0 md:hover:bg-transparent"
                >
                    Logout
                </button>
            )}
        </>
    );

    return (
        <header className="safevic-navbar sticky z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
            <div className="relative mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 md:px-6 md:py-4">
                <Link to="/" onClick={() => setMenuOpen(false)} className="min-w-0 text-xl font-bold tracking-tight text-cyan-600 md:text-2xl">
                    SafeVic
                </Link>

                <nav className="hidden flex-wrap items-center justify-end gap-x-6 gap-y-3 text-sm md:flex md:text-base">
                    {navItems}
                </nav>

                <button
                    type="button"
                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-700 transition hover:border-cyan-300 hover:text-cyan-600 md:hidden"
                    aria-label="Open navigation menu"
                    aria-expanded={menuOpen}
                    onClick={() => setMenuOpen((open) => !open)}
                >
                    <span className="flex w-5 flex-col gap-1.5" aria-hidden="true">
                        <span className="h-0.5 rounded-full bg-current" />
                        <span className="h-0.5 rounded-full bg-current" />
                        <span className="h-0.5 rounded-full bg-current" />
                    </span>
                </button>

                {menuOpen && (
                    <nav className="safevic-mobile-menu absolute left-4 right-4 top-full mt-2 flex max-h-[calc(100vh-120px)] flex-col gap-1 overflow-y-auto rounded-lg border border-slate-200 bg-white p-3 text-base shadow-xl md:hidden">
                        {navItems}
                    </nav>
                )}
            </div>
        </header>
    );
}
