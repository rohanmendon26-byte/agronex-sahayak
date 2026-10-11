"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {
  MapPin,
  Clock,
  Siren,
  RefreshCw,
  Loader2,
  Sparkles,
  Heart,
  Mic,
  MicOff,
  Volume2,
  FileText,
  RotateCcw,
  Send,
  Zap,
  Navigation
} from "lucide-react";
import { calculateDistance } from "@/utils/distance";
import DeleteButton from "@/components/DeleteButton";
import Loader from "@/components/Loader";

const formatLocation = (loc) => {
    if (!loc) return "Shirva, Udupi";
    if (typeof loc === "string") return loc;
    if (typeof loc === "object") {
        const parts = [loc.locality, loc.city, loc.state].filter(Boolean);
        if (parts.length > 0) return parts.join(", ");
        return "Shirva, Udupi";
    }
    return String(loc);
};

const getStatusStyle = (status) => {
    const normalized = String(status || "").toUpperCase();
    const styles = {
        PENDING: "bg-amber-500/15 text-amber-300 border-amber-500/30",
        ASSIGNED: "bg-violet-500/15 text-violet-300 border-violet-500/30",
        IN_PROGRESS: "bg-sky-500/15 text-sky-300 border-sky-500/30",
        COMPLETED: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
        EMERGENCY: "bg-red-500/20 text-red-300 border-red-500/40 animate-pulse font-bold",
        URGENT: "bg-rose-500/15 text-rose-300 border-rose-500/30 font-semibold"
    };
    return styles[normalized] || "bg-slate-800 text-slate-300 border-slate-700";
};

export default function SeniorDashboard() {
    const router = useRouter();

    const [user, setUser] = useState({ name: "Senior" });
    const [need, setNeed] = useState("Medicine pickup");
    const [location, setLocation] = useState("Shirva, Udupi");
    const [priority, setPriority] = useState("URGENT");
    const [channel, setChannel] = useState("TEXT");

    const [activeNavSection, setActiveNavSection] = useState("ALL");
    const [activeTab, setActiveTab] = useState("VOICE");
    const [selectedLang, setSelectedLang] = useState("en-IN");
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [parsingVoice, setParsingVoice] = useState(false);
    const [voiceConfirmCard, setVoiceConfirmCard] = useState(null);
    const [speakingId, setSpeakingId] = useState(null);

    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const [gpsLocation, setGpsLocation] = useState({
        lat: 13.2210,
        lng: 74.8020,
        locality: "Shirva, Udupi",
        loading: false
    });

    const recognitionRef = useRef(null);

    const token =
        typeof window !== "undefined"
            ? localStorage.getItem("agronex_token")
            : null;

    useEffect(() => {
        if (!token) {
            router.push("/");
            return;
        }

        const savedRole = localStorage.getItem("agronex_role");
        if (savedRole && savedRole !== "SENIOR") {
            if (savedRole === "VOLUNTEER") router.push("/volunteer");
            else if (savedRole === "POLICE_ADMIN") router.push("/admin");
            else router.push("/");
            return;
        }

        try {
            const savedUser = localStorage.getItem("agronex_user");
            if (savedUser) {
                const parsedUser = JSON.parse(savedUser);
                if (parsedUser?.name) setUser(parsedUser);
            }
        } catch (error) {
            console.error(error);
        }

        fetchRequests();
        fetchGpsLocation();

        const intervalId = setInterval(() => {
            fetchRequests(true);
        }, 3000);

        const handleStorageChange = (e) => {
            if (e.key === "agronex_sync") fetchRequests(true);
        };
        window.addEventListener("storage", handleStorageChange);

        return () => {
            clearInterval(intervalId);
            window.removeEventListener("storage", handleStorageChange);
        };
    }, []);

    const fetchGpsLocation = () => {
        if (typeof window === "undefined" || !navigator.geolocation) return;

        setGpsLocation((prev) => ({ ...prev, loading: true }));
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude, longitude } = pos.coords;
                let loc = `Shirva (${latitude.toFixed(3)}°N, ${longitude.toFixed(3)}°E)`;
                setGpsLocation({ lat: latitude, lng: longitude, locality: loc, loading: false });
                setLocation(loc);
                toast.success("GPS updated");
            },
            () => {
                setGpsLocation((prev) => ({ ...prev, loading: false }));
            },
            { timeout: 7000 }
        );
    };

    const notifySync = () => {
        if (typeof window !== "undefined") {
            localStorage.setItem("agronex_sync", String(Date.now()));
        }
    };

    const speakText = (text, id = null) => {
        if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
        window.speechSynthesis.cancel();

        if (id && speakingId === id) {
            setSpeakingId(null);
            return;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = selectedLang;
        utterance.rate = 0.95;

        if (id) setSpeakingId(id);
        utterance.onend = () => setSpeakingId(null);
        utterance.onerror = () => setSpeakingId(null);

        window.speechSynthesis.speak(utterance);
    };

    const startListening = () => {
        setTranscript("");
        setVoiceConfirmCard(null);

        if (typeof window === "undefined") return;
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            toast.error("Voice not supported on this browser");
            return;
        }

        try {
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = true;
            recognition.lang = selectedLang;

            recognition.onstart = () => {
                setIsListening(true);
                toast.info(selectedLang === "kn-IN" ? "ಮಾತನಾಡಿ..." : "Listening...");
            };

            recognition.onresult = (event) => {
                let text = "";
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    text += event.results[i][0].transcript;
                }
                setTranscript(text);
            };

            recognition.onerror = () => setIsListening(false);
            recognition.onend = () => setIsListening(false);

            recognitionRef.current = recognition;
            recognition.start();
        } catch (err) {
            setIsListening(false);
            toast.error("Microphone error");
        }
    };

    const stopListening = () => {
        if (recognitionRef.current) recognitionRef.current.stop();
        setIsListening(false);
    };

    const handleParseVoice = async () => {
        if (!transcript.trim()) return;

        setParsingVoice(true);
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/voice/parse-request`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({ transcript, language: selectedLang })
                }
            );

            const data = await response.json();
            if (!response.ok) throw new Error(data?.error?.message || "Parse failed");

            const parsed = data.data;
            const parsedLoc = parsed.location || location || "Shirva, Udupi";

            setVoiceConfirmCard({
                need: parsed.need,
                location: parsedLoc,
                priority: parsed.priority || "ROUTINE"
            });

            toast.success("Processed! Confirm below.");
        } catch (err) {
            toast.error(err.message || "Parse failed");
        } finally {
            setParsingVoice(false);
        }
    };

    const fetchRequests = async (isSilent = false) => {
        if (!isSilent) setRefreshing(true);
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/requests`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const data = await response.json();
            if (response.ok) setRequests(data.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            if (!isSilent) setRefreshing(false);
        }
    };

    const handleCreateRequest = async (e, customData = null) => {
        if (e) e.preventDefault();

        setLoading(true);
        const reqNeed = customData ? customData.need : need;
        const reqLocation = customData ? customData.location : location;
        const reqPriority = customData ? customData.priority : priority;
        const reqChannel = customData ? customData.channel : channel;

        const locationPayload = {
            locality: typeof reqLocation === "string" ? reqLocation.split("(")[0].trim() || "Shirva" : "Shirva",
            lat: gpsLocation.lat || 13.2210,
            lng: gpsLocation.lng || 74.8020
        };

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/requests`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        need: reqNeed,
                        location: locationPayload,
                        priority: reqPriority,
                        channel: reqChannel
                    })
                }
            );

            const data = await response.json();
            if (!response.ok) throw new Error(data?.error?.message || "Failed");

            toast.success("Request sent!");
            setNeed("");
            setTranscript("");
            setVoiceConfirmCard(null);

            notifySync();
            fetchRequests();
        } catch (err) {
            toast.error(err.message || "Error creating request");
        } finally {
            setLoading(false);
        }
    };

    const handleEmergency = async (requestId) => {
        setLoading(true);
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/emergencies`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({ requestId, details: "SOS Emergency" })
                }
            );

            if (!response.ok) throw new Error("Failed");
            toast.error("🚨 SOS DISPATCHED TO POLICE!", { icon: "🚨" });
            notifySync();
            fetchRequests();
        } catch (err) {
            toast.error("SOS failed");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteRequest = async (requestId) => {
        if (!window.confirm("Delete this request?")) return;

        setLoading(true);
        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/requests/${requestId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Deleted");
            notifySync();
            fetchRequests();
        } catch (err) {
            toast.error("Delete failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="max-w-5xl mx-auto px-3 py-3 sm:px-4 sm:py-5 space-y-3.5">
            {/* Compact Top Header Bar */}
            <div className="p-3 sm:p-4 rounded-2xl bg-slate-900/90 border border-emerald-500/30 flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                        <Heart className="w-4 h-4" />
                    </div>
                    <div>
                        <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-1.5">
                            Senior: {user.name || "Senior"}
                        </h2>
                        <button
                            type="button"
                            onClick={fetchGpsLocation}
                            className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
                        >
                            <Navigation className="w-3 h-3" />
                            <span>{gpsLocation.locality}</span>
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={fetchRequests}
                        disabled={refreshing}
                        className="p-2 sm:px-3 sm:py-1.5 rounded-lg bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white border border-slate-700 transition"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            const active = requests.find(r => r.status !== "COMPLETED");
                            if (active) handleEmergency(active._id);
                            else toast.warn("No active requests to escalate");
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black shadow-md shadow-red-500/30 transition animate-pulse"
                    >
                        <Siren className="w-4 h-4" />
                        <span>EMERGENCY SOS</span>
                    </button>
                </div>
            </div>

            {/* Compact Section Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 border border-slate-800 rounded-xl text-xs">
                <button
                    type="button"
                    onClick={() => setActiveNavSection("ALL")}
                    className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition ${
                        activeNavSection === "ALL" ? "bg-emerald-500 text-slate-950" : "text-slate-400 hover:text-white"
                    }`}
                >
                    All
                </button>
                <button
                    type="button"
                    onClick={() => setActiveNavSection("INPUT")}
                    className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition ${
                        activeNavSection === "INPUT" ? "bg-emerald-500 text-slate-950" : "text-slate-400 hover:text-white"
                    }`}
                >
                    New Request
                </button>
                <button
                    type="button"
                    onClick={() => setActiveNavSection("HISTORY")}
                    className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition ${
                        activeNavSection === "HISTORY" ? "bg-emerald-500 text-slate-950" : "text-slate-400 hover:text-white"
                    }`}
                >
                    History ({requests.length})
                </button>
            </div>

            {/* Main Grid */}
            <div className={`grid gap-3.5 ${activeNavSection === "ALL" ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1 max-w-xl mx-auto"}`}>

                {/* Left: Input (Voice or Form) */}
                {(activeNavSection === "ALL" || activeNavSection === "INPUT") && (
                    <section className="glass-panel border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3.5">
                        {/* Voice vs Form */}
                        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs">
                            <button
                                type="button"
                                onClick={() => setActiveTab("VOICE")}
                                className={`flex-1 py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1 ${
                                    activeTab === "VOICE" ? "bg-emerald-500 text-slate-950" : "text-slate-400"
                                }`}
                            >
                                <Mic className="w-3.5 h-3.5" />
                                <span>Voice</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab("TEXT")}
                                className={`flex-1 py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1 ${
                                    activeTab === "TEXT" ? "bg-emerald-500 text-slate-950" : "text-slate-400"
                                }`}
                            >
                                <FileText className="w-3.5 h-3.5" />
                                <span>Form</span>
                            </button>
                        </div>

                        {activeTab === "VOICE" ? (
                            <div className="text-center py-2 space-y-3">
                                {/* Language Switch */}
                                <div className="inline-flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedLang("en-IN")}
                                        className={`px-3 py-1 rounded-lg font-semibold ${selectedLang === "en-IN" ? "bg-slate-800 text-emerald-400" : "text-slate-400"}`}
                                    >
                                        English
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedLang("kn-IN")}
                                        className={`px-3 py-1 rounded-lg font-semibold ${selectedLang === "kn-IN" ? "bg-slate-800 text-emerald-400" : "text-slate-400"}`}
                                    >
                                        ಕನ್ನಡ
                                    </button>
                                </div>

                                {/* Mic Button */}
                                <div className="relative inline-block py-2">
                                    {isListening && (
                                        <>
                                            <div className="soundwave-ripple" />
                                            <div className="soundwave-ripple-2" />
                                        </>
                                    )}

                                    <button
                                        type="button"
                                        onClick={isListening ? stopListening : startListening}
                                        className={`w-24 h-24 rounded-full flex flex-col items-center justify-center gap-1 transition-all ${
                                            isListening
                                                ? "bg-red-500 text-white shadow-xl shadow-red-500/50 scale-105"
                                                : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 active:scale-95"
                                        }`}
                                    >
                                        {isListening ? (
                                            <>
                                                <MicOff className="w-8 h-8 animate-pulse" />
                                                <span className="text-[10px] font-bold">Stop</span>
                                            </>
                                        ) : (
                                            <>
                                                <Mic className="w-8 h-8" />
                                                <span className="text-[10px] font-bold">
                                                    {selectedLang === "kn-IN" ? "ಮಾತನಾಡಿ" : "Speak"}
                                                </span>
                                            </>
                                        )}
                                    </button>
                                </div>

                                {/* Transcript */}
                                {transcript && (
                                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-left text-xs space-y-2">
                                        <div className="flex items-center justify-between text-slate-400 text-[11px]">
                                            <span>Transcript</span>
                                            <button
                                                type="button"
                                                onClick={() => speakText(transcript, "raw")}
                                                className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                                            >
                                                <Volume2 className="w-3 h-3" />
                                                <span>Listen</span>
                                            </button>
                                        </div>
                                        <p className="text-white italic font-medium">"{transcript}"</p>

                                        {!voiceConfirmCard && (
                                            <button
                                                type="button"
                                                onClick={handleParseVoice}
                                                disabled={parsingVoice}
                                                className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs transition flex items-center justify-center"
                                            >
                                                {parsingVoice ? (
                                                    <Loader size="inline" text="Processing..." />
                                                ) : (
                                                    "Process Request"
                                                )}
                                            </button>
                                        )}
                                    </div>
                                )}

                                {/* Confirm Card */}
                                {voiceConfirmCard && (
                                    <div className="p-3.5 rounded-xl bg-slate-900 border border-emerald-500/40 text-left space-y-2 text-xs">
                                        <div className="flex items-center justify-between font-bold text-slate-200">
                                            <span>Voice Request Card</span>
                                            <span className="text-[10px] text-emerald-400">Ready</span>
                                        </div>

                                        <input
                                            type="text"
                                            value={voiceConfirmCard.need}
                                            onChange={(e) => setVoiceConfirmCard({ ...voiceConfirmCard, need: e.target.value })}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
                                            placeholder="Need"
                                        />

                                        <input
                                            type="text"
                                            value={voiceConfirmCard.location}
                                            onChange={(e) => setVoiceConfirmCard({ ...voiceConfirmCard, location: e.target.value })}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
                                            placeholder="Location"
                                        />

                                        <button
                                            type="button"
                                            onClick={() => handleCreateRequest(null, { ...voiceConfirmCard, channel: "VOICE" })}
                                            disabled={loading}
                                            className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs transition flex items-center justify-center gap-1"
                                        >
                                            <Send className="w-3.5 h-3.5" />
                                            <span>Send Voice Request</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* Manual Form */
                            <form onSubmit={(e) => handleCreateRequest(e, { need, location, priority, channel: "TEXT" })} className="space-y-2.5 text-xs">
                                <div>
                                    <label className="block font-bold text-slate-400 mb-1">Assistance Need</label>
                                    <input
                                        type="text"
                                        value={need}
                                        onChange={(e) => setNeed(e.target.value)}
                                        placeholder="e.g. Medicine pickup"
                                        required
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                                    />
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="font-bold text-slate-400">Location</label>
                                        <button
                                            type="button"
                                            onClick={fetchGpsLocation}
                                            className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold"
                                        >
                                            Autofill GPS
                                        </button>
                                    </div>
                                    <input
                                        type="text"
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        placeholder="Address"
                                        required
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block font-bold text-slate-400 mb-1">Priority</label>
                                    <div className="grid grid-cols-3 gap-1.5">
                                        {["ROUTINE", "URGENT", "EMERGENCY"].map((p) => (
                                            <button
                                                key={p}
                                                type="button"
                                                onClick={() => setPriority(p)}
                                                className={`py-1.5 rounded-lg border text-center font-bold text-xs ${
                                                    priority === p
                                                        ? p === "EMERGENCY"
                                                            ? "bg-red-500/20 border-red-500 text-red-300"
                                                            : "bg-emerald-500 text-slate-950 border-emerald-500"
                                                        : "bg-slate-950 border-slate-800 text-slate-400"
                                                }`}
                                            >
                                                {p}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition mt-1"
                                >
                                    {loading ? "Submitting..." : "Submit Request"}
                                </button>
                            </form>
                        )}
                    </section>
                )}

                {/* Right: History */}
                {(activeNavSection === "ALL" || activeNavSection === "HISTORY") && (
                    <section className="glass-panel border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
                            <span className="font-bold text-white flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-blue-400" /> My Requests
                            </span>
                            <span className="text-slate-400">{requests.length} Total</span>
                        </div>

                        {requests.length === 0 ? (
                            <p className="text-center py-8 text-xs text-slate-500">No requests yet</p>
                        ) : (
                            <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                                {requests.map((req) => (
                                    <div
                                        key={req._id}
                                        className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition space-y-2 text-xs"
                                    >
                                        <div className="flex items-center justify-between gap-1.5">
                                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${getStatusStyle(req.priority)}`}>
                                                {req.priority}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusStyle(req.status)}`}>
                                                {req.status}
                                            </span>
                                        </div>

                                        <div>
                                            <h4 className="font-bold text-white text-sm">{req.need}</h4>
                                            <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                                <MapPin className="w-3 h-3 text-emerald-400" />
                                                <span>{formatLocation(req.location)}</span>
                                            </p>
                                        </div>

                                        <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-1.5">
                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => speakText(`${req.need}, status ${req.status}`, req._id)}
                                                    className="px-2 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white flex items-center gap-1 text-[11px]"
                                                >
                                                    <Volume2 className="w-3 h-3" />
                                                    <span>Speak</span>
                                                </button>

                                                <DeleteButton
                                                    onClick={() => handleDeleteRequest(req._id)}
                                                    disabled={loading}
                                                    title="Delete"
                                                />
                                            </div>

                                            {req.status !== "COMPLETED" && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleEmergency(req._id)}
                                                    className="px-2.5 py-1 rounded-lg bg-red-500/20 text-red-300 border border-red-500/40 text-[11px] font-bold hover:bg-red-500/30"
                                                >
                                                    🚨 SOS
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                )}
            </div>
        </main>
    );
}