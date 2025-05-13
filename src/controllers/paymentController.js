const dayjs = require('dayjs');
const Payment = require('../models/Payment');
const ParkingLot = require('../models/Parking');
const mongoose = require('mongoose');
const Car = require('../models/Car');
const { User } = require('../models/User');

exports.getPayments = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let query = {};

    if (startDate && endDate) {
      const start = dayjs(startDate);
      const end = dayjs(endDate);

      if (start.isValid() && end.isValid()) {
        query.createdAt = {
          $gte: start.startOf('day').toDate(),
          $lte: end.endOf('day').toDate(),
        };
      } else {
        console.log('Invalid date format provided:', { startDate, endDate });
      }
    }

    const payments = await Payment.find(query)
      .sort({ createdAt: -1 })
      .populate('user', 'fullName apartmentNumber')
      .populate('car', 'licensePlate');

    const parkingLots = await ParkingLot.find({}, 'lotId name price');

    const parkingLotMap = {};
    parkingLots.forEach((lot) => {
      parkingLotMap[lot._id.toString()] = lot;
    });

    const mappedPayments = payments
      .filter((payment) => payment.user && payment.car)
      .map((payment) => {
        let parkingLotId = null;
        if (payment.parkingLot) {
          parkingLotId =
            payment.parkingLot instanceof mongoose.Types.ObjectId
              ? payment.parkingLot.toString()
              : String(payment.parkingLot);
        }

        let parkingLot = parkingLotId ? parkingLotMap[parkingLotId] : null;

        if (!parkingLot && parkingLotId) {
          const defaultKeys = Object.keys(parkingLotMap);
          if (defaultKeys.length > 0) {
            parkingLot = parkingLotMap[defaultKeys[0]];
          }
        }

        if (!parkingLot) {
          console.log(`No ParkingLot available for payment ID: ${payment._id}`);
          return null;
        }

        // ✅ Calculate date based on status
        let date;
        if (payment.status === 'paid' && payment.paymentDate) {
          date = dayjs(payment.paymentDate).format('DD-MM-YYYY');
        } else {
          date = dayjs(payment.createdAt).add(1, 'month').format('DD-MM-YYYY');
        }

        return {
          id: payment._id,
          user: payment.user.fullName,
          apartment: payment.user.apartmentNumber,
          description: `${payment.car.licensePlate} - ${parkingLot.name}`,
          amount: parkingLot.price || 0,
          date, // ✅ use computed date
          status: payment.status,
        };
      })
      .filter((payment) => payment !== null);

    res.json({
      success: true,
      count: mappedPayments.length,
      data: mappedPayments,
    });
  } catch (err) {
    console.error('Error in getPayments:', err.message);
    res.status(500).json({ success: false, message: 'Server Error', error: err.message });
  }
};
// backend/controllers/paymentController.js
exports.getRevenueStats = async (req, res) => {
  const { type, date } = req.query; // type: "day" | "month" | "year"

  const match = {};
  if (date) {
    const d = dayjs(date);
    match.createdAt = {
      $gte: d.startOf(type).toDate(),
      $lte: d.endOf(type).toDate(),
    };
  }

  let result = await Payment.aggregate([
    { $match: match },
    // Join sang ParkingLot để lấy price
    {
      $lookup: {
        from: "parkinglots", // Tên collection (chữ thường và dạng số nhiều nếu dùng Mongoose default)
        localField: "parkingLot", // field trong Payment
        foreignField: "_id",
        as: "parkingLotInfo",
      },
    },
    { $unwind: "$parkingLotInfo" }, // Gỡ mảng parkingLotInfo
    {
      $group: {
        _id: {
          day: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          status: "$status",
        },
        total: { $sum: "$parkingLotInfo.price" }, // Tính tổng theo price
      },
    },
    {
      $project: {
        label: "$_id.day",
        status: "$_id.status",
        value: "$total",
        _id: 0,
      },
    },
    { $sort: { label: 1 } },
  ]);

  // ✅ Nếu không có kết quả, tạo dữ liệu mặc định cho ngày đó
  if (result.length === 0 && date) {
    const d = dayjs(date).startOf(type).format("YYYY-MM-DD");
    result = [
      { label: d, status: "paid", value: 0 },
      { label: d, status: "unpaid", value: 0 },
      { label: d, status: "overdue", value: 0 },
    ];
  }

  const totalRevenue = result
    .filter((d) => d.status === "paid")
    .reduce((sum, d) => sum + d.value, 0);

  const totalCars = await Car.countDocuments();
  const totalUsers = await User.countDocuments();

  res.json({
    success: true,
    data: result,
    summary: {
      totalCars,
      totalUsers,
      totalRevenue,
    },
  });
};


exports.getSummaryStats = async (req, res) => {
  try {
    // Đếm số xe đang có
    const totalCars = await Car.countDocuments();

    // Lấy tất cả parking lot và cộng tổng số spot lại
    const parkingLots = await ParkingLot.find({});
    const totalSpots = parkingLots.reduce((sum, lot) => {
      return sum + (lot.parkingSpots ? lot.parkingSpots.length : 0);
    }, 0);

    // Đếm số user (chủ căn hộ)
    const totalUsers = await User.countDocuments();

    res.json({
      success: true,
      data: {
        totalCars,
        totalSpots,
        totalUsers,
      },
    });
  } catch (err) {
    console.error("Error in getSummaryStats:", err);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

exports.setPaymentPaid = async (req, res) => {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ success: false, error: 'Missing payment ID' });
    }

    const payment = await Payment.findById(id);

    if (!payment) {
      return res.status(404).json({ success: false, error: 'Payment not found' });
    }

    payment.status = 'paid';
    payment.paymentDate = new Date(); // Ghi lại ngày thanh toán
    payment.updatedAt = new Date();

    await payment.save();

    return res.status(200).json({ success: true, data: payment });
  } catch (err) {
    console.error('Error in setPaymentPaid:', err.message);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};