const mongoose = require('mongoose');
const Schema = mongoose.Schema;

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
  parkingLot: {
    type: Schema.Types.ObjectId,
    ref: 'ParkingLot',
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
