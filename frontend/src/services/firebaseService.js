import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  confirmPasswordReset,
  updatePassword,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyBaMUVhLdKujJY66RQdNetFwq6tKY5RHps',
  authDomain: 'bookworm-6c9ec.firebaseapp.com',
  projectId: 'bookworm-6c9ec',
  storageBucket: 'bookworm-6c9ec.firebasestorage.app',
  messagingSenderId: '1010965935778',
  appId: '1:1010965935778:web:2c3d867c5d1bf7a8ea09fb',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
googleProvider.addScope('email');
googleProvider.addScope('profile');

const normalizeUser = (user) => {
  if (!user) return null;
  return {
    id: user.uid,
    uid: user.uid,
    email: user.email,
    emailVerified: user.emailVerified,
    displayName: user.displayName,
    photoURL: user.photoURL,
  };
};

export const firebaseAuth = {
  auth,

  signup(email, password) {
    return createUserWithEmailAndPassword(auth, email, password);
  },

  login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  },

  async loginWithGoogle() {
    return signInWithPopup(auth, googleProvider);
  },

  logout() {
    return signOut(auth);
  },

  getCurrentUser() {
    return normalizeUser(auth.currentUser);
  },

  waitForUser() {
    return new Promise((resolve) => {
      const unsub = onAuthStateChanged(auth, (user) => {
        unsub();
        resolve(normalizeUser(user));
      });
    });
  },

  onAuthStateChanged(callback) {
    return onAuthStateChanged(auth, (user) => callback(normalizeUser(user)));
  },

  async getIdToken() {
    const user = auth.currentUser;
    if (!user) return null;
    return user.getIdToken();
  },

  async resetPassword(email) {
    const appUrl = (import.meta.env.VITE_APP_URL || window.location.origin).replace(/\/$/, '');
    await sendPasswordResetEmail(auth, email, {
      url: `${appUrl}/reset-password`,
      handleCodeInApp: false,
    });
  },

  async confirmPasswordReset(oobCode, newPassword) {
    await confirmPasswordReset(auth, oobCode, newPassword);
  },

  async updatePassword(newPassword) {
    const user = auth.currentUser;
    if (!user) throw new Error('No authenticated user');
    await updatePassword(user, newPassword);
  },
};

export { auth };
