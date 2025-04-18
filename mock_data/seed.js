const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;
const bcrypt = require('bcryptjs');
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
    const {UserGroup} = require('../src/models/User'); // Đảm bảo đường dẫn đúng đến mô hình UserGroup
    await UserGroup.deleteMany({});
    await UserGroup.create(mockData.userGroups);
    
    // Import User
    const {User} = require('../src/models/User'); // Đảm bảo đường dẫn đúng đến mô hình User
    await User.deleteMany({});
    const hashedPassword = await bcrypt.hash(mockData.users[0].password, 10); // set a secure password
    mockData.users[0].password = hashedPassword
    await User.create(mockData.users);
    
    // Import ParkingSpot
    const ParkingLot = require('../src/models/Parking'); // Đảm bảo đường dẫn đúng đến mô hình ParkingLot
    await ParkingLot.deleteMany({});
    await ParkingLot.create(mockData.parkingLots);
    
    // Import Car
    const Car = require('../src/models/Car'); // Đảm bảo đường dẫn đúng đến mô hình Car
    await Car.deleteMany({});
    await Car.create(mockData.cars);
    
    // Import ParkingRequest
    const ParkingRequest = require('../src/models/ParkingRequest'); // Đảm bảo đường dẫn đúng đến mô hình ParkingRequest
    await ParkingRequest.deleteMany({});
    await ParkingRequest.create(mockData.parkingRequests);
    
    // Import Payment
    const Payment = require('../src/models/Payment'); // Đảm bảo đường dẫn đúng đến mô hình Payment
    await Payment.deleteMany({});
    await Payment.create(mockData.payments);
    
    // Import Notification
    const Notification = require('../src/models/Notification'); // Đảm bảo đường dẫn đúng đến mô hình Notification
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