import { userService } from './userService';
import { profileStore } from './profileStore';

/** Fetch MySQL profile or create one for the Firebase user. */
export async function ensureUserProfile(firebaseUser) {
  try {
    const userProfile = await userService.getUserByFirebaseUid(firebaseUser.id);
    profileStore.setProfile(userProfile);
    return userProfile;
  } catch {
    const created = await userService.createUser({
      firebase_uid: firebaseUser.id,
      email: firebaseUser.email,
      full_name: firebaseUser.displayName || undefined,
    });
    profileStore.setProfile(created);
    return created;
  }
}
