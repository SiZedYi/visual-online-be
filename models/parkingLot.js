const mongoose = require("mongoose");
const ParkingLot = mongoose.model("ParkingLot", new mongoose.Schema({
    imageUrl: String,
    floor: Number,  // New field for floor number
    slots: [{ x: Number, y: Number, width: Number, height: Number, occupied: Boolean }]
  }));

module.exports = ParkingLot;