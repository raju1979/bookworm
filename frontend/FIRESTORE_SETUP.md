# Firestore Setup Guide

## Step 1: Enable Firestore in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project "bookworm-3ae83"
3. Go to **Firestore Database** (in left menu)
4. Click **Create Database**
5. Choose:
   - **Start in production mode** (important for security)
   - Region: `us-central1` (or closest to you)
6. Click **Create**

---

## Step 2: Add Security Rules

1. In Firebase Console, go to **Firestore Database**
2. Click the **Rules** tab
3. Replace ALL the text with the rules below:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Books collection
    match /books/{bookId} {
      // Anyone can read all books
      allow read: if true;
      
      // Only the owner can write their book
      allow write: if request.auth.uid == resource.data.userId;
      
      // Only the owner can delete their book
      allow delete: if request.auth.uid == resource.data.userId;
      
      // Anyone authenticated can create a new book (but userId gets auto-set)
      allow create: if request.auth.uid != null &&
                       request.resource.data.userId == request.auth.uid &&
                       request.resource.data.userEmail == request.auth.token.email &&
                       request.resource.data.title is string &&
                       request.resource.data.author is string &&
                       request.resource.data.genre is string;
    }

    // User profiles (optional - for future use)
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }

    // Deny everything else by default
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

4. Click **Publish**

---

## Step 3: Test the Rules

You can now:

1. **Signup/Login** in the app
2. **Upload a book** from the "My Shelf" tab
3. **View all books** on the "Home" tab
4. **Delete only your books** from "My Shelf"
5. **Search books** by title, author, or genre

---

## Security Features

✅ **Read**: Anyone can read all books (public library)
✅ **Create**: Only logged-in users can upload books
✅ **Write**: Only the owner can edit their book
✅ **Delete**: Only the owner can delete their book
✅ **Validation**: Books must have title, author, genre
✅ **Timestamp**: Automatic created/updated timestamps

---

## Data Structure

Each book document looks like:
```javascript
{
  id: "auto-generated",
  title: "The Great Gatsby",
  author: "F. Scott Fitzgerald",
  genre: "Fiction",
  description: "A classic novel...",
  userId: "user-uid-12345",
  userEmail: "user@example.com",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

---

## Troubleshooting

If you get permission errors:
- Make sure you're logged in
- Check that your UID is being saved correctly
- Try refreshing the page
- Check browser console (F12) for error details

If books aren't showing:
- Make sure you published the rules
- Give Firestore a few seconds to initialize
- Try uploading a test book first
