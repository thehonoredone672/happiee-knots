const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure your Cloudinary Credentials
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Storage Engine Options
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'happiee_knots_products', // Cloudinary folder name
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
        transformation: [{ width: 800, height: 800, crop: 'limit' }] // Optimize image size
    }
});

// Initialize upload middleware
const upload = multer({ storage: storage });

module.exports = upload;
