require("dotenv").config();

const bcrypt = require("bcryptjs");
const connectDB = require("../config/db");
const User = require("../models/User");
const VolunteerProfile = require("../models/VolunteerProfile");
const SeniorProfile = require("../models/SeniorProfile");

const seedAll = async () => {
    try {
        await connectDB();
        console.log("🌱 Database connected. Seeding demo accounts...");

        // 1. Seed Senior
        let seniorUser = await User.findOne({ phone: "8888888888" });
        if (!seniorUser) {
            const passwordHash = await bcrypt.hash("Senior@123", 10);
            seniorUser = await User.create({
                name: "Ramesh Shirva (Senior)",
                phone: "8888888888",
                email: "senior@agronex.local",
                passwordHash,
                role: "SENIOR"
            });

            await SeniorProfile.create({
                userId: seniorUser._id,
                location: "Shirva Main Street"
            });
            console.log("✅ Senior Citizen created: Phone 8888888888 | Password Senior@123");
        } else {
            console.log("ℹ️ Senior Citizen already exists");
        }

        // 2. Seed Volunteer
        let volunteerUser = await User.findOne({ phone: "7777777777" });
        if (!volunteerUser) {
            const passwordHash = await bcrypt.hash("Volunteer@123", 10);
            volunteerUser = await User.create({
                name: "Kiran Volunteer",
                phone: "7777777777",
                email: "volunteer@agronex.local",
                passwordHash,
                role: "VOLUNTEER"
            });

            await VolunteerProfile.create({
                userId: volunteerUser._id,
                skills: ["First Aid", "Medicine Delivery", "Transport"],
                availability: true,
                status: "ACTIVE",
                verificationNotes: "Pre-verified for Saturday Demo"
            });
            console.log("✅ Community Volunteer created: Phone 7777777777 | Password Volunteer@123");
        } else {
            console.log("ℹ️ Community Volunteer already exists");
        }

        // 3. Seed Police Admin
        let adminUser = await User.findOne({ phone: "9999999999" });
        if (!adminUser) {
            const passwordHash = await bcrypt.hash("Admin@123", 10);
            adminUser = await User.create({
                name: "AgroNex Police Admin",
                phone: "9999999999",
                email: "admin@agronex.local",
                passwordHash,
                role: "POLICE_ADMIN"
            });
            console.log("✅ Police Admin created: Phone 9999999999 | Password Admin@123");
        } else {
            console.log("ℹ️ Police Admin already exists");
        }

        console.log("\n🎉 Seeding complete! All accounts ready for Saturday Evaluation Demo.");
        process.exit(0);
    } catch (error) {
        console.error("❌ Error seeding database:", error.message);
        process.exit(1);
    }
};

seedAll();
