"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Heart,
  HeartHandshake,
  ShieldCheck,
  User,
  LogOut,
  Menu,
  X,
  Sparkles,
  Zap,
  ChevronDown
} from "lucide-react";
import { toast } from "react-toastify";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentRole, setCurrentRole] = useState(null);
  const [demoMenuOpen, setDemoMenuOpen] = useState(false);

  useEffect(() => {
    const syncUser = () => {
      try {
        const token = localStorage.getItem("agronex_token");
        const role = localStorage.getItem("agronex_role");
        const userStr = localStorage.getItem("agronex_user");
        if (token && userStr) {
          setCurrentUser(JSON.parse(userStr));
          setCurrentRole(role);
        } else {
          setCurrentUser(null);
          setCurrentRole(null);
        }
      } catch (e) {
        setCurrentUser(null);
        setCurrentRole(null);
      }
    };

    syncUser();
    window.addEventListener("storage", syncUser);
    return () => window.removeEventListener("storage", syncUser);
  }, [pathname]);

  const handleLogout = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    localStorage.removeItem("agronex_token");
    localStorage.removeItem("agronex_role");
    localStorage.removeItem("agronex_user");
    setCurrentUser(null);
    setCurrentRole(null);
    toast.info("Logged out", { icon: "👋" });
    router.push("/");
  };

  const navLinks = [
    { name: "Home", href: "/", icon: User },
    { name: "Senior", href: "/senior", icon: Heart },
    { name: "Volunteer", href: "/volunteer", icon: HeartHandshake },
    { name: "Admin", href: "/admin", icon: ShieldCheck },
    { name: "Register", href: "/register", icon: Sparkles }
  ];

  const quickDemoSwitch = (roleType) => {
    setDemoMenuOpen(false);
    setMobileMenuOpen(false);

    if (roleType === "SENIOR") {
      const demoUser = { name: "Ramesh Shirva", phone: "8888888888", role: "SENIOR" };
      localStorage.setItem("agronex_token", "demo-token-senior");
      localStorage.setItem("agronex_role", "SENIOR");
      localStorage.setItem("agronex_user", JSON.stringify(demoUser));
      setCurrentUser(demoUser);
      setCurrentRole("SENIOR");
      toast.success("Switched to Senior", { icon: "👴" });
      router.push("/senior");
    } else if (roleType === "VOLUNTEER") {
      const demoUser = { name: "Kiran", phone: "7777777777", role: "VOLUNTEER" };
      localStorage.setItem("agronex_token", "demo-token-volunteer");
      localStorage.setItem("agronex_role", "VOLUNTEER");
      localStorage.setItem("agronex_user", JSON.stringify(demoUser));
      setCurrentUser(demoUser);
      setCurrentRole("VOLUNTEER");
      toast.success("Switched to Volunteer", { icon: "🤝" });
      router.push("/volunteer");
    } else if (roleType === "POLICE_ADMIN") {
      const demoUser = { name: "Police Dispatch", phone: "9999999999", role: "POLICE_ADMIN" };
      localStorage.setItem("agronex_token", "demo-token-admin");
      localStorage.setItem("agronex_role", "POLICE_ADMIN");
      localStorage.setItem("agronex_user", JSON.stringify(demoUser));
      setCurrentUser(demoUser);
      setCurrentRole("POLICE_ADMIN");
      toast.success("Switched to Admin", { icon: "👮" });
      router.push("/admin");
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-slate-950/85 border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-14">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <HeartHandshake className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-base tracking-tight text-white">
              AgroNex <span className="text-emerald-400">Sahayak</span>
            </span>
          </Link>

          {/* Desktop Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-slate-800 text-emerald-400 border border-slate-700/80"
                      : "text-slate-400 hover:text-white hover:bg-slate-900"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Quick Demo Switcher */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setDemoMenuOpen(!demoMenuOpen)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-300 hover:text-white transition"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Demo Switch</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${demoMenuOpen ? "rotate-180" : ""}`} />
              </button>

              {demoMenuOpen && (
                <div className="absolute right-0 mt-1.5 w-44 p-1.5 rounded-xl bg-slate-900/95 border border-slate-800 shadow-xl z-50">
                  <button
                    type="button"
                    onClick={() => quickDemoSwitch("SENIOR")}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-200 hover:bg-emerald-500/10 hover:text-emerald-300 transition text-left"
                  >
                    <Heart className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Senior (Ramesh)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => quickDemoSwitch("VOLUNTEER")}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-200 hover:bg-violet-500/10 hover:text-violet-300 transition text-left"
                  >
                    <HeartHandshake className="w-3.5 h-3.5 text-violet-400" />
                    <span>Volunteer (Kiran)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => quickDemoSwitch("POLICE_ADMIN")}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-200 hover:bg-blue-500/10 hover:text-blue-300 transition text-left"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                    <span>Police Admin</span>
                  </button>
                </div>
              )}
            </div>

            {/* User Logged in Pill or Login */}
            {currentUser ? (
              <div className="flex items-center gap-1.5">
                <span className="hidden sm:inline text-xs font-medium text-slate-300 bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-800 truncate max-w-[120px]">
                  {currentUser.name || "User"}
                </span>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-red-500/15 border border-slate-800 hover:border-red-500/30 text-slate-400 hover:text-red-300 text-xs font-medium transition"
                  title="Logout"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <Link
                href="/"
                className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition"
              >
                <User className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>
            )}

            {/* Mobile Hamburger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950/95 px-3 py-2 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${
                  isActive
                    ? "bg-slate-800 text-emerald-400"
                    : "text-slate-300 hover:bg-slate-900"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
