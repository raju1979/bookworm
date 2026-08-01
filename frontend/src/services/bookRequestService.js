import { api } from './apiService';

export const bookRequestService = {
  async createRequest(book_id) {
    return api.post('/book-requests', { book_id });
  },

  async getUserRequests(limit = 20, offset = 0) {
    const response = await api.get(`/book-requests?limit=${limit}&offset=${offset}`);
    return response;
  },

  async getRequesterRequests(requester_id, limit = 20, offset = 0) {
    return api.get(`/book-requests/requester/${requester_id}?limit=${limit}&offset=${offset}`);
  },

  async getBookRequests(book_id, limit = 20, offset = 0) {
    return api.get(`/book-requests/book/${book_id}?limit=${limit}&offset=${offset}`);
  },

  async getRequestById(id) {
    return api.get(`/book-requests/${id}`);
  },

  async updateRequestStatus(id, status) {
    return api.put(`/book-requests/${id}`, { status });
  },

  async deleteRequest(id) {
    return api.delete(`/book-requests/${id}`);
  },
};
