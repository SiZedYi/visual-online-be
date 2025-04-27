const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Car schema
const carSchema = new Schema({
  licensePlate: {
    type: String,
    trim: true,
    uppercase: true,
    required: true,
    unique: true
  },
  color: {
    type: String,
    trim: true
  },
  model: {
    type: String,
    trim: true
  },
  ownerUser: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ownerInfo: {
    name: {
      type: String,
      trim: true
    },
    contactInfo: {
      type: String,
      trim: true
    },
    apartment: {
      type: String,
      trim: true
    }
  },
  entryTime: {
    type: Date,
    default: null
  },
  exitTime: {
    type: Date,
    default: null
  },
  currentSpot: {
    floor: {
      type: String,
      trim: true,
      default: null
    },
    spotId: {
      type: String, // Tham chiếu đến spotId
      trim: true,
      default: null
    }
  },
  parkingHistory: [{
    lotId: {
      type: String, // Tham chiếu đến lotId
    },
    spotId: {
      type: String, // Tham chiếu đến spotId
      trim: true
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