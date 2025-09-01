import express from 'express';
import User from '../models/User.js';
import LoginRecord from '../models/LoginRecord.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Create new employee
router.post('/create-employee', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, email, password, employeeId, department } = req.body;

    // Validation
    if (!name || !email || !password || !employeeId || !department) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Check if email or employeeId already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { employeeId }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email or Employee ID already exists'
      });
    }

    // Create employee
    const employee = new User({
      name,
      email,
      password,
      employeeId,
      department,
      role: 'employee'
    });

    await employee.save();

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      employee: {
        id: employee._id,
        name: employee.name,
        email: employee.email,
        employeeId: employee.employeeId,
        department: employee.department
      }
    });
  } catch (error) {
    console.error('Create employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get all employees
router.get('/employees', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const skip = (page - 1) * limit;

    const searchQuery = search ? {
      role: 'employee',
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } }
      ]
    } : { role: 'employee' };

    const employees = await User.find(searchQuery)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalEmployees = await User.countDocuments(searchQuery);
    const totalPages = Math.ceil(totalEmployees / limit);

    res.json({
      success: true,
      employees,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalRecords: totalEmployees,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get all login records
router.get('/login-records', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', startDate = '', endDate = '' } = req.query;
    const skip = (page - 1) * limit;

    let dateQuery = {};
    if (startDate && endDate) {
      dateQuery.loginDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate + 'T23:59:59.999Z')
      };
    } else if (startDate) {
      dateQuery.loginDate = { $gte: new Date(startDate) };
    } else if (endDate) {
      dateQuery.loginDate = { $lte: new Date(endDate + 'T23:59:59.999Z') };
    }

    let searchQuery = { ...dateQuery };
    if (search) {
      searchQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } }
      ];
    }

    const loginRecords = await LoginRecord.find(searchQuery)
      .sort({ loginDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalRecords = await LoginRecord.countDocuments(searchQuery);
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
    console.error('Get login records error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Update employee status (activate/deactivate)
router.patch('/employee/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const employee = await User.findOneAndUpdate(
      { _id: id, role: 'employee' },
      { isActive },
      { new: true }
    ).select('-password');

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.json({
      success: true,
      message: `Employee ${isActive ? 'activated' : 'deactivated'} successfully`,
      employee
    });
  } catch (error) {
    console.error('Update employee status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Delete employee
router.delete('/employee/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await User.findOneAndDelete({ _id: id, role: 'employee' });
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Also delete their login records
    await LoginRecord.deleteMany({ userId: id });

    res.json({
      success: true,
      message: 'Employee deleted successfully'
    });
  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Dashboard stats
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const totalEmployees = await User.countDocuments({ role: 'employee' });
    const activeEmployees = await User.countDocuments({ role: 'employee', isActive: true });
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayLogins = await LoginRecord.countDocuments({
      loginDate: { $gte: today }
    });

    const thisWeek = new Date();
    thisWeek.setDate(thisWeek.getDate() - 7);
    const weeklyLogins = await LoginRecord.countDocuments({
      loginDate: { $gte: thisWeek }
    });

    res.json({
      success: true,
      stats: {
        totalEmployees,
        activeEmployees,
        todayLogins,
        weeklyLogins
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

export default router;