# Blog API

A RESTful blog API built with Node.js, Express, and PostgreSQL, featuring user authentication and CRUD operations for blog posts.

## Features

- User authentication with JWT
- Password hashing with bcrypt
- CRUD operations for blog posts
- Pagination for post listing
- Proper error handling
- PostgreSQL database with Sequelize ORM

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL
- npm or yarn

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd blog-api
```

2. Install dependencies:
```bash
npm install
```

3. Create a PostgreSQL database named `blog_db`

4. Create a `.env` file in the root directory with the following variables:
```
PORT=3000
DB_NAME=blog_db
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
JWT_SECRET=your-secret-key
```

5. Start the server:
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## API Endpoints

### Authentication

- `POST /api/register` - Register a new user
  - Body: `{ "username": "string", "email": "string", "password": "string" }`

- `POST /api/login` - Login user
  - Body: `{ "email": "string", "password": "string" }`

- `GET /api/profile` - Get user profile (requires authentication)
  - Header: `Authorization: Bearer <token>`

### Blog Posts

- `POST /api/posts` - Create a new post (requires authentication)
  - Header: `Authorization: Bearer <token>`
  - Body: `{ "title": "string", "body": "string" }`

- `GET /api/posts` - Get all posts (public)
  - Query params: `page` (default: 1), `limit` (default: 10)

- `GET /api/posts/:id` - Get single post by ID (public)

- `PUT /api/posts/:id` - Update a post (requires authentication)
  - Header: `Authorization: Bearer <token>`
  - Body: `{ "title": "string", "body": "string" }`

- `DELETE /api/posts/:id` - Delete a post (requires authentication)
  - Header: `Authorization: Bearer <token>`

## Error Handling

The API uses standard HTTP status codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

## Testing

You can test the API using tools like Postman or curl. Make sure to:
1. Register a new user
2. Login to get the JWT token
3. Use the token in the Authorization header for protected routes

## Security

- Passwords are hashed using bcrypt
- JWT tokens are used for authentication
- Environment variables for sensitive data
- Input validation and sanitization
- Proper error handling 