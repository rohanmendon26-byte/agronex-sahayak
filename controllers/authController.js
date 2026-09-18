const bcrypt = require("bcryptjs");
const User = require("../models/User");
const VolunteerProfile = require("../models/VolunteerProfile");

const registerVolunteer = async (req, res) => {
    try {
        const { name, phone, email, password } = req.body;

        // Validate required fields
        if (!name || !phone || !password) {
            return res.status(400).json({
                success: false,
                error: {
                    code: "INVALID_INPUT",
                    message: "Name, phone and password are required"
                }
            });
        }

        // Check if phone already exists
        const existingPhone = await User.findOne({ phone });

        if (existingPhone) {
            return res.status(409).json({
                success: false,
                error: {
                    code: "PHONE_EXISTS",
                    message: "Phone number is already registered"
                }
            });
        }

        // Check email only if provided
        if (email) {
            const existingEmail = await User.findOne({ email });

            if (existingEmail) {
                return res.status(409).json({
                    success: false,
                    error: {
                        code: "EMAIL_EXISTS",
                        message: "Email is already registered"
                    }
                });
            }
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create user
        const user = await User.create({
            name,
            phone,
            email: email || undefined,
            passwordHash,
            role: "VOLUNTEER"
        });

        // Create volunteer profile
        await VolunteerProfile.create({
            userId: user._id,
            status: "REGISTERED"
        });

        return res.status(201).json({
            success: true,
            message: "Volunteer registered successfully",
            data: {
                userId: user._id,
                name: user.name,
                phone: user.phone,
                email: user.email || null,
                role: user.role,
                status: "REGISTERED"
            }
        });

    } catch (error) {
        console.error("Volunteer registration error:", error);

        return res.status(500).json({
            success: false,
            error: {
                code: "SERVER_ERROR",
                message: "Internal server error"
            }
        });
    }
};

const jwt = require("jsonwebtoken");

const loginVolunteer = async (req, res) => {
    try {
        const { phone, password } = req.body;

        // Validate input
        if (!phone || !password) {
            return res.status(400).json({
                success: false,
                error: {
                    code: "INVALID_INPUT",
                    message: "Phone and password are required"
                }
            });
        }

        // Find volunteer
        const user = await User.findOne({ phone });

        if (!user || user.role !== "VOLUNTEER") {
            return res.status(401).json({
                success: false,
                error: {
                    code: "INVALID_CREDENTIALS",
                    message: "Invalid phone or password"
                }
            });
        }

        // Compare password
        const isPasswordCorrect = await bcrypt.compare(
            password,
            user.passwordHash
        );

        if (!isPasswordCorrect) {
            return res.status(401).json({
                success: false,
                error: {
                    code: "INVALID_CREDENTIALS",
                    message: "Invalid phone or password"
                }
            });
        }

        // Generate JWT
        const token = jwt.sign(
            {
                userId: user._id,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1h"
            }
        );

        return res.status(200).json({
            success: true,
            message: "Volunteer login successful",
            data: {
                token,
                user: {
                    userId: user._id,
                    name: user.name,
                    phone: user.phone,
                    email: user.email || null,
                    role: user.role
                }
            }
        });

    } catch (error) {
        console.error("Volunteer login error:", error);

        return res.status(500).json({
            success: false,
            error: {
                code: "SERVER_ERROR",
                message: "Internal server error"
            }
        });
    }
};


const loginAdmin = async (req, res) => {
    try {
        const { phone, password } = req.body;

        // Validate input
        if (!phone || !password) {
            return res.status(400).json({
                success: false,
                error: {
                    code: "INVALID_INPUT",
                    message: "Phone and password are required"
                }
            });
        }

        // Find admin
        const user = await User.findOne({
            phone,
            role: "POLICE_ADMIN"
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                error: {
                    code: "INVALID_CREDENTIALS",
                    message: "Invalid phone or password"
                }
            });
        }

        // Compare password
        const isPasswordCorrect = await bcrypt.compare(
            password,
            user.passwordHash
        );

        if (!isPasswordCorrect) {
            return res.status(401).json({
                success: false,
                error: {
                    code: "INVALID_CREDENTIALS",
                    message: "Invalid phone or password"
                }
            });
        }

        // Generate JWT
        const token = jwt.sign(
            {
                userId: user._id,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1h"
            }
        );

        return res.status(200).json({
            success: true,
            message: "Admin login successful",
            data: {
                token,
                user: {
                    userId: user._id,
                    name: user.name,
                    phone: user.phone,
                    email: user.email || null,
                    role: user.role
                }
            }
        });

    } catch (error) {
        console.error("Admin login error:", error);

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
    registerVolunteer,loginVolunteer,loginAdmin
};