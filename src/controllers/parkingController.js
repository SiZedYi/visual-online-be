// controllers/parkingController.js
const ParkingLot = require('../models/Parking');
const Car = require('../models/Car');
const mongoose = require('mongoose');
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
    // Initialize with empty parkingSpots array if not provided
    if (!req.body.parkingSpots) {
      req.body.parkingSpots = [];
    }
    
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
    
    // Find the parking lot
    const parkingLot = await ParkingLot.findOne({ lotId: parkingLotId, isActive: true });
    
    if (!parkingLot) {
      return res.status(404).json({
        success: false,
        error: 'Parking lot not found'
      });
    }
    
    // Get active parking spots
    const activeSpots = parkingLot.parkingSpots.filter(spot => spot.isActive);
    
    res.status(200).json({
      success: true,
      count: activeSpots.length,
      data: activeSpots
    });
  } catch (error) {
    console.log(error);
    
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

exports.createParkingSpot = async (req, res) => {
  try {
    const parkingLotId = req.params.parkingLotId;
    
    // Find the parking lot
    const parkingLot = await ParkingLot.findOne({ lotId: parkingLotId });
    
    if (!parkingLot) {
      return res.status(404).json({
        success: false,
        error: 'Parking lot not found'
      });
    }
    
    // Create new spot data
    const newSpotData = {
      spotId: req.body.spotId,
      x: req.body.x,
      y: req.body.y,
      width: req.body.width,
      height: req.body.height,
      type: req.body.type || 'standard',
      label: req.body.label,
      isActive: req.body.isActive !== undefined ? req.body.isActive : true,
      currentCar: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Check if spotId already exists
    const spotExists = parkingLot.parkingSpots.some(spot => spot.spotId === newSpotData.spotId);
    if (spotExists) {
      return res.status(400).json({
        success: false,
        error: 'Spot ID already exists in this parking lot'
      });
    }
    
    // Add the new spot to the parking lot
    parkingLot.parkingSpots.push(newSpotData);
    await parkingLot.save();
    
    res.status(201).json({
      success: true,
      data: newSpotData
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        error: messages
      });
    } else {
      console.error(error);
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
    const { spotId, parkingLotId } = req.params;
    const data = req.body;
    const user = req.user; // Assuming user is set in req by authentication middleware
    console.log(user);
    
    // Find the parking lot
    const parkingLot = await ParkingLot.findOne({ lotId: parkingLotId });

    if (!parkingLot) {
      return res.status(404).json({
        success: false,
        error: 'Parking lot not found',
      });
    }

    // Find the spot within the lot
    const spotIndex = parkingLot.parkingSpots.findIndex(
      (spot) => spot.spotId === spotId && spot.isActive === true
    );

    if (spotIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Parking spot not found',
      });
    }

    // Check if spot is already occupied
    if (parkingLot.parkingSpots[spotIndex].currentCar) {
      return res.status(400).json({
        success: false,
        error: 'Parking spot is already occupied',
      });
    }

    // Check if car already exists
    let car = await Car.findOne({ licensePlate: data.carData.licensePlate });

    if (!car) {
      // Create a new car record
      car = new Car({
        licensePlate: data.carData.licensePlate,
        color: data.carData.color,
        model: data.carData.model,
        ownerUser: user._id, // Replace with actual user logic
        ownerInfo: {
          name: user.fullName,
          contactInfo: user.phoneNumber,
          apartment: user.apartmentNumber,
        },
        // entryTime: new Date(),
        currentSpot: spotId,
        parkingHistory: [{
          lotId: parkingLotId,
          spotId,
          entryTime: new Date(),
        }]
      });

      await car.save();
    } else {
      // Update car info
      car.currentSpot = spotId;
      // car.entryTime = new Date();
      car.parkingHistory.push({
        lotId: parkingLotId,
        spotId,
        entryTime: new Date(),
      });

      await car.save();
    }

    // Update the spot with the car reference
    parkingLot.parkingSpots[spotIndex].currentCar = car._id;
    parkingLot.parkingSpots[spotIndex].currentCarColor = car.color;
    parkingLot.parkingSpots[spotIndex].updatedAt = new Date();

    await parkingLot.save();

    res.status(200).json({
      success: true,
      data: {
        car,
        spot: parkingLot.parkingSpots[spotIndex],
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Server Error',
    });
  }
};

// Controller method for removing a car
exports.removeCar = async (req, res) => {
  try {
    const { spotId } = req.params;
    const { parkingLotId } = req.params;
    
    // Find the parking lot
    const parkingLot = await ParkingLot.findOne({ lotId: parkingLotId });
    
    if (!parkingLot) {
      return res.status(404).json({
        success: false,
        error: 'Parking lot not found'
      });
    }
    
    // Find the spot within the lot
    const spotIndex = parkingLot.parkingSpots.findIndex(spot => spot.spotId === spotId);
    
    if (spotIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Parking spot not found'
      });
    }
    
    const spot = parkingLot.parkingSpots[spotIndex];
    
    // Check if there's actually a car in the spot
    if (!spot.currentCar) {
      return res.status(400).json({
        success: false,
        error: 'No car is parked in this spot'
      });
    }
    
    // Find the car
    const car = await Car.findById(spot.currentCar);
    
    if (!car) {
      return res.status(404).json({
        success: false,
        error: 'Car record not found'
      });
    }
    
    // Update car exit time and add to parking history
    // car.exitTime = new Date();
    // car.parkingHistory.push({
    //   spotId: spotId,
    //   entryTime: car.entryTime,
    //   exitTime: car.exitTime
    // });
    car.currentSpot = null;
    
    await car.save();
    
    // Remove car reference from spot
    parkingLot.parkingSpots[spotIndex].currentCar = null;
    parkingLot.parkingSpots[spotIndex].updatedAt = new Date();
    await parkingLot.save();
    
    res.status(200).json({
      success: true,
      data: {
        message: 'Car successfully removed from spot',
        car,
        spot: parkingLot.parkingSpots[spotIndex]
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

// New method to update a parking spot
exports.updateParkingSpot = async (req, res) => {
  try {
    const { parkingLotId, spotId } = req.params;
    const updateData = req.body;
    
    // Find the parking lot
    const parkingLot = await ParkingLot.findOne({ lotId: parkingLotId });
    
    if (!parkingLot) {
      return res.status(404).json({
        success: false,
        error: 'Parking lot not found'
      });
    }
    
    // Find the spot within the lot
    const spotIndex = parkingLot.parkingSpots.findIndex(spot => spot.spotId === spotId);
    
    if (spotIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Parking spot not found'
      });
    }
    
    // Update the spot with allowed fields
    const allowedUpdates = ['x', 'y', 'width', 'height', 'type', 'label', 'isActive'];
    
    allowedUpdates.forEach(field => {
      if (updateData[field] !== undefined) {
        parkingLot.parkingSpots[spotIndex][field] = updateData[field];
      }
    });
    
    // Update the updatedAt timestamp
    parkingLot.parkingSpots[spotIndex].updatedAt = new Date();
    
    await parkingLot.save();
    
    res.status(200).json({
      success: true,
      data: parkingLot.parkingSpots[spotIndex]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// New method to get parking lot statistics
exports.getParkingLotStats = async (req, res) => {
  try {
    const { parkingLotId } = req.params;
    
    // Find the parking lot
    const parkingLot = await ParkingLot.findOne({ lotId: parkingLotId });
    
    if (!parkingLot) {
      return res.status(404).json({
        success: false,
        error: 'Parking lot not found'
      });
    }
    
    // Calculate statistics
    const totalSpots = parkingLot.parkingSpots.length;
    const activeSpots = parkingLot.parkingSpots.filter(spot => spot.isActive).length;
    const occupiedSpots = parkingLot.parkingSpots.filter(spot => spot.isActive && spot.currentCar).length;
    const availableSpots = activeSpots - occupiedSpots;
    
    // Count by type
    const typeStats = {};
    parkingLot.parkingSpots.forEach(spot => {
      if (!typeStats[spot.type]) {
        typeStats[spot.type] = { total: 0, available: 0 };
      }
      typeStats[spot.type].total++;
      if (spot.isActive && !spot.currentCar) {
        typeStats[spot.type].available++;
      }
    });
    
    res.status(200).json({
      success: true,
      data: {
        totalSpots,
        activeSpots,
        occupiedSpots,
        availableSpots,
        occupancyRate: (occupiedSpots / activeSpots * 100).toFixed(2) + '%',
        typeBreakdown: typeStats
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

/**
 * Get information about the car in a specific parking spot
 * @route GET /api/parking/:parkingLotId/spots/:spotId/car
 * @access Public or Restricted (depending on your needs)
 */
exports.getCarInParkingSpot = async (req, res) => {
  try {
    const { parkingLotId, spotId } = req.params;

    // Find the parking lot
    const parkingLot = await ParkingLot.findOne({ lotId: parkingLotId });

    if (!parkingLot) {
      return res.status(404).json({
        success: false,
        error: 'Parking lot not found',
      });
    }

    // Find the spot within the lot
    const spot = parkingLot.parkingSpots.find(
      (spot) => spot.spotId === spotId && spot.isActive === true
    );

    if (!spot) {
      return res.status(404).json({
        success: false,
        error: 'Parking spot not found',
      });
    }

    // Check if spot has a car
    if (!spot.currentCar) {
      return res.status(200).json({
        success: true,
        data: {
          occupied: false,
          spot: {
            spotId: spot.spotId,
            spotNumber: spot.spotNumber,
            isActive: spot.isActive,
            floor: spot.floor,
            section: spot.section,
            type: spot.type
          }
        },
      });
    }

    // Find the car details with owner information
    const car = await Car.findById(spot.currentCar)
      // .populate({
      //   path: 'ownerUser',
      //   select: 'name email' // Include owner details
      // })

    if (!car) {
      // This is an edge case where the spot shows occupied, but the car record doesn't exist
      return res.status(200).json({
        success: true,
        data: {
          occupied: true,
          car: null,
          spot: {
            spotId: spot.spotId,
            spotNumber: spot.spotNumber,
            isActive: spot.isActive,
            currentCarColor: spot.currentCarColor,
            updatedAt: spot.updatedAt,
            floor: spot.floor,
            section: spot.section,
            type: spot.type
          },
          error: 'Car record not found but spot shows as occupied'
        },
      });
    }

    // Return complete car information including owner details
    const carData = {
      licensePlate: car.licensePlate,
      color: car.color,
      model: car.model,
      ownerInfo: car.ownerInfo,
      entryTime: car.entryTime,
      currentSpot: car.currentSpot,
      // Get only the current parking record for this spot
      currentParkingRecord: car.parkingHistory.find(
        record => record.lotId === parkingLotId && 
                  record.spotId === spotId && 
                  !record.exitTime
      )
    };

    res.status(200).json({
      success: true,
      data: {
        occupied: true,
        car: carData,
        spot: {
          spotId: spot.spotId,
          spotNumber: spot.spotNumber,
          isActive: spot.isActive,
          floor: spot.floor,
          section: spot.section,
          type: spot.type
        }
      },
    });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Server Error',
    });
  }
};

// Optional function if you want to get ALL cars in a parking lot
exports.getCarsInParkingLot = async (req, res) => {
  try {
    const { parkingLotId } = req.params;

    // Find the parking lot
    const parkingLot = await ParkingLot.findOne({ lotId: parkingLotId });

    if (!parkingLot) {
      return res.status(404).json({
        success: false,
        error: 'Parking lot not found',
      });
    }

    // Get all occupied spots
    const occupiedSpots = parkingLot.parkingSpots
      .filter(spot => spot.currentCar && spot.isActive)
      .map(spot => ({
        spotId: spot.spotId,
        spotNumber: spot.spotNumber,
        carId: spot.currentCar,
        carColor: spot.currentCarColor,
        updatedAt: spot.updatedAt
      }));

    // If no occupied spots, return early
    if (occupiedSpots.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          parkingLotId,
          totalSpots: parkingLot.parkingSpots.length,
          occupiedSpots: 0,
          cars: []
        }
      });
    }

    // Extract all car IDs from occupied spots
    const carIds = occupiedSpots.map(spot => spot.carId);

    // Find all cars in one query
    const cars = await Car.find({ _id: { $in: carIds } })
      .select(req.user ? 'licensePlate color model currentSpot entryTime' : 'color currentSpot');

    // Combine spot and car data
    const spotsWithCars = occupiedSpots.map(spot => {
      const car = cars.find(car => car._id.toString() === spot.carId.toString());
      return {
        ...spot,
        car: car || { note: 'Car record not found' }
      };
    });

    res.status(200).json({
      success: true,
      data: {
        parkingLotId,
        totalSpots: parkingLot.parkingSpots.length,
        occupiedSpots: occupiedSpots.length,
        occupancyRate: (occupiedSpots.length / parkingLot.parkingSpots.length * 100).toFixed(2) + '%',
        cars: spotsWithCars
      }
    });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Server Error',
    });
  }
};
