const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

// All admin routes require BOTH valid JWT authentication AND ADMIN role
router.use(authenticate, authorize('ADMIN'));

router.get('/users', adminController.getAllUsers);
router.patch('/users/:id/role', adminController.updateUserRole);
router.delete('/users/:id', adminController.deleteUser);
router.get('/activity', adminController.getActivityStats);
router.post('/clean-databases', adminController.clearDatabases);


module.exports = router;
