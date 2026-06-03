require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');
const authRoutes = require('./routes/auth'); 
const productRoutes = require('./routes/products'); // 1. IMPORT YOUR PRODUCT ROUTE HERE

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
//          DATABASE CONNECTION (MONGOOSE)
// ==========================================
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Successfully connected to MongoDB Atlas.'))
    .catch(err => {
        console.error('MongoDB Atlas connection error:', err);
        process.exit(1);
    });

// ==========================================
//               MIDDLEWARES
// ==========================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Express Session tracking
app.use(session({
    secret: process.env.SESSION_SECRET || 'happiee_knots_premium_secret_key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        collectionName: 'sessions'
    }),
    cookie: { 
        maxAge: 1000 * 60 * 60 * 24, // 24 Hours
        secure: false 
    }
}));

// Serve static assets from your asset folder ('src')
app.use(express.static(path.join(__dirname, 'src')));
app.use(express.static(path.join(__dirname, 'public')));

// ==========================================
//          AUTHENTICATION LAYER API
// ==========================================

app.get('/api/auth/me', (req, res) => {
    if (req.session && req.session.user) {
        return res.json({ loggedIn: true, user: req.session.user });
    }
    return res.json({ loggedIn: false });
});

app.get('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) console.error("Session destruction token error:", err);
        res.redirect('/');
    });
});

app.use('/api/auth', authRoutes);

// ==========================================
//                API ROUTES
// ==========================================

// 2. MOUNT YOUR PRODUCT ROUTE HERE (Fixes your frontend fetch sync error)
app.use('/api/products', productRoutes);

app.post('/api/checkout', (req, res) => {
    const { cartItems, customerDetails } = req.body;
    console.log("Received order for:", cartItems);
    
    res.status(200).json({ 
        success: true, 
        message: "Order received successfully!" 
    });
});

// ==========================================
//            HTML PAGE ROUTES
// ==========================================

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

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'admin.html'));
});

// Legacy client-routing helper backups
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'src', 'login.html')));
app.get('/signup', (req, res) => res.sendFile(path.join(__dirname, 'src', 'signup.html')));





// Start the server
app.listen(PORT, () => {
    console.log(`Server is up and running on http://localhost:${PORT}`);
});
