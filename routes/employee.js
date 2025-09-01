import express from 'express';
import multer from 'multer';
import LoginRecord from '../models/LoginRecord.js';
import { authenticateToken, requireEmployee } from '../middleware/auth.js';
import { uploadToCloudinary } from '../config/cloudinary.js';

const router = express.Router();

// Configure multer for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Check if user already logged in today
router.get('/check-login-status', authenticateToken, requireEmployee, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const existingLogin = await LoginRecord.findOne({
      userId: req.user._id,
      loginDate: { $gte: today }
    });

    res.json({
      success: true,
      hasLoggedInToday: !!existingLogin,
      loginRecord: existingLogin
    });
  } catch (error) {
    console.error('Check login status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Employee login with photo
router.post('/login-with-photo', authenticateToken, requireEmployee, upload.single('photo'), async (req, res) => {
  try {
    // Check if already logged in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const existingLogin = await LoginRecord.findOne({
      userId: req.user._id,
      loginDate: { $gte: today }
    });

    if (existingLogin) {
      return res.status(400).json({
        success: false,
        message: 'You have already logged in today'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Photo is required'
      });
    }

    // Get location data if provided
    const { latitude, longitude, accuracy } = req.body;
    const location = (latitude && longitude) ? {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      accuracy: accuracy ? parseFloat(accuracy) : null
    } : null;

    // Upload photo to Cloudinary
    const uploadResult = await uploadToCloudinary(req.file.buffer, {
      public_id: `employee-${req.user.employeeId}-${Date.now()}`
    });

    if (!uploadResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to upload photo'
      });
    }

    // Create login record
    const loginRecord = new LoginRecord({
      userId: req.user._id,
      name: req.user.name,
      email: req.user.email,
      employeeId: req.user.employeeId,
      department: req.user.department,
      photoUrl: uploadResult.url,
      cloudinaryPublicId: uploadResult.publicId,
      location
    });

    await loginRecord.save();

    res.json({
      success: true,
      message: 'Login recorded successfully',
      loginRecord: {
        id: loginRecord._id,
        loginDate: loginRecord.loginDate,
        photoUrl: loginRecord.photoUrl
      }
    });
  } catch (error) {
    console.error('Login with photo error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get employee's login history
router.get('/login-history', authenticateToken, requireEmployee, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const loginRecords = await LoginRecord.find({ userId: req.user._id })
      .sort({ loginDate: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('loginDate photoUrl location');

    const totalRecords = await LoginRecord.countDocuments({ userId: req.user._id });
    const totalPages = Math.ceil(totalRecords / limit);

    res.json({
      success: true,
      loginRecords,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalRecords,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Get login history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

export default router;