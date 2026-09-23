"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  HeartHandshake,
  LogOut,
  User,
  MapPin,
  Clock,
  AlertTriangle,
  PlusCircle,
  Siren,
  CheckCircle2,
  RefreshCw,
  ShieldAlert,
  Loader2,
  Sparkles,
  Heart,
  Mic,
  MicOff,
  Volume2,
  FileText,
  Radio,
  Edit3,
  RotateCcw,
  Send
} from "lucide-react";

const getStatusStyle = (status) => {
    const normalized = String(status || "").toUpperCase();

    const styles = {
        PENDING: "bg-amber-500/15 text-amber-300 border border-amber-500/30",
        ASSIGNED: "bg-violet-500/15 text-violet-300 border border-violet-500/30",
        IN_PROGRESS: "bg-sky-500/15 text-sky-300 border border-sky-500/30",
        COMPLETED: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30",
        ACTIVE: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30",
        VERIFIED: "bg-sky-500/15 text-sky-300 border border-sky-500/30",
        EMERGENCY: "bg-red-500/20 text-red-300 border border-red-500/40 font-bold animate-pulse",
        URGENT: "bg-rose-500/15 text-rose-300 border border-rose-500/30"
    };

    return styles[normalized] || "bg-slate-800 text-slate-300 border border-slate-700";
};

export default function SeniorDashboard() {
    const router = useRouter();

    const [user, setUser] = useState({ name: "Senior" });
    const [need, setNeed] = useState("Medicine pickup");
    const [location, setLocation] = useState("Shirva");
    const [priority, setPriority] = useState("URGENT");
    const [channel, setChannel] = useState("TEXT");

    // Voice Flow States
    const [activeTab, setActiveTab] = useState("VOICE"); // "VOICE" | "TEXT"
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [parsingVoice, setParsingVoice] = useState(false);
    const [voiceConfirmCard, setVoiceConfirmCard] = useState(null); // { need, location, priority }
    const [speakingId, setSpeakingId] = useState(null);

    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

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

        try {
            const savedUser = localStorage.getItem("agronex_user");
            if (savedUser) {
                const parsedUser = JSON.parse(savedUser);
                if (parsedUser?.name) {
                    setUser(parsedUser);
                }
            }
        } catch (error) {
            console.error("Failed to parse saved user:", error);
        }

        fetchRequests();
    }, []);

    // Text-to-speech helper
    const speakText = (text, id = null) => {
        if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
        window.speechSynthesis.cancel(); // Stop any active speech

        if (id && speakingId === id) {
            setSpeakingId(null);
            return;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.95;
        utterance.pitch = 1.0;

        if (id) setSpeakingId(id);

        utterance.onend = () => {
            setSpeakingId(null);
        };
        utterance.onerror = () => {
            setSpeakingId(null);
        };

        window.speechSynthesis.speak(utterance);
    };

    // Voice recognition launcher
    const startListening = () => {
        setError("");
        setMessage("");
        setTranscript("");
        setVoiceConfirmCard(null);

        if (typeof window === "undefined") return;

        const SpeechRecognition =
            window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            setError("Voice recognition is not supported in this browser. Please use Chrome/Edge or fill out the text form.");
            return;
        }

        try {
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = true;
            recognition.lang = "en-US";

            recognition.onstart = () => {
                setIsListening(true);
            };

            recognition.onresult = (event) => {
                let currentTranscript = "";
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    currentTranscript += event.results[i][0].transcript;
                }
                setTranscript(currentTranscript);
            };

            recognition.onerror = (event) => {
                console.error("Speech recognition error:", event.error);
                setIsListening(false);
                if (event.error !== "no-speech") {
                    setError(`Voice capture error (${event.error}). Please try again or type manually.`);
                }
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            recognitionRef.current = recognition;
            recognition.start();
        } catch (err) {
            console.error("Failed to start speech recognition:", err);
            setIsListening(false);
            setError("Failed to initialize voice recognition.");
        }
    };

    const stopListening = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        setIsListening(false);
    };

    // Process spoken transcript with backend voice parser
    const handleParseVoice = async () => {
        if (!transcript.trim()) {
            setError("Please speak your request before parsing.");
            return;
        }

        setParsingVoice(true);
        setError("");

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/voice/parse-request`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({ transcript })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data?.error?.message || "Failed to parse voice request");
            }

            const parsed = data.data;
            setVoiceConfirmCard({
                need: parsed.need,
                location: parsed.location || "Shirva",
                priority: parsed.priority || "ROUTINE"
            });

            // Read back confirmation aloud
            const readBackMsg = `Understood. Assistance request for ${parsed.need} near ${parsed.location || "Shirva"}, marked priority as ${parsed.priority}. Please confirm to submit.`;
            speakText(readBackMsg, "confirm-card");
        } catch (err) {
            setError(err.message);
        } finally {
            setParsingVoice(false);
        }
    };

    const fetchRequests = async () => {
        setRefreshing(true);
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/requests`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data?.error?.message || "Failed to load requests"
                );
            }

            setRequests(data.data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setRefreshing(false);
        }
    };

    const handleCreateRequest = async (e, customData = null) => {
        if (e) e.preventDefault();

        setLoading(true);
        setMessage("");
        setError("");

        const reqNeed = customData ? customData.need : need;
        const reqLocation = customData ? customData.location : location;
        const reqPriority = customData ? customData.priority : priority;
        const reqChannel = customData ? customData.channel : channel;

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
                        location: reqLocation,
                        priority: reqPriority,
                        channel: reqChannel
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data?.error?.message || "Failed to create request"
                );
            }

            const isVoice = reqChannel === "VOICE";
            setMessage(`Assistance request submitted via ${isVoice ? "🎙️ Voice" : "📝 Text"} successfully!`);

            setNeed("");
            setLocation("");
            setPriority("ROUTINE");
            setTranscript("");
            setVoiceConfirmCard(null);

            fetchRequests();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEmergency = async (requestId) => {
        setLoading(true);
        setMessage("");
        setError("");

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/emergencies`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        requestId,
                        details: "Emergency assistance required"
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data?.error?.message || "Failed to escalate emergency"
                );
            }

            setMessage("🚨 Emergency alert dispatched to Police & Volunteers!");
            fetchRequests();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
            window.speechSynthesis.cancel();
        }
        localStorage.removeItem("agronex_token");
        localStorage.removeItem("agronex_role");
        localStorage.removeItem("agronex_user");
        router.push("/");
    };

    return (
        <main className="min-h-screen bg-slate-950 text-white">
            {/* Top Navigation */}
            <nav className="glass-panel border-b border-slate-800/80 sticky top-0 z-30">
                <div className="max-w-6xl mx-auto px-4 py-3 sm:px-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                            <Heart className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                            <h1 className="text-lg font-extrabold tracking-tight">
                                AgroNex <span className="text-emerald-400">Sahayak</span>
                            </h1>
                            <p className="text-xs text-slate-400 font-medium">Voice-First Senior Portal</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300">
                            <User className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{user.name || "Senior"}</span>
                        </div>

                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition"
                        >
                            <LogOut className="w-3.5 h-3.5" />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </nav>

            <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6 sm:py-8">

                {/* Welcome Header */}
                <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-2">
                            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                            <span className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">
                                Voice-First Assistance Enabled
                            </span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                            Welcome back, {user.name || "Senior"}
                        </h2>
                        <p className="text-sm text-slate-400 mt-1">
                            Speak your request naturally or type manually to alert local volunteers.
                        </p>
                    </div>

                    <button
                        onClick={fetchRequests}
                        disabled={refreshing}
                        className="self-start sm:self-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 hover:text-white transition"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
                        <span>Refresh Status</span>
                    </button>
                </div>

                {/* Status Messages */}
                {message && (
                    <div className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300 flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                        <span>{message}</span>
                    </div>
                )}

                {error && (
                    <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300 flex items-center gap-3">
                        <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* Left Panel: Voice vs Text Request Submission */}
                    <section className="glass-panel border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl">
                        {/* Tab Switcher */}
                        <div className="flex items-center gap-2 p-1 bg-slate-900 border border-slate-800 rounded-2xl mb-6">
                            <button
                                type="button"
                                onClick={() => setActiveTab("VOICE")}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                                    activeTab === "VOICE"
                                        ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                                        : "text-slate-400 hover:text-slate-200"
                                }`}
                            >
                                <Mic className="w-4 h-4" />
                                <span>🎙️ Voice Request</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab("TEXT")}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                                    activeTab === "TEXT"
                                        ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                                        : "text-slate-400 hover:text-slate-200"
                                }`}
                            >
                                <FileText className="w-4 h-4" />
                                <span>📝 Manual Form</span>
                            </button>
                        </div>

                        {activeTab === "VOICE" ? (
                            <div className="space-y-6">
                                <div className="text-center py-4">
                                    <p className="text-xs text-slate-400 mb-5">
                                        Tap the microphone and describe what you need (e.g., <em className="text-slate-300">"I urgently need medicine picked up near Shirva"</em>)
                                    </p>

                                    {/* Big Voice Button */}
                                    <button
                                        type="button"
                                        onClick={isListening ? stopListening : startListening}
                                        className={`w-28 h-28 mx-auto rounded-full flex flex-col items-center justify-center gap-2 transition-all duration-300 ${
                                            isListening
                                                ? "bg-red-500 text-white animate-pulse shadow-2xl shadow-red-500/40 border-4 border-red-400"
                                                : "bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 hover:scale-105 shadow-xl shadow-emerald-500/20"
                                        }`}
                                    >
                                        {isListening ? (
                                            <>
                                                <MicOff className="w-9 h-9" />
                                                <span className="text-[10px] font-extrabold uppercase">Stop</span>
                                            </>
                                        ) : (
                                            <>
                                                <Mic className="w-9 h-9" />
                                                <span className="text-[10px] font-extrabold uppercase">Tap & Speak</span>
                                            </>
                                        )}
                                    </button>

                                    {isListening && (
                                        <p className="text-xs text-red-400 font-semibold mt-4 animate-bounce">
                                            🎙️ Listening... Speak clearly now.
                                        </p>
                                    )}
                                </div>

                                {/* Transcript Box */}
                                {transcript && (
                                    <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Speech Transcript</span>
                                            <button
                                                type="button"
                                                onClick={() => speakText(transcript, "raw-transcript")}
                                                className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                                            >
                                                <Volume2 className="w-3.5 h-3.5" />
                                                <span>Listen</span>
                                            </button>
                                        </div>
                                        <p className="text-sm text-white italic">"{transcript}"</p>

                                        {!voiceConfirmCard && (
                                            <button
                                                type="button"
                                                onClick={handleParseVoice}
                                                disabled={parsingVoice}
                                                className="w-full mt-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl py-2.5 text-xs transition flex items-center justify-center gap-2 disabled:opacity-50"
                                            >
                                                {parsingVoice ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        <span>Parsing Request...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Sparkles className="w-4 h-4" />
                                                        <span>Process Voice Request</span>
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                )}

                                {/* Parsed Confirmation Card */}
                                {voiceConfirmCard && (
                                    <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-emerald-500/40 glow-border-emerald space-y-4">
                                        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                                            <div className="flex items-center gap-2">
                                                <Sparkles className="w-4 h-4 text-emerald-400" />
                                                <h4 className="text-sm font-bold text-white">Parsed Voice Request Card</h4>
                                            </div>
                                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                                                🎙️ VOICE CHANNEL
                                            </span>
                                        </div>

                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-[11px] font-semibold text-slate-400 uppercase">Need</label>
                                                <input
                                                    type="text"
                                                    value={voiceConfirmCard.need}
                                                    onChange={(e) => setVoiceConfirmCard({ ...voiceConfirmCard, need: e.target.value })}
                                                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-[11px] font-semibold text-slate-400 uppercase">Location</label>
                                                    <input
                                                        type="text"
                                                        value={voiceConfirmCard.location}
                                                        onChange={(e) => setVoiceConfirmCard({ ...voiceConfirmCard, location: e.target.value })}
                                                        className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-[11px] font-semibold text-slate-400 uppercase">Priority</label>
                                                    <select
                                                        value={voiceConfirmCard.priority}
                                                        onChange={(e) => setVoiceConfirmCard({ ...voiceConfirmCard, priority: e.target.value })}
                                                        className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                                                    >
                                                        <option value="ROUTINE">Routine</option>
                                                        <option value="URGENT">Urgent</option>
                                                        <option value="EMERGENCY">Emergency</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => handleCreateRequest(null, { ...voiceConfirmCard, channel: "VOICE" })}
                                                disabled={loading}
                                                className="w-full sm:flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl py-3 text-xs transition flex items-center justify-center gap-2 disabled:opacity-50"
                                            >
                                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                                <span>Confirm & Submit Voice Request</span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={startListening}
                                                className="w-full sm:w-auto px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition flex items-center justify-center gap-1.5"
                                            >
                                                <RotateCcw className="w-3.5 h-3.5" />
                                                <span>Re-record</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* Manual Text Form */
                            <form onSubmit={(e) => handleCreateRequest(e, { need, location, priority, channel: "TEXT" })} className="space-y-5">
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                                        What do you need assistance with?
                                    </label>
                                    <input
                                        type="text"
                                        value={need}
                                        onChange={(e) => setNeed(e.target.value)}
                                        placeholder="e.g. Medicine pickup, grocery buying"
                                        required
                                        className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3.5 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition-all"
                                    />
                                </div>

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
                                            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-3.5 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition-all"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                                        Priority Level
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { value: "ROUTINE", label: "Routine" },
                                            { value: "URGENT", label: "Urgent" },
                                            { value: "EMERGENCY", label: "Emergency" }
                                        ].map((item) => (
                                            <button
                                                key={item.value}
                                                type="button"
                                                onClick={() => setPriority(item.value)}
                                                className={`p-3 rounded-xl border text-center transition-all ${
                                                    priority === item.value
                                                        ? item.value === "EMERGENCY"
                                                            ? "bg-red-500/20 border-red-500 text-red-300 font-bold"
                                                            : item.value === "URGENT"
                                                            ? "bg-amber-500/20 border-amber-500 text-amber-300 font-bold"
                                                            : "bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold"
                                                        : "bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-900"
                                                }`}
                                            >
                                                <div className="text-xs">{item.label}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold rounded-xl py-3.5 shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <HeartHandshake className="w-5 h-5" />}
                                    <span>Submit Manual Text Request</span>
                                </button>
                            </form>
                        )}
                    </section>

                    {/* Right Panel: Request History & Read-Aloud Accessibility */}
                    <section className="glass-panel border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl">
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800/80">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center">
                                    <Clock className="w-5 h-5 text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">My Requests & History</h3>
                                    <p className="text-xs text-slate-400">Voice-first channel tracking & audio read-aloud</p>
                                </div>
                            </div>

                            <span className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300 font-semibold">
                                {requests.length} Requests
                            </span>
                        </div>

                        {requests.length === 0 ? (
                            <div className="text-center py-16 text-slate-500">
                                <Heart className="w-12 h-12 mx-auto text-slate-700 mb-3" />
                                <p className="text-sm">No assistance requests created yet.</p>
                                <p className="text-xs text-slate-600 mt-1">Use the voice recorder or form to create one.</p>
                            </div>
                        ) : (
                            <div className="space-y-4 max-h-[540px] overflow-y-auto pr-1">
                                {requests.map((request) => {
                                    const readAloudText = `Request for ${request.need}, located at ${request.location}, priority ${request.priority}, status ${request.status}.`;
                                    const isVoiceReq = request.channel === "VOICE";

                                    return (
                                        <div
                                            key={request._id}
                                            className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-bold text-white text-base">
                                                            {request.need}
                                                        </h4>

                                                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold flex items-center gap-1 ${
                                                            isVoiceReq
                                                                ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                                                                : "bg-slate-800 text-slate-400 border border-slate-700"
                                                        }`}>
                                                            {isVoiceReq ? "🎙️ VOICE" : "📝 TEXT"}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                                                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                                                        <span>{request.location}</span>
                                                    </div>
                                                </div>

                                                <span className={`text-xs px-3 py-1 rounded-full font-semibold ${getStatusStyle(request.status)}`}>
                                                    {request.status}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-800/60 text-xs">
                                                <span className={`px-2.5 py-0.5 rounded-md font-medium ${getStatusStyle(request.priority)}`}>
                                                    Priority: {request.priority}
                                                </span>

                                                <button
                                                    type="button"
                                                    onClick={() => speakText(readAloudText, request._id)}
                                                    className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
                                                >
                                                    <Volume2 className={`w-3.5 h-3.5 ${speakingId === request._id ? "text-emerald-400 animate-pulse" : "text-slate-400"}`} />
                                                    <span>{speakingId === request._id ? "Speaking..." : "🔊 Read Aloud"}</span>
                                                </button>
                                            </div>

                                            {request.status !== "COMPLETED" && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleEmergency(request._id)}
                                                    disabled={loading}
                                                    className="mt-4 w-full flex items-center justify-center gap-2 border border-red-500/40 bg-red-500/10 hover:bg-red-500/20 text-red-300 font-bold rounded-xl py-2.5 text-xs transition disabled:opacity-50"
                                                >
                                                    <Siren className="w-4 h-4 text-red-400 animate-pulse" />
                                                    <span>🚨 Escalate Urgent Emergency</span>
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </main>
    );
}