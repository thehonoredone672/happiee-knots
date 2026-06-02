const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    price: { type: Number, required: true },
    description: { type: String, required: true },
    image: { type: String, required: true }, // Main primary image URL
    images: [{ type: String }] // Array storing all uploaded image URLs
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
