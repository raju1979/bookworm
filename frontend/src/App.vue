<template>
  <div class="app">
    <router-view />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { authService } from './services/authService';

const router = useRouter();
const isLoading = ref(true);

onMounted(() => {
  // Check auth state on app load
  authService.onAuthStateChanged((user) => {
    isLoading.value = false;
    if (!user && (router.currentRoute.value.path.startsWith('/app'))) {
      router.push('/login');
    }
  });
});
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial,
    sans-serif;
  background: #f5f5f5;
}

.app {
  width: 100%;
  height: 100vh;
}

a {
  text-decoration: none;
  color: inherit;
}

button {
  font-family: inherit;
}

input,
textarea {
  font-family: inherit;
}
</style>
