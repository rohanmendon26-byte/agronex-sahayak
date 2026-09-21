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

export default function SeniorDashboard() {
    const router = useRouter();

    const [need, setNeed] = useState("Medicine pickup");
    const [location, setLocation] = useState("Shirva");
    const [priority, setPriority] = useState("URGENT");

    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

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
        }
    };

    const handleCreateRequest = async (e) => {
        e.preventDefault();

        setLoading(true);
        setMessage("");
        setError("");

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/requests`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        need,
                        location,
                        priority
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data?.error?.message || "Failed to create request"
                );
            }

            setMessage("Assistance request created successfully.");

            setNeed("");
            setLocation("");
            setPriority("ROUTINE");

            fetchRequests();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };



    const handleEmergency = async (requestId) => {
        setLoading(true);
        setMessage("");
        setError("");

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/emergencies`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        requestId,
                        details: "Emergency assistance required"
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data?.error?.message || "Failed to escalate emergency"
                );
            }

            setMessage("Emergency escalated successfully.");
            fetchRequests();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
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
                            AgroNex <span className="text-emerald-400">Sahayak</span>
                        </h1>

                        <p className="text-xs text-slate-500">
                            Senior Dashboard
                        </p>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="text-sm text-slate-400 hover:text-white transition"
                    >
                        Logout
                    </button>
                </div>
            </nav>

            <div className="max-w-6xl mx-auto px-6 py-8">

                {/* Welcome */}
                <div className="mb-8">
                    <h2 className="text-3xl font-bold">
                        Welcome, Demo Senior
                    </h2>

                    <p className="text-slate-400 mt-2">
                        Request Assistance
                    </p>
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

                <div className="grid lg:grid-cols-2 gap-8">

                    {/* Create request */}
                    <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                        <h3 className="text-xl font-semibold mb-1">
                            New Assistance Request
                        </h3>

                        <p className="text-sm text-slate-500 mb-6">
                            Submit a request to the volunteer network.
                        </p>

                        <form onSubmit={handleCreateRequest}>

                            <label className="block text-sm text-slate-300 mb-2">
                                What do you need?
                            </label>

                            <input
                                type="text"
                                value={need}
                                onChange={(e) => setNeed(e.target.value)}
                                placeholder="e.g. Medicine pickup"
                                required
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-sm outline-none focus:border-emerald-500 mb-5"
                            />

                            <label className="block text-sm text-slate-300 mb-2">
                                Location
                            </label>

                            <input
                                type="text"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                placeholder="e.g. Shirva"
                                required
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-sm outline-none focus:border-emerald-500 mb-5"
                            />

                            <label className="block text-sm text-slate-300 mb-2">
                                Priority
                            </label>

                            <select
                                value={priority}
                                onChange={(e) => setPriority(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-sm outline-none focus:border-emerald-500 mb-6"
                            >
                                <option value="ROUTINE">Routine</option>
                                <option value="URGENT">Urgent</option>
                                <option value="EMERGENCY">Emergency</option>
                            </select>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-semibold rounded-lg py-3 transition"
                            >
                                {loading
                                    ? "Submitting..."
                                    : "Submit Assistance Request"}
                            </button>

                        </form>
                    </section>

                    {/* Request history */}
                    <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6">

                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-xl font-semibold">
                                    My Requests
                                </h3>

                                <p className="text-sm text-slate-500 mt-1">
                                    Demo Senior • Medicine pickup • Shirva
                                </p>
                            </div>

                            <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded-full text-xs">
                                {requests.length} Requests
                            </span>
                        </div>

                        {requests.length === 0 ? (
                            <div className="text-center py-12 text-slate-500">
                                No assistance requests yet.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {requests.map((request) => (
                                    <div
                                        key={request._id}
                                        className="border border-slate-800 rounded-xl p-4"
                                    >
                                        <div className="flex items-start justify-between gap-4">

                                            <div>
                                                <h4 className="font-medium">
                                                    {request.need}
                                                </h4>

                                                <p className="text-sm text-slate-500 mt-1">
                                                    {request.location}
                                                </p>
                                            </div>

                                            <span
                                                className={`text-xs px-3 py-1 rounded-full ${getStatusStyle(request.status)}`}
                                            >
                                                {request.status}
                                            </span>

                                        </div>

                                        <div className="flex justify-between mt-4 text-xs text-slate-600">
                                            <span className={`rounded-full px-2 py-1 ${getStatusStyle(request.priority)}`}>
                                                Priority: {request.priority}
                                            </span>

                                            <span>
                                                {new Date(
                                                    request.createdAt
                                                ).toLocaleDateString()}
                                            </span>
                                        </div>

                                        {request.status !== "COMPLETED" && (
                                            <button
                                                type="button"
                                                onClick={() => handleEmergency(request._id)}
                                                disabled={loading}
                                                className="mt-4 w-full border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-medium rounded-lg py-2 text-sm transition disabled:opacity-50"
                                            >
                                                🚨 Escalate Emergency
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                </div>
            </div>
        </main>
    );
}