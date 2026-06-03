const express = require('express');
const router = express.Router();
const User = require('../models/User');

// --- SIGNUP ENDPOINT ---
router.post('/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email is already registered.' });
        }

        // Create and save new user
        const newUser = new User({ name, email, password });
        await newUser.save();

        return res.status(201).json({ success: true, message: 'Account created successfully!' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
    }
});

// --- LOGIN ENDPOINT ---
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid email or password.' });
        }

        // Check password validity using schema method
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Invalid email or password.' });
        }

        // =======================================================
        // FIXED: ATTACH USER TO SESSION FOR EXPRESS-SESSION TO TRACK
        // =======================================================
        req.session.user = {
            id: user._id,
            name: user.name,
            email: user.email
        };

        // Successful authentication response
        return res.json({ 
            success: true, 
            message: 'Logged in successfully!', 
            user: req.session.user
        });
    } catch (error) {
    // This will send the exact error message to your browser alert popup
    return res.status(500).json({ success: false, message: error.message });
    }
    
});

// --- GET CURRENT USER SESSION STATE (FOR NAVBAR CHECK) ---
router.get('/me', (req, res) => {
    // If express-session has a user object attached, they are authenticated!
    if (req.session && req.session.user) {
        return res.json({
            success: true,
            loggedIn: true, // Frontend checks for this
            user: req.session.user
        });
    } else {
        // If no session exists, safely return false instead of a server crash
        return res.json({
            success: false,
            loggedIn: false
        });
    }
});

// --- LOGOUT ENDPOINT (OPTIONAL BUT RECOMMENDED) ---
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Could not log out' });
        }
        res.redirect('/'); // Sends them right back to the homepage after clearing the cookie
    });
});


module.exports = router;
