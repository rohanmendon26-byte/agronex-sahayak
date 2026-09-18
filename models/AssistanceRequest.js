const mongoose = require("mongoose");

const assistanceRequestSchema = new mongoose.Schema(
    {
        seniorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        volunteerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        need: {
            type: String,
            required: true,
            trim: true
        },

        location: {
            type: Object,
            required: true
        },

        priority: {
            type: String,
            required: true,
            enum: ["ROUTINE", "URGENT", "EMERGENCY"],
            default: "ROUTINE"
        },

        status: {
            type: String,
            required: true,
            enum: ["PENDING", "ASSIGNED", "IN_PROGRESS", "COMPLETED"],
            default: "PENDING"
        },

        createdAt: {
            type: Date,
            default: Date.now
        }
    }
);

module.exports = mongoose.model(
    "AssistanceRequest",
    assistanceRequestSchema
);