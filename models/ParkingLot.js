// models/ParkingLot.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Parking lot schema
const parkingLotSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  svgPath: {
    type: String,
    trim: true
  },
  width: {
    type: Number,
    required: true,
    min: 100
  },
  height: {
    type: Number,
    required: true,
    min: 100
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

// Middleware to update the updatedAt field
parkingLotSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const ParkingLot = mongoose.model('ParkingLot', parkingLotSchema);

module.exports = ParkingLot;