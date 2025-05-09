const Car = require('../models/Car');
const { User } = require('../models/User');
// Get all cars for the authenticated user
exports.getUserCars = async (req, res) => {
  try {
    const cars = await Car.find({ ownerUser: req.user._id });

    res.status(200).json({
      success: true,
      count: cars.length,
      data: cars
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Get all user car
exports.getAllUserCars = async (req, res) => {
  try {
    const cars = await Car.find();

    res.status(200).json({
      success: true,
      count: cars.length,
      data: cars
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};
exports.getCarByLicensePlate = async (req, res) => {
  try {
    const licensePlate = req.params.licensePlate.trim().toLowerCase();
    const car = await Car.findOne({ licensePlate });

    if (car) {
      return res.status(200).json({ success: true, data: car });
    } else {
      return res.status(200).json({ success: true, data: null });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}
// Get single car by ID (if owned by authenticated user)
exports.getCar = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);

    if (!car) {
      return res.status(404).json({
        success: false,
        error: 'Car not found'
      });
    }

    // // Kiểm tra quyền truy cập
    // if (car.ownerUser.toString() !== req.user._id.toString()) {
    //   return res.status(403).json({
    //     success: false,
    //     error: 'Not authorized to access this car'
    //   });
    // }

    res.status(200).json({
      success: true,
      data: {
        _id: car._id,
        licensePlate: car.licensePlate,
        color: car.color,
        model: car.model,
        ownerUser: car.ownerInfo.name,
        ownerInfo: car.ownerInfo.contactInfo,
        apartment: car.ownerInfo.apartment,
        currentSpot: car.currentSpot,
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


// Add a new car for the authenticated user
exports.addCar = async (req, res) => {
  try {
    const { licensePlate, color, model } = req.body;

    // Kiểm tra xe đã tồn tại chưa
    const existingCar = await Car.findOne({ licensePlate });
    if (existingCar) {
      return res.status(400).json({
        success: false,
        error: 'A car with this license plate already exists'
      });
    }

    // Lấy thông tin user
    const user = await User.findById(req.user._id).select('fullName phoneNumber apartmentNumber cars');
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Tạo xe mới
    const car = new Car({
      licensePlate,
      color,
      model,
      ownerUser: req.user._id,
      ownerInfo: {
        name: user.fullName,
        contactInfo: user.email,
        apartment: user.apartmentNumber,
      }
    });

    await car.save();

    // Cập nhật user: thêm car vào mảng cars
    user.cars.push(car._id);
    await user.save();

    res.status(201).json({
      success: true,
      data: car
    });
  } catch (error) {
    console.error(error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        error: messages
      });
    }
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};


// Update a car for the authenticated user
exports.updateCar = async (req, res) => {
  try {
    const {
      apartment,
      carColor,
      carModel,
      contactInfo,
      licensePlate,
      ownerName
    } = req.body;

    // Tìm xe cần update
    let car = await Car.findById(req.params.id);
    if (!car) {
      return res.status(404).json({ success: false, error: 'Car not found' });
    }

    // Kiểm tra quyền: chỉ chủ xe hoặc admin
    if (car.ownerUser.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Not authorized to update this car' });
    }

    // Chuẩn bị dữ liệu update cho xe hiện tại
    const updateData = {};
    if (licensePlate !== undefined) updateData.licensePlate = licensePlate.toUpperCase();
    if (carColor !== undefined) updateData.color = carColor;
    if (carModel !== undefined) updateData.model = carModel;

    updateData.ownerInfo = {
      name: ownerName || car.ownerInfo?.name,
      contactInfo: contactInfo || car.ownerInfo?.contactInfo,
      apartment: apartment || car.ownerInfo?.apartment
    };

    updateData.updatedAt = new Date();

    // Cập nhật User.apartmentNumber nếu có apartment
    if (apartment) {
      await User.findByIdAndUpdate(
        car.ownerUser,
        { apartmentNumber: apartment },
        { new: true }
      );
    }

    // Update xe hiện tại
    const updatedCar = await Car.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    // Nếu có ownerInfo thay đổi → update toàn bộ xe khác cùng ownerUser
    if (ownerName || contactInfo || apartment) {
      const bulkOwnerInfo = {};
      if (ownerName) bulkOwnerInfo['ownerInfo.name'] = ownerName;
      if (contactInfo) bulkOwnerInfo['ownerInfo.contactInfo'] = contactInfo;
      if (apartment) bulkOwnerInfo['ownerInfo.apartment'] = apartment;

      await Car.updateMany(
        { ownerUser: car.ownerUser },
        { $set: bulkOwnerInfo }
      );
    }

    res.status(200).json({ success: true, data: updatedCar });

  } catch (error) {
    console.error(error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ success: false, error: messages });
    }
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};


// Delete a car for the authenticated user
exports.deleteCar = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);

    if (!car) {
      return res.status(404).json({
        success: false,
        error: 'Car not found'
      });
    }

    // Check if car belongs to authenticated user
    if (car.ownerUser.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this car'
      });
    }

    // Check if car is currently parked
    if (car.currentSpot) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete a car that is currently parked. Please remove the car from the parking spot first.'
      });
    }

    await car.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Get car parking history
exports.getCarParkingHistory = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);

    if (!car) {
      return res.status(404).json({
        success: false,
        error: 'Car not found'
      });
    }

    // Check if car belongs to authenticated user
    if (car.ownerUser.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this car'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        licensePlate: car.licensePlate,
        model: car.model,
        color: car.color,
        parkingHistory: car.parkingHistory
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