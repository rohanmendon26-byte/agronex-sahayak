const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const VolunteerProfile = require("../models/VolunteerProfile");
const SeniorProfile = require("../models/SeniorProfile");

// Robust phone & password validation helpers
const validatePhone = (phone) => {
    const cleaned = String(phone || "").trim().replace(/\D/g, "");
    return /^\d{10}$/.test(cleaned) ? cleaned : null;
};

const validatePassword = (password) => {
    return typeof password === "string" && password.trim().length >= 6;
};

const registerVolunteer = async (req, res) => {
    try {
        const { name, phone, email, password } = req.body;

        const cleanName = String(name || "").trim();
        const cleanPhone = validatePhone(phone);
        const cleanPassword = String(password || "");
        const cleanEmail = email ? String(email).trim().toLowerCase() : null;

        // Validate required fields
        if (!cleanName || cleanName.length < 2) {
            return res.status(400).json({
                success: false,
                error: {
                    code: "INVALID_INPUT",
                    message: "Full name must be at least 2 characters long"
                }
            });
        }

        if (!cleanPhone) {
            return res.status(400).json({
                success: false,
                error: {
                    code: "INVALID_PHONE",
                    message: "Phone number must be exactly 10 digits"
                }
            });
        }

        if (!validatePassword(cleanPassword)) {
            return res.status(400).json({
                success: false,
                error: {
                    code: "INVALID_PASSWORD",
                    message: "Password must be at least 6 characters long"
                }
            });
        }

        // Check if phone already exists
        const existingPhone = await User.findOne({ phone: cleanPhone });

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
        if (cleanEmail) {
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: "INVALID_EMAIL",
                        message: "Invalid email address format"
                    }
                });
            }

            const existingEmail = await User.findOne({ email: cleanEmail });

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
        const passwordHash = await bcrypt.hash(cleanPassword, 10);

        // Create user
        const user = await User.create({
            name: cleanName,
            phone: cleanPhone,
            email: cleanEmail || undefined,
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

const registerSenior = async (req, res) => {
    try {
        const { name, phone, email, password, location } = req.body;

        const cleanName = String(name || "").trim();
        const cleanPhone = validatePhone(phone);
        const cleanPassword = String(password || "");
        const cleanEmail = email ? String(email).trim().toLowerCase() : null;
        const cleanLocation = String(location || "").trim();

        // Validate required fields
        if (!cleanName || cleanName.length < 2) {
            return res.status(400).json({
                success: false,
                error: {
                    code: "INVALID_INPUT",
                    message: "Full name must be at least 2 characters long"
                }
            });
        }

        if (!cleanPhone) {
            return res.status(400).json({
                success: false,
                error: {
                    code: "INVALID_PHONE",
                    message: "Phone number must be exactly 10 digits"
                }
            });
        }

        if (!validatePassword(cleanPassword)) {
            return res.status(400).json({
                success: false,
                error: {
                    code: "INVALID_PASSWORD",
                    message: "Password must be at least 6 characters long"
                }
            });
        }

        if (!cleanLocation) {
            return res.status(400).json({
                success: false,
                error: {
                    code: "INVALID_LOCATION",
                    message: "Location is required for senior citizen"
                }
            });
        }

        // Check phone
        const existingPhone = await User.findOne({ phone: cleanPhone });

        if (existingPhone) {
            return res.status(409).json({
                success: false,
                error: {
                    code: "PHONE_EXISTS",
                    message: "Phone number is already registered"
                }
            });
        }

        // Check email
        if (cleanEmail) {
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: "INVALID_EMAIL",
                        message: "Invalid email address format"
                    }
                });
            }

            const existingEmail = await User.findOne({ email: cleanEmail });

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
        const passwordHash = await bcrypt.hash(cleanPassword, 10);

        // Create senior user
        const user = await User.create({
            name: cleanName,
            phone: cleanPhone,
            email: cleanEmail || undefined,
            passwordHash,
            role: "SENIOR"
        });

        // Create senior profile
        await SeniorProfile.create({
            userId: user._id,
            location: cleanLocation
        });

        return res.status(201).json({
            success: true,
            message: "Senior registered successfully",
            data: {
                userId: user._id,
                name: user.name,
                phone: user.phone,
                email: user.email || null,
                role: user.role
            }
        });

    } catch (error) {
        console.error("Senior registration error:", error);

        return res.status(500).json({
            success: false,
            error: {
                code: "SERVER_ERROR",
                message: "Internal server error"
            }
        });
    }
};

const loginSenior = async (req, res) => {
    try {
        const { phone, password } = req.body;

        const cleanPhone = validatePhone(phone);
        const cleanPassword = String(password || "");

        if (!cleanPhone) {
            return res.status(400).json({
                success: false,
                error: {
                    code: "INVALID_PHONE",
                    message: "Please enter a valid 10-digit phone number"
                }
            });
        }

        if (!validatePassword(cleanPassword)) {
            return res.status(400).json({
                success: false,
                error: {
                    code: "INVALID_PASSWORD",
                    message: "Password must be at least 6 characters long"
                }
            });
        }

        const user = await User.findOne({
            phone: cleanPhone,
            role: "SENIOR"
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

        const isPasswordCorrect = await bcrypt.compare(
            cleanPassword,
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
            message: "Senior login successful",
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
        console.error("Senior login error:", error);

        return res.status(500).json({
            success: false,
            error: {
                code: "SERVER_ERROR",
                message: "Internal server error"
            }
        });
    }
};

const loginVolunteer = async (req, res) => {
    try {
        const { phone, password } = req.body;

        const cleanPhone = validatePhone(phone);
        const cleanPassword = String(password || "");

        if (!cleanPhone) {
            return res.status(400).json({
                success: false,
                error: {
                    code: "INVALID_PHONE",
                    message: "Please enter a valid 10-digit phone number"
                }
            });
        }

        if (!validatePassword(cleanPassword)) {
            return res.status(400).json({
                success: false,
                error: {
                    code: "INVALID_PASSWORD",
                    message: "Password must be at least 6 characters long"
                }
            });
        }

        // Find volunteer
        const user = await User.findOne({ phone: cleanPhone });

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
            cleanPassword,
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

        const cleanPhone = validatePhone(phone);
        const cleanPassword = String(password || "");

        if (!cleanPhone) {
            return res.status(400).json({
                success: false,
                error: {
                    code: "INVALID_PHONE",
                    message: "Please enter a valid 10-digit phone number"
                }
            });
        }

        if (!validatePassword(cleanPassword)) {
            return res.status(400).json({
                success: false,
                error: {
                    code: "INVALID_PASSWORD",
                    message: "Password must be at least 6 characters long"
                }
            });
        }

        // Find admin
        const user = await User.findOne({
            phone: cleanPhone,
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
            cleanPassword,
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
    validatePhone,
    validatePassword,
    registerVolunteer,
    loginVolunteer,
    loginAdmin,
    registerSenior,
    loginSenior
};