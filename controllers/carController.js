const Car = require('../models/Car');

// Get all cars for the authenticated user
exports.getUserCars = async (req, res) => {
    try {
      const cars = await Car.find({ ownerUser: req.user._id });
  
      res.status(200).json({
        success: true,
        count: cars.length,
        data: cars
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        error: 'Server Error'
      });
    }
  };

// Get single car by ID (if owned by authenticated user)
exports.getCar = async (req, res) => {
    try {
      const car = await Car.findById(req.params.id);
  
      if (!car) {
        return res.status(404).json({
          success: false,
          error: 'Car not found'
        });
      }
  
      // Check if car belongs to authenticated user
      if (car.ownerUser.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to access this car'
        });
      }
  
      res.status(200).json({
        success: true,
        data: car
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        error: 'Server Error'
      });
    }
  };
  
  // Add a new car for the authenticated user
  exports.addCar = async (req, res) => {
    try {
      const { licensePlate, color, model, ownerInfo } = req.body;
  
      // Check if car with this license plate already exists
      const existingCar = await Car.findOne({ licensePlate });
      if (existingCar) {
        return res.status(400).json({
          success: false,
          error: 'A car with this license plate already exists'
        });
      }
  
      const car = new Car({
        licensePlate,
        color,
        model,
        ownerUser: req.user._id,
        ownerInfo: {
          name: ownerInfo?.name || req.user.name,
          contactInfo: ownerInfo?.contactInfo || req.user.email
        }
      });
  
      await car.save();
  
      res.status(201).json({
        success: true,
        data: car
      });
    } catch (error) {
      console.error(error);
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(val => val.message);
        return res.status(400).json({
          success: false,
          error: messages
        });
      }
      res.status(500).json({
        success: false,
        error: 'Server Error'
      });
    }
  };
  
  // Update a car for the authenticated user
  exports.updateCar = async (req, res) => {
    try {
      // Find the car
      let car = await Car.findById(req.params.id);
  
      if (!car) {
        return res.status(404).json({
          success: false,
          error: 'Car not found'
        });
      }
  
      // Check if car belongs to authenticated user
      if (car.ownerUser.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to update this car'
        });
      }
  
      // Only allow updating certain fields
      const { color, model, ownerInfo } = req.body;
      const updateData = {};
      
      if (color) updateData.color = color;
      if (model) updateData.model = model;
      if (ownerInfo) {
        updateData.ownerInfo = {
          name: ownerInfo.name || car.ownerInfo.name,
          contactInfo: ownerInfo.contactInfo || car.ownerInfo.contactInfo
        };
      }
      
      updateData.updatedAt = new Date();
  
      // Update the car
      car = await Car.findByIdAndUpdate(
        req.params.id,
        { $set: updateData },
        { new: true, runValidators: true }
      );
  
      res.status(200).json({
        success: true,
        data: car
      });
    } catch (error) {
      console.error(error);
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(val => val.message);
        return res.status(400).json({
          success: false,
          error: messages
        });
      }
      res.status(500).json({
        success: false,
        error: 'Server Error'
      });
    }
  };
  
  // Delete a car for the authenticated user
  exports.deleteCar = async (req, res) => {
    try {
      const car = await Car.findById(req.params.id);
  
      if (!car) {
        return res.status(404).json({
          success: false,
          error: 'Car not found'
        });
      }
  
      // Check if car belongs to authenticated user
      if (car.ownerUser.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to delete this car'
        });
      }
  
      // Check if car is currently parked
      if (car.currentSpot) {
        return res.status(400).json({
          success: false,
          error: 'Cannot delete a car that is currently parked. Please remove the car from the parking spot first.'
        });
      }
  
      await car.remove();
  
      res.status(200).json({
        success: true,
        data: {}
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        error: 'Server Error'
      });
    }
  };

// Get car parking history
exports.getCarParkingHistory = async (req, res) => {
    try {
      const car = await Car.findById(req.params.id);
  
      if (!car) {
        return res.status(404).json({
          success: false,
          error: 'Car not found'
        });
      }
  
      // Check if car belongs to authenticated user
      if (car.ownerUser.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to access this car'
        });
      }
  
      res.status(200).json({
        success: true,
        data: {
          licensePlate: car.licensePlate,
          model: car.model,
          color: car.color,
          parkingHistory: car.parkingHistory
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        error: 'Server Error'
      });
    }
  };