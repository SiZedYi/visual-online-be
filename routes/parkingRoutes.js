// routes/parkingRoutes.js
const express = require('express');
const router = express.Router();
const parkingController = require('../controllers/parkingController');

// Parking lot routes
router.get('/lots', parkingController.getParkingLots);
router.get('/lots/:id', parkingController.getParkingLotById);
router.post('/lots', parkingController.createParkingLot);

// Parking spot routes
router.get('/lots/:parkingLotId/spots', parkingController.getParkingSpots);
router.post('/lots/:parkingLotId/spots', parkingController.createParkingSpot);

// Car parking/removing routes
router.post('/lots/:parkingLotId/spots/:spotId/park', parkingController.parkCar);
router.post('/lots/:parkingLotId/spots/:spotId/remove', parkingController.removeCar);

module.exports = router;