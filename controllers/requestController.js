const AssistanceRequest = require("../models/AssistanceRequest");
const VolunteerProfile = require("../models/VolunteerProfile");
const { createAuditLog } = require("../services/auditService");
const mongoose = require("mongoose");


const createRequest = async (req, res) => {
    try {
        const { need, location, priority } = req.body;

        // Validate required fields
        if (!need || !location || !priority) {
            return res.status(400).json({
                success: false,
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Need, location and priority are required"
                }
            });
        }

        // Create assistance request
        const request = await AssistanceRequest.create({
            seniorId: req.user.userId,
            need,
            location,
            priority,
            status: "PENDING"
        });

        await createAuditLog({
            userId: req.user.userId,
            requestId: request._id,
            action: "ASSISTANCE_REQUEST_CREATED"
        });

        return res.status(201).json({
            success: true,
            message: "Assistance request created successfully",
            data: request
        });

    } catch (error) {
        console.error("Create request error:", error);

        return res.status(500).json({
            success: false,
            error: {
                code: "SERVER_ERROR",
                message: "Internal server error"
            }
        });
    }
};

const getRequests = async (req, res) => {
    try {
        let requests;

        // Senior → only their own requests
        if (req.user.role === "SENIOR") {
            requests = await AssistanceRequest.find({
                seniorId: req.user.userId
            }).sort({ createdAt: -1 });
        }

        // Volunteer → only requests assigned to them
        else if (req.user.role === "VOLUNTEER") {
            requests = await AssistanceRequest.find({
                volunteerId: req.user.userId
            }).sort({ createdAt: -1 });
        }

        // Police Admin → all requests
        else if (req.user.role === "POLICE_ADMIN") {
            requests = await AssistanceRequest.find()
                .sort({ createdAt: -1 });
        }

        return res.status(200).json({
            success: true,
            data: requests
        });

    } catch (error) {
        console.error("Get requests error:", error);

        return res.status(500).json({
            success: false,
            error: {
                code: "SERVER_ERROR",
                message: "Internal server error"
            }
        });
    }
};


const assignVolunteer = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                error: {
                    code: "INVALID_ID",
                    message: "Invalid request ID"
                }
            });
        }

        const { volunteerId } = req.body;

        if (!mongoose.Types.ObjectId.isValid(volunteerId)) {
            return res.status(400).json({
                success: false,
                error: {
                    code: "INVALID_ID",
                    message: "Invalid volunteer ID"
                }
            });
        }

        // Validate volunteerId
        if (!volunteerId) {
            return res.status(400).json({
                success: false,
                error: {
                    code: "VALIDATION_ERROR",
                    message: "volunteerId is required"
                }
            });
        }

        // Find the assistance request
        const request = await AssistanceRequest.findById(id);

        if (!request) {
            return res.status(404).json({
                success: false,
                error: {
                    code: "REQUEST_NOT_FOUND",
                    message: "Assistance request not found"
                }
            });
        }

        // Request must be PENDING
        if (request.status !== "PENDING") {
            return res.status(409).json({
                success: false,
                error: {
                    code: "INVALID_STATE",
                    message: "Only pending requests can be assigned"
                }
            });
        }

        // Find volunteer profile
        const volunteerProfile = await VolunteerProfile.findOne({
            userId: volunteerId
        });

        if (!volunteerProfile) {
            return res.status(404).json({
                success: false,
                error: {
                    code: "VOLUNTEER_NOT_FOUND",
                    message: "Volunteer not found"
                }
            });
        }

        // Volunteer must be ACTIVE
        if (volunteerProfile.status !== "ACTIVE") {
            return res.status(409).json({
                success: false,
                error: {
                    code: "VOLUNTEER_NOT_ACTIVE",
                    message: "Only active volunteers can be assigned"
                }
            });
        }

        if (!volunteerProfile.availability) {
            return res.status(409).json({
                success: false,
                error: {
                    code: "VOLUNTEER_UNAVAILABLE",
                    message: "Volunteer is currently unavailable"
                }
            });
        }

        // Assign volunteer
        request.volunteerId = volunteerId;
        request.status = "ASSIGNED";

        await request.save();

        await createAuditLog({
            userId: req.user.userId,
            requestId: request._id,
            action: "VOLUNTEER_ASSIGNED"
        });

        return res.status(200).json({
            success: true,
            message: "Volunteer assigned successfully",
            data: {
                requestId: request._id,
                volunteerId: request.volunteerId,
                status: request.status
            }
        });

    } catch (error) {
        console.error("Assign volunteer error:", error);

        return res.status(500).json({
            success: false,
            error: {
                code: "SERVER_ERROR",
                message: "Internal server error"
            }
        });
    }
};


const updateRequestStatus = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                error: {
                    code: "INVALID_ID",
                    message: "Invalid request ID"
                }
            });
        }

        const { status } = req.body;

        // Validate status
        const allowedStatuses = [
            "ASSIGNED",
            "IN_PROGRESS",
            "COMPLETED"
        ];

        if (!status || !allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Invalid request status"
                }
            });
        }

        // Find request
        const request = await AssistanceRequest.findById(id);

        if (!request) {
            return res.status(404).json({
                success: false,
                error: {
                    code: "REQUEST_NOT_FOUND",
                    message: "Assistance request not found"
                }
            });
        }

        // Completed requests cannot be modified
        if (request.status === "COMPLETED") {
            return res.status(409).json({
                success: false,
                error: {
                    code: "INVALID_STATE",
                    message: "Completed requests cannot be modified"
                }
            });
        }

        // Volunteer can only update requests assigned to them
        if (req.user.role === "VOLUNTEER") {
            if (
                !request.volunteerId ||
                request.volunteerId.toString() !== req.user.userId
            ) {
                return res.status(403).json({
                    success: false,
                    error: {
                        code: "FORBIDDEN",
                        message: "You can only update requests assigned to you"
                    }
                });
            }
        }

        // Update status
        // Validate state transition
        const validTransitions = {
            PENDING: ["ASSIGNED"],
            ASSIGNED: ["IN_PROGRESS"],
            IN_PROGRESS: ["COMPLETED"]
        };

        const currentStatus = request.status;

        if (
            !validTransitions[currentStatus] ||
            !validTransitions[currentStatus].includes(status)
        ) {
            return res.status(409).json({
                success: false,
                error: {
                    code: "INVALID_STATE",
                    message: `Cannot change request status from ${currentStatus} to ${status}`
                }
            });
        }

        // Update status
        request.status = status;

        await request.save();

        await createAuditLog({
            userId: req.user.userId,
            requestId: request._id,
            action: `REQUEST_STATUS_UPDATED_TO_${status}`
        });

        return res.status(200).json({
            success: true,
            message: "Request status updated successfully",
            data: {
                requestId: request._id,
                status: request.status
            }
        });

    } catch (error) {
        console.error("Update request status error:", error);

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
    createRequest,
    getRequests,
    assignVolunteer,
    updateRequestStatus
};