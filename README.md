# StudyPilot AI

A beginner-friendly AI study assistant built with React, Vite, Express, and the OpenAI Responses API.

## Features

- Responsive dashboard
- Create, edit, delete, and locally save study notes
- Import `.txt` study notes
- AI-generated summaries
- AI-generated multiple-choice quizzes with scoring and explanations
- AI-generated flashcards
- Local browser storage for notes

## Requirements

- Node.js 20.19+ (or a compatible current LTS version)
- npm
- An API key for the AI features

## 1. Install

Open a terminal in this folder and run:

```bash
npm install
```

## 2. Configure the API key

Copy `.env.example` to a new file named `.env`. Put your API key in `OPENAI_API_KEY` and confirm the model available in `OPENAI_MODEL`.

Example:

```env
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-6-astra
PORT=3001
```

Do not share `.env`, commit it to GitHub, put the key in React code, or exposes it in a `VITE_` variable. The included `.gitignore` excludes `.env`.

AI API usage may incur charges depending on your account and model. Check your account's current pricing and usage limits before testing.

## 3. Run the app

```bash
npm run dev
```

Open the Vite address printed in the terminal, usually:

http://127.0.0.1:5173

Keep the terminal open while using the app. It runs the React frontend and the Express API server together.

## 4. Try it

1. Open **My notes**.
2. Click **Load sample**, or paste your own study notes.
3. Save the notes.
4. Choose **Generate summary**, **Generate quiz**, or **Create flashcards**.
5. If you see an API configuration error, verify `.env` and restart `npm run dev`.

## Project structure

```text
StudyPilot-AI/
├── index.html
├── package.json
├── vite.config.js
├── .env.example
├── .gitignore
├── README.md
├── server/
│   └── index.js
└── src/
    ├── main.jsx
    ├── App.jsx
    └── styles.css
```

## What each file does

- `src/App.jsx`: dashboard UI, notes editor, quiz, flashcards, local persistence, and API calls.
- `src/style.css`: responsive styling and visual design.
- `src/main.jsx`: mounts the React application.
- `server/index.js`: validates requests and calls the AI API from the server.
- `vite.config.js`: forwards `/api` requests to the local Express server.
- `.env`: private configuration; and create this yourself from `.env.example`.

## Important limitations in this MVP

- Notes are stored in this browser only. Clearing browser can remove them.
- Only `.txt` upload is supported initially; PDF/DOCX parsing and cloud sync are future improvements.
- There is no user login yet.
- AI outputs may contain errors; check important information against trusted course materials.
- The server is configured for local development, not public production deployment. Before deploying, add authentication, rate limiting , stricter CORS, logging controls, and secure secret management.

## Build the frontend

```bash
npm run build
```

The output is written to `dist/`.