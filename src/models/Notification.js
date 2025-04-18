const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Notification schema for system notifications
const notificationSchema = new Schema({
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['payment_reminder', 'request_status', 'spot_available', 'system'],
      default: 'system'
    },
    relatedTo: {
      model: {
        type: String,
        enum: ['Car', 'ParkingSpot', 'ParkingRequest', 'Payment']
      },
      id: {
        type: Schema.Types.ObjectId
      }
    },
    isRead: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  });
  
  const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;