const AssistanceRequest = require("../models/AssistanceRequest");
const EmergencyRecord = require("../models/EmergencyRecord");
const AuditLog = require("../models/AuditLog");
const User = require("../models/User");
const SeniorProfile = require("../models/SeniorProfile");

/**
 * IVR Options Menu Definition
 */
const IVR_MENU = {
    "1": {
        category: "MEDICAL",
        need: "Urgent Medical Assistance & Medicine Pickup",
        priority: "URGENT",
        audioMessage: "Your urgent medical assistance request has been logged. A verified volunteer will contact you shortly."
    },
    "2": {
        category: "GROCERY",
        need: "Essential Ration & Daily Grocery Delivery",
        priority: "ROUTINE",
        audioMessage: "Your grocery delivery request has been logged. A local volunteer will pick up your supplies."
    },
    "3": {
        category: "EMERGENCY",
        need: "🚨 CRITICAL POLICE & MEDICAL EMERGENCY SOS FROM KEYPAD PHONE",
        priority: "EMERGENCY",
        audioMessage: "Emergency SOS activated! Police administration and active emergency responders have been alerted."
    }
};

/**
 * Get available IVR options list
 */
const getIvrMenuOptions = async (req, res) => {
    return res.status(200).json({
        success: true,
        data: {
            helplineNumber: "+91-1800-AGRONEX (1800-247-6639)",
            welcomeMessage: "Welcome to AgroNex Sahayak Keypad Phone IVR Helpline.",
            options: [
                { digit: "1", label: "Press 1 for Medical Assistance & Medicines", priority: "URGENT" },
                { digit: "2", label: "Press 2 for Daily Ration & Grocery Pickup", priority: "ROUTINE" },
                { digit: "3", label: "Press 3 for 🚨 Immediate Police & Emergency SOS", priority: "EMERGENCY" },
                { digit: "9", label: "Press 9 (or speak) to state custom requirement", priority: "DYNAMIC" }
            ]
        }
    });
};

/**
 * Handle incoming IVR Call / Webhook (Keypad DTMF press or Spoken Voice)
 */
const handleIncomingCall = async (req, res) => {
    try {
        const { callerPhone, digit, Digits, SpeechResult, speechInput, language } = req.body;

        // Support both standard Twilio parameters (Digits/SpeechResult) and custom JSON body
        const selectedDigit = String(digit || Digits || "").trim();
        const spokenVoice = (speechInput || SpeechResult || "").trim();
        const phone = (callerPhone || "8888888888").trim();

        // 1. Find Senior User by Phone
        let seniorUser = await User.findOne({ phone: phone, role: "SENIOR" });
        if (!seniorUser) {
            // Fallback to primary test senior user if non-registered caller
            seniorUser = await User.findOne({ role: "SENIOR" });
        }

        if (!seniorUser) {
            return res.status(404).json({
                success: false,
                error: {
                    code: "SENIOR_NOT_FOUND",
                    message: "No senior citizen account found to associate with caller ID."
                }
            });
        }

        // Fetch location details from Senior Profile
        const seniorProfile = await SeniorProfile.findOne({ userId: seniorUser._id });
        let requestLocation = "Shirva, Udupi";
        if (seniorProfile?.address) {
            if (typeof seniorProfile.address === "string") {
                requestLocation = seniorProfile.address;
            } else if (typeof seniorProfile.address === "object") {
                const parts = [
                    seniorProfile.address.locality,
                    seniorProfile.address.city,
                    seniorProfile.address.state
                ].filter(Boolean);
                if (parts.length > 0) {
                    requestLocation = parts.join(", ");
                }
            }
        }

        let need = "";
        let priority = "ROUTINE";
        let audioResponse = "";

        // 2. Process DTMF Keypad Selection or Spoken Input
        if (selectedDigit && IVR_MENU[selectedDigit]) {
            const menuItem = IVR_MENU[selectedDigit];
            need = menuItem.need;
            priority = menuItem.priority;
            audioResponse = menuItem.audioMessage;
        } else if (spokenVoice || selectedDigit === "9") {
            const rawVoice = spokenVoice || "General Assistance Required via Voice IVR";
            need = `IVR Voice Call: ${rawVoice}`;
            
            // Simple keyword priority extraction for IVR speech
            const lower = rawVoice.toLowerCase();
            if (lower.includes("emergency") || lower.includes("pain") || lower.includes("sos") || lower.includes("help")) {
                priority = "EMERGENCY";
            } else if (lower.includes("urgent") || lower.includes("medicine") || lower.includes("doctor")) {
                priority = "URGENT";
            } else {
                priority = "ROUTINE";
            }
            audioResponse = `Your spoken request "${rawVoice}" has been processed. Volunteers have been notified.`;
        } else {
            return res.status(400).json({
                success: false,
                error: {
                    code: "INVALID_IVR_INPUT",
                    message: "Please select a valid keypad digit (1 for Medical, 2 for Grocery, 3 for Emergency) or speak your request."
                }
            });
        }

        // 3. Create Assistance Request with channel IVR_PHONE
        const newRequest = await AssistanceRequest.create({
            seniorId: seniorUser._id,
            need: need,
            location: requestLocation,
            priority: priority,
            status: "PENDING",
            channel: "IVR_PHONE"
        });

        // 4. Handle Emergency Record Escalation if Priority is EMERGENCY
        let emergencyRecord = null;
        if (priority === "EMERGENCY") {
            emergencyRecord = await EmergencyRecord.create({
                requestId: newRequest._id,
                escalationStatus: "ESCALATED",
                escalatedAt: new Date(),
                details: need || "🚨 Keypad Phone Emergency SOS Triggered"
            });

            await AuditLog.create({
                userId: seniorUser._id,
                requestId: newRequest._id,
                action: "EMERGENCY_ESCALATED_VIA_IVR",
                createdAt: new Date()
            });
        }

        // 5. Create System Audit Log
        await AuditLog.create({
            userId: seniorUser._id,
            requestId: newRequest._id,
            action: "IVR_PHONE_REQUEST_CREATED",
            createdAt: new Date()
        });

        // Populate senior details for frontend response
        const populatedRequest = await AssistanceRequest.findById(newRequest._id)
            .populate("seniorId", "name phone email")
            .populate("volunteerId", "name phone email");

        // 6. Return Twilio XML TwiML if requested via Webhook header, otherwise JSON
        const acceptsXml = req.headers["accept"] && req.headers["accept"].includes("xml");
        if (acceptsXml) {
            res.type("text/xml");
            return res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice" language="${language || "en-IN"}">${audioResponse}</Say>
</Response>`);
        }

        return res.status(201).json({
            success: true,
            message: "Keypad IVR call processed successfully",
            data: {
                request: populatedRequest,
                emergencyRecord: emergencyRecord,
                audioMessage: audioResponse,
                callerPhone: phone,
                digitPressed: selectedDigit
            }
        });
    } catch (error) {
        console.error("IVR Call Handling Error:", error);
        return res.status(500).json({
            success: false,
            error: {
                code: "SERVER_ERROR",
                message: "Internal server error processing IVR phone call"
            }
        });
    }
};

module.exports = {
    getIvrMenuOptions,
    handleIncomingCall
};
