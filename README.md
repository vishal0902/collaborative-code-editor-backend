# WeCode Backend - Socket.IO with Authentication

A real-time collaborative coding platform backend with user authentication using Socket.IO, Express.js, and MongoDB.

## Features

- **User Authentication**: Register, login, logout, and profile management
- **Real-time Collaboration**: Socket.IO for real-time code sharing
- **JWT Security**: Secure token-based authentication
- **MongoDB Integration**: User data persistence
- **CORS Support**: Cross-origin resource sharing configured

## Setup Instructions

### 1. Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database
MONGO_URI=mongodb://localhost:27017/wecode

# JWT Secret (generate a strong secret key)
JWT_SECRET=your_super_secret_jwt_key_here_change_this_in_production

# Server Configuration
PORT=5000

# Client URL (for CORS)
CLIENT_URL=http://localhost:3000

# Environment
NODE_ENV=development
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Start the Server

Development mode:
```bash
pnpm run server:dev
```

Production mode:
```bash
pnpm run server:prod
```

## API Endpoints

### Authentication Routes (`/api/auth`)

#### Register User
- **POST** `/api/auth/register`
- **Body**: `{ "username": "string", "email": "string", "password": "string" }`
- **Response**: `{ "message": "string", "token": "string", "user": { "id": "string", "username": "string", "email": "string" } }`

#### Login User
- **POST** `/api/auth/login`
- **Body**: `{ "email": "string", "password": "string" }`
- **Response**: `{ "message": "string", "token": "string", "user": { "id": "string", "username": "string", "email": "string" } }`

#### Get User Profile
- **GET** `/api/auth/profile`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `{ "user": { "id": "string", "username": "string", "email": "string", "createdAt": "date" } }`

#### Logout User
- **POST** `/api/auth/logout`
- **Response**: `{ "message": "Logged out successfully" }`

## Socket.IO Events

### Client to Server

#### Join Room
- **Event**: `join`
- **Data**: `{ "roomId": "string" }`
- **Authentication**: Required (JWT token in auth object)

#### Code Change
- **Event**: `code-change`
- **Data**: `{ "roomId": "string", "code": "string" }`

#### Sync Code
- **Event**: `sync-code`
- **Data**: `{ "socketId": "string", "code": "string" }`

### Server to Client

#### User Joined
- **Event**: `joined`
- **Data**: `{ "clients": [array], "username": "string", "socketId": "string", "userId": "string" }`

#### Code Change Broadcast
- **Event**: `code-change`
- **Data**: `{ "code": "string", "socketId": "string", "username": "string", "userId": "string" }`

#### User Disconnected
- **Event**: `disconnected`
- **Data**: `{ "socketId": "string", "username": "string", "userId": "string" }`

## Socket.IO Client Connection

```javascript
import { io } from 'socket.io-client';

// Connect with authentication
const socket = io('http://localhost:5000', {
  auth: {
    token: 'your-jwt-token-here'
  }
});

// Join a room
socket.emit('join', { roomId: 'room-123' });

// Listen for events
socket.on('joined', (data) => {
  console.log('User joined:', data);
});

socket.on('code-change', (data) => {
  console.log('Code changed:', data);
});
```

## Security Features

- **Password Hashing**: Using bcrypt for secure password storage
- **JWT Tokens**: Secure token-based authentication
- **Socket Authentication**: All Socket.IO connections require valid JWT tokens
- **CORS Protection**: Configured for specific client origins
- **Input Validation**: Server-side validation for all user inputs

## Database Schema

### User Model
```javascript
{
  username: String (required, unique),
  email: String (required),
  password: String (required, min: 8, max: 60, select: false),
  createdAt: Date (default: Date.now),
  updatedAt: Date (default: Date.now)
}
```

## Error Handling

The API returns appropriate HTTP status codes and error messages:

- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid credentials, missing token)
- `403` - Forbidden (invalid token)
- `404` - Not Found (user not found)
- `500` - Internal Server Error

## Development Notes

- The server uses ES modules (`"type": "module"` in package.json)
- Socket.IO connections are authenticated using JWT tokens
- All user passwords are automatically hashed before saving
- The server automatically connects to MongoDB on startup
- CORS is configured to allow requests from the specified client URL

