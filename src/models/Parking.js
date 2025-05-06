const mongoose = require('mongoose');
const Car = require('./Car');
const Schema = mongoose.Schema;

// Parking spot sub-schema (now embedded in ParkingLot)
const parkingSpotSchema = new Schema({
  spotId: {
    type: String,
    required: true,
    trim: true
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
  currentCarColor: {
    type: String,
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

// Parking lot schema with embedded parking spots
const parkingLotSchema = new Schema({
  lotId: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
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
  price: {
    type: Number,
    required: true,
    min: 1
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
  // Embedded array of parking spots
  parkingSpots: [parkingSpotSchema],
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

// Middleware to update the updatedAt field for parking lot
// Mỗi khi gọi .save() trên một ParkingLot, nếu một parkingSpot có currentCar,
//  field currentCarColor sẽ được cập nhật tương ứng với màu của xe.
parkingLotSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Update updatedAt for any modified parking spots
  if (this.isModified('parkingSpots')) {
    const now = Date.now();
    this.parkingSpots.forEach(spot => {
      if (spot.isModified) {
        spot.updatedAt = now;
      }
    });
  }
  next();
});

// Add a virtual for getting total spots
parkingLotSchema.virtual('totalSpots').get(function() {
  return this.parkingSpots.length;
});

// Add a virtual for getting available spots
parkingLotSchema.virtual('availableSpots').get(function() {
  return this.parkingSpots.filter(spot => 
    spot.isActive && spot.currentCar === null
  ).length;
});

// Add a method to find a specific spot by spotId
parkingLotSchema.methods.findSpot = function(spotId) {
  return this.parkingSpots.find(spot => spot.spotId === spotId);
};

// Create a compound index for efficient spotId lookups within a parking lot
parkingLotSchema.index({ 'parkingSpots.spotId': 1, lotId: 1 });

const ParkingLot = mongoose.model('ParkingLot', parkingLotSchema);

module.exports = ParkingLot;