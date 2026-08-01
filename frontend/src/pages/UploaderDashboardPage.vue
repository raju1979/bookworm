<template>
  <div class="uploader-dashboard">
    <div class="header">
      <h1>📤 My Books</h1>
      <p>Requests for your books</p>
    </div>

    <div v-if="loadingBooks" class="loading">Loading your books...</div>

    <div v-else-if="userBooks.length === 0" class="empty-state">
      <div class="empty-icon">📚</div>
      <p>No books uploaded yet</p>
      <p class="text-muted">Upload books to receive requests</p>
      <button @click="goUpload" class="btn-upload">📤 Upload Book</button>
    </div>

    <div v-else class="books-container">
      <div v-for="book in userBooks" :key="book.id" class="book-section">
        <div class="book-header">
          <div class="book-title-section">
            <div class="book-cover-small">
              <img
                v-if="book.cover_image"
                :src="book.cover_image"
                :alt="book.title"
                class="book-image-small"
              />
              <div v-else class="cover-placeholder-small">📖</div>
            </div>
            <div class="book-title-info">
              <h3>{{ book.title }}</h3>
              <p class="genre">{{ book.genre }}</p>
            </div>
          </div>
          <div class="request-count">
            <span class="badge">{{ getRequestCount(book.id) }} 🙋</span>
          </div>
        </div>

        <div v-if="getBookRequests(book.id).length > 0" class="requests-list">
          <div
            v-for="request in getBookRequests(book.id)"
            :key="request.id"
            class="request-item"
          >
            <div class="requester-info">
              <p class="requester-name">{{ request.requester?.full_name }}</p>
              <p class="requester-email">{{ request.requester?.email }}</p>
              <p class="request-date">{{ formatDate(request.createdAt) }}</p>
            </div>
            <div class="request-actions">
              <button
                v-if="request.status === 'pending'"
                @click="updateStatus(request.id, 'accepted')"
                class="btn-accept"
              >
                ✓ Accept
              </button>
              <button
                v-if="request.status === 'pending'"
                @click="updateStatus(request.id, 'rejected')"
                class="btn-reject"
              >
                ✗ Reject
              </button>
              <button @click="openChat(request)" class="btn-chat">💬</button>
              <span :class="['status', request.status]">{{ request.status }}</span>
            </div>
          </div>
        </div>
        <div v-else class="no-requests">
          <p>No requests yet</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { authService } from '../services/authService';
import { api } from '../services/apiService';
import { bookRequestService } from '../services/bookRequestService';
import { chatService } from '../services/chatService';

const router = useRouter();
const userBooks = ref([]);
const requests = ref([]);
const loadingBooks = ref(true);
const currentUser = ref(null);

onMounted(async () => {
  await loadData();
});

const loadData = async () => {
  try {
    loadingBooks.value = true;
    currentUser.value = await authService.getCurrentUser();

    if (!currentUser.value) {
      router.push('/login');
      return;
    }

    // Load user's books
    const booksResponse = await api.get(
      `/books/user/${currentUser.value.id}?limit=100`,
    );
    userBooks.value = booksResponse.rows || [];

    const bookIds = new Set(userBooks.value.map((b) => Number(b.id)));

    // Load requests and keep only those for this user's books
    const requestsResponse = await bookRequestService.getUserRequests(100, 0);
    requests.value = (requestsResponse.rows || []).filter((req) =>
      bookIds.has(Number(req.book_id)),
    );
  } catch (error) {
    console.error('Error loading data:', error);
  } finally {
    loadingBooks.value = false;
  }
};

const getBookRequests = (book_id) => {
  return requests.value.filter((req) => Number(req.book_id) === Number(book_id));
};

const getRequestCount = (book_id) => {
  return getBookRequests(book_id).length;
};

const updateStatus = async (requestId, status) => {
  try {
    await bookRequestService.updateRequestStatus(requestId, status);
    await loadData();
  } catch (error) {
    alert('Error: ' + error.message);
  }
};

const openChat = async (request) => {
  try {
    const requesterFirebaseUid = request.requester?.firebase_uid;
    if (!requesterFirebaseUid) {
      alert('Error: Requester information not available');
      return;
    }

    const thread = await chatService.createThread(
      request.book_id,
      requesterFirebaseUid,
    );
    router.push(`/app/chat/${thread.id}`);
  } catch (error) {
    alert('Error opening chat: ' + error.message);
  }
};

const goUpload = () => {
  router.push('/app/myshelf');
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString();
};
</script>

<style scoped>
.uploader-dashboard {
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

.btn-upload {
  margin-top: 20px;
  padding: 10px 20px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.books-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.book-section {
  background: #2a2a3a;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #444;
}

.book-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #444;
}

.book-title-section {
  display: flex;
  gap: 12px;
  flex: 1;
}

.book-cover-small {
  width: 60px;
  height: 90px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.book-image-small {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-placeholder-small {
  font-size: 24px;
}

.book-title-info {
  flex: 1;
}

.book-title-info h3 {
  color: #ddd;
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
}

.genre {
  color: #667eea;
  margin: 0;
  font-size: 12px;
  display: inline-block;
  background: rgba(102, 126, 234, 0.2);
  padding: 2px 6px;
  border-radius: 4px;
}

.request-count {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.badge {
  background: #667eea;
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
}

.requests-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.request-item {
  background: #3a3a4a;
  padding: 12px;
  border-radius: 6px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.requester-info {
  flex: 1;
}

.requester-name {
  color: #ddd;
  margin: 0 0 2px 0;
  font-size: 14px;
  font-weight: 600;
}

.requester-email {
  color: #aaa;
  margin: 0 0 2px 0;
  font-size: 12px;
}

.request-date {
  color: #888;
  margin: 0;
  font-size: 11px;
}

.request-actions {
  display: flex;
  gap: 6px;
  align-items: center;
}

.btn-accept,
.btn-reject,
.btn-chat {
  padding: 6px 10px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-accept {
  background: #4caf50;
  color: white;
}

.btn-accept:active {
  opacity: 0.8;
}

.btn-reject {
  background: #f44336;
  color: white;
}

.btn-reject:active {
  opacity: 0.8;
}

.btn-chat {
  background: #667eea;
  color: white;
}

.btn-chat:active {
  opacity: 0.8;
}

.status {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-align: center;
  min-width: 70px;
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

.no-requests {
  text-align: center;
  padding: 20px;
  color: #888;
  font-size: 14px;
}

@media (max-width: 600px) {
  .request-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .request-actions {
    width: 100%;
    flex-wrap: wrap;
  }

  .btn-accept,
  .btn-reject,
  .btn-chat {
    flex: 1;
    min-width: 60px;
  }
}
</style>
