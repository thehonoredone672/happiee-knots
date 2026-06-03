const express = require('express');
const router = express.Router();
const User = require('../models/User');

// =======================================================
//                  --- SIGNUP ENDPOINT ---
// =======================================================
router.post('/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email is already registered.' });
        }

        // Create and save new user (normalizing email strings)
        const newUser = new User({ 
            name: name.trim(), 
            email: email.toLowerCase().trim(), 
            password 
        });
        await newUser.save();

        return res.status(201).json({ success: true, message: 'Account created successfully!' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
    }
});

// =======================================================
//                  --- LOGIN ENDPOINT ---
// =======================================================
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide email and password.' });
        }

        // Find user by normalized email entry
        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid email or password.' });
        }

        // Check password validity safely using schema method
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Invalid email or password.' });
        }

        // Attach clean user tracking information parameters to session state payload
        req.session.user = {
            id: user._id,
            name: user.name,
            email: user.email
        };

        // FIXED: Explicitly save the session state to MongoDB BEFORE sending the success signal
        req.session.save((err) => {
            if (err) {
                return res.status(500).json({ success: false, message: 'Session tracking configuration error.' });
            }
            return res.json({ 
                success: true, 
                message: 'Logged in successfully!', 
                user: req.session.user
            });
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

// =======================================================
//            --- GET CURRENT USER SESSION ---
// =======================================================
router.get('/me', (req, res) => {
    if (req.session && req.session.user) {
        return res.json({
            success: true,
            loggedIn: true, 
            user: req.session.user
        });
    } else {
        return res.json({
            success: false,
            loggedIn: false
        });
    }
});

// =======================================================
//                 --- LOGOUT ENDPOINT ---
// =======================================================
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Could not log out safely.' });
        }
        // FIXED: Clear cookie parameters instantly so old session traces disappear completely
        res.clearCookie('connect.sid'); 
        res.redirect('/'); 
    });
});

module.exports = router;
