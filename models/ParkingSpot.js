// models/ParkingSpot.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Parking spot schema
const parkingSpotSchema = new Schema({
  spotId: {
    type: String,
    required: true,
    trim: true
  },
  parkingLotId: {
    type: Schema.Types.ObjectId,
    ref: 'ParkingLot',
    required: true
  },
  x: {
    type: Number,
    required: true,
    min: 0
  },
  y: {
    type: Number,
    required: true,
    min: 0
  },
  width: {
    type: Number,
    required: true,
    min: 10
  },
  height: {
    type: Number,
    required: true,
    min: 10
  },
  type: {
    type: String,
    enum: ['standard', 'compact', 'handicap', 'electric', 'reserved'],
    default: 'standard'
  },
  label: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  currentCar: {
    type: Schema.Types.ObjectId,
    ref: 'Car',
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware to update the updatedAt field
parkingSpotSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create a compound index for efficient lookups
parkingSpotSchema.index({ parkingLotId: 1, spotId: 1 }, { unique: true });

const ParkingSpot = mongoose.model('ParkingSpot', parkingSpotSchema);

module.exports = ParkingSpot;