const { UserGroup, User } = require('../models/User');

/**
 * Create a new user group
 */
exports.createUserGroup = async (req, res) => {
  try {
    const { name, description, permissions } = req.body;

    // Check if the group name already exists
    const existingGroup = await UserGroup.findOne({ name });
    if (existingGroup) {
      return res.status(400).json({
        success: false,
        message: 'User group name already exists'
      });
    }

    // Validate permissions format
    if (permissions && !Array.isArray(permissions)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid permissions format'
      });
    }

    // Validate permissions data
    if (permissions) {
      for (const permission of permissions) {
        if (!permission.resource || !permission.actions || !Array.isArray(permission.actions)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid permissions format'
          });
        }

        // Validate enum for resource and actions
        const validResources = ['car', 'parkingSpot', 'parkingLot', 'user', 'userGroup', 'parkingRequest', 'payment'];
        const validActions = ['create', 'read', 'update', 'delete'];

        if (!validResources.includes(permission.resource)) {
          return res.status(400).json({
            success: false,
            message: `Invalid resource: ${permission.resource}`
          });
        }

        for (const action of permission.actions) {
          if (!validActions.includes(action)) {
            return res.status(400).json({
              success: false,
              message: `Invalid action: ${action}`
            });
          }
        }
      }
    }

    // Create a new user group
    const newUserGroup = new UserGroup({
      name,
      description,
      permissions: permissions || []
    });

    await newUserGroup.save();

    res.status(201).json({
      success: true,
      message: 'User group created successfully',
      data: newUserGroup
    });
  } catch (error) {
    console.error('Error creating user group:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * Get all user groups
 */
exports.getAllUserGroups = async (req, res) => {
  try {
    const userGroups = await UserGroup.find({ isActive: true });

    res.status(200).json({
      success: true,
      count: userGroups.length,
      data: userGroups
    });
  } catch (error) {
    console.error('Error fetching user groups:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * Get details of a user group
 */
exports.getUserGroupById = async (req, res) => {
  try {
    const userGroup = await UserGroup.findById(req.params.id);

    if (!userGroup || !userGroup.isActive) {
      return res.status(404).json({
        success: false,
        message: 'User group not found'
      });
    }

    res.status(200).json({
      success: true,
      data: userGroup
    });
  } catch (error) {
    console.error('Error fetching user group details:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * Update a user group
 */
exports.updateUserGroup = async (req, res) => {
  try {
    const { name, description, permissions, isActive } = req.body;
    const updateData = {};

    // Update only provided fields
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (permissions !== undefined) updateData.permissions = permissions;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Update timestamp
    updateData.updatedAt = Date.now();

    // Find and update the user group
    const userGroup = await UserGroup.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!userGroup) {
      return res.status(404).json({
        success: false,
        message: 'User group not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User group updated successfully',
      data: userGroup
    });
  } catch (error) {
    console.error('Error updating user group:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * Delete a user group (soft delete)
 */
exports.deleteUserGroup = async (req, res) => {
  try {
    // Mark as inactive instead of deleting
    const userGroup = await UserGroup.findByIdAndUpdate(
      req.params.id,
      { isActive: false, updatedAt: Date.now() },
      { new: true }
    );

    if (!userGroup) {
      return res.status(404).json({
        success: false,
        message: 'User group not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User group deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user group:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * Assign a user to a group
 */
exports.assignUserToGroup = async (req, res) => {
  try {
    const { userId, groupId } = req.body;

    // Check if user and group exist
    const user = await User.findById(userId);
    const userGroup = await UserGroup.findById(groupId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!userGroup || !userGroup.isActive) {
      return res.status(404).json({
        success: false,
        message: 'User group not found'
      });
    }

    // Check if user is already in the group
    if (user.userGroups.includes(groupId)) {
      return res.status(400).json({
        success: false,
        message: 'User is already in this group'
      });
    }

    // Add user to the group
    user.userGroups.push(groupId);
    user.updatedAt = Date.now();
    await user.save();

    res.status(200).json({
      success: true,
      message: 'User assigned to group successfully',
      data: {
        user: {
          _id: user._id,
          username: user.username,
          fullName: user.fullName,
          userGroups: user.userGroups
        },
        userGroup: {
          _id: userGroup._id,
          name: userGroup.name
        }
      }
    });
  } catch (error) {
    console.error('Error assigning user to group:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * Remove a user from a group
 */
exports.removeUserFromGroup = async (req, res) => {
  try {
    const { userId, groupId } = req.body;

    // Check if user exists
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is in the group
    if (!user.userGroups.includes(groupId)) {
      return res.status(400).json({
        success: false,
        message: 'User is not in this group'
      });
    }

    // Remove user from the group
    user.userGroups = user.userGroups.filter(
      group => group.toString() !== groupId.toString()
    );
    user.updatedAt = Date.now();
    await user.save();

    res.status(200).json({
      success: true,
      message: 'User removed from group successfully',
      data: {
        user: {
          _id: user._id,
          username: user.username,
          fullName: user.fullName,
          userGroups: user.userGroups
        }
      }
    });
  } catch (error) {
    console.error('Error removing user from group:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * Get all users in a group
 */
exports.getUsersInGroup = async (req, res) => {
  try {
    const groupId = req.params.groupId;

    // Check if group exists
    const userGroup = await UserGroup.findById(groupId);
    if (!userGroup || !userGroup.isActive) {
      return res.status(404).json({
        success: false,
        message: 'User group not found'
      });
    }

    // Find all users in the group
    const users = await User.find({
      userGroups: groupId,
      isActive: true
    }).select('_id username fullName email');

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('Error fetching users in group:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * Get all groups of a user
 */
exports.getGroupsOfUser = async (req, res) => {
  try {
    const userId = req.params.userId;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user || !user.isActive) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Find all groups the user belongs to
    const userGroups = await UserGroup.find({
      _id: { $in: user.userGroups },
      isActive: true
    });

    res.status(200).json({
      success: true,
      count: userGroups.length,
      data: userGroups
    });
  } catch (error) {
    console.error('Error fetching user groups:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * Assign multiple users to a group
 */
exports.assignMultipleUsersToGroup = async (req, res) => {
  try {
    const { userIds, groupId } = req.body;

    if (!Array.isArray(userIds)) {
      return res.status(400).json({
        success: false,
        message: 'userIds must be an array'
      });
    }

    // Check if group exists
    const userGroup = await UserGroup.findById(groupId);
    if (!userGroup || !userGroup.isActive) {
      return res.status(404).json({
        success: false,
        message: 'User group not found'
      });
    }

    // Assign each user to the group
    const results = {
      success: [],
      failed: []
    };

    for (const userId of userIds) {
      try {
        // Find user
        const user = await User.findById(userId);
        if (!user || !user.isActive) {
          results.failed.push({
            userId,
            reason: 'User not found'
          });
          continue;
        }

        // Check if user is already in the group
        if (user.userGroups.includes(groupId)) {
          results.failed.push({
            userId,
            username: user.username,
            reason: 'User is already in this group'
          });
          continue;
        }

        // Add user to the group
        user.userGroups.push(groupId);
        user.updatedAt = Date.now();
        await user.save();

        results.success.push({
          userId,
          username: user.username,
          fullName: user.fullName
        });
      } catch (error) {
        console.error(`Error assigning user ${userId} to group:`, error);
        results.failed.push({
          userId,
          reason: 'Processing error'
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Completed assigning users to group',
      data: {
        groupId,
        groupName: userGroup.name,
        results
      }
    });
  } catch (error) {
    console.error('Error assigning multiple users to group:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};