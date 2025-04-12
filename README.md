# CU Explore Server

A server application for the CU Explore project.

## Description

This repository contains the server-side code for the CU Explore project. It provides the backend services and APIs required for the application.

## Getting Started

### Prerequisites
- Node.js
- npm
- Firebase service account key

### Environment Setup

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit the `.env` file and set your Firebase service account path:
```
FIREBASE_SERVICE_ACCOUNT_PATH=/Users/YOUR_USERNAME/.config/firebase/service-account.json
```

3. Place your Firebase service account key in the specified location:
```bash
mkdir -p ~/.config/firebase
mv /path/to/your-firebase-key.json ~/.config/firebase/service-account.json
```

### Installation

1. Install dependencies:
```bash
npm install
```

2. Build the project:
```bash
npm run build
```

3. Run in development mode:
```bash
npm run dev
```

## License

This project is licensed under the MIT License - see the LICENSE file for details. 