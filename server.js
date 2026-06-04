require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');
const authRoutes = require('./routes/auth'); 
const productRoutes = require('./routes/products'); 

const app = express();
const PORT = process.env.PORT || 3000;

// Use a unified URI variable string fallback to keep everything safe
const dbURI = process.env.MONGODB_URI || process.env.MONGO_URI;

// ==========================================
//          DATABASE CONNECTION (MONGOOSE)
// ==========================================
mongoose.connect(dbURI)
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

app.set('trust proxy', 1); // CRITICAL: Tells Express to trust Render's reverse proxy for cookies

app.use(session({
    secret: process.env.SESSION_SECRET || 'happieeknotssecretkey',
    resave: false,
    saveUninitialized: false,
    // FIXED: Now uses the verified unified connection string safely
    store: MongoStore.create({ mongoUrl: dbURI }), 
    cookie: {
        secure: process.env.NODE_ENV === 'production', // true on Render (HTTPS), false locally (HTTP)
        sameSite: 'lax', // FIXED: Optimal tracking for monolithic same-domain systems
        maxAge: 24 * 60 * 60 * 1000 // 1 Day session duration window
    }
}));

// Serve static assets from your asset folders
app.use(express.static(path.join(__dirname, 'src')));
app.use(express.static(path.join(__dirname, 'public')));

// ==========================================
//          AUTHENTICATION LAYER API
// ==========================================

// Helper endpoint for the navbar session checker state
app.get('/api/auth/me', (req, res) => {
    if (req.session && req.session.user) {
        return res.json({ success: true, loggedIn: true, user: req.session.user });
    }
    return res.json({ success: false, loggedIn: false });
});

app.get('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) console.error("Session destruction token error:", err);
        res.clearCookie('connect.sid'); // Explicitly wipe the browser cookie tracking identifier
        res.redirect('/');
    });
});

app.use('/api/auth', authRoutes);

// ==========================================
//                API ROUTES
// ==========================================
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

app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'src', 'login.html')));
app.get('/signup', (req, res) => res.sendFile(path.join(__dirname, 'src', 'signup.html')));


// robots.txt
app.get('/robots.txt', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'robots.txt'));
});

// sitemap.xml
app.get('/sitemap.xml', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'sitemap.xml'));
});
// Start the server
app.listen(PORT, () => {
    console.log(`Server is up and running on http://localhost:${PORT}`);
});
