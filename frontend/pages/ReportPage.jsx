import { useState } from "react";
import api from "../services/api";

export default function ReportPage() {
    const [form, setForm] = useState({
        incident_type: "",
        description: "",
        suburb: "",
        latitude: "",
        longitude: "",
        incident_time: "",
        is_anonymous: false,
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm({
            ...form,
            [name]: type === "checkbox" ? checked : value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post("/reports", form);
            alert("Report submitted successfully");
            setForm({
                incident_type: "",
                description: "",
                suburb: "",
                latitude: "",
                longitude: "",
                incident_time: "",
                is_anonymous: false,
            });
        } catch (error) {
            console.error(error);
            alert("Failed to submit report");
        }
    };

    return (
        <div style={{ padding: "20px" }}>
            <h2>Report Incident</h2>
            <form onSubmit={handleSubmit}>
                <input name="incident_type" placeholder="Incident Type" value={form.incident_type} onChange={handleChange} /><br /><br />
                <textarea name="description" placeholder="Description" value={form.description} onChange={handleChange} /><br /><br />
                <input name="suburb" placeholder="Suburb" value={form.suburb} onChange={handleChange} /><br /><br />
                <input name="latitude" placeholder="Latitude" value={form.latitude} onChange={handleChange} /><br /><br />
                <input name="longitude" placeholder="Longitude" value={form.longitude} onChange={handleChange} /><br /><br />
                <input name="incident_time" type="datetime-local" value={form.incident_time} onChange={handleChange} /><br /><br />
                <label>
                    <input
                        type="checkbox"
                        name="is_anonymous"
                        checked={form.is_anonymous}
                        onChange={handleChange}
                    />
                    Anonymous
                </label>
                <br /><br />
                <button type="submit">Submit Report</button>
            </form>
        </div>
    );
}