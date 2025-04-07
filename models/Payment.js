const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Payment schema for tracking parking fees
const paymentSchema = new Schema({
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
    parkingSpot: {
      type: Schema.Types.ObjectId,
      ref: 'ParkingSpot',
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'VND',
      trim: true
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    paymentDate: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'overdue', 'cancelled', 'refunded'],
      default: 'pending'
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'bank_transfer', 'credit_card', 'e_wallet'],
      default: 'cash'
    },
    transactionId: {
      type: String,
      trim: true
    },
    notes: {
      type: String,
      trim: true
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
  
  const Payment = mongoose.model('Payment', paymentSchema);
module.exports = Payment;