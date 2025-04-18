const express = require('express');
const router = express.Router();
const carController = require('../controllers/carController');
const { authenticate } = require('../controllers/userController'); // Ensure correct path to userController

// Car routes - to be added to your routes file
router.get('', authenticate, carController.getUserCars);
router.get('/:id', authenticate, carController.getCar);
router.post('', authenticate, carController.addCar);
router.put('/:id', authenticate, carController.updateCar);
router.delete('/:id', authenticate, carController.deleteCar);
router.get('/:id/history', authenticate, carController.getCarParkingHistory);

module.exports = router;

