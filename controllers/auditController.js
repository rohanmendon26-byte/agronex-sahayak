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

module.exports = {
    getAuditLogs
};