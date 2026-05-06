import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function LoginPage() {
    const [form, setForm] = useState({
        email: "",
        password: "",
    });
    const [message, setMessage] = useState("");

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setForm((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
        setMessage("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const res = await api.post("/auth/login", form);
            login(res.data.user, res.data.token);

            if (res.data.user.role === "community") {
                navigate("/");
            } else {
                navigate("/dashboard");
            }
        } catch (error) {
            setMessage(error.response?.data?.message || "Login failed");
        }
    };

    return (
        <div className="max-w-md mx-auto">
            <div className="card p-8">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-600">
                    SafeVic Access
                </p>
                <h1 className="mt-2 text-3xl font-bold text-slate-900">Login</h1>
                <p className="mt-2 text-slate-500">
                    Sign in to access role-based features.
                </p>

                {message && (
                    <div className="mt-4 rounded-lg bg-red-100 px-4 py-3 text-red-700">
                        {message}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                    <div>
                        <label className="block mb-2 font-medium text-slate-700">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            className="w-full rounded-xl border border-slate-300 px-4 py-3"
                            placeholder="Enter email"
                        />
                    </div>

                    <div>
                        <label className="block mb-2 font-medium text-slate-700">Password</label>
                        <input
                            type="password"
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            className="w-full rounded-xl border border-slate-300 px-4 py-3"
                            placeholder="Enter password"
                        />
                    </div>

                    <button type="submit" className="btn-primary w-full justify-center">
                        Login
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-slate-500">
                    Don&apos;t have an account?{" "}
                    <Link
                        to="/signup"
                        className="font-semibold text-cyan-600 transition hover:text-cyan-700"
                    >
                        Create account
                    </Link>
                </p>
            </div>
        </div>
    );
}
