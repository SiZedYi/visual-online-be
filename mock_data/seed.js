const { exec } = require('child_process');
const path = require('path');
require("dotenv").config();
// Đường dẫn thư mục chứa dữ liệu đã dump
const dumpPath = path.resolve(__dirname, '../mongo-backups/visual-online');

// Tên database cần khôi phục
const dbName = 'visual-online';
const connection = process.env.MONGO_URI
// Lệnh mongorestore với --drop để xóa dữ liệu cũ
const command = `mongorestore "--uri=${connection}" --drop --db=${dbName} "${dumpPath}"`;

console.log(`⚙️ Đang khôi phục database "${dbName}" từ thư mục:\n${dumpPath}`);

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(`❌ Lỗi khi khôi phục: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`⚠️ STDERR: ${stderr}`);
  }
  console.log(`✅ Đã khôi phục thành công:\n${stdout}`);
});
