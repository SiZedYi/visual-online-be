const express = require('express');
const router = express.Router();
const carController = require('../controllers/carController');
const { authenticate } = require('../controllers/userController'); // Ensure correct path to userController

// Car routes - to be added to your routes file
router.get('', authenticate, carController.getUserCars);
router.get('/all', authenticate, carController.getAllUserCars);
router.get('/:id', authenticate, carController.getCar); // ge tby id
router.get('/check/:licensePlate', carController.getCarByLicensePlate); //check by licnes plate
router.post('', authenticate, carController.addCar);
router.put('/:id', authenticate, carController.updateCar);
router.delete('/:id', authenticate, carController.deleteCar);
router.get('/:id/history', authenticate, carController.getCarParkingHistory);

module.exports = router;

