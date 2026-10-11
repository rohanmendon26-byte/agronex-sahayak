"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {
  ShieldCheck,
  Users,
  FileText,
  CheckCircle2,
  UserCheck,
  Clock,
  RefreshCw,
  Siren,
  MapPin,
  Check,
  Zap,
  Navigation
} from "lucide-react";
import { calculateDistance } from "@/utils/distance";
import DeleteButton from "@/components/DeleteButton";
import Loader from "@/components/Loader";

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
        ACTIVE: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
        VERIFIED: "bg-sky-500/15 text-sky-300 border-sky-500/30",
        EMERGENCY: "bg-red-500/20 text-red-300 border-red-500/40 animate-pulse font-bold",
        URGENT: "bg-rose-500/15 text-rose-300 border-rose-500/30"
    };
    return styles[normalized] || "bg-slate-800 text-slate-300 border-slate-700";
};

export default function AdminDashboard() {
    const router = useRouter();

    const [volunteers, setVolunteers] = useState([]);
    const [requests, setRequests] = useState([]);
    const [auditLogs, setAuditLogs] = useState([]);
    const [activeNavSection, setActiveNavSection] = useState("ALL");

    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState("");

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
        if (savedRole && savedRole !== "POLICE_ADMIN") {
            if (savedRole === "SENIOR") router.push("/senior");
            else if (savedRole === "VOLUNTEER") router.push("/volunteer");
            else router.push("/");
            return;
        }

        loadDashboard();

        const intervalId = setInterval(() => {
            loadDashboard(true);
        }, 3000);

        const handleStorageChange = (e) => {
            if (e.key === "agronex_sync") loadDashboard(true);
        };
        window.addEventListener("storage", handleStorageChange);

        return () => {
            clearInterval(intervalId);
            window.removeEventListener("storage", handleStorageChange);
        };
    }, []);

    const notifySync = () => {
        if (typeof window !== "undefined") {
            localStorage.setItem("agronex_sync", String(Date.now()));
        }
    };

    const loadDashboard = async (isSilent = false) => {
        try {
            if (!isSilent) setLoading(true);

            const headers = { Authorization: `Bearer ${token}` };
            const [vRes, rRes, aRes] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/volunteers`, { headers }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/requests`, { headers }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/audit-logs`, { headers })
            ]);

            const vData = await vRes.json();
            const rData = await rRes.json();
            const aData = await aRes.json();

            if (vRes.ok) setVolunteers(vData.data || []);
            if (rRes.ok) setRequests(rData.data || []);
            if (aRes.ok) setAuditLogs(aData.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            if (!isSilent) setLoading(false);
        }
    };

    const updateVolunteer = async (id, action) => {
        try {
            setUpdating(id);
            const options = {
                method: "PATCH",
                headers: { Authorization: `Bearer ${token}` }
            };

            if (action === "verify") {
                options.headers["Content-Type"] = "application/json";
                options.body = JSON.stringify({ verificationNotes: "Verified by Police Admin" });
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/volunteers/${id}/${action}`, options);
            if (!response.ok) throw new Error("Operation failed");

            toast.success(`Volunteer ${action}d!`);
            notifySync();
            await loadDashboard();
        } catch (err) {
            toast.error(err.message || "Failed");
        } finally {
            setUpdating("");
        }
    };

    const assignVolunteer = async (requestId, volunteerId) => {
        try {
            setUpdating(requestId);
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/requests/${requestId}/assign`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({ volunteerId })
                }
            );

            if (!response.ok) throw new Error("Assign failed");
            toast.success("Volunteer assigned!");
            notifySync();
            await loadDashboard();
        } catch (err) {
            toast.error("Failed to assign");
        } finally {
            setUpdating("");
        }
    };

    const handleDeleteRequest = async (requestId) => {
        if (!window.confirm("Delete request?")) return;
        setUpdating(requestId);
        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/requests/${requestId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Deleted");
            notifySync();
            await loadDashboard();
        } catch (err) {
            toast.error("Failed to delete");
        } finally {
            setUpdating("");
        }
    };

    const handleDeleteVolunteer = async (volunteerId) => {
        if (!window.confirm("Delete volunteer?")) return;
        setUpdating(volunteerId);
        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/volunteers/${volunteerId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Volunteer deleted");
            notifySync();
            await loadDashboard();
        } catch (err) {
            toast.error("Failed to delete");
        } finally {
            setUpdating("");
        }
    };

    const handleDeleteAuditLog = async (logId) => {
        if (!window.confirm("Delete log?")) return;
        setUpdating(logId);
        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/audit-logs/${logId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Log deleted");
            notifySync();
            await loadDashboard();
        } catch (err) {
            toast.error("Failed to delete");
        } finally {
            setUpdating("");
        }
    };

    const verifiedVolunteers = volunteers.filter(v => v.status === "ACTIVE");
    const emergencyRequests = requests.filter(
        r => r.status !== "COMPLETED" && (r.status === "EMERGENCY" || r.priority === "EMERGENCY")
    );

    return (
        <main className="max-w-6xl mx-auto px-3 py-3 sm:px-4 sm:py-5 space-y-3.5">
            {/* Header */}
            <div className="p-3 sm:p-4 rounded-2xl bg-slate-900/90 border border-blue-500/30 flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                        <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                        <h2 className="text-base sm:text-lg font-bold text-white">Police Dispatch Console</h2>
                        <span className="text-[11px] text-slate-400">Shirva Emergency Jurisdiction</span>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={loadDashboard}
                    disabled={loading}
                    className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white border border-slate-700 transition"
                >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                </button>
            </div>

            {/* Emergency SOS Banner */}
            {emergencyRequests.length > 0 && (
                <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 flex items-center justify-between gap-2 text-xs font-bold animate-pulse">
                    <div className="flex items-center gap-2">
                        <Siren className="w-4 h-4 text-red-400" />
                        <span>🚨 {emergencyRequests.length} ACTIVE EMERGENCY SOS ALERT(S)</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-red-500/30 text-[10px]">High Priority</span>
                </div>
            )}

            {/* Metrics Counters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                <div className="glass-panel border border-slate-800 rounded-xl p-2.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Volunteers</span>
                    <p className="text-xl font-black text-white mt-0.5">{volunteers.length}</p>
                </div>
                <div className="glass-panel border border-slate-800 rounded-xl p-2.5">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase">Active</span>
                    <p className="text-xl font-black text-emerald-400 mt-0.5">{verifiedVolunteers.length}</p>
                </div>
                <div className="glass-panel border border-slate-800 rounded-xl p-2.5">
                    <span className="text-[10px] font-bold text-amber-400 uppercase">Pending</span>
                    <p className="text-xl font-black text-amber-400 mt-0.5">{requests.filter(r => r.status === "PENDING").length}</p>
                </div>
                <div className="glass-panel border border-slate-800 rounded-xl p-2.5">
                    <span className="text-[10px] font-bold text-sky-400 uppercase">Done</span>
                    <p className="text-xl font-black text-sky-400 mt-0.5">{requests.filter(r => r.status === "COMPLETED").length}</p>
                </div>
            </div>

            {/* Section Switcher */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 border border-slate-800 rounded-xl text-xs">
                <button
                    type="button"
                    onClick={() => setActiveNavSection("ALL")}
                    className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition ${
                        activeNavSection === "ALL" ? "bg-blue-500 text-slate-950" : "text-slate-400 hover:text-white"
                    }`}
                >
                    All
                </button>
                <button
                    type="button"
                    onClick={() => setActiveNavSection("VOLUNTEERS")}
                    className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition ${
                        activeNavSection === "VOLUNTEERS" ? "bg-blue-500 text-slate-950" : "text-slate-400 hover:text-white"
                    }`}
                >
                    Volunteers ({volunteers.length})
                </button>
                <button
                    type="button"
                    onClick={() => setActiveNavSection("REQUESTS")}
                    className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition ${
                        activeNavSection === "REQUESTS" ? "bg-blue-500 text-slate-950" : "text-slate-400 hover:text-white"
                    }`}
                >
                    Dispatch ({requests.length})
                </button>
                <button
                    type="button"
                    onClick={() => setActiveNavSection("AUDIT")}
                    className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition ${
                        activeNavSection === "AUDIT" ? "bg-blue-500 text-slate-950" : "text-slate-400 hover:text-white"
                    }`}
                >
                    Audit ({auditLogs.length})
                </button>
            </div>

            {/* Sections */}
            <div className="space-y-3.5">
                {/* Volunteers */}
                {(activeNavSection === "ALL" || activeNavSection === "VOLUNTEERS") && (
                    <section className="glass-panel border border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-lg space-y-2.5">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-bold text-white">
                            <span className="flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5 text-blue-400" /> Volunteers Roster
                            </span>
                            <span className="text-slate-400">{volunteers.length} Total</span>
                        </div>

                        {loading && volunteers.length === 0 ? (
                            <Loader size="sm" text="Syncing volunteer roster" />
                        ) : volunteers.length === 0 ? (
                            <p className="py-4 text-center text-xs text-slate-500">No volunteers registered</p>
                        ) : (
                            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                                {volunteers.map((vol) => {
                                    const id = vol._id || vol.userId;
                                    const isVerified = vol.status === "VERIFIED" || vol.status === "ACTIVE";
                                    const isActive = vol.status === "ACTIVE";

                                    return (
                                        <div
                                            key={id}
                                            className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-2.5 text-xs"
                                        >
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-bold text-white">{vol.name || "Volunteer"}</h4>
                                                    <span className={`px-2 py-0.2 rounded text-[10px] font-bold border ${getStatusStyle(vol.status)}`}>
                                                        {vol.status}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-slate-400 mt-0.5">
                                                    {vol.phone} • {vol.availability ? "🟢 Ready" : "⚪ Away"}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-1.5">
                                                {!isVerified && (
                                                    <button
                                                        onClick={() => updateVolunteer(id, "verify")}
                                                        disabled={updating === id}
                                                        className="px-2.5 py-1 rounded-lg bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold text-[11px]"
                                                    >
                                                        Verify
                                                    </button>
                                                )}
                                                {!isActive && (
                                                    <button
                                                        onClick={() => updateVolunteer(id, "activate")}
                                                        disabled={updating === id}
                                                        className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[11px]"
                                                    >
                                                        Activate
                                                    </button>
                                                )}
                                                <DeleteButton
                                                    onClick={() => handleDeleteVolunteer(id)}
                                                    disabled={updating === id}
                                                    title="Delete"
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>
                )}

                {/* Dispatch Requests */}
                {(activeNavSection === "ALL" || activeNavSection === "REQUESTS") && (
                    <section className="glass-panel border border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-lg space-y-2.5">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-bold text-white">
                            <span className="flex items-center gap-1.5">
                                <FileText className="w-3.5 h-3.5 text-violet-400" /> Requests Dispatch
                            </span>
                            <span className="text-slate-400">{requests.length} Total</span>
                        </div>

                        {loading && requests.length === 0 ? (
                            <Loader size="sm" text="Syncing dispatch requests" />
                        ) : requests.length === 0 ? (
                            <p className="py-4 text-center text-xs text-slate-500">No requests</p>
                        ) : (
                            <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                                {requests.map((req) => {
                                    const available = verifiedVolunteers
                                        .filter(v => v.availability === true)
                                        .map(v => ({ ...v, distance: calculateDistance(req.location, v.location) }))
                                        .sort((a, b) => a.distance - b.distance);
                                    const closest = available[0];

                                    return (
                                        <div
                                            key={req._id}
                                            className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 text-xs"
                                        >
                                            <div className="flex items-center justify-between gap-1.5">
                                                <h4 className="font-bold text-white text-sm">{req.need}</h4>
                                                <div className="flex items-center gap-1">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusStyle(req.priority)}`}>
                                                        {req.priority}
                                                    </span>
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusStyle(req.status)}`}>
                                                        {req.status}
                                                    </span>
                                                    <DeleteButton
                                                        onClick={() => handleDeleteRequest(req._id)}
                                                        disabled={updating === req._id}
                                                        title="Delete"
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 text-[11px] text-slate-400">
                                                <MapPin className="w-3 h-3 text-emerald-400" />
                                                <span>{formatLocation(req.location)}</span>
                                            </div>

                                            {/* Proximity assignment for pending */}
                                            {req.status === "PENDING" && (
                                                <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                                                    {closest ? (
                                                        <div className="flex items-center gap-1.5 text-[11px]">
                                                            <Zap className="w-3 h-3 text-emerald-400" />
                                                            <span className="text-slate-300">
                                                                Closest: <strong className="text-white">{closest.name || closest.phone}</strong> ({closest.distance} km)
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[11px] text-amber-400">No available volunteer</span>
                                                    )}

                                                    {closest && (
                                                        <button
                                                            type="button"
                                                            onClick={() => assignVolunteer(req._id, closest._id || closest.userId)}
                                                            disabled={updating === req._id}
                                                            className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[11px] transition"
                                                        >
                                                            Quick Assign
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>
                )}

                {/* Audit Logs */}
                {(activeNavSection === "ALL" || activeNavSection === "AUDIT") && (
                    <section className="glass-panel border border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-lg space-y-2.5">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-bold text-white">
                            <span className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-slate-400" /> Audit Trail
                            </span>
                            <span className="text-slate-400">{auditLogs.length} Records</span>
                        </div>

                        {loading && auditLogs.length === 0 ? (
                            <Loader size="sm" text="Syncing audit logs" />
                        ) : auditLogs.length === 0 ? (
                            <p className="py-4 text-center text-xs text-slate-500">No logs</p>
                        ) : (
                            <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                                {auditLogs.slice().reverse().map((log, idx) => (
                                    <div
                                        key={log._id || idx}
                                        className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-2 text-xs"
                                    >
                                        <div className="overflow-hidden">
                                            <p className="font-bold text-slate-200 text-xs truncate">{log.action}</p>
                                            <p className="text-[10px] text-slate-400 font-mono truncate">
                                                {log.userId || "System"} • {log.createdAt ? new Date(log.createdAt).toLocaleTimeString() : ""}
                                            </p>
                                        </div>

                                        {log._id && (
                                            <DeleteButton
                                                onClick={() => handleDeleteAuditLog(log._id)}
                                                disabled={updating === log._id}
                                                title="Delete"
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                )}
            </div>
        </main>
    );
}