"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Shield,
  ShieldCheck,
  Users,
  AlertTriangle,
  FileText,
  CheckCircle2,
  UserCheck,
  User,
  Clock,
  LogOut,
  RefreshCw,
  Loader2,
  Siren,
  UserPlus,
  MapPin,
  Check,
  AlertCircle
} from "lucide-react";

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

export default function AdminDashboard() {
    const router = useRouter();

    const [volunteers, setVolunteers] = useState([]);
    const [requests, setRequests] = useState([]);
    const [auditLogs, setAuditLogs] = useState([]);

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

        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            setLoading(true);
            setError("");

            const headers = {
                Authorization: `Bearer ${token}`
            };

            const [volunteerResponse, requestResponse, auditResponse] =
                await Promise.all([
                    fetch(
                        `${process.env.NEXT_PUBLIC_API_URL}/volunteers`,
                        { headers }
                    ),
                    fetch(
                        `${process.env.NEXT_PUBLIC_API_URL}/requests`,
                        { headers }
                    ),
                    fetch(
                        `${process.env.NEXT_PUBLIC_API_URL}/audit-logs`,
                        { headers }
                    )
                ]);

            const volunteerData = await volunteerResponse.json();
            const requestData = await requestResponse.json();
            const auditData = await auditResponse.json();

            if (!volunteerResponse.ok) {
                throw new Error(
                    volunteerData?.error?.message ||
                    "Failed to load volunteers"
                );
            }

            if (!requestResponse.ok) {
                throw new Error(
                    requestData?.error?.message ||
                    "Failed to load requests"
                );
            }

            if (!auditResponse.ok) {
                throw new Error(
                    auditData?.error?.message ||
                    "Failed to load audit logs"
                );
            }

            setVolunteers(volunteerData.data || []);
            setRequests(requestData.data || []);
            setAuditLogs(auditData.data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const updateVolunteer = async (id, action) => {
        try {
            setUpdating(id);
            setError("");
            setMessage("");

            const options = {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            };

            if (action === "verify") {
                options.headers["Content-Type"] = "application/json";

                options.body = JSON.stringify({
                    verificationNotes: "Verified by Police Admin"
                });
            }

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/volunteers/${id}/${action}`,
                options
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data?.error?.message ||
                    `Failed to ${action} volunteer`
                );
            }

            setMessage(
                `Volunteer ${action} operation completed successfully.`
            );

            await loadDashboard();
        } catch (err) {
            setError(err.message);
        } finally {
            setUpdating("");
        }
    };

    const assignVolunteer = async (requestId, volunteerId) => {
        try {
            setUpdating(requestId);
            setError("");
            setMessage("");

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/requests/${requestId}/assign`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        volunteerId
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data?.error?.message ||
                    "Failed to assign volunteer"
                );
            }

            setMessage("Volunteer assigned successfully.");

            await loadDashboard();
        } catch (err) {
            setError(err.message);
        } finally {
            setUpdating("");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("agronex_token");
        localStorage.removeItem("agronex_role");
        localStorage.removeItem("agronex_user");
        router.push("/");
    };

    const verifiedVolunteers = volunteers.filter(
        (volunteer) =>
            volunteer.status === "ACTIVE"
    );

    const emergencyRequests = requests.filter(
        (request) =>
            request.status !== "COMPLETED" &&
            (request.status === "EMERGENCY" ||
             request.priority === "EMERGENCY" ||
             request.priority === "URGENT" ||
             request.isEmergency === true)
    );

    return (
        <main className="min-h-screen bg-slate-950 text-white">

            {/* Top Navbar */}
            <nav className="glass-panel border-b border-slate-800/80 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center">
                            <Shield className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <h1 className="text-lg font-extrabold tracking-tight">
                                AgroNex <span className="text-emerald-400">Sahayak</span>
                            </h1>
                            <p className="text-xs text-slate-400 font-medium">Police & Emergency Dispatch Admin</p>
                        </div>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Logout</span>
                    </button>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 sm:py-8">

                {/* Dashboard Header */}
                <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 mb-2">
                            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                            <span className="text-xs font-semibold text-blue-300 uppercase tracking-wider">
                                Central Command Console
                            </span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                            Police & Safety Administration
                        </h2>
                        <p className="text-sm text-slate-400 mt-1">
                            Verify community volunteers, oversee assistance requests, and respond to SOS emergencies.
                        </p>
                    </div>

                    <button
                        onClick={loadDashboard}
                        disabled={loading}
                        className="self-start sm:self-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 hover:text-white transition"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                        <span>Refresh Console</span>
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

                {/* Emergency Alert Banner if any */}
                {emergencyRequests.length > 0 && (
                    <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-between gap-4 animate-pulse">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center shrink-0">
                                <Siren className="w-5 h-5 text-red-400" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-red-200">
                                    🚨 {emergencyRequests.length} Active Emergency / Urgent Alert(s)
                                </h4>
                                <p className="text-xs text-red-300/80 mt-0.5">High priority action required from police dispatchers.</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Stats Header Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
                    <div className="glass-panel border border-slate-800 rounded-2xl p-4 sm:p-5">
                        <div className="flex items-center justify-between text-slate-400 mb-2">
                            <span className="text-xs font-semibold uppercase tracking-wider">Volunteers</span>
                            <Users className="w-4 h-4 text-slate-400" />
                        </div>
                        <p className="text-2xl sm:text-3xl font-extrabold text-white">{volunteers.length}</p>
                    </div>

                    <div className="glass-panel border border-slate-800 rounded-2xl p-4 sm:p-5">
                        <div className="flex items-center justify-between text-emerald-400 mb-2">
                            <span className="text-xs font-semibold uppercase tracking-wider">Active</span>
                            <UserCheck className="w-4 h-4 text-emerald-400" />
                        </div>
                        <p className="text-2xl sm:text-3xl font-extrabold text-emerald-400">{verifiedVolunteers.length}</p>
                    </div>

                    <div className="glass-panel border border-slate-800 rounded-2xl p-4 sm:p-5">
                        <div className="flex items-center justify-between text-amber-400 mb-2">
                            <span className="text-xs font-semibold uppercase tracking-wider">Pending</span>
                            <Clock className="w-4 h-4 text-amber-400" />
                        </div>
                        <p className="text-2xl sm:text-3xl font-extrabold text-amber-400">
                            {requests.filter(r => r.status === "PENDING").length}
                        </p>
                    </div>

                    <div className="glass-panel border border-slate-800 rounded-2xl p-4 sm:p-5">
                        <div className="flex items-center justify-between text-sky-400 mb-2">
                            <span className="text-xs font-semibold uppercase tracking-wider">Completed</span>
                            <CheckCircle2 className="w-4 h-4 text-sky-400" />
                        </div>
                        <p className="text-2xl sm:text-3xl font-extrabold text-sky-400">
                            {requests.filter(r => r.status === "COMPLETED").length}
                        </p>
                    </div>

                    <div className="glass-panel border border-slate-800 rounded-2xl p-4 sm:p-5 col-span-2 sm:col-span-1">
                        <div className="flex items-center justify-between text-red-400 mb-2">
                            <span className="text-xs font-semibold uppercase tracking-wider">Emergency</span>
                            <Siren className="w-4 h-4 text-red-400" />
                        </div>
                        <p className="text-2xl sm:text-3xl font-extrabold text-red-400">{emergencyRequests.length}</p>
                    </div>
                </div>

                {/* Section 1: Volunteer Verification & Management */}
                <section className="glass-panel border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl mb-8">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800/80">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center">
                                <UserCheck className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">Volunteer Verification & Roster</h3>
                                <p className="text-xs text-slate-400">Review applications and verify credentials</p>
                            </div>
                        </div>

                        <span className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300 font-semibold">
                            {volunteers.length} Registered
                        </span>
                    </div>

                    {loading ? (
                        <div className="text-center py-12 text-slate-400 flex flex-col items-center gap-3">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                            <p className="text-sm">Loading volunteers...</p>
                        </div>
                    ) : volunteers.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            <Users className="w-12 h-12 mx-auto text-slate-700 mb-3" />
                            <p className="text-sm">No registered volunteers found.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {volunteers.map((volunteer) => {
                                const id = volunteer._id || volunteer.userId;
                                const isVerified = volunteer.status === "VERIFIED" || volunteer.status === "ACTIVE";
                                const isActive = volunteer.status === "ACTIVE";

                                return (
                                    <div
                                        key={id}
                                        className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-5 hover:border-slate-700 transition"
                                    >
                                        <div>
                                            <h4 className="font-bold text-white text-base">
                                                {volunteer.name || volunteer.fullName || "Volunteer"}
                                            </h4>

                                            <p className="text-xs text-slate-400 mt-1">
                                                Phone: <span className="text-slate-300 font-mono">{volunteer.phone || "Not specified"}</span>
                                            </p>

                                            <div className="flex flex-wrap items-center gap-2 mt-3">
                                                <span className={`px-3 py-0.5 rounded-full text-xs font-semibold ${getStatusStyle(volunteer.status)}`}>
                                                    Status: {volunteer.status}
                                                </span>

                                                <span className={`px-3 py-0.5 rounded-full text-xs font-semibold ${
                                                    isVerified ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30" : "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                                                }`}>
                                                    Verification: {isVerified ? "VERIFIED" : "PENDING"}
                                                </span>

                                                <span className={`px-3 py-0.5 rounded-full text-xs font-semibold ${
                                                    volunteer.availability ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20" : "bg-slate-800 text-slate-400 border border-slate-700"
                                                }`}>
                                                    Availability: {volunteer.availability ? "Available" : "Away"}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            {!isVerified && (
                                                <button
                                                    onClick={() => updateVolunteer(id, "verify")}
                                                    disabled={updating === id}
                                                    className="flex items-center gap-1.5 bg-blue-500 hover:bg-blue-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold transition shadow-md shadow-blue-500/10 disabled:opacity-50"
                                                >
                                                    {updating === id ? (
                                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                    ) : (
                                                        <ShieldCheck className="w-3.5 h-3.5" />
                                                    )}
                                                    <span>Verify Credentials</span>
                                                </button>
                                            )}

                                            {!isActive && (
                                                <button
                                                    onClick={() => updateVolunteer(id, "activate")}
                                                    disabled={updating === id}
                                                    className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold transition shadow-md shadow-emerald-500/10 disabled:opacity-50"
                                                >
                                                    {updating === id ? (
                                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                    ) : (
                                                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                                                    )}
                                                    <span>Activate Account</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* Section 2: Assistance Requests & Dispatch */}
                <section className="glass-panel border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl mb-8">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800/80">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center">
                                <FileText className="w-5 h-5 text-violet-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">Assistance Requests Dispatch</h3>
                                <p className="text-xs text-slate-400">Assign unallocated requests to active verified volunteers</p>
                            </div>
                        </div>

                        <span className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300 font-semibold">
                            {requests.length} Requests
                        </span>
                    </div>

                    {loading ? (
                        <div className="text-center py-12 text-slate-400 flex flex-col items-center gap-3">
                            <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
                            <p className="text-sm">Loading request registry...</p>
                        </div>
                    ) : requests.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            <FileText className="w-12 h-12 mx-auto text-slate-700 mb-3" />
                            <p className="text-sm">No assistance requests found in system.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {requests.map((request) => {
                                const availableVolunteers = verifiedVolunteers.filter(
                                    (v) => v.availability === true
                                );

                                let assignedVolunteerName = "Unassigned";
                                if (request.volunteerId) {
                                    if (typeof request.volunteerId === "object" && request.volunteerId.name) {
                                        assignedVolunteerName = request.volunteerId.name;
                                    } else {
                                        const matched = volunteers.find(
                                            (v) => String(v.userId || v._id) === String(request.volunteerId)
                                        );
                                        if (matched) {
                                            assignedVolunteerName = matched.name || matched.fullName || matched.phone || "Assigned";
                                        } else {
                                            assignedVolunteerName = "Assigned";
                                        }
                                    }
                                }

                                return (
                                    <div
                                        key={request._id}
                                        className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition"
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                            <div>
                                                <h4 className="text-lg font-bold text-white">
                                                    {request.need}
                                                </h4>

                                                <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                                                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                                                    <span>Location: {request.location}</span>
                                                </div>

                                                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-300 mt-2">
                                                    <User className="w-3.5 h-3.5 text-violet-400" />
                                                    <span>Assigned Volunteer: <strong className={assignedVolunteerName === "Unassigned" ? "text-slate-400 font-semibold" : "text-violet-300 font-bold"}>{assignedVolunteerName}</strong></span>
                                                </div>
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

                                        {request.status === "PENDING" && (
                                            <div className="mt-5 pt-4 border-t border-slate-800/80">
                                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                                                    Assign Active Volunteer
                                                </label>

                                                {availableVolunteers.length === 0 ? (
                                                    <p className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-xl">
                                                        ⚠️ No verified, active, and available volunteers ready for assignment.
                                                    </p>
                                                ) : (
                                                    <div className="flex flex-col sm:flex-row gap-3">
                                                        <select
                                                            id={`volunteer-${request._id}`}
                                                            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-violet-500"
                                                            defaultValue=""
                                                        >
                                                            <option value="" disabled>
                                                                Select available volunteer...
                                                            </option>
                                                            {availableVolunteers.map((v) => (
                                                                <option key={v._id || v.userId} value={v._id || v.userId}>
                                                                    {v.name || v.fullName || v.phone || "Volunteer"}
                                                                </option>
                                                            ))}
                                                        </select>

                                                        <button
                                                            onClick={() => {
                                                                const select = document.getElementById(`volunteer-${request._id}`);
                                                                if (!select.value) {
                                                                    setError("Please select a volunteer.");
                                                                    return;
                                                                }
                                                                assignVolunteer(request._id, select.value);
                                                            }}
                                                            disabled={updating === request._id}
                                                            className="bg-violet-500 hover:bg-violet-400 text-slate-950 px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-md shadow-violet-500/10 disabled:opacity-50 flex items-center justify-center gap-1.5"
                                                        >
                                                            {updating === request._id ? (
                                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                            ) : (
                                                                <UserPlus className="w-3.5 h-3.5" />
                                                            )}
                                                            <span>Assign Volunteer</span>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* Section 3: Audit Logs */}
                <section className="glass-panel border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800/80">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                                <FileText className="w-5 h-5 text-slate-300" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">System Audit Trail</h3>
                                <p className="text-xs text-slate-400">Security and dispatch transaction log</p>
                            </div>
                        </div>

                        <span className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300 font-semibold">
                            {auditLogs.length} Records
                        </span>
                    </div>

                    {auditLogs.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            <FileText className="w-12 h-12 mx-auto text-slate-700 mb-3" />
                            <p className="text-sm">No audit logs recorded yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                            {auditLogs.slice().reverse().map((log, idx) => (
                                <div
                                    key={log._id || idx}
                                    className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                                >
                                    <div>
                                        <p className="font-semibold text-slate-200">{log.action}</p>
                                        <p className="text-[11px] text-slate-500 mt-0.5">
                                            User ID: <span className="font-mono text-slate-400">{log.userId || "System"}</span>
                                        </p>
                                    </div>

                                    <span className="text-slate-500 font-mono text-[11px]">
                                        {log.createdAt ? new Date(log.createdAt).toLocaleString() : "N/A"}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

            </div>
        </main>
    );
}