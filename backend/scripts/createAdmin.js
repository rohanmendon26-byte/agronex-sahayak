require("dotenv").config();

const bcrypt = require("bcryptjs");
const connectDB = require("../config/db");
const User = require("../models/User");

const createAdmin = async () => {
    try {
        await connectDB();

        const existingAdmin = await User.findOne({
            phone: "9999999999"
        });

        if (existingAdmin) {
            console.log("Admin already exists");
            process.exit(0);
        }

        const passwordHash = await bcrypt.hash(
            "Admin@123",
            10
        );

        await User.create({
            name: "AgroNex Police Admin",
            phone: "9999999999",
            email: "admin@agronex.local",
            passwordHash,
            role: "POLICE_ADMIN"
        });

        console.log("Police Admin created successfully");

        process.exit(0);

    } catch (error) {
        console.error("Error creating admin:", error.message);
        process.exit(1);
    }
};

createAdmin();