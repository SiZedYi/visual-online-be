// authRoutes.js

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController'); // Đảm bảo đường dẫn đúng đến controller của bạn

// Register route
router.post('/register', userController.register);

// Login route
router.post('/login', userController.login);

// 
router.get('/me', userController.authenticate, (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user
  });
});

router.get('/users',userController.getAllUser);
router.post('/create-user', userController.createUser);

module.exports = router;