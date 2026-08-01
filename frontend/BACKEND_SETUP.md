# Backend Setup Guide - Node.js + MySQL

## Step 1: Create MySQL Database

### Option A: Using MySQL Command Line
```bash
# Connect to MySQL
mysql -u root -p

# Then copy-paste the entire contents of MYSQL_SCHEMA.sql
# Or run:
mysql -u root -p < MYSQL_SCHEMA.sql
```

### Option B: Using MySQL Workbench
1. Open MySQL Workbench
2. Connect to your server
3. File → Open SQL Script → Select MYSQL_SCHEMA.sql
4. Click Execute (⚡ button)

### Option C: Using phpMyAdmin (Shared Hosting)
1. Go to your hosting control panel (cPanel, Plesk, etc.)
2. Open phpMyAdmin
3. Create new database: `bookworm_db`
4. Go to Import tab
5. Choose MYSQL_SCHEMA.sql and click Import

---

## Step 2: Verify Database

After running the schema, verify with:

```sql
USE bookworm_db;
SHOW TABLES;

-- Should show:
-- users
-- books
-- reviews (optional)
-- wishlist (optional)
```

---

## Database Schema Overview

### **users** table
- Stores user info from Firebase
- Links Firebase UID to database ID
- Stores profile data (name, bio, city, genre)

### **books** table
- All books uploaded by users
- Includes title, author, genre, description
- Status: available/borrowed/unavailable
- Ratings system ready

### **reviews** table (for later)
- User reviews for books
- 1-5 star ratings
- Review text

### **wishlist** table (for later)
- Books users want to read
- Favorites list

---

## Next: Backend Setup

Once your database is created, tell me:
- Your MySQL host (localhost or shared hosting domain)
- Your MySQL username
- Your MySQL password
- Your database name (should be `bookworm_db`)

Then I'll create the Node.js + Sequelize backend with these API endpoints:

### Auth
- `POST /api/auth/register` - Create user profile after Firebase signup
- `GET /api/auth/user/:firebaseUid` - Get user by Firebase UID

### Books
- `GET /api/books` - Get all books (with search/filter)
- `GET /api/books/:id` - Get single book
- `POST /api/books` - Upload new book (requires auth)
- `PUT /api/books/:id` - Update book (owner only)
- `DELETE /api/books/:id` - Delete book (owner only)
- `GET /api/books/user/:userId` - Get user's books

### Search
- `GET /api/books/search?q=query` - Full-text search

### Reviews (for later)
- `POST /api/reviews` - Add review
- `GET /api/books/:id/reviews` - Get book reviews

---

## Cost Breakdown

| Service | Cost |
|---------|------|
| Shared Hosting (Node.js) | $3-5/month |
| MySQL Database | Included |
| Total | ~$5/month |

**vs Firestore**: Would cost $15-50+/month at scale!

🎉 Ready for backend setup?
