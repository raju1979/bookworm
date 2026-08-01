import { api } from './apiService';

export const chatService = {
  async createThread(book_id, uploader_id) {
    return api.post('/chat-threads', {
      book_id: Number(book_id),
      uploader_id,
    });
  },

  async getUserThreads(user_id, limit = 20, offset = 0) {
    return api.get(`/chat-threads/user/${user_id}?limit=${limit}&offset=${offset}`);
  },

  async getThreadById(id) {
    return api.get(`/chat-threads/${id}`);
  },

  async getBookThreads(book_id) {
    return api.get(`/chat-threads/book/${book_id}`);
  },

  async deleteThread(id) {
    return api.delete(`/chat-threads/${id}`);
  },

  async sendMessage(thread_id, message) {
    return api.post('/chat-messages', {
      thread_id: Number(thread_id),
      message,
    });
  },

  async getThreadMessages(thread_id, limit = 50, offset = 0) {
    return api.get(`/chat-messages/thread/${thread_id}?limit=${limit}&offset=${offset}`);
  },

  async deleteMessage(id) {
    return api.delete(`/chat-messages/${id}`);
  },
};
