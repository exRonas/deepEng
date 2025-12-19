# DeepEng - Educational Platform with AI

This is a full-stack educational platform for learning English, featuring an AI tutor powered by DeepSeek.

## Project Structure

- `/frontend`: React + Vite application
- `/backend`: Node.js + Express + SQLite API
- `/db`: Database files

## Prerequisites

- Node.js (v16+)
- npm

## Setup Instructions

### 1. Backend Setup

Navigate to the backend folder:
```bash
cd backend
```

Install dependencies:
```bash
npm install
```

Create a `.env` file based on `.env.example` and add your DeepSeek API key (optional for demo mode):
```bash
cp .env.example .env
```

Initialize the database:
```bash
npm run init-db
```

Start the server:
```bash
npm start
```
The server will run on `http://localhost:3000`.

### 2. Frontend Setup

Open a new terminal and navigate to the frontend folder:
```bash
cd frontend
```

Install dependencies:
```bash
npm install
```

Start the development server:
```bash
npm run dev
```
The application will run on `http://localhost:5173`.

## Features

- **Placement Test**: Determine your English level (A1-B2).
- **Modules**: View available learning modules based on your level.
- **AI Chat**: Floating chat widget available on all pages to ask questions, translate text, or practice conversation.
- **Progress Tracking**: (Basic implementation) Tracks user level.

## Tech Stack

- **Frontend**: React, React Router, Axios, Lucide React
- **Backend**: Express.js, SQLite
- **AI**: DeepSeek API Integration
