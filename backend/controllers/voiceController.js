const KNOWN_LOCALITIES = [
    "Shirva",
    "Udupi",
    "Manipal",
    "Kaup",
    "Karkala",
    "Kundapura",
    "Padubidri",
    "Brahmavar",
    "Moodabidri",
    "Mangalore",
    "Surathkal"
];

const EMERGENCY_KEYWORDS = [
    "chest pain",
    "fallen",
    "bleeding",
    "fire",
    "heart attack",
    "accident",
    "breath",
    "breathing problem",
    "stroke",
    "sos",
    "unconscious",
    "collapsed"
];

const URGENT_KEYWORDS = [
    "urgent",
    "today",
    "sick",
    "immediately",
    "asap",
    "fever",
    "doctor",
    "pain",
    "severe",
    "medicine",
    "hospital"
];

const FILLER_PHRASES = [
    "i urgently need",
    "i need to get",
    "i need to buy",
    "i need to",
    "i need",
    "could you please",
    "could you",
    "please help me with",
    "please help me get",
    "please buy",
    "please bring",
    "please get",
    "can someone get",
    "i want to buy",
    "i want to get",
    "i want",
    "help me get",
    "help me with"
];

const parseVoiceRequest = async (req, res) => {
    try {
        const { transcript } = req.body;

        if (!transcript || typeof transcript !== "string" || !transcript.trim()) {
            return res.status(400).json({
                success: false,
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Audio transcript text is required"
                }
            });
        }

        const rawText = transcript.trim();
        const lowerText = rawText.toLowerCase();

        // 1. Priority Detection
        let priority = "ROUTINE";

        if (EMERGENCY_KEYWORDS.some((kw) => lowerText.includes(kw))) {
            priority = "EMERGENCY";
        } else if (URGENT_KEYWORDS.some((kw) => lowerText.includes(kw))) {
            priority = "URGENT";
        }

        // 2. Locality Matching
        let detectedLocation = "";
        for (const locality of KNOWN_LOCALITIES) {
            if (lowerText.includes(locality.toLowerCase())) {
                detectedLocation = locality;
                break;
            }
        }

        // 3. Need Cleaning
        let cleanedNeed = rawText;

        // Remove matched locality from need string if present
        if (detectedLocation) {
            const locRegex = new RegExp(`(?:near|at|in)?\\s*${detectedLocation}`, "gi");
            cleanedNeed = cleanedNeed.replace(locRegex, "");
        }

        // Remove filler phrases
        FILLER_PHRASES.forEach((phrase) => {
            const phraseRegex = new RegExp(`^${phrase}\\s*`, "gi");
            cleanedNeed = cleanedNeed.replace(phraseRegex, "");
        });

        // Clean trailing/leading punctuation or extra spaces
        cleanedNeed = cleanedNeed
            .replace(/^[,\.\-\s]+|[,\.\-\s]+$/g, "")
            .trim();

        // Capitalize first letter
        if (cleanedNeed.length > 0) {
            cleanedNeed = cleanedNeed.charAt(0).toUpperCase() + cleanedNeed.slice(1);
        } else {
            cleanedNeed = rawText;
        }

        return res.status(200).json({
            success: true,
            data: {
                need: cleanedNeed,
                location: detectedLocation || "Shirva",
                priority: priority,
                rawTranscript: rawText,
                channel: "VOICE"
            }
        });
    } catch (error) {
        console.error("Parse voice request error:", error);

        return res.status(500).json({
            success: false,
            error: {
                code: "SERVER_ERROR",
                message: "Internal server error parsing voice transcript"
            }
        });
    }
};

module.exports = {
    parseVoiceRequest
};
