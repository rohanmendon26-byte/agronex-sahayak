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
  ShieldAlert,
  CheckCircle2,
  Heart,
  Navigation,
  Eye,
  EyeOff
} from "lucide-react";
import Loader from "@/components/Loader";
import { getUserLocation } from "@/utils/geolocation";

export default function Register() {
  const router = useRouter();

  const [role, setRole] = useState("SENIOR");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [location, setLocation] = useState("");
  const [gpsLoading, setGpsLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handlePhoneChange = (e) => {
    const numericOnly = e.target.value.replace(/\D/g, "").slice(0, 10);
    setPhone(numericOnly);
    if (error) setError("");
  };

  const fetchLiveLocation = async () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      toast.warn("Geolocation is not supported by your browser");
      return;
    }

    setGpsLoading(true);
    try {
      const geo = await getUserLocation();
      const resolvedLocality = geo.displayName || geo.locality || "Shirva Main Street, Udupi";
      setLocation(resolvedLocality);
      toast.success(`📍 GPS Captured: ${geo.locality || "Shirva"}`);
    } catch (err) {
      toast.warn(err.message || "Could not read GPS location. Please enter manually.");
      if (!location) setLocation("Shirva Main Street, Udupi");
    } finally {
      setGpsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    const cleanName = name.trim();
    const cleanPhone = phone.trim();
    const cleanEmail = email.trim();
    const cleanLocation = location.trim();

    setError("");

    // Validate name
    if (!cleanName || cleanName.length < 2) {
      setError("Please enter your full name (at least 2 characters)");
      toast.warn("Full name is required");
      return;
    }

    // Validate phone edge case: exactly 10 digits
    if (!/^\d{10}$/.test(cleanPhone)) {
      setError("Mobile number must be exactly 10 digits");
      toast.warn("10-digit mobile number is required");
      return;
    }

    // Validate optional email
    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError("Please enter a valid email address");
      toast.warn("Invalid email format");
      return;
    }

    // Validate location for Senior
    if (role === "SENIOR" && !cleanLocation) {
      setError("Please provide your location or click Autofill GPS");
      toast.warn("Location is required for senior citizen");
      return;
    }

    // Validate password edge cases
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters long");
      toast.warn("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      toast.warn("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const endpoints = {
        SENIOR: "/auth/senior/register",
        VOLUNTEER: "/auth/volunteer/register"
      };

      const body = {
        name: cleanName,
        phone: cleanPhone,
        password,
        ...(cleanEmail ? { email: cleanEmail } : {}),
        ...(role === "SENIOR" ? { location: cleanLocation || "Shirva Main Street, Udupi" } : {})
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
      toast.success("Account created successfully!");

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
                  autoComplete="email"
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
                    className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 transition"
                  >
                    <Navigation className={`w-3 h-3 ${gpsLoading ? "animate-spin text-amber-400" : ""}`} />
                    <span>{gpsLoading ? "Detecting GPS..." : "Autofill GPS"}</span>
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
                  placeholder="Create password"
                  autoComplete="new-password"
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

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Confirm Password
                </label>
                {confirmPassword && (
                  <span className={`text-[10px] font-semibold ${password === confirmPassword ? "text-emerald-400" : "text-amber-400"}`}>
                    {password === confirmPassword ? "✓ Matches" : "Must match"}
                  </span>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="Re-enter password"
                  autoComplete="new-password"
                  required
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-emerald-500 rounded-xl pl-9 pr-10 py-2 text-xs sm:text-sm text-white placeholder-slate-500 outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white transition"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  title={showConfirmPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
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
              <span>Account created! Redirecting to login...</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || success}
            className="w-full bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] disabled:opacity-50 text-slate-950 font-extrabold text-xs sm:text-sm rounded-xl py-2.5 transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/15"
          >
            {loading ? (
              <Loader size="inline" text="Registering..." />
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