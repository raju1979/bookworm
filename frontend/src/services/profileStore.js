// Simple session storage manager for user profile
export const profileStore = {
  // Get user profile from session storage
  getProfile() {
    const profile = sessionStorage.getItem('userProfile');
    return profile ? JSON.parse(profile) : null;
  },

  // Set user profile in session storage
  setProfile(profile) {
    sessionStorage.setItem('userProfile', JSON.stringify(profile));
  },

  // Clear user profile from session storage
  clearProfile() {
    sessionStorage.removeItem('userProfile');
  },

  // Get a specific field from user profile
  getField(fieldName) {
    const profile = this.getProfile();
    return profile ? profile[fieldName] : null;
  },
};
