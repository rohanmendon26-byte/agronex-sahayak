const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        requestId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AssistanceRequest",
            default: null
        },

        action: {
            type: String,
            required: true
        },

        timestamp: {
            type: Date,
            default: Date.now
        }
    }
);

module.exports = mongoose.model("AuditLog", auditLogSchema);