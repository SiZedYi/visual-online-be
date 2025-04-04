const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Car schema
const carSchema = new Schema({
  licensePlate: {
    type: String,
    trim: true,
    uppercase: true
  },
  color: {
    type: String,
    trim: true
  },
  model: {
    type: String,
    trim: true
  },
  owner: {
    name: {
      type: String,
      trim: true
    },
    contactInfo: {
      type: String,
      trim: true
    }
  },
  entryTime: {
    type: Date,
    default: Date.now,
    required: true
  },
  exitTime: {
    type: Date,
    default: null
  },
  currentSpot: {
    type: String,
    ref: 'ParkingSpot',
    default: null
  },
  parkingHistory: [{
    spotId: {
      type: Schema.Types.ObjectId,
      ref: 'ParkingSpot'
    },
    entryTime: Date,
    exitTime: Date
  }],
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
carSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Car = mongoose.model('Car', carSchema);

module.exports = Car;