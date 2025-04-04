const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const parkingRoutes = require("./routes/parkingRoutes");

require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("public/uploads"));
app.use(express.urlencoded({ extended: true }));
app.use("/api", parkingRoutes);
mongoose.connect(process.env.MONGO_URI, {  });

// Set up i
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
