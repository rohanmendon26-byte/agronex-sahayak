const AssistanceRequest = require("../models/AssistanceRequest");
const EmergencyRecord = require("../models/EmergencyRecord");
const { createAuditLog } = require("../services/auditService");

const createEmergency = async (req, res) => {
    try {
        const { requestId, details } = req.body;

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

        // Check whether assistance request exists
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

        // Create emergency record
        const emergency = await EmergencyRecord.create({
            requestId,
            details,
            escalationStatus: "PENDING",
            escalatedAt: null
        });

        await createAuditLog({
        userId: req.user.userId,
        requestId: request._id,
        action: "EMERGENCY_RECORDED"
    });

        return res.status(201).json({
            success: true,
            message: "Emergency record created successfully",
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