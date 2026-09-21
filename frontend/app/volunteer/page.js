"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const getStatusStyle = (status) => {
    const normalized = String(status || "").toUpperCase();

    const styles = {
        PENDING: "bg-yellow-500/10 text-yellow-300 border border-yellow-500/20",
        ASSIGNED: "bg-violet-500/10 text-violet-300 border border-violet-500/20",
        IN_PROGRESS: "bg-blue-500/10 text-blue-300 border border-blue-500/20",
        COMPLETED: "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20",
        ACTIVE: "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20",
        VERIFIED: "bg-blue-500/10 text-blue-300 border border-blue-500/20",
        EMERGENCY: "bg-red-500/10 text-red-300 border border-red-500/20",
        URGENT: "bg-red-500/10 text-red-300 border border-red-500/20"
    };

    return styles[normalized] || "bg-slate-800 text-slate-300 border border-slate-700";
};

export default function VolunteerDashboard() {
    const router = useRouter();

    const [requests, setRequests] = useState([]);
    const [available, setAvailable] = useState(true);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState("");
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const token =
        typeof window !== "undefined"
            ? localStorage.getItem("agronex_token")
            : null;

    useEffect(() => {
        if (!token) {
            router.push("/");
            return;
        }

        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/requests`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data?.error?.message || "Failed to load requests"
                );
            }

            setRequests(data.data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (requestId, status) => {
        try {
            setUpdating(requestId);
            setError("");
            setMessage("");

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/requests/${requestId}/status`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        status
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data?.error?.message || "Failed to update status"
                );
            }

            setMessage(`Request updated to ${status}.`);

            fetchRequests();
        } catch (err) {
            setError(err.message);
        } finally {
            setUpdating("");
        }
    };

    const toggleAvailability = async () => {
        try {
            setError("");
            setMessage("");

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/volunteers/availability`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        availability: !available
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data?.error?.message ||
                    "Failed to update availability"
                );
            }

            setAvailable(!available);

            setMessage(
                `You are now ${!available ? "available" : "unavailable"} for assistance.`
            );
        } catch (err) {
            setError(err.message);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("agronex_token");
        localStorage.removeItem("agronex_role");
        router.push("/");
    };

    return (
        <main className="min-h-screen bg-slate-950 text-white">

            {/* Navbar */}
            <nav className="border-b border-slate-800 bg-slate-900">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">

                    <div>
                        <h1 className="text-xl font-bold">
                            AgroNex{" "}
                            <span className="text-emerald-400">
                                Sahayak
                            </span>
                        </h1>

                        <p className="text-xs text-slate-500">
                            Volunteer Dashboard
                        </p>
                    </div>

                    <div className="flex items-center gap-4">

                        <button
                            onClick={toggleAvailability}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${available
                                    ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                                    : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                                }`}
                        >
                            {available
                                ? "Available"
                                : "Unavailable"}
                        </button>

                        <button
                            onClick={handleLogout}
                            className="text-sm text-slate-400 hover:text-white"
                        >
                            Logout
                        </button>

                    </div>
                </div>
            </nav>

            <div className="max-w-6xl mx-auto px-6 py-8">

                {/* Header */}
                <div className="mb-8">
                    <h2 className="text-3xl font-bold">
                        Volunteer Dashboard
                    </h2>

                    <div className="mt-4 flex items-center gap-3">
                        <span className="text-sm text-slate-400">Demo Volunteer</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${available ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20" : "bg-slate-700 text-slate-300 border border-slate-600"}`}>
                            {available ? "ACTIVE" : "UNAVAILABLE"}
                        </span>
                    </div>
                </div>

                {/* Messages */}
                {message && (
                    <div className="mb-6 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
                        {message}
                    </div>
                )}

                {error && (
                    <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                        {error}
                    </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">

                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                        <p className="text-sm text-slate-500">
                            Assigned
                        </p>

                        <p className="text-3xl font-bold mt-2">
                            {requests.length}
                        </p>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                        <p className="text-sm text-slate-500">
                            In Progress
                        </p>

                        <p className="text-3xl font-bold mt-2">
                            {
                                requests.filter(
                                    (request) =>
                                        request.status === "IN_PROGRESS"
                                ).length
                            }
                        </p>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                        <p className="text-sm text-slate-500">
                            Completed
                        </p>

                        <p className="text-3xl font-bold mt-2">
                            {
                                requests.filter(
                                    (request) =>
                                        request.status === "COMPLETED"
                                ).length
                            }
                        </p>
                    </div>

                </div>

                {/* Requests */}
                <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6">

                    <h3 className="text-xl font-semibold mb-6">
                        Assistance Requests
                    </h3>

                    {loading ? (
                        <div className="text-center py-12 text-slate-500">
                            Loading requests...
                        </div>
                    ) : requests.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            No requests assigned to you.
                        </div>
                    ) : (
                        <div className="space-y-4">

                            {requests.map((request) => (

                                <div
                                    key={request._id}
                                    className="border border-slate-800 rounded-xl p-5"
                                >

                                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">

                                        <div>
                                            <h4 className="text-lg font-semibold">
                                                {request.need}
                                            </h4>

                                            <p className="text-sm text-slate-500 mt-1">
                                                Location: {request.location}
                                            </p>

                                            <p className="text-xs text-slate-600 mt-2">
                                                Request ID: {request._id}
                                            </p>
                                        </div>

                                        <span className={`w-fit px-3 py-1 rounded-full text-xs ${getStatusStyle(request.status)}`}>
                                            {request.status}
                                        </span>

                                    </div>

                                    <div className="flex flex-wrap items-center gap-3 mt-5">

                                        <span className="text-xs text-slate-500">
                                            Priority:{" "}
                                            <span className="text-slate-300">
                                                {request.priority}
                                            </span>
                                        </span>

                                        {request.status === "ASSIGNED" && (
                                            <button
                                                onClick={() =>
                                                    updateStatus(
                                                        request._id,
                                                        "IN_PROGRESS"
                                                    )
                                                }
                                                disabled={
                                                    updating === request._id
                                                }
                                                className="ml-auto bg-blue-500 hover:bg-blue-400 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium"
                                            >
                                                {updating === request._id
                                                    ? "Updating..."
                                                    : "Start Assistance"}
                                            </button>
                                        )}

                                        {request.status === "IN_PROGRESS" && (
                                            <button
                                                onClick={() =>
                                                    updateStatus(
                                                        request._id,
                                                        "COMPLETED"
                                                    )
                                                }
                                                disabled={
                                                    updating === request._id
                                                }
                                                className="ml-auto bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 px-4 py-2 rounded-lg text-sm font-medium"
                                            >
                                                {updating === request._id
                                                    ? "Updating..."
                                                    : "Mark Completed"}
                                            </button>
                                        )}

                                        {request.status === "COMPLETED" && (
                                            <span className="ml-auto text-sm text-emerald-400">
                                                ✓ Assistance completed
                                            </span>
                                        )}

                                    </div>

                                </div>

                            ))}

                        </div>
                    )}

                </section>

            </div>
        </main>
    );
}