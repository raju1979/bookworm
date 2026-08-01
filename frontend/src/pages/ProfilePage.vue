<template>
  <div class="profile-page">
    <div class="profile-card">
      <h2>My Profile</h2>

      <form @submit.prevent="saveProfile" class="profile-form">
        <div v-if="error" class="error-message">{{ error }}</div>

        <div class="form-group">
          <label>Full Name</label>
          <input
            v-model="form.fullName"
            type="text"
            placeholder="Enter your full name"
            :disabled="loading"
          />
        </div>

        <div class="form-group">
          <label>Bio</label>
          <textarea
            v-model="form.bio"
            placeholder="Tell us about yourself"
            rows="3"
            :disabled="loading"
          ></textarea>
        </div>

        <div class="form-group">
          <label>City</label>
          <input
            v-model="form.city"
            type="text"
            placeholder="Enter your city"
            :disabled="loading"
          />
        </div>

        <div class="form-group">
          <label>Favorite Genre</label>
          <input
            v-model="form.favoriteGenre"
            type="text"
            placeholder="e.g., Fiction, Mystery, Science"
            :disabled="loading"
          />
        </div>

        <button type="submit" class="btn-primary" :disabled="loading">
          <span v-if="loading">⏳ Saving...</span>
          <span v-else>💾 Save Profile</span>
        </button>
      </form>

      <button @click="logout" class="btn-logout">Logout</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { authService } from '../services/authService';
import { userService } from '../services/userService';
import { profileStore } from '../services/profileStore';

const router = useRouter();
const userEmail = ref('');
const userId = ref(null);
const firebaseUid = ref(null);
const loading = ref(false);
const error = ref('');
const form = ref({
  fullName: '',
  bio: '',
  city: '',
  favoriteGenre: '',
});

onMounted(async () => {
  try {
    const user = await authService.getCurrentUser();
    if (user) {
      userEmail.value = user.email;
      firebaseUid.value = user.id;

      // Try to get cached profile from store first
      let dbUser = profileStore.getProfile();

      if (!dbUser) {
        // If not cached, fetch from backend
        try {
          dbUser = await userService.getUserByFirebaseUid(user.id);
          profileStore.setProfile(dbUser);
        } catch (err) {
          // User not in database yet, that's fine
          console.log('User not found in database:', err.message);
        }
      }

      // Populate form with profile data
      if (dbUser) {
        userId.value = dbUser.id;
        form.value = {
          fullName: dbUser.full_name || '',
          bio: dbUser.bio || '',
          city: dbUser.city || '',
          favoriteGenre: dbUser.favorite_genre || '',
        };
      }
    }
  } catch (err) {
    console.error('Failed to load profile:', err);
  }
});

const saveProfile = async () => {
  loading.value = true;
  error.value = '';

  try {
    if (!firebaseUid.value) {
      throw new Error('No authenticated user');
    }

    const profileData = {
      fullName: form.value.fullName,
      bio: form.value.bio,
      city: form.value.city,
      favoriteGenre: form.value.favoriteGenre,
    };

    // Update profile (backend will get userId from token)
    if (userId.value) {
      await userService.updateUser(profileData);
      console.log('Profile updated successfully');

      // Update cached profile
      const updatedProfile = profileStore.getProfile();
      if (updatedProfile) {
        updatedProfile.full_name = profileData.fullName;
        updatedProfile.bio = profileData.bio;
        updatedProfile.city = profileData.city;
        updatedProfile.favorite_genre = profileData.favoriteGenre;
        profileStore.setProfile(updatedProfile);
      }

      alert('✅ Profile saved successfully!');
    } else {
      // Create new user in database
      const createData = {
        firebase_uid: firebaseUid.value,
        email: userEmail.value,
        full_name: profileData.fullName,
        bio: profileData.bio,
        city: profileData.city,
        favorite_genre: profileData.favoriteGenre,
      };
      const newUser = await userService.createUser(createData);
      userId.value = newUser.id;
      console.log('Profile created successfully');

      // Store new profile in cache
      profileStore.setProfile(newUser);

      alert('✅ Profile created successfully!');
    }
  } catch (err) {
    console.error('Failed to save profile:', err);
    error.value = err.message || 'Failed to save profile';
    alert('❌ Error: ' + error.value);
  } finally {
    loading.value = false;
  }
};

const logout = async () => {
  await authService.logout();
  router.push('/login');
};
</script>

<style scoped>
.profile-page {
  padding: 16px;
  padding-bottom: 100px;
}

.profile-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
}

.profile-card h2 {
  font-size: 22px;
  color: #333;
  margin-bottom: 20px;
}

.profile-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.error-message {
  background-color: #ffebee;
  color: #c62828;
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 10px;
  border-left: 4px solid #c62828;
  font-size: 14px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-size: 14px;
  color: #666;
  margin-bottom: 5px;
  font-weight: 500;
}

.form-group input,
.form-group textarea {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  font-family: inherit;
}

.form-group input:focus,
.form-group textarea:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-group input:disabled,
.form-group textarea:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
  opacity: 0.6;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.3s;
  margin-top: 10px;
}

.btn-primary:active {
  opacity: 0.9;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-logout {
  width: 100%;
  background-color: #ff5252;
  color: white;
  border: none;
  padding: 12px;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.3s;
  margin-top: 20px;
}

.btn-logout:active {
  opacity: 0.8;
}
</style>
