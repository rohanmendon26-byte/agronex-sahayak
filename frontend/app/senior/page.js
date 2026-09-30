"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ToastContainer, toast } from "react-toastify";
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
  Send,
  Globe,
  Trash2,
  Zap,
  Navigation
} from "lucide-react";
import { calculateDistance } from "@/utils/distance";
import DeleteButton from "@/components/DeleteButton";

const formatLocation = (loc) => {
    if (!loc) return "Shirva, Udupi";
    if (typeof loc === "string") return loc;
    if (typeof loc === "object") {
        const parts = [loc.locality, loc.city, loc.state, loc.addressLine].filter(Boolean);
        if (parts.length > 0) return parts.join(", ");
        return Object.values(loc).filter(v => typeof v === "string").join(", ") || "Shirva, Udupi";
    }
    return String(loc);
};

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

const reverseGeocode = async (lat, lng) => {
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`, {
            headers: { 'Accept-Language': 'en' }
        });
        if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            const area = addr.suburb || addr.neighbourhood || addr.village || addr.town || addr.city_district || addr.city || addr.county || "";
            const cityOrState = addr.city || addr.state_district || addr.state || "";
            const parts = [area, cityOrState].filter(Boolean);
            if (parts.length > 0) {
                return parts.join(", ");
            }
            if (data.display_name) {
                return data.display_name.split(",").slice(0, 2).join(", ").trim();
            }
        }
    } catch (e) {
        console.warn("Reverse geocode notice:", e);
    }
    return null;
};

const fetchIpLocation = async () => {
    try {
        const res = await fetch("https://ipapi.co/json/");
        if (res.ok) {
            const data = await res.json();
            if (data.city && data.latitude && data.longitude) {
                return {
                    lat: data.latitude,
                    lng: data.longitude,
                    locality: `${data.city}, ${data.region_code || data.region || ""}`.trim()
                };
            }
        }
    } catch (e) {
        console.warn("IP location fallback notice:", e);
    }
    return null;
};

export default function SeniorDashboard() {
    const router = useRouter();

    const [user, setUser] = useState({ name: "Senior" });
    const [need, setNeed] = useState("Medicine pickup");
    const [location, setLocation] = useState("Detecting location...");
    const [priority, setPriority] = useState("URGENT");
    const [channel, setChannel] = useState("TEXT");

    // Voice & Language Flow States
    const [activeNavSection, setActiveNavSection] = useState("ALL"); // "ALL" | "INPUT" | "HISTORY"
    const [activeTab, setActiveTab] = useState("VOICE"); // "VOICE" | "TEXT"
    const [selectedLang, setSelectedLang] = useState("en-IN"); // "en-IN" | "kn-IN"
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

    const [gpsLocation, setGpsLocation] = useState({
        lat: 13.2210,
        lng: 74.8020,
        locality: "Detecting live location...",
        isLive: true,
        loading: false
    });

    const fetchGpsLocation = () => {
        if (typeof window === "undefined") return;

        setGpsLocation((prev) => ({ ...prev, loading: true }));

        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    let detectedLocality = await reverseGeocode(latitude, longitude);
                    if (!detectedLocality) {
                        detectedLocality = `Location (${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E)`;
                    }
                    setGpsLocation({
                        lat: latitude,
                        lng: longitude,
                        locality: detectedLocality,
                        isLive: true,
                        loading: false
                    });
                    setLocation(`${detectedLocality} (${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E)`);
                    toast.success(`📍 Live GPS Captured: ${detectedLocality}!`, { icon: "🛰️" });
                },
                async (err) => {
                    console.warn("Geolocation API notice:", err.message);
                    const ipLoc = await fetchIpLocation();
                    if (ipLoc) {
                        setGpsLocation({
                            lat: ipLoc.lat,
                            lng: ipLoc.lng,
                            locality: ipLoc.locality,
                            isLive: true,
                            loading: false
                        });
                        setLocation(`${ipLoc.locality} (${ipLoc.lat.toFixed(4)}°N, ${ipLoc.lng.toFixed(4)}°E)`);
                        toast.info(`📍 Location detected via IP: ${ipLoc.locality}`);
                    } else {
                        setGpsLocation({
                            lat: 13.2210,
                            lng: 74.8020,
                            locality: "Current Location",
                            isLive: true,
                            loading: false
                        });
                        setLocation("Current Location (13.2210°N, 74.8020°E)");
                        toast.info("📍 Live GPS set to Current Location");
                    }
                },
                { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
            );
        } else {
            setGpsLocation((prev) => ({ ...prev, loading: false }));
            toast.error("Geolocation is not supported in this browser.");
        }
    };

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
                if (parsedUser?.name) {
                    setUser(parsedUser);
                    toast.info(`Welcome ${parsedUser.name}! Active as Senior Citizen.`, { icon: "👴" });
                }
            }
        } catch (error) {
            console.error("Failed to parse saved user:", error);
        }

        fetchRequests();
        fetchGpsLocation();

        // Real-time 3-second auto-sync interval across all devices/windows
        const intervalId = setInterval(() => {
            fetchRequests(true);
        }, 3000);

        const handleStorageChange = (e) => {
            if (e.key === "agronex_sync") {
                fetchRequests(true);
            }
        };
        window.addEventListener("storage", handleStorageChange);

        return () => {
            clearInterval(intervalId);
            window.removeEventListener("storage", handleStorageChange);
        };
    }, []);

    const notifySync = () => {
        if (typeof window !== "undefined") {
            localStorage.setItem("agronex_sync", String(Date.now()));
        }
    };

    // Text-to-speech helper
    const speakText = (text, id = null) => {
        if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
        window.speechSynthesis.cancel(); // Stop any active speech

        if (id && speakingId === id) {
            setSpeakingId(null);
            return;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = selectedLang;
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
            const errMsg = "Voice recognition is not supported in this browser. Please use Chrome/Edge or fill out the text form.";
            setError(errMsg);
            toast.error(errMsg);
            return;
        }

        try {
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = true;
            recognition.lang = selectedLang;

            recognition.onstart = () => {
                setIsListening(true);
                toast.info(selectedLang === "kn-IN" ? "🎙️ ಮೈಕ್ರೋಫೋನ್ ಸಕ್ರಿಯವಾಗಿದೆ... ಈಗ ಮಾತನಾಡಿ." : "🎙️ Listening... Speak your request naturally now.");
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
                    const captureError = `Voice capture error (${event.error}). Please try again.`;
                    setError(captureError);
                    toast.error(captureError);
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
            toast.error("Failed to initialize voice recognition.");
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
            const emptyMsg = "Please speak your request before parsing.";
            setError(emptyMsg);
            toast.warn(emptyMsg);
            return;
        }

        setParsingVoice(true);
        setError("");
        toast.info("⚡ Processing voice request into structured card...");

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

            if (!response.ok) {
                throw new Error(data?.error?.message || "Failed to parse voice request");
            }

            const parsed = data.data;
            const currentAutoLoc = location || (gpsLocation.locality ? `${gpsLocation.locality} (${gpsLocation.lat.toFixed(4)}°N, ${gpsLocation.lng.toFixed(4)}°E)` : "Shirva, Udupi");
            const parsedLoc = (parsed.location && parsed.location.toLowerCase() !== "shirva" && parsed.location.trim().length > 0) ? parsed.location : currentAutoLoc;

            setVoiceConfirmCard({
                need: parsed.need,
                location: parsedLoc,
                priority: parsed.priority || "ROUTINE"
            });

            // Read back confirmation aloud in natural language
            const isKannada = selectedLang === "kn-IN";
            const readBackMsg = isKannada
                ? `ಸರಿ. ${parsed.need} ವಿನಂತಿ, ಸ್ಥಳ ${parsedLoc}, ಆಧ್ಯತೆ ${parsed.priority}. ದಯವಿಟ್ಟು ಖಚಿತಪಡಿಸಿ.`
                : `Understood. Assistance request for ${parsed.need} near ${parsedLoc}, marked priority as ${parsed.priority}. Please confirm to submit.`;

            speakText(readBackMsg, "confirm-card");
        } catch (err) {
            setError(err.message);
        } finally {
            setParsingVoice(false);
        }
    };

    const fetchRequests = async (isSilent = false) => {
        if (!isSilent) setRefreshing(true);
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
            if (!isSilent) setError(err.message);
        } finally {
            if (!isSilent) setRefreshing(false);
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

        let locationPayload = reqLocation;
        if (typeof reqLocation === "string") {
            locationPayload = {
                locality: reqLocation.split("(")[0].trim() || gpsLocation.locality || "Shirva",
                city: "Udupi",
                state: "Karnataka",
                lat: gpsLocation.lat || 13.2210,
                lng: gpsLocation.lng || 74.8020,
                isLiveGPS: true
            };
        }

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

            if (!response.ok) {
                throw new Error(
                    data?.error?.message || "Failed to create request"
                );
            }

            const isVoice = reqChannel === "VOICE";
            const successMsg = `Assistance request submitted via ${isVoice ? "🎙️ Voice" : "📝 Text"} successfully!`;
            setMessage(successMsg);
            toast.success(successMsg);

            setNeed("");
            setLocation("");
            setPriority("ROUTINE");
            setTranscript("");
            setVoiceConfirmCard(null);

            notifySync();
            fetchRequests();
        } catch (err) {
            setError(err.message);
            toast.error(err.message || "Failed to create request");
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

            const alertMsg = "🚨 Emergency SOS alert dispatched to Police & Volunteers!";
            setMessage(alertMsg);
            toast.error(alertMsg, { icon: "🚨" });
            notifySync();
            fetchRequests();
        } catch (err) {
            setError(err.message);
            toast.error(err.message || "Failed to escalate emergency");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteRequest = async (requestId) => {
        if (typeof window !== "undefined" && !window.confirm("Are you sure you want to delete this request?")) return;

        setLoading(true);
        setMessage("");
        setError("");

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/requests/${requestId}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data?.error?.message || "Failed to delete request");
            }

            const deleteMsg = "Assistance request deleted successfully.";
            setMessage(deleteMsg);
            toast.success(deleteMsg);
            notifySync();
            fetchRequests();
        } catch (err) {
            setError(err.message);
            toast.error(err.message || "Failed to delete request");
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
                                Multilingual Speech Recognition (English & ಕನ್ನಡ)
                            </span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                            Welcome back, {user.name || "Senior"}
                        </h2>
                        <p className="text-sm text-slate-400 mt-1">
                            Speak your request naturally in English or Kannada to alert local volunteers.
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
                    </div>
                )}

                {/* Real-Time GPS Location Detector Banner */}
                <div className="mb-6 p-4 rounded-2xl bg-slate-900/90 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-emerald-500/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
                            <Navigation className="w-5 h-5 text-emerald-400 animate-pulse" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-200">Senior Real-Time GPS Location</span>
                                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                                    Live Tracking Active
                                </span>
                            </div>
                            <p className="text-xs text-slate-300 font-medium mt-0.5">
                                📍 {gpsLocation.locality} <span className="text-emerald-400 font-mono text-[11px] font-semibold">({gpsLocation.lat.toFixed(4)}° N, {gpsLocation.lng.toFixed(4)}° E)</span>
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={fetchGpsLocation}
                        disabled={gpsLocation.loading}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition shrink-0 disabled:opacity-50"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${gpsLocation.loading ? "animate-spin" : ""}`} />
                        <span>{gpsLocation.loading ? "Locating..." : "Refresh Live GPS Pin"}</span>
                    </button>
                </div>

                {/* Senior Domain Navigation Tabs */}
                <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-900/90 border border-slate-800 rounded-2xl mb-8 shadow-inner">
                    <button
                        type="button"
                        onClick={() => setActiveNavSection("ALL")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                            activeNavSection === "ALL"
                                ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                        }`}
                    >
                        <Sparkles className="w-4 h-4" />
                        <span>All Sections</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveNavSection("INPUT")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                            activeNavSection === "INPUT"
                                ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                        }`}
                    >
                        <PlusCircle className="w-4 h-4" />
                        <span>✍️ Input Section (New Request)</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveNavSection("HISTORY")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                            activeNavSection === "HISTORY"
                                ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                        }`}
                    >
                        <Clock className="w-4 h-4" />
                        <span>📜 Request History ({requests.length})</span>
                    </button>
                </div>

                <div className={`grid gap-8 items-start ${activeNavSection === "ALL" ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1 max-w-md mx-auto"}`}>

                    {/* Left Panel: Voice vs Text Request Submission */}
                    {(activeNavSection === "ALL" || activeNavSection === "INPUT") && (
                        <section className="glass-panel border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl max-w-md mx-auto w-full h-fit">
                        {/* Tab Switcher & Language Selector Header */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
                            <div className="flex items-center gap-2 p-1 bg-slate-900 border border-slate-800 rounded-2xl flex-1">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab("VOICE")}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                                        activeTab === "VOICE"
                                            ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                                            : "text-slate-400 hover:text-slate-200"
                                    }`}
                                >
                                    <Mic className="w-4 h-4" />
                                    <span>🎙️ Voice</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setActiveTab("TEXT")}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                                        activeTab === "TEXT"
                                            ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                                            : "text-slate-400 hover:text-slate-200"
                                    }`}
                                >
                                    <FileText className="w-4 h-4" />
                                    <span>📝 Form</span>
                                </button>
                            </div>
                        </div>

                        {activeTab === "VOICE" ? (
                            <div className="space-y-5">
                                <div className="text-center py-3">
                                    <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
                                        <div className="flex items-center justify-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-2xl">
                                            <Globe className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
                                            <button
                                                type="button"
                                                onClick={() => setSelectedLang("en-IN")}
                                                className={`py-1.5 px-2 rounded-xl text-xs font-semibold transition-all ${
                                                    selectedLang === "en-IN"
                                                        ? "bg-slate-800 text-white font-bold"
                                                        : "text-slate-400 hover:text-slate-200"
                                                }`}
                                            >
                                                EN
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setSelectedLang("kn-IN")}
                                                className={`py-1.5 px-2 rounded-xl text-xs font-semibold transition-all ${
                                                    selectedLang === "kn-IN"
                                                        ? "bg-slate-800 text-emerald-400 font-bold"
                                                        : "text-slate-400 hover:text-slate-200"
                                                }`}
                                            >
                                                ಕನ್ನಡ
                                            </button>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={fetchGpsLocation}
                                            className="flex items-center gap-1.5 py-1.5 px-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition shadow-sm"
                                        >
                                            <Navigation className="w-3.5 h-3.5 text-emerald-400" />
                                            <span>📍 {gpsLocation.locality || "Autofill GPS"}</span>
                                        </button>
                                    </div>
                                    <p className="text-xs text-slate-400 mb-5">
                                        {selectedLang === "kn-IN" ? (
                                            <>
                                                ಮೈಕ್ರೋಫೋನ್ ಒತ್ತಿ ನಿಮ್ಮ ವಿನಂತಿಯನ್ನು ಹೇಳಿ (ಉದಾ: <em className="text-emerald-300">"ನನಗೆ ತುರ್ತಾಗಿ ಔಷಧಿ ಶಿರ್ವ ಹತ್ತಿರ ಬೇಕು"</em>)
                                            </>
                                        ) : (
                                            <>
                                                Tap microphone and describe what you need (e.g., <em className="text-slate-300">"I urgently need medicine picked up near Shirva"</em>)
                                            </>
                                        )}
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
                                                <span className="text-[10px] font-extrabold uppercase">
                                                    {selectedLang === "kn-IN" ? "ಮಾತನಾಡಿ" : "Tap & Speak"}
                                                </span>
                                            </>
                                        )}
                                    </button>

                                    {isListening && (
                                        <p className="text-xs text-red-400 font-semibold mt-4 animate-bounce">
                                            🎙️ {selectedLang === "kn-IN" ? "ಕೇಳಿಸಿಕೊಳ್ಳುತ್ತಿದ್ದೇವೆ... ಈಗ ಮಾತನಾಡಿ." : "Listening... Speak clearly now."}
                                        </p>
                                    )}
                                </div>

                                {/* Transcript Box */}
                                {transcript && (
                                    <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                                {selectedLang === "kn-IN" ? "ಧ್ವನಿ ಪಠ್ಯ" : "Speech Transcript"}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => speakText(transcript, "raw-transcript")}
                                                className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                                            >
                                                <Volume2 className="w-3.5 h-3.5" />
                                                <span>{selectedLang === "kn-IN" ? "ಆಲಿಸಿ" : "Listen"}</span>
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
                                                        <span>Processing...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Sparkles className="w-4 h-4" />
                                                        <span>{selectedLang === "kn-IN" ? "ವಿಶ್ಲೇಷಿಸಿ" : "Process Voice Request"}</span>
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
                                                🎙️ {selectedLang === "kn-IN" ? "ಕನ್ನಡ VOICE" : "VOICE CHANNEL"}
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

                                            <div>
                                                <div className="flex items-center justify-between mb-1">
                                                    <label className="block text-[11px] font-semibold text-slate-400 uppercase">Location / Address</label>
                                                    <button
                                                        type="button"
                                                        onClick={async () => {
                                                            toast.info("📍 Fetching live GPS pin...");
                                                            if (navigator.geolocation) {
                                                                navigator.geolocation.getCurrentPosition(
                                                                    async (pos) => {
                                                                        const lat = pos.coords.latitude;
                                                                        const lng = pos.coords.longitude;
                                                                        let locName = `Location (${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E)`;
                                                                        try {
                                                                            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
                                                                            const data = await res.json();
                                                                            if (data && data.address) {
                                                                                locName = data.address.suburb || data.address.village || data.address.town || data.address.city || locName;
                                                                            }
                                                                        } catch (e) {}
                                                                        const fullLoc = `${locName} (${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E)`;
                                                                        setVoiceConfirmCard((prev) => ({ ...prev, location: fullLoc }));
                                                                        toast.success(`📍 Live GPS Autofilled: ${locName}`);
                                                                    },
                                                                    () => {
                                                                        setVoiceConfirmCard((prev) => ({ ...prev, location: location || "Live GPS Location" }));
                                                                    }
                                                                );
                                                            }
                                                        }}
                                                        className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition"
                                                    >
                                                        <Navigation className="w-3 h-3 text-emerald-400" />
                                                        <span>📍 Autofill Live GPS Pin</span>
                                                    </button>
                                                </div>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                                        <MapPin className="w-3.5 h-3.5" />
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={voiceConfirmCard.location}
                                                        onChange={(e) => setVoiceConfirmCard({ ...voiceConfirmCard, location: e.target.value })}
                                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Priority Level</label>
                                                <select
                                                    value={voiceConfirmCard.priority}
                                                    onChange={(e) => setVoiceConfirmCard({ ...voiceConfirmCard, priority: e.target.value })}
                                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                                                >
                                                    <option value="ROUTINE">Routine</option>
                                                    <option value="URGENT">Urgent</option>
                                                    <option value="EMERGENCY">Emergency</option>
                                                </select>
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
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                                            Location / Address
                                        </label>
                                        <button
                                            type="button"
                                            onClick={fetchGpsLocation}
                                            className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition"
                                        >
                                            <Navigation className="w-3 h-3 text-emerald-400" />
                                            📍 Autofill Live GPS Pin
                                        </button>
                                    </div>
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
                    )}

                    {/* Right Panel: Request History & Read-Aloud Accessibility */}
                    {(activeNavSection === "ALL" || activeNavSection === "HISTORY") && (
                    <section className="glass-panel border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl">
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800/80">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center">
                                    <Clock className="w-5 h-5 text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">My Requests & History</h3>
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
                                    const formattedLoc = formatLocation(request.location);
                                    const isKannada = selectedLang === "kn-IN";
                                    const readAloudText = isKannada
                                        ? `${request.need} ವಿನಂತಿ, ಸ್ಥಳ ${formattedLoc}, ಆಧ್ಯತೆ ${request.priority}, ಸ್ಥಿತಿ ${request.status}.`
                                        : `Request for ${request.need}, located at ${formattedLoc}, priority ${request.priority}, status ${request.status}.`;
                                    const isVoiceReq = request.channel === "VOICE";

                                    return (
                                        <div
                                            key={request._id}
                                            className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition shadow-lg space-y-3"
                                        >
                                            {/* Top Header Row: Badges & Status */}
                                            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold flex items-center gap-1 shrink-0 ${
                                                        isVoiceReq
                                                            ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                                                            : "bg-slate-800 text-slate-400 border border-slate-700"
                                                    }`}>
                                                        {isVoiceReq ? "🎙️ VOICE" : "📝 TEXT"}
                                                    </span>

                                                    <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold shrink-0 ${getStatusStyle(request.priority)}`}>
                                                        Priority: {request.priority}
                                                    </span>
                                                </div>

                                                <span className={`text-xs px-3 py-0.5 rounded-full font-semibold shrink-0 ${getStatusStyle(request.status)}`}>
                                                    Status: {request.status}
                                                </span>
                                            </div>

                                            {/* Need Title & Location */}
                                            <div className="space-y-1">
                                                <h4 className="font-extrabold text-white text-base sm:text-lg leading-snug break-words">
                                                    {request.need}
                                                </h4>

                                                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 break-words pt-0.5">
                                                    <div className="flex items-center gap-1.5">
                                                        <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                                        <span className="font-medium text-slate-300">{formattedLoc}</span>
                                                    </div>
                                                    <span className="text-[11px] font-mono text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30 font-semibold flex items-center gap-1">
                                                        <Zap className="w-3 h-3 text-emerald-400" />
                                                        {request.volunteerId ? "Volunteer Matched (~" : "Proximity (~"}{calculateDistance(request.location, "Shirva")} km)
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Footer Row: Action Buttons */}
                                            <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => speakText(readAloudText, request._id)}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition font-semibold"
                                                    >
                                                        <Volume2 className={`w-3.5 h-3.5 ${speakingId === request._id ? "text-emerald-400 animate-pulse" : "text-slate-400"}`} />
                                                        <span>{speakingId === request._id ? "Speaking..." : "🔊 Read Aloud"}</span>
                                                    </button>

                                                    <DeleteButton
                                                        onClick={() => handleDeleteRequest(request._id)}
                                                        disabled={loading}
                                                        title="Delete Request"
                                                    />
                                                </div>

                                                {request.status !== "COMPLETED" && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleEmergency(request._id)}
                                                        disabled={loading}
                                                        className="flex items-center justify-center gap-1.5 border border-red-500/40 bg-red-500/15 hover:bg-red-500/25 text-red-300 font-bold rounded-xl px-3 py-1.5 text-xs transition disabled:opacity-50"
                                                    >
                                                        <Siren className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                                                        <span>🚨 Escalate SOS</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>
                    )}
                </div>
            </div>
            <ToastContainer theme="dark" position="top-right" autoClose={3000} />
        </main>
    );
}