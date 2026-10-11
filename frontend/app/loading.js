"use client";

import Loader from "@/components/Loader";

export default function Loading() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="glass-panel border border-slate-800 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
        <Loader
          size="lg"
          text="AgroNex Sahayak"
          subtext="Connecting live community network..."
        />
      </div>
    </div>
  );
}
