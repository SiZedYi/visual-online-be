// controllers/userController.js

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User, UserGroup } = require('../models/User'); // Assuming this is the file containing your model
const extractPermissions = require('../utils/extractPermission');

// Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'; // Should be set in environment variables
const JWT_EXPIRES_IN = '24h';

// Register a new user
exports.register = async (req, res) => {
  try {
    const { username, fullName, email, password, phoneNumber, address, apartmentNumber } = req.body;
    console.log(username, password);

    // Check if email or username already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email or username already exists in the system'
      });
    }

    // Find the Regular User group
    const regularUserGroup = await UserGroup.findOne({ name: /Regular User/i });

    if (!regularUserGroup) {
      return res.status(500).json({
        success: false,
        message: 'Regular User group not found in the system'
      });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create a new user with Regular User group
    const newUser = new User({
      username,
      fullName,
      email,
      password: hashedPassword,
      phoneNumber,
      address,
      apartmentNumber,
      userGroups: [regularUserGroup._id], // <-- gán mặc định Regular User group
    });

    await newUser.save();

    // Populate userGroups and extract permissions
    await newUser.populate({
      path: 'userGroups',
      select: 'name permissions',
    });
    const permissions = extractPermissions(newUser.userGroups);

    // Generate token
    const token = generateToken(newUser);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        fullName: newUser.fullName,
        isAdmin: false,
        permissions,
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


// Login
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if the user exists
    const user = await User.findOne({
      $or: [{ username }, { email: username }],
      isActive: true
    }).populate({
      path: 'userGroups',
      select: 'name permissions', // Chú ý thêm field 'name'
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid login credentials'
      });
    }

    // Check the password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid login credentials'
      });
    }

    const permissions = extractPermissions(user.userGroups);

    // Check if any userGroup name contains 'admin' (case-insensitive)
    const isAdmin = user.userGroups.some(group =>
      group.name.toLowerCase().includes('admin')
    );

    // Generate token
    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        isAdmin, // <<-- add this field
        permissions,
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


// Authentication middleware
exports.authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token not found'
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Find the user in the database
    const user = await User.findById(decoded.id)
      .select('-password')
      .populate('userGroups');

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User does not exist or has been deactivated'
      });
    }

    // Attach user information to the request
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired'
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

// Authorization middleware
exports.authorize = (resource, action) => {
  return (req, res, next) => {
    // Check if the user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Check permissions from userGroups
    const hasPermission = req.user.userGroups.some(group => {
      return group.permissions.some(permission => {
        return (
          permission.resource === resource &&
          permission.actions.includes(action)
        );
      });
    });

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action'
      });
    }

    next();
  };
};

// Function to generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, username: user.username },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

exports.getAllUser = async (req, res) => {
  try {
    const users = await User.find({ isActive: true }).populate({
      path: 'userGroups',
      populate: {
        path: 'permissions',
      },
    });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { username, fullName, email, password, phoneNumber, address, apartmentNumber, userGroups } = req.body;

    console.log(username, password);

    // Check if email or username already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email or username already exists in the system'
      });
    }

    // Check if userGroups IDs are valid
    const validGroups = await UserGroup.find({ _id: { $in: userGroups } });
    if (validGroups.length !== userGroups.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more userGroup IDs are invalid'
      });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create a new user with userGroups
    const newUser = new User({
      username,
      fullName,
      email,
      password: hashedPassword,
      phoneNumber,
      address,
      apartmentNumber,
      userGroups, 
    });

    await newUser.save();

    // Populate userGroups and extract permissions
    await newUser.populate({
      path: 'userGroups',
      select: 'name permissions',
    });

    const permissions = extractPermissions(newUser.userGroups);

    // Generate token
    const token = generateToken(newUser);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        fullName: newUser.fullName,
        permissions,
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};