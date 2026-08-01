<template>
  <div class="login-container">
    <div class="login-card">
      <h1 class="logo">📚 Bookworm</h1>
      <h2>Set new password</h2>

      <form @submit.prevent="handleReset" class="login-form">
        <div v-if="error" class="error-message">{{ error }}</div>
        <div v-if="success" class="success-message">{{ success }}</div>
        <p v-if="!oobCode && !error" class="hint">
          Open the password reset link from your email to continue.
        </p>

        <div class="form-group">
          <input
            v-model="password"
            type="password"
            :placeholder="passwordHint"
            class="form-input"
            required
            minlength="7"
            maxlength="10"
            :disabled="!oobCode"
          />
          <p class="field-hint">{{ passwordHint }}</p>
        </div>

        <div class="form-group">
          <input
            v-model="confirmPassword"
            type="password"
            placeholder="Confirm new password"
            class="form-input"
            required
            minlength="7"
            maxlength="10"
            :disabled="!oobCode"
          />
        </div>

        <button type="submit" class="btn-primary" :disabled="loading || !!success || !oobCode">
          <span v-if="loading">Updating...</span>
          <span v-else>Update password</span>
        </button>
      </form>

      <p class="signup-link">
        <a @click="$router.push('/login')">Back to login</a>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { authService } from '../services/authService';
import { getPasswordPolicyHint, validatePassword } from '../utils/passwordPolicy';

const router = useRouter();
const route = useRoute();
const password = ref('');
const confirmPassword = ref('');
const error = ref('');
const success = ref('');
const loading = ref(false);
const oobCode = ref('');
const passwordHint = getPasswordPolicyHint();

onMounted(() => {
  // Firebase reset links: ?mode=resetPassword&oobCode=...
  const code = route.query.oobCode || route.query.oobcode;
  if (typeof code === 'string' && code) {
    oobCode.value = code;
  } else {
    error.value = 'Missing reset code. Request a new password reset email.';
  }
});

const handleReset = async () => {
  if (!oobCode.value) {
    error.value = 'Missing reset code. Request a new password reset email.';
    return;
  }
  if (!password.value || !confirmPassword.value) {
    error.value = 'Please fill in all fields';
    return;
  }
  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match';
    return;
  }
  const passwordError = validatePassword(password.value);
  if (passwordError) {
    error.value = passwordError;
    return;
  }

  loading.value = true;
  error.value = '';
  success.value = '';

  try {
    await authService.confirmPasswordReset(oobCode.value, password.value);
    success.value = 'Password updated. Redirecting to login...';
    setTimeout(() => router.push('/login'), 1500);
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-card {
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

.login-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-input {
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  outline: none;
  transition: border-color 0.3s;
}

.form-input:focus {
  border-color: #667eea;
}

.form-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.field-hint {
  margin: 6px 0 0;
  font-size: 12px;
  color: #666;
  line-height: 1.4;
}

.hint {
  color: #666;
  font-size: 14px;
  margin: 0;
}

.error-message {
  background-color: #ffebee;
  color: #c62828;
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 10px;
  border-left: 4px solid #c62828;
}

.success-message {
  background-color: #e8f5e9;
  color: #2e7d32;
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 10px;
  border-left: 4px solid #2e7d32;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px;
  border-radius: 4px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.3s;
  margin-top: 10px;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary:hover:not(:disabled) {
  opacity: 0.9;
}

.signup-link {
  text-align: center;
  margin-top: 20px;
  color: #666;
  font-size: 14px;
}

.signup-link a {
  color: #667eea;
  cursor: pointer;
  text-decoration: none;
  font-weight: 500;
}

.signup-link a:hover {
  text-decoration: underline;
}
</style>
