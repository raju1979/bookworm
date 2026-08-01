<template>
  <div class="chat-list-page">
    <div class="header">
      <h1>💬 Messages</h1>
      <p>Your conversations</p>
    </div>

    <div v-if="loading" class="loading">Loading conversations...</div>

    <div v-else-if="threads.length === 0" class="empty-state">
      <div class="empty-icon">💭</div>
      <p>No conversations yet</p>
      <p class="text-muted">Request books or accept requests to start chatting</p>
    </div>

    <div v-else class="threads-list">
      <div
        v-for="thread in threads"
        :key="thread.id"
        class="thread-item"
        @click="openThread(thread)"
      >
        <div class="thread-book">
          <div class="book-cover">
            <img
              v-if="thread.book?.cover_image"
              :src="thread.book.cover_image"
              :alt="thread.book.title"
              class="book-image"
            />
            <div v-else class="cover-placeholder">📖</div>
          </div>
        </div>

        <div class="thread-info">
          <h3>{{ thread.book?.title }}</h3>
          <p class="thread-user">
            <span v-if="isRequester(thread)">
              Talking to: {{ thread.uploader?.full_name }}
            </span>
            <span v-else>
              Request from: {{ thread.requester?.full_name }}
            </span>
          </p>
          <p class="thread-date">{{ formatDate(thread.updatedAt) }}</p>
        </div>

        <div class="thread-arrow">→</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { chatService } from '../services/chatService';
import { authService } from '../services/authService';
import { api } from '../services/apiService';

const router = useRouter();
const route = useRoute();
const threads = ref([]);
const loading = ref(true);
const currentUser = ref(null);
const databaseUserId = ref(null);
let pollInterval = null;

onMounted(async () => {
  try {
    currentUser.value = await authService.getCurrentUser();
    if (!currentUser.value) {
      router.push('/login');
      return;
    }

    await loadThreads(true);

    pollInterval = setInterval(() => {
      loadThreads(false);
    }, 5000);
  } catch (error) {
    console.error('Error loading chat page:', error);
  } finally {
    loading.value = false;
  }
});

onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval);
});

watch(
  () => route.fullPath,
  async () => {
    if (route.path === '/app/chat' && currentUser.value) {
      await loadThreads(false);
    }
  },
);

const loadThreads = async (showLoading = false) => {
  try {
    if (showLoading) loading.value = true;

    const userResponse = await api.get(
      `/users/firebase/${currentUser.value.id}`,
    );
    const databaseUser = userResponse;

    if (!databaseUser?.id) {
      console.error('User not found in database');
      return;
    }

    databaseUserId.value = databaseUser.id;
    const response = await chatService.getUserThreads(databaseUser.id, 50, 0);
    threads.value = response.rows || [];
  } catch (error) {
    console.error('Error loading threads:', error);
  } finally {
    if (showLoading) loading.value = false;
  }
};

const openThread = (thread) => {
  router.push(`/app/chat/${thread.id}`);
};

const isRequester = (thread) => {
  return Number(thread.requester_id) === Number(databaseUserId.value);
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString();
};
</script>

<style scoped>
.chat-list-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #1a1a1a;
}

.header {
  text-align: center;
  padding: 20px;
  border-bottom: 1px solid #333;
}

.header h1 {
  color: #ddd;
  margin: 0 0 8px 0;
  font-size: 24px;
}

.header p {
  color: #888;
  margin: 0;
  font-size: 14px;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  color: #888;
  font-size: 16px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  text-align: center;
  padding: 40px 20px;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.empty-state p {
  color: #888;
  margin: 10px 0;
}

.text-muted {
  color: #666;
  font-size: 14px;
}

.threads-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.thread-item {
  display: flex;
  gap: 12px;
  padding: 16px;
  border-bottom: 1px solid #333;
  cursor: pointer;
  transition: background-color 0.2s;
  align-items: center;
}

.thread-item:active {
  background-color: #2a2a3a;
}

.thread-book {
  flex-shrink: 0;
}

.book-cover {
  width: 60px;
  height: 90px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.book-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-placeholder {
  font-size: 30px;
}

.thread-info {
  flex: 1;
  min-width: 0;
}

.thread-info h3 {
  color: #ddd;
  margin: 0 0 4px 0;
  font-size: 15px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.thread-user {
  color: #aaa;
  margin: 4px 0;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.thread-date {
  color: #888;
  margin: 4px 0 0 0;
  font-size: 11px;
}

.thread-arrow {
  color: #666;
  font-size: 20px;
  flex-shrink: 0;
}
</style>
