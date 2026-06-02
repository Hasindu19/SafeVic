import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const features = [
    {
        title: "Real-time community reporting",
        description: "Submit precise incident information quickly, with location-aware reporting that helps others stay informed.",
    },
    {
        title: "Interactive incident map",
        description: "Explore reported safety risks near you and understand what is happening across local suburbs.",
    },
    {
        title: "Role-based safety management",
        description: "Keep public access simple while giving authorised teams the tools needed for accountable review.",
    },
    {
        title: "Analytics dashboard",
        description: "Turn incident records into practical visibility across status, category, location, and activity trends.",
    },
];

const steps = [
    {
        number: "01",
        title: "Community submits incident",
        description: "Residents securely report an event with time, location, and useful context.",
    },
    {
        number: "02",
        title: "Incident appears on map",
        description: "Local users can discover relevant safety reports through the interactive map.",
    },
    {
        number: "03",
        title: "Admin reviews and updates status",
        description: "Authorised teams track progress from pending through resolution.",
    },
];

export default function HomePage() {
    const { user } = useAuth();
    const reportPath = user ? "/report" : "/login";

    return (
        <div className="space-y-10 pb-8 md:space-y-14">
            <section className="relative overflow-hidden rounded-3xl border border-cyan-100 bg-white px-5 py-10 shadow-xl shadow-slate-200/60 sm:px-9 md:py-16 lg:px-14">
                <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-cyan-100/70 blur-3xl" aria-hidden="true" />
                <div className="absolute -bottom-20 left-1/3 h-60 w-60 rounded-full bg-blue-100/70 blur-3xl" aria-hidden="true" />

                <div className="relative grid items-center gap-10 lg:grid-cols-[1.08fr_0.92fr]">
                    <div>
                        <p className="inline-flex rounded-full bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-700">
                            Safer communities through shared insight
                        </p>
                        <h1 className="mt-6 max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                            Community Safety, Smarter Reporting
                        </h1>
                        <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                            SafeVic helps communities report incidents, view nearby safety risks,
                            and support data-driven response with accessible, location-aware tools.
                        </p>

                        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                            <Link to="/map" className="btn-primary min-h-12">
                                View Safety Map
                            </Link>
                            <Link to={reportPath} className="btn-secondary min-h-12">
                                Report Incident
                            </Link>
                            <Link to="/signup" className="btn-outline min-h-12">
                                Create Account
                            </Link>
                        </div>
                    </div>

                    <div className="card relative p-5 sm:p-7">
                        <div className="rounded-2xl bg-slate-950 p-5 text-white sm:p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
                                        Safety overview
                                    </p>
                                    <p className="mt-2 text-2xl font-bold">Live community view</p>
                                </div>
                                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/20 text-xl font-bold text-cyan-300">
                                    SV
                                </span>
                            </div>

                            <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-900 p-4">
                                <div className="flex justify-between text-sm text-slate-300">
                                    <span>Nearby incident awareness</span>
                                    <span className="text-emerald-300">Active</span>
                                </div>
                                <div className="mt-5 space-y-3">
                                    <div className="h-2 w-full rounded-full bg-slate-700">
                                        <div className="h-2 w-3/4 rounded-full bg-cyan-400" />
                                    </div>
                                    <div className="h-2 w-full rounded-full bg-slate-700">
                                        <div className="h-2 w-1/2 rounded-full bg-blue-400" />
                                    </div>
                                    <div className="h-2 w-full rounded-full bg-slate-700">
                                        <div className="h-2 w-5/6 rounded-full bg-emerald-400" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section>
                <div className="max-w-2xl">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-600">Platform Features</p>
                    <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                        Everything needed for clear local safety visibility
                    </h2>
                </div>
                <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {features.map((feature) => (
                        <article key={feature.title} className="card p-6">
                            <div className="mb-5 h-1.5 w-12 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500" />
                            <h3 className="text-lg font-semibold text-slate-900">{feature.title}</h3>
                            <p className="mt-3 text-sm leading-7 text-slate-600">{feature.description}</p>
                        </article>
                    ))}
                </div>
            </section>

            <section className="card px-5 py-8 sm:px-8 md:p-10">
                <div className="text-center">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-600">How It Works</p>
                    <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                        Report, understand, respond
                    </h2>
                </div>
                <div className="mt-9 grid gap-5 md:grid-cols-3">
                    {steps.map((step) => (
                        <article key={step.number} className="rounded-2xl border border-slate-100 bg-slate-50 p-6">
                            <span className="text-sm font-bold text-cyan-600">{step.number}</span>
                            <h3 className="mt-4 text-xl font-semibold text-slate-900">{step.title}</h3>
                            <p className="mt-3 text-sm leading-7 text-slate-600">{step.description}</p>
                        </article>
                    ))}
                </div>
            </section>

            <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-cyan-700 to-blue-700 px-6 py-10 text-center text-white shadow-xl sm:px-10 md:py-14">
                <h2 className="text-3xl font-bold tracking-tight">Help make your community safer today</h2>
                <p className="mx-auto mt-4 max-w-2xl leading-7 text-cyan-50">
                    Explore local incident visibility or create an account to contribute reliable
                    community safety information.
                </p>
                <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                    <Link to="/map" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-white px-6 py-3 font-semibold text-cyan-700 transition hover:bg-cyan-50">
                        Explore The Map
                    </Link>
                    <Link to="/signup" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/40 px-6 py-3 font-semibold text-white transition hover:bg-white/10">
                        Get Started
                    </Link>
                </div>
            </section>
        </div>
    );
}
