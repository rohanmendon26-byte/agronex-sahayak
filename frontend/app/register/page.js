"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-toastify";
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
  Navigation
} from "lucide-react";

export default function Register() {
  const router = useRouter();

  const [role, setRole] = useState("SENIOR");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [location, setLocation] = useState("");
  const [gpsLoading, setGpsLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const fetchLiveLocation = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      toast.error("Geolocation not supported");
      return;
    }

    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        let detected = `Location (${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E)`;

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          if (res.ok) {
            const data = await res.json();
            if (data && data.address) {
              const a = data.address;
              const place = a.suburb || a.village || a.town || a.city_district || a.city || "";
              if (place) {
                detected = `${place}, Shirva (${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E)`;
              }
            }
          }
        } catch (e) {
          console.warn(e);
        }

        setLocation(detected);
        setGpsLoading(false);
        toast.success("GPS Captured!");
      },
      () => {
        setLocation("Shirva Main Street, Udupi");
        setGpsLoading(false);
      },
      { timeout: 7000 }
    );
  };

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
        ...(role === "SENIOR" ? { location: location || "Shirva Main Street" } : {})
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
        throw new Error(data?.error?.message || "Registration failed");
      }

      setSuccess(true);
      toast.success("Account created!");

      setTimeout(() => {
        router.push("/");
      }, 1200);
    } catch (err) {
      setError(err.message);
      toast.error(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-3 py-4 sm:px-4">
      <div className="w-full max-w-md">
        
        {/* Header */}
        <div className="text-center mb-4">
          <h1 className="text-2xl font-black text-white">Create Account</h1>
          <p className="text-xs text-slate-400 mt-0.5">Register for AgroNex Sahayak</p>
        </div>

        {/* Card */}
        <form
          onSubmit={handleRegister}
          className="glass-panel border border-slate-800/90 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3.5"
        >
          {/* Role Toggle */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setRole("SENIOR");
                setError("");
              }}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                role === "SENIOR"
                  ? "bg-emerald-500 text-slate-950 shadow-sm"
                  : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-white"
              }`}
            >
              <Heart className="w-3.5 h-3.5" />
              <span>Senior Citizen</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setRole("VOLUNTEER");
                setError("");
              }}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                role === "VOLUNTEER"
                  ? "bg-emerald-500 text-slate-950 shadow-sm"
                  : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-white"
              }`}
            >
              <HeartHandshake className="w-3.5 h-3.5" />
              <span>Volunteer</span>
            </button>
          </div>

          {/* Form Fields */}
          <div className="space-y-2.5">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <User className="w-3.5 h-3.5" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full name"
                  required
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-emerald-500 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Phone
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Phone className="w-3.5 h-3.5" />
                </div>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Mobile number"
                  required
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-emerald-500 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Email <span className="text-slate-500 lowercase">(optional)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-3.5 h-3.5" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-emerald-500 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 outline-none transition"
                />
              </div>
            </div>

            {role === "SENIOR" && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Location
                  </label>
                  <button
                    type="button"
                    onClick={fetchLiveLocation}
                    disabled={gpsLoading}
                    className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300"
                  >
                    <Navigation className={`w-3 h-3 ${gpsLoading ? "animate-spin" : ""}`} />
                    <span>{gpsLoading ? "Detecting..." : "Autofill GPS"}</span>
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Location / Address"
                    required
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-emerald-500 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 outline-none transition"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-emerald-500 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 outline-none transition"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Account created! Redirecting...</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || success}
            className="w-full bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] disabled:opacity-50 text-slate-950 font-extrabold text-xs sm:text-sm rounded-xl py-2.5 transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/15"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Registering...</span>
              </>
            ) : (
              <>
                <span>Register</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400">Already registered?</span>
            <Link
              href="/"
              className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1"
            >
              <span>Sign In</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}