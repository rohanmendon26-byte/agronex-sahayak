const AssistanceRequest = require("../models/AssistanceRequest");
const EmergencyRecord = require("../models/EmergencyRecord");
const { createAuditLog } = require("../services/auditService");
const mongoose = require("mongoose");


const createEmergency = async (req, res) => {
    try {
        const { requestId, details } = req.body;

        if (!mongoose.Types.ObjectId.isValid(requestId)) {
            return res.status(400).json({
                success: false,
                error: {
                    code: "INVALID_ID",
                    message: "Invalid request ID"
                }
            });
        }

        // Validate required fields
        if (!requestId || !details) {
            return res.status(400).json({
                success: false,
                error: {
                    code: "VALIDATION_ERROR",
                    message: "requestId and details are required"
                }
            });
        }

        // Find assistance request
        const request = await AssistanceRequest.findById(requestId);

        if (!request) {
            return res.status(404).json({
                success: false,
                error: {
                    code: "REQUEST_NOT_FOUND",
                    message: "Assistance request not found"
                }
            });
        }

        // Prevent duplicate emergency records
        const existingEmergency = await EmergencyRecord.findOne({
            requestId
        });

        if (existingEmergency) {
            return res.status(409).json({
                success: false,
                error: {
                    code: "EMERGENCY_EXISTS",
                    message: "Emergency record already exists for this request"
                }
            });
        }

        // Create emergency record
        const emergency = await EmergencyRecord.create({
            requestId,
            escalationStatus: "ESCALATED",
            escalatedAt: new Date(),
            details
        });

        // Audit log
        await createAuditLog({
            userId: req.user.userId,
            requestId,
            action: "EMERGENCY_ESCALATED"
        });

        return res.status(201).json({
            success: true,
            message: "Emergency escalated successfully",
            data: emergency
        });

    } catch (error) {
        console.error("Create emergency error:", error);

        return res.status(500).json({
            success: false,
            error: {
                code: "SERVER_ERROR",
                message: "Internal server error"
            }
        });
    }
};

module.exports = {
    createEmergency
};