<template>
  <div class="home-page">
    <div class="search-header">
      <h1 class="discover-title">DISCOVER YOUR NEXT READ</h1>

      <div class="search-container">
        <div class="search-input-wrapper">
          <span class="search-icon">🔍</span>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search by title or author..."
            class="search-input"
            @keyup.enter="handleSearch"
          />
        </div>

        <div class="genre-filter-wrapper">
          <span class="filter-icon">📚</span>
          <div class="genre-dropdown">
            <button
              type="button"
              class="genre-toggle"
              @click="showGenreDropdown = !showGenreDropdown"
            >
              {{ selectedGenre || "All genres" }}
              <span class="dropdown-icon">▼</span>
            </button>

            <div v-if="showGenreDropdown" class="genre-menu">
              <div v-if="loadingGenres" class="genre-loading">
                Loading genres...
              </div>
              <div v-else class="genre-list">
                <button
                  type="button"
                  class="genre-option"
                  :class="{ active: !selectedGenre }"
                  @click="selectGenre('')"
                >
                  All genres
                </button>
                <button
                  v-for="genre in genres"
                  :key="genre.id"
                  type="button"
                  class="genre-option"
                  :class="{ active: selectedGenre === genre.tag_name }"
                  @click="selectGenre(genre.tag_name)"
                >
                  {{ genre.tag_name }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <button type="button" class="search-button" @click="handleSearch">
          🔍 Search Books
        </button>
      </div>
    </div>

    <div class="results-section">
      <p v-if="!hasSearched" class="results-hint">Results will appear here</p>

      <div v-else-if="loading" class="loading">Loading books...</div>

      <div v-else-if="displayedBooks.length === 0" class="empty-state">
        <div class="empty-icon">📚</div>
        <p>No books found</p>
        <p class="text-muted">Try different search terms or genres</p>
      </div>

      <div v-else class="books-grid">
        <div v-for="book in displayedBooks" :key="book.id" class="book-card">
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
            <p class="author">by {{ book.author || "Unknown" }}</p>
            <div v-if="book.genre" class="genre-tags">
              <span v-for="g in book.genre.split(', ')" :key="g" class="genre-tag">
                {{ g }}
              </span>
            </div>
            <button
              :class="['btn-want', { disabled: isUserUploader(book) }]"
              :disabled="isUserUploader(book)"
              @click="handleWantBook(book)"
              :title="isUserUploader(book) ? 'This is your book' : 'Add to wishlist'"
            >
              {{ isUserUploader(book) ? '✓ Your Book' : '❤️ I Want' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { api } from '../services/apiService';
import { bookRequestService } from '../services/bookRequestService';
import { chatService } from '../services/chatService';
import { authService } from '../services/authService';
import { useRouter } from 'vue-router';

const searchQuery = ref('');
const selectedGenre = ref('');
const books = ref([]);
const displayedBooks = ref([]);
const loading = ref(false);
const hasSearched = ref(false);
const genres = ref([]);
const loadingGenres = ref(false);
const showGenreDropdown = ref(false);
const currentFirebaseUid = ref(null);

onMounted(async () => {
  await fetchGenres();
  await loadCurrentUser();
});

const loadCurrentUser = async () => {
  try {
    const user = await authService.getCurrentUser();
    if (user) {
      currentFirebaseUid.value = user.id;
    }
  } catch (error) {
    console.error('Error loading current user:', error);
  }
};

const fetchGenres = async () => {
  try {
    loadingGenres.value = true;
    const response = await api.get('/tags?limit=100');
    genres.value = response.rows || [];
  } catch (error) {
    console.error('Error loading genres:', error);
    genres.value = [];
  } finally {
    loadingGenres.value = false;
  }
};

const selectGenre = (genre) => {
  selectedGenre.value = genre;
  showGenreDropdown.value = false;
  // Auto-search when genre is selected
  handleSearch();
};

const router = useRouter();

const isUserUploader = (book) => {
  return !!(currentFirebaseUid.value && book.firebase_uid === currentFirebaseUid.value);
};

const handleWantBook = async (book) => {
  try {
    if (isUserUploader(book)) {
      alert('This is your book! You cannot request your own books.');
      return;
    }

    const user = await authService.getCurrentUser();
    if (!user) {
      alert('Please login to add books to your wishlist');
      return;
    }

    await bookRequestService.createRequest(book.id);

    // Start a chat thread so the book owner sees this in Chat
    if (book.firebase_uid) {
      try {
        await chatService.createThread(book.id, book.firebase_uid);
      } catch (chatErr) {
        console.log('Chat thread create skipped:', chatErr.message);
      }
    }

    alert(
      `📚 Requested "${book.title}".\n\nThe owner will see this in Chat and Incoming Requests.`,
    );
    router.push('/app/chat');
  } catch (error) {
    if (error.message.includes('already requested')) {
      alert('You have already requested this book');
    } else {
      alert('Error: ' + (error.message || 'Failed to add to wishlist'));
    }
  }
};

const handleSearch = async () => {
  loading.value = true;
  hasSearched.value = true;

  try {
    // Build query parameters
    let query = '/books?limit=100';

    // Add search query if provided
    if (searchQuery.value.trim()) {
      query += `&search=${encodeURIComponent(searchQuery.value)}`;
    }

    // Add genre filter if provided
    if (selectedGenre.value) {
      query += `&genre=${encodeURIComponent(selectedGenre.value)}`;
    }

    const response = await api.get(query);
    books.value = response.rows || [];

    // Filter books by genre if selected (client-side filtering as fallback)
    if (selectedGenre.value) {
      displayedBooks.value = books.value.filter((book) =>
        book.genre && book.genre.includes(selectedGenre.value)
      );
    } else {
      displayedBooks.value = books.value;
    }
  } catch (error) {
    console.error('Error searching books:', error);
    displayedBooks.value = [];
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.home-page {
  padding: 0;
  padding-bottom: 100px;
  background-color: #1a1a1a;
  min-height: 100vh;
}

.search-header {
  background: linear-gradient(135deg, #2d1b4e 0%, #1a0f2e 100%);
  padding: 24px 16px;
  border-bottom: 1px solid #3a2e5e;
}

.discover-title {
  text-align: center;
  color: #aaa;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 2px;
  margin: 0 0 20px 0;
  text-transform: uppercase;
}

.search-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  background-color: #2a2a3a;
  border-radius: 8px;
  border: 1px solid #444;
}

.search-icon {
  position: absolute;
  left: 12px;
  font-size: 16px;
  pointer-events: none;
  color: #888;
}

.search-input {
  flex: 1;
  padding: 12px 12px 12px 40px;
  background: transparent;
  border: none;
  outline: none;
  color: #ddd;
  font-size: 14px;
}

.search-input::placeholder {
  color: #888;
}

.genre-filter-wrapper {
  position: relative;
}

.filter-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 16px;
  pointer-events: none;
  z-index: 1;
}

.genre-dropdown {
  position: relative;
}

.genre-toggle {
  width: 100%;
  padding: 12px 12px 12px 40px;
  background-color: #2a2a3a;
  border: 1px solid #444;
  border-radius: 8px;
  color: #bbb;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: border-color 0.2s;
}

.genre-toggle:active {
  border-color: #667eea;
}

.dropdown-icon {
  font-size: 12px;
  transition: transform 0.2s;
}

.genre-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: #2a2a3a;
  border: 1px solid #444;
  border-radius: 8px;
  margin-top: 4px;
  max-height: 300px;
  overflow-y: auto;
  z-index: 100;
}

.genre-list {
  padding: 8px 0;
}

.genre-option {
  width: 100%;
  padding: 10px 12px;
  background: none;
  border: none;
  color: #aaa;
  font-size: 14px;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.15s;
  border-bottom: 1px solid #3a3a4a;
}

.genre-option:last-child {
  border-bottom: none;
}

.genre-option:hover,
.genre-option:active {
  background-color: #3a3a4a;
}

.genre-option.active {
  background-color: #667eea;
  color: white;
}

.genre-loading {
  padding: 15px;
  text-align: center;
  color: #888;
  font-size: 14px;
}

.search-button {
  padding: 12px;
  background-color: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.search-button:active {
  background-color: #5568d3;
}

.results-section {
  padding: 24px 16px;
}

.results-hint {
  text-align: center;
  color: #888;
  font-size: 14px;
  margin: 40px 0;
}

.loading {
  text-align: center;
  padding: 40px 20px;
  color: #888;
  font-size: 14px;
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

.books-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 15px;
}

.book-card {
  background: #2a2a3a;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
}

.book-card:active {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
}

.book-cover {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
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
  color: #ddd;
  margin: 0 0 5px 0;
  font-weight: 600;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.author {
  font-size: 12px;
  color: #aaa;
  margin: 0 0 8px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.genre-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.genre-tag {
  font-size: 10px;
  background-color: #667eea;
  color: white;
  padding: 2px 6px;
  border-radius: 12px;
  display: inline-block;
}

.btn-want {
  width: 100%;
  margin-top: 10px;
  padding: 8px 12px;
  background-color: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.1s;
}

.btn-want:active {
  background-color: #5568d3;
  transform: scale(0.98);
}

.btn-want.disabled {
  background-color: #888;
  cursor: not-allowed;
  opacity: 0.6;
}

.btn-want.disabled:active {
  background-color: #888;
  transform: none;
}

@media (max-width: 600px) {
  .books-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 10px;
  }

  .search-container {
    gap: 10px;
  }

  .discover-title {
    font-size: 12px;
    margin-bottom: 16px;
  }
}
</style>
