// routes/parkingRoutes.js
const express = require('express');
const router = express.Router();
const parkingController = require("../controllers/parkingController"); // Ensure correct path to parkingController
const { authenticate } = require('../controllers/userController'); // Ensure correct path to userController

// Parking lot routes
router.get('/lots', parkingController.getParkingLots);
router.get('/lots/:id', parkingController.getParkingLotById);
router.post('/create', parkingController.createParkingLot);
router.post('/update', parkingController.updateParkingLot);


// Parking spot routes
router.get('/lots/:parkingLotId/spots',authenticate,  parkingController.getParkingSpots);
router.post('/lots/:parkingLotId/spots', parkingController.createSpot);
router.delete('/lots/:parkingLotId/spots/:spotId', parkingController.deleteSpot);
// router.post('/lots/:parkingLotId/spots', parkingController.createParkingSpot);
router.post('/lots/set-active', parkingController.setActiveParkingLot);

// Car parking/removing routes
router.post('/lots/:parkingLotId/spots/:spotId/park', authenticate, parkingController.parkCar);
router.post('/lots/:parkingLotId/spots/:spotId/remove', authenticate, parkingController.removeCar);

// OR if you want to restrict access:
router.get('/:parkingLotId/spots/:spotId/car', authenticate, parkingController.getCarInParkingSpot);

// Get all cars in a parking lot
router.get('/:parkingLotId/cars', parkingController.getCarsInParkingLot);
module.exports = router;