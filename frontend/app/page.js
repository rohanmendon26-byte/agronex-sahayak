"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
    const router = useRouter();

    const [role, setRole] = useState("SENIOR");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = async (e) => {
        e.preventDefault();

        setError("");
        setLoading(true);

        try {
            const endpoints = {
                SENIOR: "/auth/senior/login",
                VOLUNTEER: "/auth/volunteer/login",
                POLICE_ADMIN: "/auth/admin/login"
            };

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}${endpoints[role]}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        phone,
                        password
                    })
                }
            );

            const data = await response.json();
            console.log("LOGIN RESPONSE:", data);

            if (!response.ok) {
                throw new Error(
                    data?.error?.message || "Login failed"
                );
            }

            // Store authentication information
            localStorage.setItem("agronex_token", data.data.token);
            localStorage.setItem("agronex_role", role);

            // Redirect according to role
            if (role === "SENIOR") {
                router.push("/senior");
            } else if (role === "VOLUNTEER") {
                router.push("/volunteer");
            } else {
                router.push("/admin");
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6 py-10">
            <div className="w-full max-w-xl">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-400/40 mb-5 shadow-lg shadow-emerald-500/10">
                        <span className="text-2xl font-bold text-emerald-300">
                            A
                        </span>
                    </div>

                    <p className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-400">
                        AGRONEX SAHAYAK
                    </p>

                    <h1 className="mt-4 text-3xl font-bold tracking-tight text-white">
                        Community assistance, connected.
                    </h1>

                    <p className="mt-3 text-sm text-slate-400 max-w-lg mx-auto">
                        A trusted platform connecting senior citizens
                        with verified volunteers and police administration.
                    </p>
                </div>

                <form
                    onSubmit={handleLogin}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-7 shadow-2xl shadow-slate-950/60"
                >
                    <div className="mb-6 text-center">
                        <h2 className="text-2xl font-semibold text-white">
                            Login
                        </h2>
                    </div>

                    <label className="block text-sm text-slate-300 mb-2">
                        Login as
                    </label>

                    <div className="grid grid-cols-3 gap-2 mb-5">
                        {[
                            { value: "SENIOR", label: "Senior" },
                            { value: "VOLUNTEER", label: "Volunteer" },
                            { value: "POLICE_ADMIN", label: "Police Admin" }
                        ].map((item) => (
                            <button
                                key={item.value}
                                type="button"
                                onClick={() => {
                                    setRole(item.value);
                                    setError("");
                                }}
                                className={`rounded-lg px-2 py-2 text-xs font-medium transition ${
                                    role === item.value
                                        ? "bg-emerald-500 text-slate-950"
                                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                                }`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>

                    <label className="block text-sm text-slate-300 mb-2">
                        Phone
                    </label>

                    <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Enter your phone number"
                        required
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-sm outline-none focus:border-emerald-500 mb-4"
                    />

                    <label className="block text-sm text-slate-300 mb-2">
                        Password
                    </label>

                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        required
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-sm outline-none focus:border-emerald-500 mb-6"
                    />

                    {error && (
                        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-semibold rounded-lg py-3 transition"
                    >
                        {loading ? "Signing in..." : "Login"}
                    </button>

                    <p className="text-center text-xs text-slate-500 mt-5">
                        AgroNex Sahayak • Voice-first community assistance platform
                    </p>
                </form>
            </div>
        </main>
    );
}