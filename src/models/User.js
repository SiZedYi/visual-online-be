const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// User schema
const userSchema = new Schema({
    username: {
      type: String,
      required: true,
      trim: true,
      unique: true
    },
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true
    },
    password: {
      type: String,
      required: true
    },
    phoneNumber: {
      type: String,
      trim: true
    },
    address: {
      type: String,
      trim: true
    },
    apartmentNumber: {
      type: String,
      trim: true
    },
    cars: [{
      type: Schema.Types.ObjectId,
      ref: 'Car'
    }],
    isActive: {
      type: Boolean,
      default: true
    },
    userGroups: [{
      type: Schema.Types.ObjectId,
      ref: 'UserGroup'
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
  
  const User = mongoose.model('User', userSchema);
  
  // User Group schema for permissions
  const userGroupSchema = new Schema({
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true
    },
    description: {
      type: String,
      trim: true
    },
    permissions: [{
      resource: {
        type: String,
        enum: ['car', 'parkingSpot', 'parkingLot', 'user', 'userGroup', 'parkingRequest', 'payment'],
        required: true
      },
      actions: [{
        type: String,
        enum: ['create', 'read', 'update', 'delete'],
        required: true
      }]
    }],
    isActive: {
      type: Boolean,
      default: true
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
  
const UserGroup = mongoose.model('UserGroup', userGroupSchema);
module.exports = { User, UserGroup };