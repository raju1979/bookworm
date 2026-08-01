import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  deleteDoc,
  doc
} from 'firebase/firestore';
import { firebaseAuth } from './firebaseService';

const db = getFirestore();

export const firestoreService = {
  // Add a new book to user's shelf
  async uploadBook(bookData) {
    const user = firebaseAuth.getCurrentUser();
    if (!user) throw new Error('User must be logged in');

    try {
      const docRef = await addDoc(collection(db, 'books'), {
        ...bookData,
        userId: user.uid,
        userEmail: user.email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return { id: docRef.id, ...bookData };
    } catch (error) {
      console.error('Error uploading book:', error);
      throw error;
    }
  },

  // Get all books (for home page)
  async getAllBooks() {
    try {
      const q = query(collection(db, 'books'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      }));
    } catch (error) {
      console.error('Error fetching books:', error);
      throw error;
    }
  },

  // Get user's books (for MyShelf)
  async getUserBooks() {
    const user = firebaseAuth.getCurrentUser();
    if (!user) throw new Error('User must be logged in');

    try {
      const q = query(
        collection(db, 'books'),
        where('userId', '==', user.uid)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      }));
    } catch (error) {
      console.error('Error fetching user books:', error);
      throw error;
    }
  },

  // Delete a book
  async deleteBook(bookId) {
    const user = firebaseAuth.getCurrentUser();
    if (!user) throw new Error('User must be logged in');

    try {
      await deleteDoc(doc(db, 'books', bookId));
    } catch (error) {
      console.error('Error deleting book:', error);
      throw error;
    }
  },

  // Search books
  async searchBooks(searchTerm) {
    try {
      const allBooks = await this.getAllBooks();
      const term = searchTerm.toLowerCase();
      return allBooks.filter(book =>
        book.title?.toLowerCase().includes(term) ||
        book.author?.toLowerCase().includes(term) ||
        book.genre?.toLowerCase().includes(term)
      );
    } catch (error) {
      console.error('Error searching books:', error);
      throw error;
    }
  },
};
