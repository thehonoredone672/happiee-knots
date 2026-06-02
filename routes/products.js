const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const upload = require('../middleware/upload');

// CREATE / UPDATE PRODUCT ENDPOINT
// upload.array('productImages', 5) accepts up to 5 file uploads matching the field name
router.post('/save', upload.array('productImages', 5), async (req, res) => {
    try {
        const { id, name, category, price, description } = req.body;
        
        let imageUrls = [];

        // If new images were selected/uploaded via Multer
        if (req.files && req.files.length > 0) {
            imageUrls = req.files.map(file => file.path); // Cloudinary secure URLs
        } else if (req.body.existingImages) {
            // Fallback to pre-existing images if editing and no new files were uploaded
            imageUrls = Array.isArray(req.body.existingImages) ? req.body.existingImages : [req.body.existingImages];
        } else {
            // Absolute fallback default placeholder image
            imageUrls = ['https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=600'];
        }

        const primaryImage = imageUrls[0];

        if (id) {
            // --- UPDATE EXISTING PRODUCT ---
            const updatedProduct = await Product.findByIdAndUpdate(
                id,
                { name, category, price: parseFloat(price), description, image: primaryImage, images: imageUrls },
                { new: true }
            );
            return res.status(200).json({ success: true, message: 'Product updated successfully!', product: updatedProduct });
        } else {
            // --- CREATE NEW PRODUCT ---
            const newProduct = new Product({
                name, category, price: parseFloat(price), description, image: primaryImage, images: imageUrls
            });
            await newProduct.save();
            return res.status(201).json({ success: true, message: 'Product saved to MongoDB Atlas!', product: newProduct });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error processing product storage data.' });
    }
});

// GET ALL PRODUCTS FROM MONGOOSE
router.get('/all', async (req, res) => {
    try {
        // Fetches products sorted with the newest entries first
        const products = await Product.find().sort({ createdAt: -1 });
        res.json({ success: true, products });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ success: false, message: 'Failed to load products.' });
    }
});


module.exports = router;
