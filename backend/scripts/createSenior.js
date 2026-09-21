require("dotenv").config();

const bcrypt = require("bcryptjs");
const connectDB = require("../config/db");
const User = require("../models/User");

const createSenior = async () => {
    try {
        await connectDB();

        const existingSenior = await User.findOne({
            phone: "8888888888"
        });

        if (existingSenior) {
            console.log("Senior already exists");
            process.exit(0);
        }

        const passwordHash = await bcrypt.hash(
            "Senior@123",
            10
        );

        await User.create({
            name: "Test Senior",
            phone: "8888888888",
            email: "senior@agronex.local",
            passwordHash,
            role: "SENIOR"
        });

        console.log("Senior created successfully");
        console.log("Phone: 8888888888");
        console.log("Password: Senior@123");

        process.exit(0);

    } catch (error) {
        console.error("Error creating senior:", error.message);
        process.exit(1);
    }
};

createSenior();