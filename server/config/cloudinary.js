const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Ensure uploads folder exists
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Multer local storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

// Upload to Cloudinary helper
const uploadToCloudinary = async (filePath) => {
  const result = await cloudinary.uploader.upload(filePath, {
    folder: 'MyThings/documents',
    resource_type: 'auto',
  });

  // Optional: delete local file after upload
  fs.unlinkSync(filePath);

  return result.secure_url;
};

module.exports = { cloudinary, upload, uploadToCloudinary };