# Blog API

A robust RESTful API for a blog platform built with Node.js, Express, TypeScript, and TypeORM.

## Features

- 🔐 User authentication with JWT
- 👥 Role-based access control (Admin, Author, User)
- 📝 CRUD operations for blog posts
- 📧 Email verification system
- 🔄 Password reset functionality
- 🛡️ Input validation and sanitization
- ⚡ Rate limiting for API protection
- 📦 TypeORM for database operations
- 🎯 TypeScript for type safety

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd blog-api
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=your_username
DB_PASSWORD=your_password
DB_NAME=blog_db
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=1d
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASS=your_password
```

4. Run database migrations:
```bash
npm run typeorm migration:run
```

5. Start the development server:
```bash
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/verify-email` - Verify user email
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Posts
- `GET /api/posts` - Get all posts
- `GET /api/posts/:id` - Get post by ID
- `POST /api/posts` - Create new post (Author/Admin only)
- `PUT /api/posts/:id` - Update post (Author/Admin only)
- `DELETE /api/posts/:id` - Delete post (Author/Admin only)

### Admin
- `GET /api/admin/users` - Get all users (Admin only)
- `PUT /api/admin/users/:id/role` - Update user role (Admin only)
- `DELETE /api/admin/users/:id` - Delete user (Admin only)

## Project Structure

```
src/
├── config/         # Configuration files
├── controllers/    # Route controllers
├── entities/       # TypeORM entities
├── middlewares/    # Custom middlewares
├── routes/         # API routes
├── utils/          # Utility functions
└── index.ts        # Application entry point
```

## Error Handling

The API uses a centralized error handling system with custom `ApiError` class for consistent error responses. All errors include:
- HTTP status code
- Error message
- Optional error details

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- CORS enabled
- Rate limiting
- Input validation and sanitization
- SQL injection protection (TypeORM)
- XSS protection

## Development

```bash
# Run in development mode
npm run dev

# Build for production
npm run build

# Run in production mode
npm start

# Run tests
npm test
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 