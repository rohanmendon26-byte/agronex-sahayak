"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  HeartHandshake, 
  ShieldCheck, 
  User, 
  Phone, 
  Lock, 
  ArrowRight, 
  Loader2, 
  ShieldAlert, 
  Heart 
} from "lucide-react";

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

            if (!response.ok) {
                throw new Error(
                    data?.error?.message || "Login failed"
                );
            }

            const loggedInUser = data?.data?.user || {
                name: "User",
                role: role
            };
            const loggedInRole = loggedInUser.role || role;

            localStorage.setItem("agronex_token", data.data.token);
            localStorage.setItem("agronex_role", loggedInRole);
            localStorage.setItem("agronex_user", JSON.stringify(loggedInUser));

            if (loggedInRole === "SENIOR") {
                router.push("/senior");
            } else if (loggedInRole === "VOLUNTEER") {
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

    const rolesInfo = [
        { value: "SENIOR", label: "Senior Citizen", icon: Heart, color: "emerald" },
        { value: "VOLUNTEER", label: "Volunteer", icon: HeartHandshake, color: "violet" },
        { value: "POLICE_ADMIN", label: "Police Admin", icon: ShieldCheck, color: "blue" }
    ];

    return (
        <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4 py-8 sm:px-6 relative overflow-hidden">
            {/* Background glowing blurred circles */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-10 right-10 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="w-full max-w-lg z-10">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 mb-5 shadow-xl shadow-emerald-500/10 backdrop-blur-md">
                        <HeartHandshake className="w-10 h-10 text-emerald-400" />
                    </div>

                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-3">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-300">
                            AGRONEX SAHAYAK
                        </span>
                    </div>

                    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white drop-shadow-sm">
                        Community Assistance Connected
                    </h1>

                    <p className="mt-3 text-sm sm:text-base text-slate-400 max-w-md mx-auto leading-relaxed">
                        A trusted network bridging senior citizens, local volunteers, and safety administration.
                    </p>
                </div>

                {/* Login Card */}
                <form
                    onSubmit={handleLogin}
                    className="glass-panel border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-slate-950/80"
                >
                    <div className="mb-6">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <User className="w-5 h-5 text-emerald-400" />
                            Sign In to Your Account
                        </h2>
                        <p className="text-xs text-slate-400 mt-1">Select your account role to proceed</p>
                    </div>

                    {/* Role Selector */}
                    <div className="grid grid-cols-3 gap-2 mb-6 p-1 bg-slate-900/80 border border-slate-800 rounded-2xl">
                        {rolesInfo.map((item) => {
                            const IconComponent = item.icon;
                            const isSelected = role === item.value;
                            return (
                                <button
                                    key={item.value}
                                    type="button"
                                    onClick={() => {
                                        setRole(item.value);
                                        setError("");
                                    }}
                                    className={`flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                                        isSelected
                                            ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 scale-[1.02]"
                                            : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                                    }`}
                                >
                                    <IconComponent className={`w-4 h-4 ${isSelected ? "text-slate-950" : "text-slate-400"}`} />
                                    <span>{item.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Phone Input */}
                    <div className="mb-4">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                            Phone Number
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                <Phone className="w-4 h-4" />
                            </div>
                            <input
                                type="text"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="Enter your registered phone"
                                required
                                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-3.5 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                            />
                        </div>
                    </div>

                    {/* Password Input */}
                    <div className="mb-6">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                            Password
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                <Lock className="w-4 h-4" />
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                required
                                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-3.5 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400 flex items-start gap-2.5">
                            <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold rounded-xl py-3.5 shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Authenticating...</span>
                            </>
                        ) : (
                            <>
                                <span>Sign In</span>
                                <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </button>

                    <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
                        <span className="text-slate-400">Don't have an account?</span>
                        <Link
                            href="/register"
                            className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 transition"
                        >
                            Create an Account
                            <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                </form>

                {/* Footer badge */}
                <p className="text-center text-xs text-slate-500 mt-8 flex items-center justify-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-500/60" />
                    Encrypted & Secure • AgroNex Sahayak
                </p>
            </div>
        </main>
    );
}