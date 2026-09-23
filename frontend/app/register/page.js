"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  HeartHandshake,
  User,
  Phone,
  Mail,
  MapPin,
  Lock,
  ArrowRight,
  Loader2,
  ShieldAlert,
  CheckCircle2,
  Heart,
  UserPlus
} from "lucide-react";

export default function Register() {
    const router = useRouter();

    const [role, setRole] = useState("SENIOR");
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [location, setLocation] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleRegister = async (e) => {
        e.preventDefault();

        setError("");
        setLoading(true);

        try {
            const endpoints = {
                SENIOR: "/auth/senior/register",
                VOLUNTEER: "/auth/volunteer/register"
            };

            const body = {
                name,
                phone,
                password,
                ...(email ? { email } : {}),
                ...(role === "SENIOR" ? { location } : {})
            };

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}${endpoints[role]}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(body)
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data?.error?.message || "Registration failed"
                );
            }

            setSuccess(true);

            setTimeout(() => {
                router.push("/");
            }, 1500);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4 py-8 sm:px-6 relative overflow-hidden">
            {/* Background ambient lighting */}
            <div className="absolute top-10 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-10 left-10 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="w-full max-w-lg z-10">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 mb-5 shadow-xl shadow-emerald-500/10 backdrop-blur-md">
                        <UserPlus className="w-10 h-10 text-emerald-400" />
                    </div>

                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-3">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-300">
                            JOIN AGRONEX SAHAYAK
                        </span>
                    </div>

                    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                        Create Your Account
                    </h1>

                    <p className="mt-3 text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                        Join as a senior citizen seeking assistance or as a verified community volunteer.
                    </p>
                </div>

                {/* Card */}
                <form
                    onSubmit={handleRegister}
                    className="glass-panel border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-slate-950/80"
                >
                    {/* Role Switcher */}
                    <div className="mb-6">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                            I want to register as
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setRole("SENIOR");
                                    setError("");
                                }}
                                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
                                    role === "SENIOR"
                                        ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 scale-[1.01]"
                                        : "bg-slate-900/80 text-slate-400 border border-slate-800 hover:text-slate-200 hover:bg-slate-800/50"
                                }`}
                            >
                                <Heart className={`w-4 h-4 ${role === "SENIOR" ? "text-slate-950" : "text-emerald-400"}`} />
                                Senior Citizen
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setRole("VOLUNTEER");
                                    setError("");
                                }}
                                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
                                    role === "VOLUNTEER"
                                        ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 scale-[1.01]"
                                        : "bg-slate-900/80 text-slate-400 border border-slate-800 hover:text-slate-200 hover:bg-slate-800/50"
                                }`}
                            >
                                <HeartHandshake className={`w-4 h-4 ${role === "VOLUNTEER" ? "text-slate-950" : "text-teal-400"}`} />
                                Volunteer
                            </button>
                        </div>
                    </div>

                    {/* Inputs */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                                Full Name
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                    <User className="w-4 h-4" />
                                </div>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Enter your full name"
                                    required
                                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-3.5 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                                />
                            </div>
                        </div>

                        <div>
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
                                    placeholder="Enter mobile phone number"
                                    required
                                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-3.5 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                                Email Address <span className="text-slate-500 font-normal">(Optional)</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                    <Mail className="w-4 h-4" />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email"
                                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-3.5 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                                />
                            </div>
                        </div>

                        {role === "SENIOR" && (
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                                    Location / Address
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                        <MapPin className="w-4 h-4" />
                                    </div>
                                    <input
                                        type="text"
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        placeholder="e.g. Shirva, Main Street"
                                        required
                                        className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-3.5 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                                    />
                                </div>
                            </div>
                        )}

                        <div>
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
                                    placeholder="Create a strong password"
                                    required
                                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-3.5 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400 flex items-start gap-2.5">
                            <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    {success && (
                        <div className="mt-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400 flex items-center gap-2.5">
                            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                            <span>Account created successfully! Redirecting to login...</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || success}
                        className="w-full mt-6 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold rounded-xl py-3.5 shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Creating Account...</span>
                            </>
                        ) : (
                            <>
                                <span>Register Now</span>
                                <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </button>

                    {role === "VOLUNTEER" && (
                        <div className="mt-4 p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 text-center">
                            🛡️ Volunteer accounts undergo Police Admin verification before taking requests.
                        </div>
                    )}

                    <div className="mt-6 pt-5 border-t border-slate-800/80 flex items-center justify-between text-sm">
                        <span className="text-slate-400">Already registered?</span>
                        <Link
                            href="/"
                            className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 transition"
                        >
                            Sign In
                            <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                </form>
            </div>
        </main>
    );
}