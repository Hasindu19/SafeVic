import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api.js";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignupPage() {
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
    });
    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState("");
    const [success, setSuccess] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setForm((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
        setErrors((prev) => ({
            ...prev,
            [e.target.name]: "",
        }));
        setMessage("");
    };

    const validateForm = () => {
        const newErrors = {};

        if (!form.name.trim()) {
            newErrors.name = "Full name is required";
        }

        if (!form.email.trim()) {
            newErrors.email = "Email is required";
        } else if (!emailRegex.test(form.email.trim())) {
            newErrors.email = "Enter a valid email address";
        }

        if (!form.password) {
            newErrors.password = "Password is required";
        } else if (form.password.length < 6) {
            newErrors.password = "Password must be at least 6 characters";
        } else if (!/[A-Z]/.test(form.password)) {
            newErrors.password = "Must include at least 1 uppercase letter";
        } else if (!/[a-z]/.test(form.password)) {
            newErrors.password = "Must include at least 1 lowercase letter";
        } else if (!/[0-9]/.test(form.password)) {
            newErrors.password = "Must include at least 1 number";
        }

        if (!form.confirmPassword) {
            newErrors.confirmPassword = "Confirm your password";
        } else if (form.confirmPassword !== form.password) {
            newErrors.confirmPassword = "Passwords do not match";
        }

        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const validationErrors = validateForm();

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            setSuccess(false);
            setMessage("");
            return;
        }

        try {
            setSubmitting(true);
            setMessage("");

            await api.post("/auth/register", {
                name: form.name.trim(),
                email: form.email.trim(),
                password: form.password,
                role: "community",
            });

            setSuccess(true);
            setMessage("Account created successfully. Redirecting to login...");

            setTimeout(() => {
                navigate("/login");
            }, 1000);
        } catch (error) {
            setSuccess(false);
            if (error.response?.data?.message) {
                setMessage(error.response.data.message);
            } else if (error.request) {
                setMessage(
                    `Cannot reach backend at ${api.defaults.baseURL}. Check Wi-Fi and make sure the backend is running.`
                );
            } else {
                setMessage("Signup failed. Please try again.");
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="mx-auto max-w-md">
            <div className="card p-8">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-600">
                    SafeVic Community
                </p>
                <h1 className="mt-2 text-3xl font-bold text-slate-900">
                    Create Account
                </h1>
                <p className="mt-2 text-slate-500">
                    Join SafeVic to submit and track your community safety reports.
                </p>

                {message && (
                    <div
                        className={`mt-4 rounded-lg px-4 py-3 ${
                            success
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-red-100 text-red-700"
                        }`}
                    >
                        {message}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                    <div>
                        <label className="mb-2 block font-medium text-slate-700">
                            Full name
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                            placeholder="Enter full name"
                        />
                        {errors.name && (
                            <p className="mt-2 text-sm text-red-600">{errors.name}</p>
                        )}
                    </div>

                    <div>
                        <label className="mb-2 block font-medium text-slate-700">
                            Email
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                            placeholder="Enter email"
                        />
                        {errors.email && (
                            <p className="mt-2 text-sm text-red-600">{errors.email}</p>
                        )}
                    </div>

                    <div>
                        <label className="mb-2 block font-medium text-slate-700">
                            Password
                        </label>
                        <input
                            type="password"
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                            placeholder="Create password"
                        />
                        <p className="mt-2 text-sm text-slate-500">
                            Must include uppercase, lowercase, and a number
                        </p>
                        {errors.password && (
                            <p className="mt-2 text-sm text-red-600">{errors.password}</p>
                        )}
                    </div>

                    <div>
                        <label className="mb-2 block font-medium text-slate-700">
                            Confirm password
                        </label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={form.confirmPassword}
                            onChange={handleChange}
                            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                            placeholder="Confirm password"
                        />
                        {errors.confirmPassword && (
                            <p className="mt-2 text-sm text-red-600">
                                {errors.confirmPassword}
                            </p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="btn-primary w-full justify-center disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        {submitting ? "Creating account..." : "Create account"}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-slate-500">
                    Already have an account?{" "}
                    <Link
                        to="/login"
                        className="font-semibold text-cyan-600 transition hover:text-cyan-700"
                    >
                        Login
                    </Link>
                </p>
            </div>
        </div>
    );
}
