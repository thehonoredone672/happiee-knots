require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');
const authRoutes = require('./routes/auth'); // Ensure your auth routes are placed here

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

// Express Session tracking (Stores session tokens securely in MongoDB Atlas)
app.use(session({
    secret: process.env.SESSION_SECRET || 'happiee_knots_premium_secret_key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        collectionName: 'sessions'
    }),
    cookie: { 
        maxAge: 1000 * 60 * 60 * 24, // 24 Hours validity window
        secure: false // Set to true if running on HTTPS production deployment
    }
}));

// Serve static assets from your asset folder ('src')
app.use(express.static(path.join(__dirname, 'src')));

// ==========================================
//          AUTHENTICATION LAYER API
// ==========================================

// Checks session state context for frontend client calls
app.get('/api/auth/me', (req, res) => {
    if (req.session && req.session.user) {
        return res.json({ loggedIn: true, user: req.session.user });
    }
    return res.json({ loggedIn: false });
});

// User session logging out controller redirection layer
app.get('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) console.error("Session destruction token error:", err);
        res.redirect('/');
    });
});

// Mount user signup/login endpoints under the base endpoint
app.use('/api/auth', authRoutes);

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

// Legacy client-routing helper backups for clean URL loading fallback links
app.get('/login.html', (req, res) => res.sendFile(path.join(__dirname, 'src', 'login.html')));
app.get('/signup.html', (req, res) => res.sendFile(path.join(__dirname, 'src', 'signup.html')));

// ==========================================
//                API ROUTES
// ==========================================

app.post('/api/checkout', (req, res) => {
    const { cartItems, customerDetails } = req.body;
    console.log("Received order for:", cartItems);
    
    res.status(200).json({ 
        success: true, 
        message: "Order received successfully!" 
    });
});

// Start the server matching target requirements
app.listen(PORT, () => {
    console.log(`Server is up and running on http://localhost:${PORT}`);
});
