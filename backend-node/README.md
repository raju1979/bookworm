# BookWorm API

A NestJS + Sequelize REST API for the BookWorm application.

## Features

- User Management (CRUD)
- Book Management (CRUD)
- MySQL Database with Sequelize ORM
- Comprehensive validation using class-validator
- CORS enabled for Angular frontend
- TypeScript strict mode enabled

## Prerequisites

- Node.js 18+
- npm or yarn
- MySQL 5.7+

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file in the root directory:

```env
NODE_ENV=development
PORT=3000

# Database
DB_DIALECT=mysql
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=bookwork_db
```

## Running the Application

### Development

```bash
npm run start:dev
```

### Production

```bash
npm run build
npm run start:prod
```

## API Endpoints

### Users

- `POST /users` - Create a new user
- `GET /users` - Get all users
- `GET /users/:id` - Get user by ID
- `GET /users/supabase/:supabaseUid` - Get user by Supabase UID
- `GET /users/email/:email` - Get user by email
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user

### Books

- `POST /books` - Create a new book
- `GET /books` - Get all books
- `GET /books/:id` - Get book by ID
- `GET /books/user/:userId` - Get books by user ID
- `PUT /books/:id` - Update book
- `DELETE /books/:id` - Delete book

## Database Schema

### Users Table

```sql
CREATE TABLE users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  supabase_uid VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  bio TEXT,
  city VARCHAR(255),
  favorite_genre VARCHAR(255),
  profile_image LONGTEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Books Table

```sql
CREATE TABLE books (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(255) NOT NULL,
  genre VARCHAR(100) NOT NULL,
  description TEXT,
  isbn VARCHAR(20),
  publication_year INT,
  pages INT,
  language VARCHAR(50) DEFAULT 'English',
  book_image LONGTEXT,
  status ENUM('available', 'borrowed', 'unavailable') DEFAULT 'available',
  rating DECIMAL(3,2) DEFAULT 0,
  total_ratings INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## Project Structure

```
src/
├── main.ts
├── app.module.ts
├── modules/
│   ├── users/
│   │   ├── entities/
│   │   │   └── user.entity.ts
│   │   ├── dto/
│   │   │   ├── create-user.dto.ts
│   │   │   └── update-user.dto.ts
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   └── users.module.ts
│   └── books/
│       ├── entities/
│       │   └── book.entity.ts
│       ├── dto/
│       │   ├── create-book.dto.ts
│       │   └── update-book.dto.ts
│       ├── books.controller.ts
│       ├── books.service.ts
│       └── books.module.ts
```

## Good Practices Implemented

✅ **Modular Architecture** - Separate modules for different features
✅ **DTOs** - Data validation using class-validator
✅ **Proper Error Handling** - HTTP exceptions with meaningful messages
✅ **Strict TypeScript** - Full type safety with declare types
✅ **CORS** - Configured for frontend consumption
✅ **Sequelize ORM** - Type-safe database queries
✅ **Environment Configuration** - Externalized config using dotenv
✅ **Service Layer** - Business logic separated from controllers
✅ **Global Validation Pipe** - Automatic request validation

## License

MIT
