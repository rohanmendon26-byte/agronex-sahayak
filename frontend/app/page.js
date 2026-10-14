"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-toastify";
import {
  HeartHandshake,
  ShieldCheck,
  User,
  Phone,
  Lock,
  ArrowRight,
  Loader2,
  ShieldAlert,
  Heart,
  Zap,
  Eye,
  EyeOff,
  CheckCircle2
} from "lucide-react";
import Loader from "@/components/Loader";
import { getUserLocation } from "@/utils/geolocation";

export default function Home() {
  const router = useRouter();

  const [role, setRole] = useState("SENIOR");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePhoneChange = (e) => {
    const numericOnly = e.target.value.replace(/\D/g, "").slice(0, 10);
    setPhone(numericOnly);
    if (error) setError("");
  };

  const handleLogin = async (e, customCredentials = null) => {
    if (e) e.preventDefault();

    const targetPhone = customCredentials ? customCredentials.phone : phone.trim();
    const targetPassword = customCredentials ? customCredentials.password : password;
    const targetRole = customCredentials ? customCredentials.role : role;

    setError("");

    // Validate 10-digit phone number edge case
    if (!targetPhone) {
      setError("Please enter your 10-digit mobile number");
      toast.warn("Mobile number is required");
      return;
    }
    if (!/^\d{10}$/.test(targetPhone)) {
      setError("Phone number must be exactly 10 digits");
      toast.warn("Phone number must be exactly 10 digits");
      return;
    }

    // Validate password edge case
    if (!targetPassword) {
      setError("Please enter your password");
      toast.warn("Password is required");
      return;
    }
    if (targetPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      toast.warn("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const endpoints = {
        SENIOR: "/auth/senior/login",
        VOLUNTEER: "/auth/volunteer/login",
        POLICE_ADMIN: "/auth/admin/login"
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}${endpoints[targetRole]}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            phone: targetPhone,
            password: targetPassword
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error?.message || "Invalid phone or password"
        );
      }

      const loggedInUser = data?.data?.user || {
        name: targetRole === "SENIOR" ? "Ramesh" : targetRole === "VOLUNTEER" ? "Kiran" : "Admin",
        role: targetRole
      };
      const loggedInRole = loggedInUser.role || targetRole;

      localStorage.setItem("agronex_token", data.data.token);
      localStorage.setItem("agronex_role", loggedInRole);
      localStorage.setItem("agronex_user", JSON.stringify(loggedInUser));

      toast.success(`Welcome, ${loggedInUser.name || "User"}!`, {
        icon: loggedInRole === "SENIOR" ? "👴" : loggedInRole === "VOLUNTEER" ? "🤝" : "👮"
      });

      if (loggedInRole === "SENIOR") {
        router.push("/senior");
      } else if (loggedInRole === "VOLUNTEER") {
        // Update volunteer GPS location immediately upon login
        getUserLocation()
          .then(async (loc) => {
            try {
              await fetch(`${process.env.NEXT_PUBLIC_API_URL}/volunteers/location`, {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${data.data.token}`
                },
                body: JSON.stringify({
                  location: {
                    locality: loc.locality || loc.displayName,
                    city: loc.city || "Udupi",
                    state: loc.state || "Karnataka",
                    lat: loc.lat,
                    lng: loc.lng
                  }
                })
              });
              if (typeof window !== "undefined") {
                localStorage.setItem("agronex_sync", String(Date.now()));
              }
            } catch (e) {
              console.warn("Location sync failed on login", e);
            }
          })
          .catch((e) => console.warn("GPS lookup on login skipped", e));

        router.push("/volunteer");
      } else {
        router.push("/admin");
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (r, p, pass) => {
    setRole(r);
    setPhone(p);
    setPassword(pass);
    setError("");
    toast.info(`Filled demo for ${r === "POLICE_ADMIN" ? "Admin" : r}`);
  };

  const roles = [
    { value: "SENIOR", label: "Senior", icon: Heart },
    { value: "VOLUNTEER", label: "Volunteer", icon: HeartHandshake },
    { value: "POLICE_ADMIN", label: "Admin", icon: ShieldCheck }
  ];

  return (
    <main className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-3 py-4 sm:px-4">
      <div className="w-full max-w-md">
        
        {/* Title */}
        <div className="text-center mb-4">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            AgroNex <span className="text-emerald-400">Sahayak</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Sign in to your account</p>
        </div>

        {/* Quick Demo Fill Bar */}
        <div className="mb-3.5 p-2 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-1.5 text-xs">
          <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 pl-1 shrink-0">
            <Zap className="w-3 h-3 text-amber-400" /> Demo:
          </span>
          <div className="flex items-center gap-1 flex-wrap justify-end">
            <button
              type="button"
              onClick={() => fillDemo("SENIOR", "8888888888", "Senior@123")}
              className="px-2 py-1 rounded-lg bg-slate-950 hover:bg-emerald-500/20 text-[11px] font-semibold text-slate-300 hover:text-emerald-300 border border-slate-800 transition"
            >
              Senior
            </button>
            <button
              type="button"
              onClick={() => fillDemo("VOLUNTEER", "7777777777", "Volunteer@123")}
              className="px-2 py-1 rounded-lg bg-slate-950 hover:bg-violet-500/20 text-[11px] font-semibold text-slate-300 hover:text-violet-300 border border-slate-800 transition"
            >
              Volunteer
            </button>
            <button
              type="button"
              onClick={() => fillDemo("POLICE_ADMIN", "9999999999", "Admin@123")}
              className="px-2 py-1 rounded-lg bg-slate-950 hover:bg-blue-500/20 text-[11px] font-semibold text-slate-300 hover:text-blue-300 border border-slate-800 transition"
            >
              Admin
            </button>
          </div>
        </div>

        {/* Login Form */}
        <form
          onSubmit={(e) => handleLogin(e)}
          className="glass-panel border border-slate-800/90 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3.5"
        >
          {/* Role Tabs */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl">
            {roles.map((item) => {
              const Icon = item.icon;
              const isSelected = role === item.value;

              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => {
                    setRole(item.value);
                    setError("");
                  }}
                  className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-lg text-xs font-bold transition-all ${
                    isSelected
                      ? "bg-emerald-500 text-slate-950 shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Inputs */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Mobile Number
              </label>
              <span className={`text-[10px] font-mono font-semibold ${phone.length === 10 ? "text-emerald-400" : "text-slate-500"}`}>
                {phone.length}/10 digits
              </span>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Phone className="w-3.5 h-3.5" />
              </div>
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]{10}"
                maxLength={10}
                value={phone}
                onChange={handlePhoneChange}
                placeholder="10-digit mobile number"
                autoComplete="tel"
                required
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-emerald-500 rounded-xl pl-9 pr-9 py-2 text-xs sm:text-sm text-white placeholder-slate-500 outline-none transition"
              />
              {phone.length === 10 && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Password
              </label>
              <span className="text-[10px] text-slate-500">Min. 6 chars</span>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-3.5 h-3.5" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError("");
                }}
                placeholder="Enter password"
                autoComplete="current-password"
                required
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-emerald-500 rounded-xl pl-9 pr-10 py-2 text-xs sm:text-sm text-white placeholder-slate-500 outline-none transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white transition"
                aria-label={showPassword ? "Hide password" : "Show password"}
                title={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] disabled:opacity-50 text-slate-950 font-extrabold text-xs sm:text-sm rounded-xl py-2.5 transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/15"
          >
            {loading ? (
              <Loader size="inline" text="Signing in..." />
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>

          <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400">New user?</span>
            <Link
              href="/register"
              className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1"
            >
              <span>Create Account</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}