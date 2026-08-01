<template>
  <div class="app-layout">
    <!-- Header -->
    <div class="header">
      <h1>📚 Bookworm</h1>
    </div>

    <!-- Page Content -->
    <router-view class="page-content" />

    <!-- Bottom Navigation -->
    <div class="bottom-nav">
      <router-link to="/app/home" class="nav-item" :class="{ active: activeTab === 'home' }">
        <span class="nav-icon">🏠</span>
        <span class="nav-label">Home</span>
      </router-link>
      <router-link to="/app/myshelf" class="nav-item" :class="{ active: activeTab === 'myshelf' }">
        <span class="nav-icon">📚</span>
        <span class="nav-label">My Shelf</span>
      </router-link>
      <router-link to="/app/chat" class="nav-item" :class="{ active: activeTab === 'chat' }">
        <span class="nav-icon">💬</span>
        <span class="nav-label">Chat</span>
      </router-link>
      <router-link to="/app/profile" class="nav-item" :class="{ active: activeTab === 'profile' }">
        <span class="nav-icon">👤</span>
        <span class="nav-label">Profile</span>
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const activeTab = ref('home');

watch(
  () => route.path,
  (newPath) => {
    if (newPath.includes('home')) activeTab.value = 'home';
    else if (newPath.includes('myshelf')) activeTab.value = 'myshelf';
    else if (newPath.includes('chat')) activeTab.value = 'chat';
    else if (newPath.includes('profile')) activeTab.value = 'profile';
  },
  { immediate: true }
);
</script>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f5f5;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 15px 20px;
  text-align: center;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}

.page-content {
  flex: 1;
  overflow-y: auto;
  width: 100%;
}

.bottom-nav {
  display: flex;
  justify-content: space-around;
  align-items: center;
  background: white;
  border-top: 1px solid #e0e0e0;
  height: 70px;
  position: sticky;
  bottom: 0;
  z-index: 100;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  flex: 1;
  height: 100%;
  text-decoration: none;
  color: #666;
  transition: color 0.3s;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  user-select: none;
}

.nav-item:active {
  transform: scale(0.95);
}

.nav-item.active {
  color: #667eea;
  border-bottom-color: #667eea;
}

.nav-icon {
  font-size: 24px;
}

.nav-label {
  font-size: 12px;
  font-weight: 500;
}

@media (max-width: 600px) {
  .bottom-nav {
    height: 60px;
  }

  .nav-icon {
    font-size: 20px;
  }

  .nav-label {
    font-size: 10px;
  }
}
</style>
