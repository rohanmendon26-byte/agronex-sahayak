"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {
  HeartHandshake,
  MapPin,
  Clock,
  CheckCircle2,
  Play,
  Check,
  Power,
  RefreshCw,
  Loader2,
  Navigation
} from "lucide-react";
import { calculateDistance } from "@/utils/distance";
import { getUserLocation } from "@/utils/geolocation";
import DeleteButton from "@/components/DeleteButton";
import Loader from "@/components/Loader";

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
        const parts = [loc.locality, loc.city, loc.state].filter(Boolean);
        if (parts.length > 0) return parts.join(", ");
        return "Shirva, Udupi";
    }
    return String(loc);
};

const getStatusStyle = (status) => {
    const normalized = String(status || "").toUpperCase();
    const styles = {
        PENDING: "bg-amber-500/15 text-amber-300 border-amber-500/30",
        ASSIGNED: "bg-violet-500/15 text-violet-300 border-violet-500/30",
        IN_PROGRESS: "bg-sky-500/15 text-sky-300 border-sky-500/30",
        COMPLETED: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
        EMERGENCY: "bg-red-500/20 text-red-300 border-red-500/40 animate-pulse font-bold",
        URGENT: "bg-rose-500/15 text-rose-300 border-rose-500/30"
    };
    return styles[normalized] || "bg-slate-800 text-slate-300 border-slate-700";
};

export default function VolunteerDashboard() {
    const router = useRouter();

    const [user, setUser] = useState({ name: "Volunteer" });
    const [requests, setRequests] = useState([]);
    const [activeNavSection, setActiveNavSection] = useState("ALL");
    const [available, setAvailable] = useState(true);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState("");
    const [gpsLocation, setGpsLocation] = useState({
        lat: 13.2250,
        lng: 74.8030,
        locality: "Shirva, Udupi",
        loading: false
    });

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
                if (parsedUser?.name) setUser(parsedUser);
            }
        } catch (error) {
            console.error(error);
        }

        fetchVolunteerProfile();
        fetchRequests();
        syncGpsLocation(false);

        const intervalId = setInterval(() => {
            fetchRequests(true);
        }, 3000);

        const handleStorageChange = (e) => {
            if (e.key === "agronex_sync") fetchRequests(true);
        };
        window.addEventListener("storage", handleStorageChange);

        return () => {
            clearInterval(intervalId);
            window.removeEventListener("storage", handleStorageChange);
        };
    }, []);

    const syncGpsLocation = async (isManualClick = false) => {
        if (typeof window === "undefined" || !token) return;
        if (!navigator.geolocation) {
            if (isManualClick) toast.warn("Geolocation is not supported by your browser");
            return;
        }

        setGpsLocation((prev) => ({ ...prev, loading: true }));
        try {
            const geo = await getUserLocation();
            const resolvedLocality = geo.displayName || geo.locality;
            setGpsLocation({
                lat: geo.lat,
                lng: geo.lng,
                locality: resolvedLocality,
                city: geo.city,
                state: geo.state,
                loading: false
            });

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/volunteers/location`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    location: {
                        locality: geo.locality || resolvedLocality,
                        city: geo.city || "Udupi",
                        state: geo.state || "Karnataka",
                        lat: geo.lat,
                        lng: geo.lng
                    }
                })
            });

            if (res.ok) {
                notifySync();
                if (isManualClick) {
                    toast.success(`📍 Volunteer patrol location updated: ${geo.locality}`);
                }
            }
        } catch (err) {
            setGpsLocation((prev) => ({ ...prev, loading: false }));
            if (isManualClick) {
                toast.warn(err.message || "Could not read GPS location");
            }
        }
    };

    const notifySync = () => {
        if (typeof window !== "undefined") {
            localStorage.setItem("agronex_sync", String(Date.now()));
        }
    };

    const fetchVolunteerProfile = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/volunteers/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) {
                setAvailable(data?.data?.availability ?? true);
                if (data?.data?.location) {
                    const loc = data.data.location;
                    const localityStr = loc.locality ? `${loc.locality}${loc.city && loc.city !== loc.locality ? `, ${loc.city}` : ""}` : "Shirva, Udupi";
                    setGpsLocation(prev => ({
                        ...prev,
                        lat: loc.lat || prev.lat,
                        lng: loc.lng || prev.lng,
                        locality: localityStr
                    }));
                }
            }
        } catch (e) {
            console.warn(e);
        }
    };

    const fetchRequests = async (isSilent = false) => {
        try {
            if (!isSilent) setLoading(true);
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/requests`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) setRequests(data.data || []);
        } catch (e) {
            console.error(e);
        } finally {
            if (!isSilent) setLoading(false);
        }
    };

    const updateStatus = async (requestId, status) => {
        try {
            setUpdating(requestId);
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/requests/${requestId}/status`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({ status })
                }
            );

            if (!response.ok) throw new Error("Update failed");
            toast.success(status === "COMPLETED" ? "Task Completed!" : "Task Started!");
            notifySync();
            fetchRequests();
        } catch (err) {
            toast.error(err.message || "Failed to update");
        } finally {
            setUpdating("");
        }
    };

    const handleDeleteRequest = async (requestId) => {
        if (!window.confirm("Delete this request?")) return;

        setUpdating(requestId);
        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/requests/${requestId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Deleted");
            notifySync();
            fetchRequests();
        } catch (err) {
            toast.error("Failed to delete");
        } finally {
            setUpdating("");
        }
    };

    const toggleAvailability = async () => {
        try {
            const next = !available;
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/volunteers/availability`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ availability: next })
            });

            if (res.ok) {
                setAvailable(next);
                toast.info(next ? "Status: Online" : "Status: Away");
            }
        } catch (e) {
            toast.error("Failed to toggle");
        }
    };

    const countInProgress = requests.filter(r => r.status === "IN_PROGRESS").length;
    const countCompleted = requests.filter(r => r.status === "COMPLETED").length;

    const filtered = requests.filter(r => {
        if (activeNavSection === "ASSIGNED") return r.status !== "COMPLETED";
        if (activeNavSection === "COMPLETED") return r.status === "COMPLETED";
        return true;
    });

    return (
        <main className="max-w-5xl mx-auto px-3 py-3 sm:px-4 sm:py-5 space-y-3.5">
            {/* Header */}
            <div className="p-3 sm:p-4 rounded-2xl bg-slate-900/90 border border-violet-500/30 flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-violet-500/20 text-violet-400 flex items-center justify-center font-bold">
                        <HeartHandshake className="w-4 h-4" />
                    </div>
                    <div>
                        <h2 className="text-base sm:text-lg font-bold text-white">
                            Volunteer: {user.name || "Volunteer"}
                        </h2>
                        <button
                            type="button"
                            onClick={() => syncGpsLocation(true)}
                            disabled={gpsLocation.loading}
                            className="text-[11px] text-violet-300 hover:text-white font-medium flex items-center gap-1 transition"
                            title="Click to refresh your volunteer patrol GPS location"
                        >
                            <Navigation className={`w-3 h-3 ${gpsLocation.loading ? "animate-spin text-amber-400" : "text-violet-400"}`} />
                            <span>{gpsLocation.loading ? "Updating GPS..." : gpsLocation.locality}</span>
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={toggleAvailability}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                            available
                                ? "bg-emerald-500 text-slate-950"
                                : "bg-slate-800 text-slate-300 border border-slate-700"
                        }`}
                    >
                        <Power className="w-3.5 h-3.5" />
                        <span>{available ? "Online" : "Away"}</span>
                    </button>

                    <button
                        type="button"
                        onClick={fetchRequests}
                        disabled={loading}
                        className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-slate-800 text-xs text-slate-300 hover:text-white border border-slate-700 transition"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                    </button>
                </div>
            </div>

            {/* Compact Metric Bar */}
            <div className="grid grid-cols-3 gap-2">
                <div className="glass-panel border border-slate-800 rounded-xl p-2.5 sm:p-3 text-center">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Queue</p>
                    <p className="text-xl sm:text-2xl font-black text-white mt-0.5">{requests.length}</p>
                </div>
                <div className="glass-panel border border-slate-800 rounded-xl p-2.5 sm:p-3 text-center">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Active</p>
                    <p className="text-xl sm:text-2xl font-black text-sky-400 mt-0.5">{countInProgress}</p>
                </div>
                <div className="glass-panel border border-slate-800 rounded-xl p-2.5 sm:p-3 text-center">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Done</p>
                    <p className="text-xl sm:text-2xl font-black text-emerald-400 mt-0.5">{countCompleted}</p>
                </div>
            </div>

            {/* Compact Navigation Filter */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 border border-slate-800 rounded-xl text-xs">
                <button
                    type="button"
                    onClick={() => setActiveNavSection("ALL")}
                    className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition ${
                        activeNavSection === "ALL" ? "bg-violet-500 text-slate-950" : "text-slate-400 hover:text-white"
                    }`}
                >
                    All ({requests.length})
                </button>
                <button
                    type="button"
                    onClick={() => setActiveNavSection("ASSIGNED")}
                    className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition ${
                        activeNavSection === "ASSIGNED" ? "bg-violet-500 text-slate-950" : "text-slate-400 hover:text-white"
                    }`}
                >
                    Active Tasks
                </button>
                <button
                    type="button"
                    onClick={() => setActiveNavSection("COMPLETED")}
                    className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition ${
                        activeNavSection === "COMPLETED" ? "bg-violet-500 text-slate-950" : "text-slate-400 hover:text-white"
                    }`}
                >
                    Completed ({countCompleted})
                </button>
            </div>

            {/* Task Cards Feed */}
            <section className="glass-panel border border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-lg space-y-2.5">
                {loading && filtered.length === 0 ? (
                    <Loader size="sm" text="Syncing community tasks" />
                ) : filtered.length === 0 ? (
                    <p className="py-8 text-center text-xs text-slate-500">No tasks in this section</p>
                ) : (
                    <div className="space-y-2.5">
                        {filtered.map((req) => (
                            <div
                                key={req._id}
                                className="p-3 sm:p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition space-y-2 text-xs"
                            >
                                <div className="flex items-center justify-between gap-1.5">
                                    <h4 className="font-bold text-white text-sm truncate">{req.need}</h4>
                                    <div className="flex items-center gap-1 shrink-0">
                                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${getStatusStyle(req.priority)}`}>
                                            {req.priority}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusStyle(req.status)}`}>
                                            {req.status}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 text-slate-400 text-[11px]">
                                    <span className="flex items-center gap-1">
                                        <MapPin className="w-3 h-3 text-emerald-400" />
                                        {formatLocation(req.location)}
                                    </span>
                                    <span className="text-emerald-400 font-mono font-semibold">
                                        ~{calculateDistance(req.location, "Shirva")} km
                                    </span>
                                </div>

                                <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                                    <a
                                        href={getGpsMapUrl(req.location)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/30 text-[11px] font-bold transition"
                                    >
                                        <Navigation className="w-3 h-3 text-emerald-400" />
                                        <span>Maps</span>
                                    </a>

                                    <div className="flex items-center gap-1.5">
                                        {req.status === "ASSIGNED" && (
                                            <button
                                                onClick={() => updateStatus(req._id, "IN_PROGRESS")}
                                                disabled={updating === req._id}
                                                className="px-3 py-1 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold transition flex items-center gap-1"
                                            >
                                                <Play className="w-3 h-3 fill-slate-950" />
                                                <span>Start</span>
                                            </button>
                                        )}

                                        {req.status === "IN_PROGRESS" && (
                                            <button
                                                onClick={() => updateStatus(req._id, "COMPLETED")}
                                                disabled={updating === req._id}
                                                className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition flex items-center gap-1"
                                            >
                                                <Check className="w-3 h-3" />
                                                <span>Complete</span>
                                            </button>
                                        )}

                                        {req.status === "COMPLETED" && (
                                            <span className="text-emerald-400 font-bold text-[11px] flex items-center gap-1">
                                                <CheckCircle2 className="w-3.5 h-3.5" /> Done
                                            </span>
                                        )}

                                        <DeleteButton
                                            onClick={() => handleDeleteRequest(req._id)}
                                            disabled={updating === req._id}
                                            title="Delete"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}