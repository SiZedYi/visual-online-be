const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticate } = require('../controllers/userController'); // Ensure correct path to userController

// Car routes - to be added to your routes file
router.get('', authenticate, paymentController.getPayments);

module.exports = router;

