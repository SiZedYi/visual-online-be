const express = require('express');
const router = express.Router();
const userGroupController = require('../controllers/userGroupController');
const { authenticate, authorize } = require('../controllers/userController'); // Ensure correct path to userController

// Route to create a new user group
router.post(
  '/',
  authenticate,
  authorize('userGroup', 'create'),
  userGroupController.createUserGroup
);

// Route to get all user groups
router.get(
  '/',
  authenticate,
  authorize('userGroup', 'read'),
  userGroupController.getAllUserGroups
);

// Route to get details of a specific user group
router.get(
  '/:id',
  authenticate,
  authorize('userGroup', 'read'),
  userGroupController.getUserGroupById
);

// Route to update a user group
router.put(
  '/:id',
  authenticate,
  authorize('userGroup', 'update'),
  userGroupController.updateUserGroup
);

// Route to delete a user group (soft delete)
router.delete(
  '/:id',
  authenticate,
  authorize('userGroup', 'delete'),
  userGroupController.deleteUserGroup
);

// Route to assign a user to a group
router.post(
  '/assign',
  authenticate,
  authorize('userGroup', 'update'),
  userGroupController.assignUserToGroup
);

// Route to remove a user from a group
router.post(
  '/remove',
  authenticate,
  authorize('userGroup', 'update'),
  userGroupController.removeUserFromGroup
);

// Route to get all users in a specific group
router.get(
  '/:groupId/users',
  authenticate,
  authorize('userGroup', 'read'),
  userGroupController.getUsersInGroup
);

// Route to get all groups of a specific user
router.get(
  '/user/:userId',
  authenticate,
  authorize('userGroup', 'read'),
  userGroupController.getGroupsOfUser
);

// Route to assign multiple users to a group
router.post(
  '/assign-multiple',
  authenticate,
  authorize('userGroup', 'update'),
  userGroupController.assignMultipleUsersToGroup
);

module.exports = router;