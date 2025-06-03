# CU Explore Server

A server application for the CU Explore project.

## Prerequisites

- Node.js (v18 or higher)
- npm
- MongoDB

## Environment Variables

The following environment variables are required:

- MongoDB connection string
- JWT secret key

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory with the following content:
```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=5001
```

3. Build the TypeScript code:
```bash
npm run build
```

4. Start the server:
```bash
npm start
```

For development, you can use:
```bash
npm run dev
```

## API Documentation

The API provides endpoints for:
- User authentication
- Course management
- Major requirements
- College information
- Schedule planning

## License

ISC 