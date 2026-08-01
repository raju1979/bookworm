<template>
  <div class="chat-page">
    <div class="chat-header">
      <button @click="goBack" class="btn-back">← Back</button>
      <div class="chat-title">
        <h3>{{ thread?.book?.title || 'Chat' }}</h3>
        <p>{{ otherUserName }}</p>
      </div>
    </div>

    <template v-if="loading">
      <div class="loading">⏳ Loading conversation...</div>
    </template>

    <template v-else>
      <div class="chat-container">
        <div class="messages-area">
          <div v-if="messages.length === 0" class="empty-messages">
            <p>💬 No messages yet. Start the conversation!</p>
          </div>

          <div
            v-for="message in messages"
            :key="message.id"
            :class="['message', isOwnMessage(message) ? 'sent' : 'received']"
          >
            <div class="message-content">
              <p class="message-text">{{ message.message }}</p>
              <p class="message-time">{{ formatTime(message.createdAt || message.created_at) }}</p>
            </div>
            <button
              v-if="isOwnMessage(message)"
              @click="deleteMessage(message.id)"
              class="btn-delete-msg"
            >
              ✕
            </button>
          </div>
          <div ref="messagesEnd"></div>
        </div>

        <div class="message-input-area">
          <input
            v-model="newMessage"
            type="text"
            placeholder="Type a message..."
            class="message-input"
            @keyup.enter="sendMessage"
          />
          <button @click="sendMessage" class="btn-send">Send</button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { chatService } from '../services/chatService';
import { authService } from '../services/authService';
import { api } from '../services/apiService';

const router = useRouter();
const route = useRoute();

const thread = ref(null);
const messages = ref([]);
const newMessage = ref('');
const loading = ref(true);
const currentUser = ref(null);
const databaseUserId = ref(null);
const messagesEnd = ref(null);
let pollInterval = null;

const otherUserName = computed(() => {
  if (!thread.value || !databaseUserId.value) return 'Connecting...';
  const isRequester =
    Number(thread.value.requester_id) === Number(databaseUserId.value);
  const other = isRequester ? thread.value.uploader : thread.value.requester;
  return other?.full_name || other?.email || 'Book chat';
});

const isOwnMessage = (message) => {
  return Number(message.sender_id) === Number(databaseUserId.value);
};

onMounted(async () => {
  try {
    currentUser.value = await authService.getCurrentUser();
    if (!currentUser.value) {
      router.push('/login');
      return;
    }

    const profile = await api.get(`/users/firebase/${currentUser.value.id}`);
    databaseUserId.value = profile?.id;

    const threadId = route.params.id;
    if (!threadId) {
      alert('Error: Thread ID not found');
      return;
    }

    await loadThread(threadId);

    pollInterval = setInterval(async () => {
      await loadMessages(threadId);
    }, 3000);
  } catch (error) {
    console.error('Error in onMounted:', error);
    alert('Error: ' + error.message);
  }
});

onUnmounted(() => {
  if (pollInterval) {
    clearInterval(pollInterval);
  }
});

const loadThread = async (threadId) => {
  try {
    loading.value = true;
    thread.value = await chatService.getThreadById(threadId);
    if (!thread.value) {
      throw new Error('Thread not found');
    }
    await loadMessages(threadId);
  } catch (error) {
    console.error('Error loading thread:', error);
    alert('Error loading chat: ' + error.message);
  } finally {
    loading.value = false;
  }
};

const loadMessages = async (threadId) => {
  try {
    if (!threadId) return;
    const response = await chatService.getThreadMessages(threadId, 100, 0);
    messages.value = response.rows || response || [];
    await nextTick();
    scrollToBottom();
  } catch (error) {
    console.error('Error loading messages:', error);
  }
};

const sendMessage = async () => {
  if (!newMessage.value.trim()) return;

  try {
    const threadId = route.params.id;
    const text = newMessage.value;
    newMessage.value = '';
    await chatService.sendMessage(threadId, text);
    await loadMessages(threadId);
  } catch (error) {
    alert('Error sending message: ' + error.message);
  }
};

const deleteMessage = async (messageId) => {
  if (!confirm('Delete this message?')) return;

  try {
    await chatService.deleteMessage(messageId);
    await loadMessages(route.params.id);
  } catch (error) {
    alert('Error: ' + error.message);
  }
};

const scrollToBottom = () => {
  if (messagesEnd.value) {
    messagesEnd.value.scrollIntoView({ behavior: 'smooth' });
  }
};

const goBack = () => {
  router.push('/app/chat');
};

const formatTime = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
};
</script>

<style scoped>
.chat-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 130px);
  background: #f5f5f5;
}

.chat-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-back {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
}

.chat-title h3 {
  margin: 0;
  font-size: 16px;
}

.chat-title p {
  margin: 2px 0 0;
  font-size: 12px;
  opacity: 0.9;
}

.loading {
  padding: 40px;
  text-align: center;
  color: #666;
}

.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.messages-area {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.empty-messages {
  text-align: center;
  color: #888;
  margin-top: 40px;
}

.message {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  max-width: 80%;
}

.message.sent {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.message.received {
  align-self: flex-start;
}

.message-content {
  background: white;
  padding: 10px 12px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.message.sent .message-content {
  background: #667eea;
  color: white;
}

.message-text {
  margin: 0;
  word-break: break-word;
}

.message-time {
  margin: 4px 0 0;
  font-size: 11px;
  opacity: 0.7;
}

.btn-delete-msg {
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  font-size: 12px;
}

.message-input-area {
  display: flex;
  gap: 8px;
  padding: 12px;
  background: white;
  border-top: 1px solid #e0e0e0;
}

.message-input {
  flex: 1;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 15px;
  outline: none;
}

.btn-send {
  background: #667eea;
  color: white;
  border: none;
  padding: 12px 18px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
}
</style>
