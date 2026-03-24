import { Link, useLocation } from "react-router-dom";

export default function Navbar() {
    const location = useLocation();

    const navLinkClass = (path) =>
        `transition hover:text-cyan-600 ${
            location.pathname === path ? "text-cyan-600 font-semibold" : "text-slate-700"
        }`;

    return (
        <header className="fixed top-0 left-0 w-full z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                <Link to="/" className="text-2xl font-bold tracking-tight text-cyan-600">
                    SafeVic
                </Link>

                <nav className="flex items-center gap-6 text-sm md:text-base">
                    <Link to="/" className={navLinkClass("/")}>
                        Map
                    </Link>
                    <Link to="/report" className={navLinkClass("/report")}>
                        Report
                    </Link>
                    <Link to="/dashboard" className={navLinkClass("/dashboard")}>
                        Dashboard
                    </Link>
                </nav>
            </div>
        </header>
    );
}