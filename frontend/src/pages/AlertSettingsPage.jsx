import { useEffect, useState } from "react";
import api from "../services/api.js";

const radii = [1, 3, 5, 10, 20];

export default function AlertSettingsPage() {
    const [preferences, setPreferences] = useState({
        alerts_enabled: true,
        radius_km: 5,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        const loadPreferences = async () => {
            try {
                const result = await api.get("/alert-preferences/me");
                setPreferences({
                    alerts_enabled: result.data.alerts_enabled,
                    radius_km: result.data.radius_km,
                });
            } catch (loadError) {
                setError(loadError.response?.data?.message || "Unable to load alert preferences.");
            } finally {
                setLoading(false);
            }
        };

        loadPreferences();
    }, []);

    const handleSave = async (event) => {
        event.preventDefault();
        setSaving(true);
        setError("");
        setMessage("");

        try {
            const result = await api.put("/alert-preferences/me", preferences);
            setPreferences(result.data.preferences);
            setMessage(result.data.message);
        } catch (saveError) {
            setError(saveError.response?.data?.message || "Unable to save alert preferences.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="text-slate-600">Loading alert settings...</div>;
    }

    return (
        <div className="mx-auto max-w-2xl space-y-6">
            <section className="card p-5 sm:p-8">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-600">
                    Nearby Alerts
                </p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                    Notification Preferences
                </h1>
                <p className="mt-3 text-slate-500">
                    Choose whether to receive nearby incident notifications and how close a
                    report must be before SafeVic alerts you.
                </p>
            </section>

            <form onSubmit={handleSave} className="card space-y-7 p-5 sm:p-8">
                {message && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-700">
                        {message}
                    </div>
                )}
                {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
                        {error}
                    </div>
                )}

                <fieldset>
                    <legend className="font-semibold text-slate-900">Nearby incident alerts</legend>
                    <p className="mt-1 text-sm text-slate-500">
                        Push notifications require an Android device registered with SafeVic.
                    </p>
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                        {[
                            [true, "Enabled"],
                            [false, "Disabled"],
                        ].map(([value, label]) => (
                            <label key={label} className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-4 py-3">
                                <input
                                    type="radio"
                                    name="alerts_enabled"
                                    checked={preferences.alerts_enabled === value}
                                    onChange={() => setPreferences((current) => ({ ...current, alerts_enabled: value }))}
                                />
                                <span className="font-medium text-slate-700">{label}</span>
                            </label>
                        ))}
                    </div>
                </fieldset>

                <div>
                    <label htmlFor="alert-radius" className="font-semibold text-slate-900">
                        Alert radius
                    </label>
                    <select
                        id="alert-radius"
                        value={preferences.radius_km}
                        disabled={!preferences.alerts_enabled}
                        onChange={(event) =>
                            setPreferences((current) => ({
                                ...current,
                                radius_km: Number(event.target.value),
                            }))
                        }
                        className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none disabled:bg-slate-100 disabled:text-slate-400"
                    >
                        {radii.map((radius) => (
                            <option key={radius} value={radius}>
                                {radius} km
                            </option>
                        ))}
                    </select>
                </div>

                <button type="submit" disabled={saving} className="btn-primary w-full disabled:opacity-60 sm:w-auto">
                    {saving ? "Saving..." : "Save Preferences"}
                </button>
            </form>
        </div>
    );
}
