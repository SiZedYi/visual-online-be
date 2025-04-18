function extractPermissions(groups) {
    const permissionMap = {};
  
    groups.forEach(group => {
      group.permissions.forEach(({ resource, actions }) => {
        if (!permissionMap[resource]) {
          permissionMap[resource] = new Set();
        }
        actions.forEach(action => permissionMap[resource].add(action));
      });
    });
  
    // Convert sets to arrays
    const result = {};
    for (const [resource, actionsSet] of Object.entries(permissionMap)) {
      result[resource] = Array.from(actionsSet);
    }
  
    return result;
}

module.exports = extractPermissions;