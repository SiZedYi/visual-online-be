const cv = require('opencv.js');
const sharp = require('sharp');
const fs = require('fs');

async function detectParkingSlots(imagePath) {
  try {
    // Đọc và chuyển đổi ảnh sang RGBA bằng sharp (hỗ trợ mọi định dạng)
    const imageBuffer = await sharp(imagePath).toFormat('png').ensureAlpha().raw().toBuffer({ resolveWithObject: true });

    const { data, info } = imageBuffer;
    const { width, height } = info;

    // Tạo OpenCV matrix từ dữ liệu ảnh
    let src = cv.matFromImageData({ data, width, height });

    // Chuyển ảnh sang grayscale
    cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY);

    // Phát hiện cạnh bằng Canny
    let edges = new cv.Mat();
    cv.Canny(src, edges, 50, 150);

    // Tìm contours để xác định vùng bãi đỗ xe
    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();
    cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    let slots = [];
    for (let i = 0; i < contours.size(); i++) {
      let rect = cv.boundingRect(contours.get(i));
      if (rect.width > 20 && rect.height > 20) {  // Lọc những vùng nhỏ không phải là chỗ đỗ xe
        slots.push({
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
          occupied: false
        });
      }
    }

    // Sắp xếp các Rect theo diện tích (width * height), Rect lớn hơn sẽ nằm dưới
    slots.sort((a, b) => (b.width * b.height) - (a.width * a.height));

    // Dọn dẹp bộ nhớ
    src.delete();
    edges.delete();
    contours.delete();
    hierarchy.delete();

    return slots;
  } catch (error) {
    console.error("Error processing image:", error);
    return [];
  }
}
module.exports = detectParkingSlots;