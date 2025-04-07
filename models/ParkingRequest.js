const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Parking Request schema for users to request parking spots
const parkingRequestSchema = new Schema({
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    car: {
      type: Schema.Types.ObjectId,
      ref: 'Car',
      required: true
    },
    requestedSpot: {
      type: Schema.Types.ObjectId,
      ref: 'ParkingSpot',
      required: true
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled', 'expired'],
      default: 'pending'
    },
    notes: {
      type: String,
      trim: true
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    approvalDate: {
      type: Date,
      default: null
    },
    isWaiting: {
      type: Boolean,
      default: false
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
  
  const ParkingRequest = mongoose.model('ParkingRequest', parkingRequestSchema);
module.exports = ParkingRequest;