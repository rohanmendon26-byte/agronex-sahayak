const mongoose = require("mongoose");

const emergencyRecordSchema = new mongoose.Schema(
    {
        requestId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AssistanceRequest",
            required: true
        },

        escalationStatus: {
            type: String,
            required: true,
            enum: ["PENDING", "ESCALATED", "RESOLVED"],
            default: "PENDING"
        },

        escalatedAt: {
            type: Date,
            default: null
        },

        details: {
            type: String,
            required: true
        },

        createdAt: {
            type: Date,
            default: Date.now
        }
    }
);

module.exports = mongoose.model(
    "EmergencyRecord",
    emergencyRecordSchema
);