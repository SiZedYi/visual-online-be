// routes/parkingRoutes.js
const express = require('express');
const router = express.Router();
const parkingController = require('../controllers/parkingController');
const { authenticate } = require('../controllers/userController'); // Ensure correct path to userController

// Parking lot routes
router.get('/lots', parkingController.getParkingLots);
router.get('/lots/:id', parkingController.getParkingLotById);
router.post('/lots', parkingController.createParkingLot);

// Parking spot routes
router.get('/lots/:parkingLotId/spots', parkingController.getParkingSpots);
router.post('/lots/:parkingLotId/spots', parkingController.createParkingSpot);

// Car parking/removing routes
router.post('/lots/:parkingLotId/spots/:spotId/park', authenticate, parkingController.parkCar);
router.post('/lots/:parkingLotId/spots/:spotId/remove', authenticate, parkingController.removeCar);

// OR if you want to restrict access:
router.get('/:parkingLotId/spots/:spotId/car', authenticate, parkingController.getCarInParkingSpot);

// Get all cars in a parking lot
router.get('/:parkingLotId/cars', parkingController.getCarsInParkingLot);
module.exports = router;