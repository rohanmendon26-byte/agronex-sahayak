const AuditLog = require("../models/AuditLog");

const getAuditLogs = async (req, res) => {
    try {
        const logs = await AuditLog.find()
            .sort({ timestamp: -1 });

        return res.status(200).json({
            success: true,
            data: logs
        });

    } catch (error) {
        console.error("Get audit logs error:", error);

        return res.status(500).json({
            success: false,
            error: {
                code: "SERVER_ERROR",
                message: "Internal server error"
            }
        });
    }
};

const deleteAuditLog = async (req, res) => {
    try {
        const { id } = req.params;
        const log = await AuditLog.findByIdAndDelete(id);

        if (!log) {
            return res.status(404).json({
                success: false,
                error: {
                    code: "NOT_FOUND",
                    message: "Audit log record not found"
                }
            });
        }

        return res.status(200).json({
            success: true,
            message: "Audit log entry deleted successfully"
        });
    } catch (error) {
        console.error("Delete audit log error:", error);

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
    getAuditLogs,
    deleteAuditLog
};