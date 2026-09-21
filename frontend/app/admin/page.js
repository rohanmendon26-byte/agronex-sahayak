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
        router.push("/");
    };

    const verifiedVolunteers = volunteers.filter(
        (volunteer) =>
            volunteer.status === "ACTIVE"
    );

    const emergencyRequests = requests.filter(
        (request) =>
            request.status === "EMERGENCY" ||
            request.priority === "EMERGENCY" ||
            request.priority === "URGENT" ||
            request.isEmergency === true
    );

    return (
        <main className="min-h-screen bg-slate-950 text-white">

            {/* Navbar */}
            <nav className="border-b border-slate-800 bg-slate-900">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

                    <div>
                        <h1 className="text-xl font-bold">
                            AgroNex{" "}
                            <span className="text-emerald-400">
                                Sahayak
                            </span>
                        </h1>

                        <p className="text-xs text-slate-500">
                            Police Admin Dashboard
                        </p>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="text-sm text-slate-400 hover:text-white"
                    >
                        Logout
                    </button>

                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-6 py-8">

                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-3xl font-bold">
                            Administration
                        </h2>

                        <p className="text-slate-400 mt-2">
                            Manage volunteers and coordinate assistance requests.
                        </p>
                    </div>

                    <button
                        onClick={loadDashboard}
                        disabled={loading}
                        className="border border-slate-700 hover:border-emerald-500 text-slate-300 hover:text-white px-4 py-2 rounded-lg text-sm transition disabled:opacity-50"
                    >
                        {loading ? "Refreshing..." : "Refresh"}
                    </button>
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
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 mb-8">

                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                        <p className="text-sm text-slate-500">
                            Volunteers
                        </p>

                        <p className="text-3xl font-bold mt-2">
                            {volunteers.length}
                        </p>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                        <p className="text-sm text-slate-500">
                            Active Volunteers
                        </p>

                        <p className="text-3xl font-bold mt-2">
                            {verifiedVolunteers.length}
                        </p>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                        <p className="text-sm text-slate-500">
                            Pending Requests
                        </p>

                        <p className="text-3xl font-bold mt-2">
                            {
                                requests.filter(
                                    (request) =>
                                        request.status === "PENDING"
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

                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                        <p className="text-sm text-slate-500">
                            Emergency
                        </p>

                        <p className="text-3xl font-bold mt-2">
                            {emergencyRequests.length}
                        </p>
                    </div>

                </div>

                {/* Volunteers */}
                <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8">

                    <h3 className="text-xl font-semibold mb-6">
                        Volunteer Management
                    </h3>

                    {loading ? (
                        <div className="text-center py-10 text-slate-500">
                            Loading volunteers...
                        </div>
                    ) : volunteers.length === 0 ? (
                        <div className="text-center py-10 text-slate-500">
                            No volunteers found.
                        </div>
                    ) : (
                        <div className="space-y-4">

                            {volunteers.map((volunteer) => (
                                <div
                                    key={
                                        volunteer._id ||
                                        volunteer.userId
                                    }
                                    className="border border-slate-800 rounded-xl p-5"
                                >

                                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

                                        <div>
                                            <h4 className="font-semibold">
                                                {volunteer.name ||
                                                    volunteer.fullName ||
                                                    "Volunteer"}
                                            </h4>

                                            <p className="text-sm text-slate-500 mt-1">
                                                Phone:{" "}
                                                {volunteer.phone ||
                                                    "Not available"}
                                            </p>

                                            <div className="flex flex-wrap gap-2 mt-3">

                                                <span className={`px-2 py-1 rounded-full text-xs ${getStatusStyle(volunteer.status)}`}>
                                                    Status:{" "}
                                                    {volunteer.status}
                                                </span>

                                                <span className={`px-2 py-1 rounded-full text-xs ${getStatusStyle(
                                                    volunteer.status === "VERIFIED" || volunteer.status === "ACTIVE"
                                                        ? "VERIFIED"
                                                        : "PENDING"
                                                )}`}>
                                                    Verification:{" "}
                                                    {volunteer.status === "VERIFIED" || volunteer.status === "ACTIVE"
                                                        ? "VERIFIED"
                                                        : "PENDING"}
                                                </span>

                                                <span className={`px-2 py-1 rounded-full text-xs ${volunteer.availability ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20" : "bg-slate-700 text-slate-300 border border-slate-600"}`}>
                                                    Availability:{" "}
                                                    {String(
                                                        volunteer.availability
                                                    )}
                                                </span>

                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2">

                                            {volunteer.status !== "VERIFIED" &&
                                                volunteer.status !== "ACTIVE" && (
                                                    <button
                                                        onClick={() =>
                                                            updateVolunteer(
                                                                volunteer._id ||
                                                                volunteer.userId,
                                                                "verify"
                                                            )
                                                        }
                                                        disabled={
                                                            updating ===
                                                            (volunteer._id ||
                                                                volunteer.userId)
                                                        }
                                                        className="bg-blue-500 hover:bg-blue-400 disabled:opacity-50 px-4 py-2 rounded-lg text-sm font-medium"
                                                    >
                                                        Verify
                                                    </button>
                                                )}

                                            {volunteer.status !== "ACTIVE" && (
                                                <button
                                                    onClick={() =>
                                                        updateVolunteer(
                                                            volunteer._id ||
                                                            volunteer.userId,
                                                            "activate"
                                                        )
                                                    }
                                                    disabled={
                                                        updating ===
                                                        (volunteer._id ||
                                                            volunteer.userId)
                                                    }
                                                    className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 px-4 py-2 rounded-lg text-sm font-medium"
                                                >
                                                    Activate
                                                </button>
                                            )}

                                        </div>

                                    </div>
                                </div>
                            ))}

                        </div>
                    )}

                </section>

                {/* Requests */}
                <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6">

                    <h3 className="text-xl font-semibold mb-6">
                        Assistance Requests
                    </h3>

                    {loading ? (
                        <div className="text-center py-10 text-slate-500">
                            Loading requests...
                        </div>
                    ) : requests.length === 0 ? (
                        <div className="text-center py-10 text-slate-500">
                            No assistance requests found.
                        </div>
                    ) : (
                        <div className="space-y-4">

                            {requests.map((request) => {

                                const availableVolunteers =
                                    verifiedVolunteers.filter(
                                        (volunteer) =>
                                            volunteer.availability === true
                                    );

                                return (
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
                                                    Location:{" "}
                                                    {request.location}
                                                </p>

                                                <p className="text-xs text-slate-600 mt-2">
                                                    Request ID:{" "}
                                                    {request._id}
                                                </p>
                                            </div>

                                            <span className={`px-3 py-1 rounded-full text-xs w-fit ${getStatusStyle(request.status)}`}>
                                                {request.status}
                                            </span>

                                        </div>

                                        {request.status === "PENDING" && (
                                            <div className="mt-5">

                                                <label className="block text-sm text-slate-400 mb-2">
                                                    Assign verified available
                                                    volunteer
                                                </label>

                                                {availableVolunteers.length ===
                                                    0 ? (
                                                    <p className="text-sm text-yellow-400">
                                                        No verified and
                                                        available volunteers.
                                                    </p>
                                                ) : (
                                                    <div className="flex gap-3">

                                                        <select
                                                            id={`volunteer-${request._id}`}
                                                            className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-sm outline-none focus:border-emerald-500"
                                                            defaultValue=""
                                                        >
                                                            <option
                                                                value=""
                                                                disabled
                                                            >
                                                                Select volunteer
                                                            </option>

                                                            {availableVolunteers.map(
                                                                (
                                                                    volunteer
                                                                ) => (
                                                                    <option
                                                                        key={
                                                                            volunteer._id ||
                                                                            volunteer.userId
                                                                        }
                                                                        value={
                                                                            volunteer._id ||
                                                                            volunteer.userId
                                                                        }
                                                                    >
                                                                        {volunteer.name ||
                                                                            volunteer.fullName ||
                                                                            volunteer.phone ||
                                                                            "Volunteer"}
                                                                    </option>
                                                                )
                                                            )}
                                                        </select>

                                                        <button
                                                            onClick={() => {
                                                                const select =
                                                                    document.getElementById(
                                                                        `volunteer-${request._id}`
                                                                    );

                                                                if (
                                                                    !select.value
                                                                ) {
                                                                    setError(
                                                                        "Please select a volunteer."
                                                                    );
                                                                    return;
                                                                }

                                                                assignVolunteer(
                                                                    request._id,
                                                                    select.value
                                                                );
                                                            }}
                                                            disabled={
                                                                updating ===
                                                                request._id
                                                            }
                                                            className="bg-purple-500 hover:bg-purple-400 disabled:opacity-50 px-5 py-3 rounded-lg text-sm font-medium"
                                                        >
                                                            Assign
                                                        </button>

                                                    </div>
                                                )}

                                            </div>
                                        )}

                                        {request.status !== "PENDING" && (
                                            <div className="mt-5 text-sm text-slate-500">
                                                This request is already{" "}
                                                <span className="text-slate-300">
                                                    {request.status}
                                                </span>
                                                .
                                            </div>
                                        )}

                                    </div>
                                );
                            })}

                        </div>
                    )}

                </section>

                {/* Audit Logs */}
                <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mt-8">

                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-xl font-semibold">
                                Audit Logs
                            </h3>

                            <p className="text-sm text-slate-500 mt-1">
                                Track important actions performed in the system.
                            </p>
                        </div>

                        <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded-full text-xs">
                            {auditLogs.length} Logs
                        </span>
                    </div>

                    {auditLogs.length === 0 ? (
                        <div className="text-center py-10 text-slate-500">
                            No audit logs found.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {auditLogs.slice().reverse().map((log, index) => (
                                <div
                                    key={log._id || index}
                                    className="border border-slate-800 rounded-xl p-4"
                                >
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">

                                        <div>
                                            <p className="font-medium text-slate-200">
                                                {log.action}
                                            </p>

                                            <p className="text-xs text-slate-500 mt-1">
                                                User: {log.userId || "System"}
                                            </p>

                                            {log.requestId && (
                                                <p className="text-xs text-slate-600 mt-1">
                                                    Request: {log.requestId}
                                                </p>
                                            )}
                                        </div>

                                        <span className="text-xs text-slate-500">
                                            {log.createdAt
                                                ? new Date(
                                                    log.createdAt
                                                ).toLocaleString()
                                                : "N/A"}
                                        </span>

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