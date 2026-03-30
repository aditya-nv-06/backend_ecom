const { User } = require('../models');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const messages = require('../constants/messages');

/**
 * Get all users
 * GET /api/users
 */
const getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.findAll({
    order: [['createdAt', 'DESC']]
  });

  res.status(200).json({
    status: 'success',
    results: users.length,
    data: {
      users
    }
  });
});

/**
 * Get a single user
 * GET /api/users/:id
 */
const getUserById = catchAsync(async (req, res, next) => {
  const user = await User.findByPk(req.params.id);

  if (!user) {
    return next(new AppError(messages.ERROR.USER_NOT_FOUND, 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      user
    }
  });
});

/**
 * Update user profile
 * PATCH /api/users/profile
 */
const updateProfile = catchAsync(async (req, res, next) => {
  const { name, email } = req.body;
  const user = req.user;

  // Check if email is being changed and if it already exists
  if (email && email !== user.email) {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return next(new AppError(messages.ERROR.EMAIL_EXISTS, 400));
    }
  }

  // Update user
  await user.update({
    name: name || user.name,
    email: email || user.email
  });

  res.status(200).json({
    status: 'success',
    message: messages.SUCCESS.PROFILE_UPDATED,
    data: {
      user
    }
  });
});

/**
 * Delete a user
 * DELETE /api/users/:id
 */
const deleteUser = catchAsync(async (req, res, next) => {
  const user = await User.findByPk(req.params.id);

  if (!user) {
    return next(new AppError(messages.ERROR.USER_NOT_FOUND, 404));
  }

  await user.destroy();

  res.status(204).json({
    status: 'success',
    data: null
  });
});

module.exports = {
  getAllUsers,
  getUserById,
  updateProfile,
  deleteUser
};
