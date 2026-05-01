const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Replace with your Cloudinary credentials in .env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: 'MyThings/documents',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf', 'webp'],
    resource_type: 'auto',
    public_id: `${Date.now()}-${file.originalname.split('.')[0]}`,
  }),
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
});

module.exports = { cloudinary, upload };
