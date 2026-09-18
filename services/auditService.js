const AuditLog = require("../models/AuditLog");

const createAuditLog = async ({
    userId,
    requestId = null,
    action
}) => {
    try {
        await AuditLog.create({
            userId,
            requestId,
            action
        });
    } catch (error) {
        console.error("Audit log creation error:", error);
    }
};

module.exports = {
    createAuditLog
};