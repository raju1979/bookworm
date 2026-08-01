<template>
  <div class="signup-container">
    <div class="signup-card">
      <h1 class="logo">📚 Bookworm</h1>
      <h2>Create Account</h2>

      <div v-if="error" class="error-message">{{ error }}</div>

      <button
        type="button"
        class="btn-google"
        :disabled="googleLoading"
        @click="handleGoogleSignup"
      >
        <span v-if="googleLoading">Connecting...</span>
        <span v-else>Continue with Google</span>
      </button>

      <p class="login-link">
        Already have an account? <a @click="$router.push('/login')">Login</a>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { authService } from '../services/authService';
import { ensureUserProfile } from '../services/ensureUserProfile';

const router = useRouter();
const error = ref('');
const googleLoading = ref(false);

const handleGoogleSignup = async () => {
  googleLoading.value = true;
  error.value = '';
  try {
    const result = await authService.loginWithGoogle();
    try {
      await ensureUserProfile(result.user);
    } catch (profileErr) {
      console.log('ℹ️ Profile sync skipped:', profileErr.message);
    }
    router.push('/app');
  } catch (err) {
    error.value = err.message;
  } finally {
    googleLoading.value = false;
  }
};
</script>

<style scoped>
.signup-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.signup-card {
  background: white;
  border-radius: 12px;
  padding: 40px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.logo {
  text-align: center;
  font-size: 32px;
  margin-bottom: 10px;
}

h2 {
  text-align: center;
  color: #333;
  margin-bottom: 30px;
  font-size: 24px;
}

.error-message {
  background-color: #ffebee;
  color: #c62828;
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 16px;
  border-left: 4px solid #c62828;
}

.btn-google {
  width: 100%;
  background: #fff;
  color: #333;
  border: 1px solid #ddd;
  padding: 12px;
  border-radius: 4px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
}

.btn-google:hover:not(:disabled) {
  background: #f7f7f7;
  border-color: #ccc;
}

.btn-google:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.login-link {
  text-align: center;
  margin-top: 20px;
  color: #666;
  font-size: 14px;
}

.login-link a {
  color: #667eea;
  cursor: pointer;
  text-decoration: none;
  font-weight: 500;
}

.login-link a:hover {
  text-decoration: underline;
}
</style>
