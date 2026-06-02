
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies (crucial for future checkout APIs)
app.use(express.json());

// Serve static assets (CSS, JS, images) from the 'public' directory
app.use(express.static(path.join(__dirname, 'src')));

// --- HTML PAGE ROUTES ---

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'index.html'));
});

app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'about.html'));
});

app.get('/products', (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'products.html'));
});

app.get('/cart', (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'cart.html'));
});

app.get('/contact', (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'contact.html'));
});

// --- API ROUTES (Foundation for your E-commerce logic) ---

// Example: Endpoint to handle a checkout request from the frontend
app.post('/api/checkout', (req, res) => {
    const { cartItems, customerDetails } = req.body;
    
    // Here you would eventually validate the cart, calculate totals, 
    // and save the order to a database.
    console.log("Received order for:", cartItems);
    
    res.status(200).json({ 
        success: true, 
        message: "Order received successfully!" 
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is up and running on http://localhost:${PORT}`);
});
