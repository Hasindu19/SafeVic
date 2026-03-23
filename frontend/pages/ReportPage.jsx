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

    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState("");

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        setForm({
            ...form,
            [name]: type === "checkbox" ? checked : value,
        });

        setErrors((prev) => ({
            ...prev,
            [name]: "",
        }));

        setMessage("");
    };

    const validateForm = () => {
        const newErrors = {};

        if (!form.incident_type.trim()) {
            newErrors.incident_type = "Incident type is required";
        }

        if (!form.description.trim()) {
            newErrors.description = "Description is required";
        }

        if (!form.suburb.trim()) {
            newErrors.suburb = "Suburb is required";
        }

        if (form.latitude === "") {
            newErrors.latitude = "Latitude is required";
        } else if (
            isNaN(form.latitude) ||
            Number(form.latitude) < -90 ||
            Number(form.latitude) > 90
        ) {
            newErrors.latitude = "Latitude must be between -90 and 90";
        }

        if (form.longitude === "") {
            newErrors.longitude = "Longitude is required";
        } else if (
            isNaN(form.longitude) ||
            Number(form.longitude) < -180 ||
            Number(form.longitude) > 180
        ) {
            newErrors.longitude = "Longitude must be between -180 and 180";
        }

        if (!form.incident_time) {
            newErrors.incident_time = "Incident time is required";
        }

        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const validationErrors = validateForm();

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            setMessage("");
            return;
        }

        try {
            const res = await api.post("/reports", {
                ...form,
                latitude: Number(form.latitude),
                longitude: Number(form.longitude),
            });

            setMessage(res.data.message || "Report submitted successfully");
            setErrors({});

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
            setMessage(
                error.response?.data?.message || "Failed to submit report"
            );
        }
    };

    return (
        <div style={{ padding: "20px", maxWidth: "600px" }}>
            <h2>Report Incident</h2>

            {message && (
                <p style={{ marginBottom: "15px", fontWeight: "bold" }}>{message}</p>
            )}

            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: "15px" }}>
                    <input
                        name="incident_type"
                        placeholder="Incident Type"
                        value={form.incident_type}
                        onChange={handleChange}
                        style={{ width: "100%", padding: "10px" }}
                    />
                    {errors.incident_type && (
                        <p style={{ color: "red", marginTop: "5px" }}>
                            {errors.incident_type}
                        </p>
                    )}
                </div>

                <div style={{ marginBottom: "15px" }}>
          <textarea
              name="description"
              placeholder="Description"
              value={form.description}
              onChange={handleChange}
              style={{ width: "100%", padding: "10px", minHeight: "100px" }}
          />
                    {errors.description && (
                        <p style={{ color: "red", marginTop: "5px" }}>
                            {errors.description}
                        </p>
                    )}
                </div>

                <div style={{ marginBottom: "15px" }}>
                    <input
                        name="suburb"
                        placeholder="Suburb"
                        value={form.suburb}
                        onChange={handleChange}
                        style={{ width: "100%", padding: "10px" }}
                    />
                    {errors.suburb && (
                        <p style={{ color: "red", marginTop: "5px" }}>
                            {errors.suburb}
                        </p>
                    )}
                </div>

                <div style={{ marginBottom: "15px" }}>
                    <input
                        name="latitude"
                        placeholder="Latitude"
                        value={form.latitude}
                        onChange={handleChange}
                        style={{ width: "100%", padding: "10px" }}
                    />
                    {errors.latitude && (
                        <p style={{ color: "red", marginTop: "5px" }}>
                            {errors.latitude}
                        </p>
                    )}
                </div>

                <div style={{ marginBottom: "15px" }}>
                    <input
                        name="longitude"
                        placeholder="Longitude"
                        value={form.longitude}
                        onChange={handleChange}
                        style={{ width: "100%", padding: "10px" }}
                    />
                    {errors.longitude && (
                        <p style={{ color: "red", marginTop: "5px" }}>
                            {errors.longitude}
                        </p>
                    )}
                </div>

                <div style={{ marginBottom: "15px" }}>
                    <input
                        name="incident_time"
                        type="datetime-local"
                        value={form.incident_time}
                        onChange={handleChange}
                        style={{ width: "100%", padding: "10px" }}
                    />
                    {errors.incident_time && (
                        <p style={{ color: "red", marginTop: "5px" }}>
                            {errors.incident_time}
                        </p>
                    )}
                </div>

                <div style={{ marginBottom: "15px" }}>
                    <label>
                        <input
                            type="checkbox"
                            name="is_anonymous"
                            checked={form.is_anonymous}
                            onChange={handleChange}
                        />{" "}
                        Anonymous
                    </label>
                </div>

                <button type="submit" style={{ padding: "10px 20px" }}>
                    Submit Report
                </button>
            </form>
        </div>
    );
}