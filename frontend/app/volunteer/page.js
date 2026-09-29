"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ToastContainer, toast } from "react-toastify";
import {
  HeartHandshake,
  LogOut,
  User,
  MapPin,
  Clock,
  CheckCircle2,
  Play,
  Check,
  ShieldCheck,
  Power,
  RefreshCw,
  Loader2,
  Sparkles,
  AlertCircle,
  Zap,
  Navigation
} from "lucide-react";
import { calculateDistance } from "@/utils/distance";
import DeleteButton from "@/components/DeleteButton";

const getGpsMapUrl = (loc) => {
    if (typeof loc === "object" && loc !== null && loc.lat && loc.lng) {
        return `https://www.google.com/maps/dir/?api=1&destination=${loc.lat},${loc.lng}`;
    }
    const searchStr = typeof loc === "string" ? loc : [loc?.locality, loc?.city, loc?.state].filter(Boolean).join(", ") || "Shirva, Udupi";
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(searchStr)}`;
};

const formatLocation = (loc) => {
    if (!loc) return "Shirva, Udupi";
    if (typeof loc === "string") return loc;
    if (typeof loc === "object") {
        const parts = [loc.locality, loc.city, loc.state, loc.addressLine].filter(Boolean);
        if (parts.length > 0) return parts.join(", ");
        return Object.values(loc).filter(v => typeof v === "string").join(", ") || "Shirva, Udupi";
    }
    return String(loc);
};

const getStatusStyle = (status) => {
    const normalized = String(status || "").toUpperCase();

    const styles = {
        PENDING: "bg-amber-500/15 text-amber-300 border border-amber-500/30",
        ASSIGNED: "bg-violet-500/15 text-violet-300 border border-violet-500/30",
        IN_PROGRESS: "bg-sky-500/15 text-sky-300 border border-sky-500/30",
        COMPLETED: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30",
        ACTIVE: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30",
        VERIFIED: "bg-sky-500/15 text-sky-300 border border-sky-500/30",
        EMERGENCY: "bg-red-500/20 text-red-300 border border-red-500/40 font-bold animate-pulse",
        URGENT: "bg-rose-500/15 text-rose-300 border border-rose-500/30"
    };

    return styles[normalized] || "bg-slate-800 text-slate-300 border border-slate-700";
};

export default function VolunteerDashboard() {
    const router = useRouter();

    const [user, setUser] = useState({ name: "Volunteer" });
    const [requests, setRequests] = useState([]);
    const [activeNavSection, setActiveNavSection] = useState("ALL"); // "ALL" | "ASSIGNED" | "COMPLETED"
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

        const savedRole = localStorage.getItem("agronex_role");
        if (savedRole && savedRole !== "VOLUNTEER") {
            if (savedRole === "SENIOR") router.push("/senior");
            else if (savedRole === "POLICE_ADMIN") router.push("/admin");
            else router.push("/");
            return;
        }

        try {
            const savedUser = localStorage.getItem("agronex_user");
            if (savedUser) {
                const parsedUser = JSON.parse(savedUser);
                if (parsedUser?.name) {
                    setUser(parsedUser);
                    toast.info(`Welcome ${parsedUser.name}! Active as Volunteer Responder.`, { icon: "🤝" });
                }
            }
        } catch (error) {
            console.error("Failed to parse saved user:", error);
        }

        fetchVolunteerProfile();
        fetchRequests();
        syncGpsLocation();

        // 3-second auto-sync interval across devices/tabs
        const intervalId = setInterval(() => {
            fetchRequests(true);
        }, 3000);

        const handleStorageChange = (e) => {
            if (e.key === "agronex_sync") {
                fetchRequests(true);
            }
        };
        window.addEventListener("storage", handleStorageChange);

        return () => {
            clearInterval(intervalId);
            window.removeEventListener("storage", handleStorageChange);
        };
    }, []);

    const syncGpsLocation = async () => {
        if (typeof window === "undefined" || !navigator.geolocation || !token) return;
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                let localityName = "Shirva, Udupi";

                try {
                    const geoRes = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
                    );
                    const geoData = await geoRes.json();
                    if (geoData && geoData.address) {
                        const addr = geoData.address;
                        localityName =
                            addr.suburb ||
                            addr.village ||
                            addr.town ||
                            addr.city_district ||
                            addr.county ||
                            addr.city ||
                            "Live GPS Pin";
                    }
                } catch (err) {
                    console.warn("Reverse geocode failed:", err);
                }

                try {
                    const locationObj = {
                        locality: localityName,
                        lat: latitude,
                        lng: longitude
                    };

                    const res = await fetch(
                        `${process.env.NEXT_PUBLIC_API_URL}/volunteers/location`,
                        {
                            method: "PATCH",
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${token}`
                            },
                            body: JSON.stringify({ location: locationObj })
                        }
                    );
                    if (res.ok) {
                        notifySync();
                        toast.success(`📍 Live GPS Broadcasted to Police: ${localityName}`, { icon: "📡" });
                    }
                } catch (error) {
                    console.error("Failed to sync GPS location:", error);
                }
            },
            (error) => {
                console.warn("Geolocation access denied or unavailable:", error.message);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const notifySync = () => {
        if (typeof window !== "undefined") {
            localStorage.setItem("agronex_sync", String(Date.now()));
        }
    };

    const fetchVolunteerProfile = async () => {
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/volunteers/me`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 403) {
                    return;
                }
                throw new Error(
                    data?.error?.message || "Failed to load volunteer profile"
                );
            }

            const nextAvailability = data?.data?.availability ?? true;
            setAvailable(nextAvailability);
        } catch (err) {
            console.warn("Volunteer profile note:", err.message);
        }
    };

    const fetchRequests = async (isSilent = false) => {
        try {
            if (!isSilent) setLoading(true);
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
            if (!isSilent) setError(err.message);
        } finally {
            if (!isSilent) setLoading(false);
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

            let statusMsg = `Request status updated to ${status}.`;
            if (status === "IN_PROGRESS") {
                statusMsg = "🚗 Task started! Proceeding to senior location...";
                toast.info(statusMsg);
            } else if (status === "COMPLETED") {
                statusMsg = "🎉 Assistance task COMPLETED! Great job!";
                toast.success(statusMsg);
            } else {
                toast.success(statusMsg);
            }
            setMessage(statusMsg);

            notifySync();
            fetchRequests();
        } catch (err) {
            setError(err.message);
            toast.error(err.message || "Failed to update status");
        } finally {
            setUpdating("");
        }
    };

    const handleDeleteRequest = async (requestId) => {
        if (typeof window !== "undefined" && !window.confirm("Are you sure you want to delete this request?")) return;

        setUpdating(requestId);
        setError("");
        setMessage("");

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/requests/${requestId}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data?.error?.message || "Failed to delete request");
            }

            const deleteMsg = "Assistance request deleted successfully.";
            setMessage(deleteMsg);
            toast.success(deleteMsg);
            notifySync();
            fetchRequests();
        } catch (err) {
            setError(err.message);
            toast.error(err.message || "Failed to delete request");
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

            const nextAvailability = data?.data?.availability ?? !available;
            setAvailable(nextAvailability);

            if (nextAvailability) {
                const availMsg = "🟢 Status set to AVAILABLE! Ready for senior citizen requests.";
                setMessage(availMsg);
                toast.success(availMsg);
            } else {
                const unavailMsg = "🟡 Status set to UNAVAILABLE (Away).";
                setMessage(unavailMsg);
                toast.warn(unavailMsg);
            }
        } catch (err) {
            setError(err.message);
            toast.error(err.message || "Failed to update availability");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("agronex_token");
        localStorage.removeItem("agronex_role");
        localStorage.removeItem("agronex_user");
        router.push("/");
    };

    const countInProgress = requests.filter(r => r.status === "IN_PROGRESS").length;
    const countCompleted = requests.filter(r => r.status === "COMPLETED").length;

    return (
        <main className="min-h-screen bg-slate-950 text-white">

            {/* Navbar */}
            <nav className="glass-panel border-b border-slate-800/80 sticky top-0 z-30">
                <div className="max-w-6xl mx-auto px-4 py-3 sm:px-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center">
                            <HeartHandshake className="w-5 h-5 text-violet-400" />
                        </div>
                        <div>
                            <h1 className="text-lg font-extrabold tracking-tight">
                                AgroNex <span className="text-emerald-400">Sahayak</span>
                            </h1>
                            <p className="text-xs text-slate-400 font-medium">Volunteer Command Center</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={toggleAvailability}
                            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md ${
                                available
                                    ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-emerald-500/10"
                                    : "bg-slate-800 text-slate-400 border border-slate-700 hover:text-white"
                            }`}
                        >
                            <Power className="w-3.5 h-3.5" />
                            <span>{available ? "Available" : "Unavailable (Away)"}</span>
                        </button>

                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition"
                        >
                            <LogOut className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Logout</span>
                        </button>
                    </div>
                </div>
            </nav>

            <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6 sm:py-8">

                {/* Header */}
                <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 mb-2">
                            <ShieldCheck className="w-3.5 h-3.5 text-violet-400" />
                            <span className="text-xs font-semibold text-violet-300 uppercase tracking-wider">
                                Verified Community Responder
                            </span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                            Hello, {user.name || "Volunteer"}
                        </h2>
                        <p className="text-sm text-slate-400 mt-1">
                            Review incoming senior citizen assistance tasks in your coverage area.
                        </p>
                    </div>

                    <button
                        onClick={fetchRequests}
                        disabled={loading}
                        className="self-start sm:self-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 hover:text-white transition"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                        <span>Refresh Tasks</span>
                    </button>
                </div>

                {/* Notifications */}
                {message && (
                    <div className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300 flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                        <span>{message}</span>
                    </div>
                )}

                {error && (
                    <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300 flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Summary Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
                    <div className="glass-panel border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Assigned Tasks</p>
                            <p className="text-3xl font-extrabold text-white mt-1">{requests.length}</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center">
                            <Clock className="w-6 h-6 text-violet-400" />
                        </div>
                    </div>

                    <div className="glass-panel border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">In Progress</p>
                            <p className="text-3xl font-extrabold text-sky-400 mt-1">{countInProgress}</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center">
                            <Play className="w-6 h-6 text-sky-400" />
                        </div>
                    </div>

                    <div className="glass-panel border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Completed</p>
                            <p className="text-3xl font-extrabold text-emerald-400 mt-1">{countCompleted}</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                        </div>
                    </div>
                </div>

                {/* Volunteer Domain Navigation Tabs */}
                <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-900/90 border border-slate-800 rounded-2xl mb-8 shadow-inner">
                    <button
                        type="button"
                        onClick={() => setActiveNavSection("ALL")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                            activeNavSection === "ALL"
                                ? "bg-violet-500 text-slate-950 shadow-md shadow-violet-500/20"
                                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                        }`}
                    >
                        <Sparkles className="w-4 h-4" />
                        <span>All Requests ({requests.length})</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveNavSection("ASSIGNED")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                            activeNavSection === "ASSIGNED"
                                ? "bg-violet-500 text-slate-950 shadow-md shadow-violet-500/20"
                                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                        }`}
                    >
                        <Clock className="w-4 h-4" />
                        <span>⚡ Active Assigned Tasks ({requests.filter(r => r.status !== 'COMPLETED').length})</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveNavSection("COMPLETED")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                            activeNavSection === "COMPLETED"
                                ? "bg-violet-500 text-slate-950 shadow-md shadow-violet-500/20"
                                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                        }`}
                    >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>📜 Task History ({countCompleted})</span>
                    </button>
                </div>

                {/* Request List Feed */}
                <section className="glass-panel border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800/80">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                                <HeartHandshake className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">Community Requests</h3>
                                <p className="text-xs text-slate-400">Accept and fulfill requests assigned to you</p>
                            </div>
                        </div>

                        <span className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300 font-semibold">
                            {requests.filter(r => {
                                if (activeNavSection === "ASSIGNED") return r.status !== "COMPLETED";
                                if (activeNavSection === "COMPLETED") return r.status === "COMPLETED";
                                return true;
                            }).length} Displayed
                        </span>
                    </div>

                    {loading ? (
                        <div className="text-center py-16 text-slate-400 flex flex-col items-center gap-3">
                            <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
                            <p className="text-sm">Fetching request queue...</p>
                        </div>
                    ) : requests.filter(r => {
                        if (activeNavSection === "ASSIGNED") return r.status !== "COMPLETED";
                        if (activeNavSection === "COMPLETED") return r.status === "COMPLETED";
                        return true;
                    }).length === 0 ? (
                        <div className="text-center py-16 text-slate-500">
                            <ShieldCheck className="w-12 h-12 mx-auto text-slate-700 mb-3" />
                            <p className="text-sm">No assistance requests match selected section.</p>
                            <p className="text-xs text-slate-600 mt-1">Check another section or refresh your feed.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {requests.filter(r => {
                                if (activeNavSection === "ASSIGNED") return r.status !== "COMPLETED";
                                if (activeNavSection === "COMPLETED") return r.status === "COMPLETED";
                                return true;
                            }).map((request) => (
                                <div
                                    key={request._id}
                                    className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition"
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                        <div>
                                            <h4 className="text-lg font-bold text-white">
                                                {request.need}
                                            </h4>

                                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1.5">
                                                <div className="flex items-center gap-1.5">
                                                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                                                    <span>Location: {formatLocation(request.location)}</span>
                                                </div>
                                                <span className="text-[11px] font-mono text-emerald-300 bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-500/30 font-semibold flex items-center gap-1">
                                                    <Zap className="w-3 h-3 text-emerald-400" />
                                                    {calculateDistance(request.location, "Shirva")} km away
                                                </span>
                                            </div>

                                            <p className="text-[11px] text-slate-600 font-mono mt-2">
                                                ID: {request._id}
                                            </p>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                                request.channel === "VOICE"
                                                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                                                    : "bg-slate-800 text-slate-400 border border-slate-700"
                                            }`}>
                                                {request.channel === "VOICE" ? "🎙️ VOICE" : "📝 TEXT"}
                                            </span>
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusStyle(request.status)}`}>
                                                Status: {request.status}
                                            </span>
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusStyle(request.priority)}`}>
                                                Priority: {request.priority}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center justify-between gap-3 mt-5 pt-4 border-t border-slate-800/80">
                                        <a
                                            href={getGpsMapUrl(request.location)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition shadow-sm"
                                        >
                                            <Navigation className="w-3.5 h-3.5 text-emerald-400" />
                                            <span>🗺️ Open Live GPS Navigation</span>
                                        </a>

                                        <div className="flex items-center gap-2">
                                            {request.status === "ASSIGNED" && (
                                                <button
                                                    onClick={() => updateStatus(request._id, "IN_PROGRESS")}
                                                    disabled={updating === request._id}
                                                    className="flex items-center gap-2 bg-sky-500 hover:bg-sky-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold transition shadow-md shadow-sky-500/10 disabled:opacity-50"
                                                >
                                                    {updating === request._id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <Play className="w-4 h-4 fill-slate-950" />
                                                    )}
                                                    <span>Start Assistance</span>
                                                </button>
                                            )}

                                            {request.status === "IN_PROGRESS" && (
                                                <button
                                                    onClick={() => updateStatus(request._id, "COMPLETED")}
                                                    disabled={updating === request._id}
                                                    className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold transition shadow-md shadow-emerald-500/10 disabled:opacity-50"
                                                >
                                                    {updating === request._id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <Check className="w-4 h-4 stroke-[3]" />
                                                    )}
                                                    <span>Mark Completed</span>
                                                </button>
                                            )}

                                            {request.status === "COMPLETED" && (
                                                <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                                    Assistance Completed
                                                </span>
                                            )}

                                            <DeleteButton
                                                onClick={() => handleDeleteRequest(request._id)}
                                                disabled={updating === request._id}
                                                title="Delete Request"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
            <ToastContainer theme="dark" position="top-right" autoClose={3000} />
        </main>
    );
}