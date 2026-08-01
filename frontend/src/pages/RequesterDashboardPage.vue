<template>
  <div class="requester-dashboard">
    <div class="header">
      <h1>📚 My Wishes</h1>
      <p>Books you requested</p>
    </div>

    <div v-if="loadingRequests" class="loading">Loading your wishes...</div>

    <div v-else-if="requests.length === 0" class="empty-state">
      <div class="empty-icon">💭</div>
      <p>No wishes yet</p>
      <p class="text-muted">Search for books and click "I Want" to add them</p>
      <button @click="goHome" class="btn-home">← Back to Home</button>
    </div>

    <div v-else class="requests-container">
      <div v-for="request in requests" :key="request.id" class="request-card">
        <div class="book-section">
          <div class="book-cover">
            <img
              v-if="request.book?.cover_image"
              :src="request.book.cover_image"
              :alt="request.book.title"
              class="book-image"
            />
            <div v-else class="cover-placeholder">📖</div>
          </div>
          <div class="book-info">
            <h3>{{ request.book?.title }}</h3>
            <p class="uploader">by {{ request.book?.firebase_uid }}</p>
            <p v-if="request.book?.genre" class="genre">{{ request.book.genre }}</p>
          </div>
        </div>

        <div class="request-section">
          <div class="status" :class="request.status">
            {{ request.status.toUpperCase() }}
          </div>
          <p class="date">{{ formatDate(request.createdAt) }}</p>
          <button @click="openChat(request)" class="btn-chat">💬 Chat</button>
          <button @click="cancelRequest(request.id)" class="btn-cancel">❌ Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { bookRequestService } from '../services/bookRequestService';
import { authService } from '../services/authService';
import { chatService } from '../services/chatService';

const router = useRouter();
const requests = ref([]);
const loadingRequests = ref(true);
const currentUser = ref(null);

onMounted(async () => {
  await loadRequests();
});

const loadRequests = async () => {
  try {
    loadingRequests.value = true;
    currentUser.value = await authService.getCurrentUser();

    if (!currentUser.value) {
      router.push('/login');
      return;
    }

    const response = await bookRequestService.getUserRequests(50, 0);
    requests.value = response.rows || [];
  } catch (error) {
    console.error('Error loading requests:', error);
  } finally {
    loadingRequests.value = false;
  }
};

const openChat = async (request) => {
  try {
    // Get the uploader's firebase_uid from the book
    const uploaderFirebaseUid = request.book?.firebase_uid;
    if (!uploaderFirebaseUid) {
      alert('Error: Uploader information not available');
      return;
    }

    const thread = await chatService.createThread(
      request.book_id,
      uploaderFirebaseUid,
    );
    router.push(`/app/chat/${thread.id}`);
  } catch (error) {
    alert('Error opening chat: ' + error.message);
  }
};

const cancelRequest = async (id) => {
  if (confirm('Are you sure you want to cancel this request?')) {
    try {
      await bookRequestService.deleteRequest(id);
      await loadRequests();
    } catch (error) {
      alert('Error: ' + error.message);
    }
  }
};

const goHome = () => {
  router.push('/app/home');
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString();
};
</script>

<style scoped>
.requester-dashboard {
  padding: 16px;
  padding-bottom: 100px;
  background: #1a1a1a;
  min-height: 100vh;
}

.header {
  text-align: center;
  margin-bottom: 24px;
  padding: 24px 0;
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
  text-align: center;
  padding: 40px 20px;
  color: #888;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 15px;
}

.empty-state p {
  color: #888;
  margin: 5px 0;
}

.text-muted {
  color: #666;
  font-size: 14px;
}

.btn-home {
  margin-top: 20px;
  padding: 10px 20px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.requests-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.request-card {
  background: #2a2a3a;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  gap: 16px;
  border: 1px solid #444;
}

.book-section {
  display: flex;
  gap: 12px;
  flex: 1;
}

.book-cover {
  width: 80px;
  height: 120px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 6px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.book-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-placeholder {
  font-size: 32px;
}

.book-info {
  flex: 1;
  overflow: hidden;
}

.book-info h3 {
  color: #ddd;
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.uploader {
  color: #aaa;
  margin: 4px 0;
  font-size: 12px;
}

.genre {
  color: #667eea;
  margin: 4px 0;
  font-size: 11px;
  display: inline-block;
  background: rgba(102, 126, 234, 0.2);
  padding: 2px 6px;
  border-radius: 4px;
}

.request-section {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: space-between;
  gap: 8px;
  min-width: 100px;
}

.status {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-align: center;
}

.status.pending {
  background: rgba(255, 193, 7, 0.2);
  color: #ffc107;
}

.status.accepted {
  background: rgba(76, 175, 80, 0.2);
  color: #4caf50;
}

.status.rejected {
  background: rgba(244, 67, 54, 0.2);
  color: #f44336;
}

.status.completed {
  background: rgba(33, 150, 243, 0.2);
  color: #2196f3;
}

.date {
  color: #888;
  font-size: 11px;
  margin: 0;
}

.btn-chat,
.btn-cancel {
  padding: 6px 10px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-chat {
  background: #667eea;
  color: white;
  flex: 1;
  min-width: 80px;
}

.btn-chat:active {
  opacity: 0.8;
}

.btn-cancel {
  background: #ff5252;
  color: white;
  flex: 1;
  min-width: 80px;
}

.btn-cancel:active {
  opacity: 0.8;
}

@media (max-width: 600px) {
  .request-card {
    flex-direction: column;
  }

  .request-section {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    min-width: unset;
    width: 100%;
  }

  .btn-chat,
  .btn-cancel {
    flex: 1;
    min-width: unset;
  }
}
</style>
