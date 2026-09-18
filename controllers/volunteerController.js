const User = require("../models/User");
const VolunteerProfile = require("../models/VolunteerProfile");

const getVolunteers = async (req, res) => {
    try {
        const volunteers = await User.find(
            { role: "VOLUNTEER" },
            {
                passwordHash: 0
            }
        ).lean();

        const volunteerProfiles = await VolunteerProfile.find().lean();

        const profileMap = new Map(
            volunteerProfiles.map(profile => [
                profile.userId.toString(),
                profile
            ])
        );

        const result = volunteers.map(volunteer => {
            const profile = profileMap.get(
                volunteer._id.toString()
            );

            return {
                userId: volunteer._id,
                name: volunteer.name,
                phone: volunteer.phone,
                email: volunteer.email || null,
                role: volunteer.role,
                status: profile?.status || null,
                availability: profile?.availability ?? null,
                skills: profile?.skills || [],
                organisationId: profile?.organisationId || null,
                verificationNotes:
                    profile?.verificationNotes || null,
                createdAt: volunteer.createdAt
            };
        });

        return res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error("Get volunteers error:", error);

        return res.status(500).json({
            success: false,
            error: {
                code: "SERVER_ERROR",
                message: "Internal server error"
            }
        });
    }
};


const verifyVolunteer = async (req, res) => {
    try {
        const { id } = req.params;
        const { verificationNotes } = req.body;

        const volunteer = await User.findOne({
            _id: id,
            role: "VOLUNTEER"
        });

        if (!volunteer) {
            return res.status(404).json({
                success: false,
                error: {
                    code: "NOT_FOUND",
                    message: "Volunteer not found"
                }
            });
        }

        const profile = await VolunteerProfile.findOne({
            userId: volunteer._id
        });

        if (!profile) {
            return res.status(404).json({
                success: false,
                error: {
                    code: "PROFILE_NOT_FOUND",
                    message: "Volunteer profile not found"
                }
            });
        }

        // Volunteer must be REGISTERED before verification
        if (profile.status !== "REGISTERED") {
            return res.status(409).json({
                success: false,
                error: {
                    code: "INVALID_STATE",
                    message: "Volunteer cannot be verified from the current status"
                }
            });
        }

        profile.status = "VERIFIED";
        profile.verificationNotes = verificationNotes || null;

        await profile.save();

        return res.status(200).json({
            success: true,
            message: "Volunteer verified successfully",
            data: {
                volunteerId: volunteer._id,
                status: profile.status,
                verificationNotes: profile.verificationNotes
            }
        });

    } catch (error) {
        console.error("Verify volunteer error:", error);

        return res.status(500).json({
            success: false,
            error: {
                code: "SERVER_ERROR",
                message: "Internal server error"
            }
        });
    }
};


const activateVolunteer = async (req, res) => {
    try {
        const { id } = req.params;

        const volunteer = await User.findOne({
            _id: id,
            role: "VOLUNTEER"
        });

        if (!volunteer) {
            return res.status(404).json({
                success: false,
                error: {
                    code: "NOT_FOUND",
                    message: "Volunteer not found"
                }
            });
        }

        const profile = await VolunteerProfile.findOne({
            userId: volunteer._id
        });

        if (!profile) {
            return res.status(404).json({
                success: false,
                error: {
                    code: "PROFILE_NOT_FOUND",
                    message: "Volunteer profile not found"
                }
            });
        }

        // Volunteer must be VERIFIED before activation
        if (profile.status !== "VERIFIED") {
            return res.status(409).json({
                success: false,
                error: {
                    code: "INVALID_STATE",
                    message: "Volunteer must be verified before activation"
                }
            });
        }

        profile.status = "ACTIVE";

        await profile.save();

        return res.status(200).json({
            success: true,
            message: "Volunteer activated successfully",
            data: {
                volunteerId: volunteer._id,
                status: profile.status
            }
        });

    } catch (error) {
        console.error("Activate volunteer error:", error);

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
    getVolunteers,
    verifyVolunteer,
    activateVolunteer
};