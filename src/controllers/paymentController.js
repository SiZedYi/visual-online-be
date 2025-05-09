const dayjs = require('dayjs');
const Payment = require('../models/Payment');
const ParkingLot = require('../models/Parking');
const mongoose = require('mongoose');

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
