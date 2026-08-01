import { authService } from './authService';

const API_URL = import.meta.env.VITE_API_URL || 'https://ajarafashion.com/bookworm/backend';

export const userService = {
  async getUser(userId) {
    const token = await authService.getIdToken();
    const response = await fetch(`${API_URL}/users/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user: ${response.statusText}`);
    }
    return response.json();
  },

  async getUserByFirebaseUid(firebaseUid) {
    const token = await authService.getIdToken();
    const response = await fetch(`${API_URL}/users/firebase/${firebaseUid}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user: ${response.statusText}`);
    }
    return response.json();
  },

  async updateUser(userData) {
    const token = await authService.getIdToken();
    const response = await fetch(`${API_URL}/users`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      throw new Error(`Failed to update user: ${response.statusText}`);
    }
    return response.json();
  },

  async createUser(userData) {
    const token = await authService.getIdToken();
    const response = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      throw new Error(`Failed to create user: ${response.statusText}`);
    }
    return response.json();
  },

  async deleteUser(userId) {
    const token = await authService.getIdToken();
    const response = await fetch(`${API_URL}/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete user: ${response.statusText}`);
    }
    return response.json();
  },
};
