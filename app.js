const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const multer = require("multer");
const detectParkingSlots = require("./controllers/parkingDetection");
const ParkingLot = require("./models/parkingLot");

require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("public/uploads"));

mongoose.connect(process.env.MONGO_URI, {  });

// Set up image upload
const storage = multer.diskStorage({
  destination: "public/uploads/",
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// Upload and detect parking slots
app.post("/api/upload", upload.single("image"), async (req, res) => {
  try {
    const { floor } = req.body; // Get floor number from request
    const imagePath = req.file.path;
    const slots = await detectParkingSlots(imagePath);

    const parkingLot = await ParkingLot.create({ imageUrl: imagePath, floor, slots });
    res.json(parkingLot);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Get parking lot data
app.get("/api/parking-lot", async (req, res) => {
  const { floor } = req.query;
  const parkingLots = await ParkingLot.find({ floor });
  res.json(parkingLots);
});

// Update parking slots
app.put("/api/parking-lot/:id", async (req, res) => {
  const { id } = req.params;
  const { slots } = req.body;
  const updatedLot = await ParkingLot.findByIdAndUpdate(id, { slots }, { new: true });
  res.json(updatedLot);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
