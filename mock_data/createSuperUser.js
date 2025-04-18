const mongoose = require("mongoose");
const bcrypt = require('bcryptjs');
const {User} = require("../src/models/User"); // update with actual path
const {UserGroup} = require("../src/models/User"); // update with actual path

// Configuration
require("dotenv").config();
async function createSuperUser() {
  await mongoose.connect(process.env.MONGO_URI);

  try {
    // Step 1: Create or find the admin group
    let adminGroup = await UserGroup.findOne({ name: "Admins Group" });

    if (!adminGroup) {
      adminGroup = await UserGroup.create({
        name: "Admin Group",
        description: "Superuser group with full permissions",
        permissions: [
          ...["car", "parkingSpot", "parkingLot", "user", "userGroup", "parkingRequest", "payment"].map(resource => ({
            resource,
            actions: ["create", "read", "update", "delete"],
          })),
        ],
      });

      console.log("✅ Admin group created");
    }

    // Step 2: Create super user
    const existingUser = await User.findOne({ username: "admin" });
    if (existingUser) {
      console.log("⚠️ Super user already exists");
      return;
    }

    const hashedPassword = await bcrypt.hash("admin123", 10); // set a secure password

    const superUser = await User.create({
      username: "admin",
      fullName: "Super Admin",
      email: "admin@example.com",
      password: hashedPassword,
      phoneNumber: "0123456789",
      address: "Admin HQ",
      apartmentNumber: "001",
      userGroups: [adminGroup._id],
    });

    console.log("✅ Super user created:", superUser.username);
  } catch (error) {
    console.error("❌ Error creating super user:", error);
  } finally {
    mongoose.disconnect();
  }
}

createSuperUser();
