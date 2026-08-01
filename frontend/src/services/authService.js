import { firebaseAuth } from './firebaseService';

const toAuthResult = async (credential) => {
  const user = credential.user;
  return {
    user: {
      id: user.uid,
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
    },
    access_token: await user.getIdToken(),
  };
};

export const authService = {
  async signup(email, password) {
    return toAuthResult(await firebaseAuth.signup(email, password));
  },

  async login(email, password) {
    return toAuthResult(await firebaseAuth.login(email, password));
  },

  async loginWithGoogle() {
    try {
      return await toAuthResult(await firebaseAuth.loginWithGoogle());
    } catch (err) {
      if (err?.code === 'auth/popup-closed-by-user') {
        throw new Error('Google sign-in was cancelled');
      }
      if (err?.code === 'auth/popup-blocked') {
        throw new Error('Popup blocked. Allow popups for this site and try again.');
      }
      if (err?.code === 'auth/unauthorized-domain') {
        const host = window.location.hostname;
        throw new Error(
          `Domain "${host}" is not authorized. In Firebase Console → Authentication → Settings → Authorized domains, add exactly: ${host} (no http:// or port). Also add http://${host}:5173 under Google Cloud → APIs & Services → Credentials → your Web client → Authorized JavaScript origins.`,
        );
      }
      throw new Error(err?.message || 'Google sign-in failed');
    }
  },

  async logout() {
    await firebaseAuth.logout();
  },

  async getCurrentUser() {
    return firebaseAuth.waitForUser();
  },

  async getSession() {
    const user = await firebaseAuth.waitForUser();
    if (!user) return null;
    const access_token = await firebaseAuth.getIdToken();
    return { user, access_token };
  },

  onAuthStateChanged(callback) {
    return firebaseAuth.onAuthStateChanged(callback);
  },

  async getIdToken() {
    await firebaseAuth.waitForUser();
    return firebaseAuth.getIdToken();
  },

  async resetPassword(email) {
    await firebaseAuth.resetPassword(email);
  },

  async confirmPasswordReset(oobCode, newPassword) {
    await firebaseAuth.confirmPasswordReset(oobCode, newPassword);
  },

  async updatePassword(password) {
    await firebaseAuth.updatePassword(password);
  },
};
