const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;
const fs = require('fs');

// Kết nối đến MongoDB
mongoose.connect('mongodb://localhost:27017/visual-online', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Kết nối MongoDB thành công'))
.catch(err => console.error('Lỗi kết nối MongoDB:', err));

let mockData;
// Đọc dữ liệu từ tệp JSON và gán vào biến mockData
try {
  const data = fs.readFileSync('./mock_data/mock_data.json', 'utf8');
  mockData = JSON.parse(data);
  console.log('Đã đọc dữ liệu mẫu từ mock_data.json');
  console.log(mockData.userGroups);
  
} catch (err) {
  console.error('Lỗi khi đọc tệp mock_data.json:', err);
}

// Hàm để import dữ liệu vào MongoDB
async function importData() {
  try {
    // Import UserGroup first
    const {UserGroup} = require('../models/User'); // Đảm bảo đường dẫn đúng đến mô hình UserGroup
    await UserGroup.deleteMany({});
    await UserGroup.create(mockData.userGroups);
    
    // Import User
    const {User} = require('../models/User'); // Đảm bảo đường dẫn đúng đến mô hình User
    await User.deleteMany({});
    await User.create(mockData.users);
    
    // Import ParkingSpot
    const ParkingLot = require('../models/Parking'); // Đảm bảo đường dẫn đúng đến mô hình ParkingLot
    await ParkingLot.deleteMany({});
    await ParkingLot.create(mockData.parkingLots);
    
    // Import Car
    const Car = require('../models/Car'); // Đảm bảo đường dẫn đúng đến mô hình Car
    await Car.deleteMany({});
    await Car.create(mockData.cars);
    
    // Import ParkingRequest
    const ParkingRequest = require('../models/ParkingRequest'); // Đảm bảo đường dẫn đúng đến mô hình ParkingRequest
    await ParkingRequest.deleteMany({});
    await ParkingRequest.create(mockData.parkingRequests);
    
    // Import Payment
    const Payment = require('../models/Payment'); // Đảm bảo đường dẫn đúng đến mô hình Payment
    await Payment.deleteMany({});
    await Payment.create(mockData.payments);
    
    // Import Notification
    const Notification = require('../models/Notification'); // Đảm bảo đường dẫn đúng đến mô hình Notification
    await Notification.deleteMany({});
    await Notification.create(mockData.notifications);
    
    console.log('Đã import dữ liệu thành công vào MongoDB');
    
    // Đóng kết nối
    mongoose.connection.close();
  } catch (error) {
    console.error('Lỗi khi import dữ liệu:', error);
  }
}

// Gọi hàm import nếu muốn import ngay lập tức
// Bỏ comment dòng dưới để thực hiện import
importData();

// Xuất mô-đun để có thể import và sử dụng trong các tập lệnh khác
module.exports = { mockData, importData };