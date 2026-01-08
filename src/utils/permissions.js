import { USER_ROLES } from '../constants';

/**
 * Check if user can edit a profile
 * @param {object} currentUser - Current logged in user
 * @param {object} targetUser - User whose profile is being viewed/edited
 * @returns {boolean} Whether user can edit the profile
 */
export const canEditProfile = (currentUser, targetUser) => {
  if (!currentUser || !targetUser) return false;

  const currentRole = currentUser.role;
  const targetUserId = targetUser.id;
  const currentUserId = currentUser.id;

  // Admin can edit all profiles
  if (currentRole === USER_ROLES.ADMIN) {
    return true;
  }

  // User can always edit their own profile
  if (currentUserId === targetUserId) {
    return true;
  }

  // Sale/Staff can edit profiles of students assigned to them
  if (currentRole === USER_ROLES.SALE || currentRole === USER_ROLES.STAFF) {
    // Cần call đến BE để check xem học viên có được phân công cho sale/staff này không
    // For now, we'll assume BE will handle this check
    // In FE, we just allow if target is a student
    return targetUser.role === USER_ROLES.STUDENT;
  }

  // Instructor and Student can only edit their own profile
  return false;
};

/**
 * Check if user can view a profile
 * @param {object} currentUser - Current logged in user
 * @param {object} targetUser - User whose profile is being viewed
 * @returns {boolean} Whether user can view the profile
 */
export const canViewProfile = (currentUser, targetUser) => {
  if (!currentUser || !targetUser) return false;

  const currentRole = currentUser.role;
  const targetUserId = targetUser.id;
  const currentUserId = currentUser.id;

  // Admin can view all profiles
  if (currentRole === USER_ROLES.ADMIN) {
    return true;
  }

  // User can always view their own profile
  if (currentUserId === targetUserId) {
    return true;
  }

  // Sale/Staff can view profiles of students assigned to them
  if (currentRole === USER_ROLES.SALE || currentRole === USER_ROLES.STAFF) {
    return targetUser.role === USER_ROLES.STUDENT;
  }

  // Instructor can view profiles of their students
  if (currentRole === USER_ROLES.INSTRUCTOR) {
    // Cần call đến BE để check xem học viên có học với instructor này không
    return targetUser.role === USER_ROLES.STUDENT;
  }

  // Student can only view their own profile
  return false;
};

/**
 * Check if user has a specific role
 * @param {object} user - User object
 * @param {string} role - Role to check
 * @returns {boolean}
 */
export const hasRole = (user, role) => {
  return user?.role === role;
};

/**
 * Check if user has any of the specified roles
 * @param {object} user - User object
 * @param {string[]} roles - Roles to check
 * @returns {boolean}
 */
export const hasAnyRole = (user, roles) => {
  return roles.includes(user?.role);
};

