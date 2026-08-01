<template>
  <div class="myshelf-page">
    <!-- Camera Modal -->
    <div v-if="showCameraModal" class="camera-modal-overlay">
      <div class="camera-modal">
        <h3>📷 Take a Photo</h3>
        <video
          ref="videoElement"
          class="camera-video"
          playsinline
          autoplay
          muted
        ></video>
        <canvas ref="canvasElement" class="hidden-canvas"></canvas>
        <div class="camera-controls">
          <button type="button" class="btn-capture" @click="capturePhoto">
            📸 Capture
          </button>
          <button type="button" class="btn-cancel" @click="closeCameraModal">
            ✕ Close
          </button>
        </div>
        <p v-if="cameraError" class="camera-error">{{ cameraError }}</p>
      </div>
    </div>

    <div v-if="showUploadForm" class="upload-section">
      <div class="upload-card">
        <h3>Upload New Book</h3>

        <form @submit.prevent="handleUpload" class="upload-form">
          <div v-if="error" class="error-message">{{ error }}</div>

          <div class="form-group">
            <input
              v-model="form.title"
              type="text"
              placeholder="Book Title"
              required
            />
          </div>

          <div class="form-group">
            <label for="genre-select" class="genre-label">Select Genres</label>
            <div class="genre-dropdown">
              <button
                type="button"
                class="genre-toggle"
                @click="showGenreDropdown = !showGenreDropdown"
              >
                {{ selectedGenres.length === 0
                  ? "Choose genres..."
                  : `${selectedGenres.length} selected` }}
                <span class="dropdown-icon">▼</span>
              </button>

              <div v-if="showGenreDropdown" class="genre-menu">
                <div v-if="loadingGenres" class="genre-loading">
                  Loading genres...
                </div>
                <div v-else-if="genres.length === 0" class="genre-empty">
                  No genres available
                </div>
                <div v-else class="genre-list">
                  <label
                    v-for="genre in genres"
                    :key="genre.id"
                    class="genre-checkbox-label"
                  >
                    <input
                      type="checkbox"
                      :value="genre.tag_name"
                      v-model="selectedGenres"
                      class="genre-checkbox"
                    />
                    <span>{{ genre.tag_name }}</span>
                  </label>
                </div>
              </div>
            </div>

            <div v-if="selectedGenres.length > 0" class="selected-tags">
              <span
                v-for="genre in selectedGenres"
                :key="genre"
                class="tag-badge"
              >
                {{ genre }}
                <button
                  type="button"
                  class="tag-remove"
                  @click="selectedGenres.splice(selectedGenres.indexOf(genre), 1)"
                >
                  ✕
                </button>
              </span>
            </div>
          </div>

          <div class="form-group">
            <textarea
              v-model="form.description"
              placeholder="Book Description"
              rows="3"
            ></textarea>
          </div>

          <div class="form-group">
            <label class="image-label">📷 Book Cover Image (Optional)</label>
            <div class="image-buttons">
              <button
                type="button"
                class="btn-camera"
                @click="openCamera"
                title="Works best on mobile devices"
              >
                📷 Take Photo
              </button>
              <button
                type="button"
                class="btn-gallery"
                @click="openGallery"
              >
                🖼️ Choose from Gallery
              </button>
            </div>
            <p v-if="cameraNote" class="camera-note">
              💡 Tip: On desktop, use "Choose from Gallery". Camera works best on mobile.
            </p>
            <input
              id="book-image-camera"
              type="file"
              accept="image/*"
              capture
              @change="handleImageUpload"
              class="hidden-input"
            />
            <input
              id="book-image-gallery"
              type="file"
              accept="image/*"
              @change="handleImageUpload"
              class="hidden-input"
            />
            <div v-if="imagePreview" class="image-preview">
              <img :src="imagePreview" alt="Book cover preview" />
              <button
                type="button"
                class="btn-remove-image"
                @click="removeImage"
              >
                ✕
              </button>
            </div>
          </div>

          <div class="button-group">
            <button type="submit" class="btn-primary" :disabled="uploading">
              <span v-if="uploading">Uploading...</span>
              <span v-else>📤 Upload Book</span>
            </button>
            <button type="button" class="btn-secondary" @click="closeForm">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>

    <div v-else class="upload-section">
      <div class="upload-card">
        <button class="upload-btn" @click="showUploadForm = true">
          📤 Upload New Book
        </button>
        <button class="requests-btn" @click="$router.push('/app/uploader-dashboard')">
          📥 Incoming Requests
        </button>
        <p class="upload-hint">Add a book or review who wants your books</p>
      </div>
    </div>

    <div class="books-section">
      <h2>My Books</h2>

      <div v-if="loadingBooks" class="loading">Loading your books...</div>

      <div v-else-if="userBooks.length === 0" class="empty-state">
        <div class="empty-icon">🔖</div>
        <p>No books uploaded yet</p>
        <p class="text-muted">Click the button above to upload your first book</p>
      </div>

      <div v-else class="books-grid">
        <div v-for="book in userBooks" :key="book.id" class="book-card">
          <div class="book-cover">
            <img
              v-if="book.cover_image"
              :src="book.cover_image"
              :alt="book.title"
              class="book-image"
            />
            <div v-else class="cover-placeholder">📖</div>
          </div>
          <div class="book-info">
            <h3>{{ book.title }}</h3>
            <p class="genre">{{ book.genre }}</p>
            <button class="btn-delete" @click="deleteBook(book.id)">🗑️ Delete</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { api } from '../services/apiService';
import { authService } from '../services/authService';

const showUploadForm = ref(false);
const uploading = ref(false);
const loadingBooks = ref(true);
const userBooks = ref([]);
const error = ref('');
const showGenreDropdown = ref(false);
const genres = ref([]);
const loadingGenres = ref(false);
const selectedGenres = ref([]);

const form = ref({
  title: '',
  description: '',
});
const imagePreview = ref(null);
const imageBase64 = ref(null);
const cameraNote = ref(!navigator.userAgent.includes('Mobile'));
const showCameraModal = ref(false);
const cameraError = ref('');
const videoElement = ref(null);
const canvasElement = ref(null);
const cameraStream = ref(null);

onMounted(async () => {
  await fetchUserBooks();
  await fetchGenres();
});

const fetchUserBooks = async () => {
  try {
    loadingBooks.value = true;
    const user = await authService.getCurrentUser();
    if (!user) {
      error.value = 'Not logged in';
      return;
    }
    // Use firebase_uid (user.id) instead of user ID
    const response = await api.get(`/books/user/${user.id}?limit=100`);
    userBooks.value = response.rows || [];
  } catch (err) {
    console.error('Error loading books:', err);
    error.value = 'Failed to load your books';
  } finally {
    loadingBooks.value = false;
  }
};

const fetchGenres = async () => {
  try {
    loadingGenres.value = true;
    const response = await api.get('/tags?limit=100');
    genres.value = response.rows || [];
  } catch (err) {
    console.error('Error loading genres:', err);
    genres.value = [];
  } finally {
    loadingGenres.value = false;
  }
};

const openCamera = async () => {
  cameraError.value = '';
  showCameraModal.value = true;

  // Try to use getUserMedia for desktop webcam
  if (navigator.mediaDevices?.getUserMedia) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      cameraStream.value = stream;

      // Wait for DOM to update, then set video source
      setTimeout(() => {
        if (videoElement.value) {
          videoElement.value.srcObject = stream;
        }
      }, 0);
    } catch (err) {
      console.error('Camera error:', err);
      cameraError.value = `Camera access denied: ${err.message}. Using file picker instead.`;

      // Fallback to file input if camera access denied
      setTimeout(() => {
        const input = document.getElementById('book-image-camera');
        if (input) {
          showCameraModal.value = false;
          input.click();
        }
      }, 500);
    }
  } else {
    cameraError.value = 'Camera not supported. Using file picker instead.';
    setTimeout(() => {
      const input = document.getElementById('book-image-camera');
      if (input) {
        showCameraModal.value = false;
        input.click();
      }
    }, 500);
  }
};

const compressImage = (canvas, maxWidth = 200, maxHeight = 300, maxSizeKB = 20) => {
  return new Promise((resolve) => {
    // Calculate aspect ratio
    const aspectRatio = canvas.width / canvas.height;
    let width = maxWidth;
    let height = maxHeight;

    // Adjust dimensions to maintain aspect ratio
    if (aspectRatio > maxWidth / maxHeight) {
      height = Math.round(width / aspectRatio);
    } else {
      width = Math.round(height * aspectRatio);
    }

    // Create compressed canvas
    const compressedCanvas = document.createElement('canvas');
    compressedCanvas.width = width;
    compressedCanvas.height = height;

    const ctx = compressedCanvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(canvas, 0, 0, width, height);

      // Compress with decreasing quality until under max size
      let quality = 0.85;
      let attempts = 0;
      const maxAttempts = 20;

      const tryCompress = () => {
        attempts++;
        compressedCanvas.toBlob(
          (blob) => {
            const sizeKB = blob.size / 1024;
            console.log(
              `Attempt ${attempts}: ${sizeKB.toFixed(2)}KB at quality ${(quality * 100).toFixed(0)}%`,
            );

            // If under max size or reached max attempts, use this quality
            if (sizeKB <= maxSizeKB || quality <= 0.1 || attempts >= maxAttempts) {
              // Convert blob to base64
              const reader = new FileReader();
              reader.onload = () => {
                resolve({
                  base64: reader.result,
                  sizeKB: sizeKB.toFixed(2),
                  width,
                  height,
                });
              };
              reader.readAsDataURL(blob);
            } else if (sizeKB > maxSizeKB) {
              // Need to reduce quality
              quality -= 0.05;
              tryCompress();
            }
          },
          'image/jpeg',
          quality,
        );
      };

      tryCompress();
    }
  });
};

const capturePhoto = async () => {
  if (!videoElement.value || !canvasElement.value) return;

  const video = videoElement.value;
  const canvas = canvasElement.value;
  const context = canvas.getContext('2d');

  // Set canvas dimensions to match video
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  // Draw current video frame to canvas
  if (context) {
    context.drawImage(video, 0, 0);

    try {
      // Compress image: 200x300px, max 20KB
      const compressed = await compressImage(canvas, 200, 300, 20);

      imagePreview.value = compressed.base64;
      imageBase64.value = compressed.base64;

      console.log(
        `✅ Compressed: ${compressed.width}x${compressed.height}px, ${compressed.sizeKB}KB`,
      );

      // Close modal and stop camera
      closeCameraModal();
      alert(
        `✅ Photo captured!\n📸 ${compressed.width}x${compressed.height}px\n💾 ${compressed.sizeKB}KB`,
      );
    } catch (err) {
      console.error('Error:', err);
      cameraError.value = 'Error processing image';
    }
  }
};

const closeCameraModal = () => {
  // Stop camera stream
  if (cameraStream.value) {
    cameraStream.value.getTracks().forEach((track) => track.stop());
    cameraStream.value = null;
  }

  showCameraModal.value = false;
  cameraError.value = '';

  if (videoElement.value) {
    videoElement.value.srcObject = null;
  }
};

const openGallery = () => {
  const input = document.getElementById('book-image-gallery');
  if (input) input.click();
};

const handleImageUpload = async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    // Read file and compress
    const reader = new FileReader();
    reader.onload = async (e) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);

          // Compress: 200x300px, max 20KB
          const compressed = await compressImage(canvas, 200, 300, 20);

          imagePreview.value = compressed.base64;
          imageBase64.value = compressed.base64;

          console.log(
            `✅ Compressed: ${compressed.width}x${compressed.height}px, ${compressed.sizeKB}KB`,
          );
        }
      };
      img.src = e.target?.result;
    };
    reader.readAsDataURL(file);
  } catch (err) {
    error.value = 'Error processing image';
    console.error('Error:', err);
  }
};

const removeImage = () => {
  imagePreview.value = null;
  imageBase64.value = null;
  const input = document.getElementById('book-image');
  if (input) input.value = '';
};

const handleUpload = async () => {
  if (!form.value.title || selectedGenres.value.length === 0) {
    error.value = 'Please fill in all required fields';
    return;
  }

  uploading.value = true;
  error.value = '';

  try {
    const bookData = {
      title: form.value.title,
      genre: selectedGenres.value.join(', '),
      description: form.value.description,
    };

    // Add cover image if provided
    if (imageBase64.value) {
      bookData.cover_image = imageBase64.value;
    }

    await api.post('/books', bookData);

    // Reset form and refresh books
    form.value = { title: '', description: '' };
    selectedGenres.value = [];
    imagePreview.value = null;
    imageBase64.value = null;
    showUploadForm.value = false;
    showGenreDropdown.value = false;
    await fetchUserBooks();
  } catch (err) {
    error.value = err.message || 'Failed to upload book';
  } finally {
    uploading.value = false;
  }
};

const closeForm = () => {
  showUploadForm.value = false;
  form.value = { title: '', description: '' };
  selectedGenres.value = [];
  showGenreDropdown.value = false;
  imagePreview.value = null;
  imageBase64.value = null;
  error.value = '';
  closeCameraModal();
};

const deleteBook = async (bookId) => {
  if (confirm('Are you sure you want to delete this book?')) {
    try {
      await api.delete(`/books/${bookId}`);
      await fetchUserBooks();
    } catch (err) {
      error.value = 'Failed to delete book';
    }
  }
};
</script>

<style scoped>
.myshelf-page {
  padding: 16px;
  padding-bottom: 100px;
}

.upload-section {
  margin-bottom: 20px;
}

.upload-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 24px;
  color: white;
}

.upload-card h3 {
  margin: 0 0 20px 0;
  font-size: 18px;
}

.upload-btn {
  background-color: white;
  color: #667eea;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  width: 100%;
  margin-bottom: 10px;
  transition: transform 0.2s;
}

.upload-btn:active {
  transform: scale(0.98);
}

.requests-btn {
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.6);
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  width: 100%;
  margin-bottom: 12px;
  transition: transform 0.2s;
}

.requests-btn:active {
  transform: scale(0.98);
}

.upload-hint {
  margin: 0;
  font-size: 14px;
  opacity: 0.9;
}

.upload-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group input,
.form-group textarea {
  padding: 10px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
  outline: none;
}

.button-group {
  display: flex;
  gap: 10px;
}

.btn-primary {
  flex: 1;
  background-color: white;
  color: #667eea;
  border: none;
  padding: 10px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  flex: 1;
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid white;
  padding: 10px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.error-message {
  background-color: rgba(255, 100, 100, 0.2);
  color: white;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 10px;
  border-left: 3px solid white;
}

.image-label {
  color: white;
  font-size: 14px;
  font-weight: 500;
  display: block;
  margin-bottom: 10px;
}

.image-buttons {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.btn-camera,
.btn-gallery {
  flex: 1;
  background-color: rgba(255, 255, 255, 0.9);
  color: #667eea;
  border: none;
  padding: 10px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-camera:active,
.btn-gallery:active {
  background-color: white;
}

.hidden-input {
  display: none;
}

.camera-note {
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  margin: 8px 0 0 0;
  padding: 0;
  text-align: center;
}

.camera-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.camera-modal {
  background: white;
  border-radius: 12px;
  padding: 20px;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.camera-modal h3 {
  margin: 0 0 15px 0;
  font-size: 18px;
  color: #333;
  text-align: center;
}

.camera-video {
  width: 100%;
  height: auto;
  border-radius: 8px;
  background: #000;
  margin-bottom: 15px;
  max-height: 400px;
  object-fit: cover;
}

.hidden-canvas {
  display: none;
}

.camera-controls {
  display: flex;
  gap: 10px;
}

.btn-capture {
  flex: 1;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-capture:active {
  opacity: 0.9;
}

.btn-cancel {
  flex: 0 0 50px;
  background-color: #f0f0f0;
  color: #666;
  border: none;
  padding: 12px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-cancel:active {
  opacity: 0.8;
}

.camera-error {
  color: #c62828;
  font-size: 12px;
  text-align: center;
  margin: 10px 0 0 0;
  padding: 10px;
  background-color: #ffebee;
  border-radius: 4px;
}

.image-preview {
  position: relative;
  width: 100%;
  border-radius: 6px;
  overflow: hidden;
  background-color: white;
}

.image-preview img {
  width: 100%;
  height: 200px;
  object-fit: cover;
  display: block;
}

.btn-remove-image {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 32px;
  height: 32px;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  border: none;
  border-radius: 50%;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.btn-remove-image:active {
  background-color: rgba(0, 0, 0, 0.8);
}

.books-section h2 {
  font-size: 18px;
  color: #333;
  margin: 20px 0 15px;
}

.loading {
  text-align: center;
  padding: 40px 20px;
  color: #666;
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
  color: #999;
  margin: 5px 0;
}

.text-muted {
  color: #bbb;
  font-size: 14px;
}

.books-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 15px;
}

.book-card {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.book-cover {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cover-placeholder {
  font-size: 48px;
}

.book-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.book-info {
  padding: 12px;
}

.book-info h3 {
  font-size: 14px;
  color: #333;
  margin: 0 0 5px 0;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.genre {
  font-size: 11px;
  background: #f0f0f0;
  color: #667eea;
  padding: 2px 6px;
  border-radius: 4px;
  display: inline-block;
  margin: 5px 0;
}

.btn-delete {
  width: 100%;
  margin-top: 8px;
  background-color: #ffebee;
  color: #c62828;
  border: none;
  padding: 6px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-delete:active {
  opacity: 0.8;
}

.genre-label {
  color: white;
  font-size: 14px;
  font-weight: 500;
  display: block;
  margin-bottom: 8px;
}

.genre-dropdown {
  position: relative;
}

.genre-toggle {
  width: 100%;
  padding: 10px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  background-color: #3a3a3a;
  color: #999;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background-color 0.2s;
}

.genre-toggle:active {
  background-color: #4a4a4a;
}

.dropdown-icon {
  font-size: 12px;
  transition: transform 0.2s;
  display: inline-block;
}

.genre-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: white;
  border-radius: 6px;
  margin-top: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 100;
  max-height: 300px;
  overflow-y: auto;
}

.genre-list {
  padding: 8px 0;
}

.genre-checkbox-label {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  cursor: pointer;
  transition: background-color 0.15s;
  border-bottom: 1px solid #f0f0f0;
}

.genre-checkbox-label:last-child {
  border-bottom: none;
}

.genre-checkbox-label:active {
  background-color: #f5f5f5;
}

.genre-checkbox-label:hover {
  background-color: #f9f9f9;
}

.genre-checkbox {
  margin-right: 10px;
  cursor: pointer;
  width: 16px;
  height: 16px;
}

.genre-checkbox-label span {
  color: #333;
  font-size: 14px;
}

.genre-loading,
.genre-empty {
  padding: 15px;
  text-align: center;
  color: #999;
  font-size: 14px;
}

.selected-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.tag-badge {
  background-color: rgba(102, 126, 234, 0.2);
  color: white;
  padding: 6px 10px;
  border-radius: 20px;
  font-size: 13px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.tag-remove {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 14px;
  padding: 0;
  display: flex;
  align-items: center;
  transition: opacity 0.2s;
}

.tag-remove:active {
  opacity: 0.7;
}

@media (max-width: 600px) {
  .books-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 10px;
  }
}
</style>
