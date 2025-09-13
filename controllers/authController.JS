const User = require("../models/User.js");

const jwt = require("jsonwebtoken");

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: "7d",
    });
};

// Register User
exports.registerUser = async (req, res) => {
    const { fullName, email, password, profileImageUrl } = req.body;

    // validation: check for missing fields
    if (!fullName || !email || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }

    try {
        // check if email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already in use" });
        }

        // create the user
        const user = await User.create({
            fullName,
            email,
            password,
            profileImageUrl,
        });

        res.status(201).json({
            id: user._id,
            User,
            token: generateToken(user._id),
        });
    } catch (error) {
        res.status(500).json({
            message: "Error registering",
            error: error.message,
        });
    }
};

// Login User
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }
    try {
        const user = await User.findOne({ email });
        if (!user || !(await user.comparePassword(password))) {
            return res
                .status(400)
                .json({ message: "Invalid email or password" });
        }

        res.status(200).json({
            id: user._id,
            user,
            token: generateToken(user._id),
        });
    } catch (error) {
        res.status(500).json({
            message: "Error logging in",
            error: error.message,
        });
    }
};

// Get User Info
exports.getUserInfo = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({
            message: "Error fetching user info",
            error: error.message,
        });
    }
};

// Update User Profile
exports.updateUserProfile = async (req, res) => {
    const { fullName, currentPassword, newPassword, profileImageUrl } =
        req.body;

    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // If user wants to update password, verify current password
        if (newPassword) {
            if (!currentPassword) {
                return res.status(400).json({
                    message: "Current password is required to set new password",
                });
            }

            const isCurrentPasswordValid = await user.comparePassword(
                currentPassword
            );
            if (!isCurrentPasswordValid) {
                return res.status(400).json({
                    message: "Current password is incorrect",
                });
            }

            user.password = newPassword;
        }

        // Update other fields if provided
        if (fullName) {
            user.fullName = fullName;
        }

        if (profileImageUrl !== undefined) {
            user.profileImageUrl = profileImageUrl;
        }

        // Save the updated user
        await user.save();

        // Return updated user without password
        const updatedUser = await User.findById(user._id).select("-password");

        res.status(200).json({
            message: "Profile updated successfully",
            user: updatedUser,
        });
    } catch (error) {
        res.status(500).json({
            message: "Error updating profile",
            error: error.message,
        });
    }
};
