const mongoose = require("mongoose");

const volunteerProfileSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        organisationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organisation",
            default: null
        },

        skills: {
            type: [String],
            default: []
        },

        availability: {
            type: Boolean,
            required: true,
            default: true
        },

        status: {
            type: String,
            required: true,
            enum: ["REGISTERED", "VERIFIED", "ACTIVE", "INACTIVE"],
            default: "REGISTERED"
        },

        verificationNotes: {
            type: String,
            default: null
        },

        location: {
            type: Object,
            default: { locality: "Shirva", city: "Udupi", state: "Karnataka", lat: 13.2250, lng: 74.8030 }
        },

        createdAt: {
            type: Date,
            default: Date.now
        }
    }
);

module.exports = mongoose.model("VolunteerProfile", volunteerProfileSchema);