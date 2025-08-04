const fs = require('fs');
const path = require('path');

// Cache for JSON data to avoid repeated file reads
let managersCache = null;
let hrCache = null;
let lastManagersLoad = 0;
let lastHRLoad = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

/**
 * Load and cache managers data from JSON file
 * @returns {Array} Array of manager objects
 */
const loadManagersData = () => {
  const now = Date.now();
  
  // Return cached data if it's still valid
  if (managersCache && (now - lastManagersLoad) < CACHE_DURATION) {
    return managersCache;
  }
  
  try {
    const managersPath = path.join(__dirname, '../data/managers.json');
    const managersData = fs.readFileSync(managersPath, 'utf8');
    const parsedData = JSON.parse(managersData);
    
    managersCache = parsedData.managers || [];
    lastManagersLoad = now;
    
    console.log(`📋 Loaded ${managersCache.length} managers from JSON`);
    return managersCache;
  } catch (error) {
    console.error('Error loading managers data:', error);
    return [];
  }
};

/**
 * Load and cache HR data from JSON file
 * @returns {Array} Array of HR objects
 */
const loadHRData = () => {
  const now = Date.now();
  
  // Return cached data if it's still valid
  if (hrCache && (now - lastHRLoad) < CACHE_DURATION) {
    return hrCache;
  }
  
  try {
    const hrPath = path.join(__dirname, '../data/hr.json');
    const hrData = fs.readFileSync(hrPath, 'utf8');
    const parsedData = JSON.parse(hrData);
    
    hrCache = parsedData.hr || [];
    lastHRLoad = now;
    
    console.log(`👥 Loaded ${hrCache.length} HR personnel from JSON`);
    return hrCache;
  } catch (error) {
    console.error('Error loading HR data:', error);
    return [];
  }
};

/**
 * Find manager by email in JSON data
 * @param {string} email - Manager email to search for
 * @returns {Object|null} Manager object or null if not found
 */
const findManagerByEmail = (email) => {
  const managers = loadManagersData();
  return managers.find(manager => 
    manager.email.toLowerCase() === email.toLowerCase()
  ) || null;
};

/**
 * Find manager by employee ID in JSON data
 * @param {string} employeeId - Manager employee ID to search for
 * @returns {Object|null} Manager object or null if not found
 */
const findManagerByEmployeeId = (employeeId) => {
  const managers = loadManagersData();
  return managers.find(manager => 
    manager.employeeId === employeeId
  ) || null;
};

/**
 * Find HR by email in JSON data
 * @param {string} email - HR email to search for
 * @returns {Object|null} HR object or null if not found
 */
const findHRByEmail = (email) => {
  const hrPersonnel = loadHRData();
  return hrPersonnel.find(hr => 
    hr.email.toLowerCase() === email.toLowerCase()
  ) || null;
};

/**
 * Find HR by employee ID in JSON data
 * @param {string} employeeId - HR employee ID to search for
 * @returns {Object|null} HR object or null if not found
 */
const findHRByEmployeeId = (employeeId) => {
  const hrPersonnel = loadHRData();
  return hrPersonnel.find(hr => 
    hr.employeeId === employeeId
  ) || null;
};

/**
 * Validate if a user is authorized for a specific role
 * @param {string} role - Role to validate (manager/hr)
 * @param {string} email - User email
 * @param {string} employeeId - User employee ID
 * @returns {Object} Validation result with authorized flag and user data
 */
const validateRoleAuthorization = (role, email, employeeId) => {
  let authorizedUser = null;
  
  if (role === 'manager') {
    authorizedUser = findManagerByEmail(email) || findManagerByEmployeeId(employeeId);
  } else if (role === 'hr') {
    authorizedUser = findHRByEmail(email) || findHRByEmployeeId(employeeId);
  }
  
  return {
    authorized: !!authorizedUser,
    userData: authorizedUser
  };
};

/**
 * Get all managers for dropdown/selection purposes
 * @returns {Array} Array of manager objects formatted for UI
 */
const getAllManagers = () => {
  const managers = loadManagersData();
  return managers.map(manager => ({
    _id: manager.employeeId, // Use employeeId as unique identifier
    name: manager.name,
    email: manager.email,
    employeeId: manager.employeeId,
    role: manager.role,
    team: manager.team || null,
    department: manager.department || null
  }));
};

/**
 * Get all HR personnel for dropdown/selection purposes
 * @returns {Array} Array of HR objects formatted for UI
 */
const getAllHR = () => {
  const hrPersonnel = loadHRData();
  return hrPersonnel.map(hr => ({
    _id: hr.employeeId, // Use employeeId as unique identifier
    name: hr.name,
    email: hr.email,
    employeeId: hr.employeeId,
    role: hr.role,
    department: hr.department || 'Human Resources'
  }));
};

/**
 * Search managers by name, email, team, or department
 * @param {string} searchTerm - Term to search for
 * @returns {Array} Array of matching manager objects
 */
const searchManagers = (searchTerm) => {
  const managers = getAllManagers();
  
  if (!searchTerm || !searchTerm.trim()) {
    return managers;
  }
  
  const searchLower = searchTerm.toLowerCase();
  return managers.filter(manager => 
    manager.name.toLowerCase().includes(searchLower) ||
    manager.email.toLowerCase().includes(searchLower) ||
    (manager.team && manager.team.toLowerCase().includes(searchLower)) ||
    (manager.department && manager.department.toLowerCase().includes(searchLower)) ||
    manager.employeeId.toLowerCase().includes(searchLower)
  );
};

/**
 * Clear cache - useful for testing or when JSON files are updated
 */
const clearCache = () => {
  managersCache = null;
  hrCache = null;
  lastManagersLoad = 0;
  lastHRLoad = 0;
  console.log('📝 JSON data cache cleared');
};

module.exports = {
  loadManagersData,
  loadHRData,
  findManagerByEmail,
  findManagerByEmployeeId,
  findHRByEmail,
  findHRByEmployeeId,
  validateRoleAuthorization,
  getAllManagers,
  getAllHR,
  searchManagers,
  clearCache
};