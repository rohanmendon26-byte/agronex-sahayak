"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Heart,
  HeartHandshake,
  ShieldCheck,
  User,
  PlusCircle,
  Home
} from "lucide-react";

export default function MobileBottomNav() {
  const pathname = usePathname();

  const navItems = [
    {
      label: "Home",
      href: "/",
      icon: Home
    },
    {
      label: "Senior",
      href: "/senior",
      icon: Heart,
      activeColor: "text-emerald-400"
    },
    {
      label: "Volunteer",
      href: "/volunteer",
      icon: HeartHandshake,
      activeColor: "text-violet-400"
    },
    {
      label: "Police",
      href: "/admin",
      icon: ShieldCheck,
      activeColor: "text-blue-400"
    },
    {
      label: "Register",
      href: "/register",
      icon: PlusCircle,
      activeColor: "text-teal-400"
    }
  ];

  return (
    <div className="md:hidden fixed bottom-3 left-4 right-4 z-40 max-w-md mx-auto pointer-events-auto">
      <nav className="glass-panel border border-slate-700/80 rounded-2xl p-1.5 shadow-2xl shadow-slate-950/90 flex items-center justify-around backdrop-blur-2xl">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all duration-200 relative ${
                isActive
                  ? "bg-slate-800/90 text-white scale-105 shadow-md shadow-slate-900"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Icon
                className={`w-5 h-5 transition-transform ${
                  isActive ? `${item.activeColor || "text-emerald-400"} scale-110` : ""
                }`}
              />
              <span className="text-[10px] font-bold mt-0.5 tracking-tight">
                {item.label}
              </span>

              {isActive && (
                <span className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
