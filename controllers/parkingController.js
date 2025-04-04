// controllers/parkingController.js
const ParkingLot = require('../models/ParkingLot');
const ParkingSpot = require('../models/ParkingSpot');
const Car = require('../models/Car');

// Controller methods for parking lot operations
exports.getParkingLots = async (req, res) => {
  try {
    const parkingLots = await ParkingLot.find({ isActive: true });
    res.status(200).json({
      success: true,
      count: parkingLots.length,
      data: parkingLots
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

exports.getParkingLotById = async (req, res) => {
  try {
    const parkingLot = await ParkingLot.findById(req.params.id);
    
    if (!parkingLot) {
      return res.status(404).json({
        success: false,
        error: 'Parking lot not found'
      });
    }

    res.status(200).json({
      success: true,
      data: parkingLot
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

exports.createParkingLot = async (req, res) => {
  try {
    const parkingLot = await ParkingLot.create(req.body);
    
    res.status(201).json({
      success: true,
      data: parkingLot
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        error: messages
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Server Error'
      });
    }
  }
};

// Controller methods for parking spots
exports.getParkingSpots = async (req, res) => {
  try {
    const parkingLotId = req.params.parkingLotId;
    
    const spots = await ParkingSpot.find({ 
      parkingLotId, 
      isActive: true 
    }).populate('currentCar');
    
    res.status(200).json({
      success: true,
      count: spots.length,
      data: spots
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

exports.createParkingSpot = async (req, res) => {
  try {
    // Add the parking lot ID from the URL params
    req.body.parkingLotId = req.params.parkingLotId;
    
    const spot = await ParkingSpot.create(req.body);
    
    res.status(201).json({
      success: true,
      data: spot
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        error: messages
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Server Error'
      });
    }
  }
};

// Controller method for parking a car
exports.parkCar = async (req, res) => {
  try {
    const { spotId } = req.params;
    const carData = req.body;
    console.log(carData);
    
    // Find the spot
    const spot = await ParkingSpot.findOne({ spotId: spotId });
    
    if (!spot) {
      return res.status(404).json({
        success: false,
        error: 'Parking spot not found'
      });
    }
    
    // Check if spot is already occupied
    if (spot.currentCar) {
      return res.status(400).json({
        success: false,
        error: 'Parking spot is already occupied'
      });
    }
    
    // Create a new car record
    const car = new Car({
      licensePlate: carData.licensePlate,
      color: carData.color,
      model: carData.model,
      owner: carData.owner,
      entryTime: new Date(),
      currentSpot: spot._id
    });
    
    // Save the car
    await car.save();
    
    // Update the spot with the car reference
    spot.currentCar = car._id;
    await spot.save();
    
    res.status(200).json({
      success: true,
      data: {
        car,
        spot
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

// Controller method for removing a car
exports.removeCar = async (req, res) => {
  try {
    const { spotId } = req.params;
    
    // Find the spot
    const spot = await ParkingSpot.findOne({ spotId: spotId }).populate('currentCar');
    
    if (!spot) {
      return res.status(404).json({
        success: false,
        error: 'Parking spot not found'
      });
    }
    
    // Check if there's actually a car in the spot
    if (!spot.currentCar) {
      return res.status(400).json({
        success: false,
        error: 'No car is parked in this spot'
      });
    }
    
    const car = spot.currentCar;
    
    // Update car exit time and add to parking history
    car.exitTime = new Date();
    car.parkingHistory.push({
      spotId: spot._id,
      entryTime: car.entryTime,
      exitTime: car.exitTime
    });
    car.currentSpot = null;
    
    await car.save();
    
    // Remove car reference from spot
    spot.currentCar = null;
    await spot.save();
    
    res.status(200).json({
      success: true,
      data: {
        message: 'Car successfully removed from spot',
        car,
        spot
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