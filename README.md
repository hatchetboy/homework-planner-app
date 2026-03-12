# 🎓 Homework Planner - Magic Planner 🚀

A vibrant, AI-powered scheduling app designed to help students manage their homework and extracurriculars seamlessly. Built with **React**, **TypeScript**, and **Vite**, and powered by **Google Gemini**.

[Live Demo](https://homework-planner-5635821869.us-central1.run.app)

## ✨ Features

- **🪄 Magic Planner (AI Mode)**: Use natural language to describe your tasks (e.g., "I have 30 mins of Math and an English essay due tomorrow"). The AI automatically calculates durations and organizes your evening.
- **⏰ Fixed-Time Scheduling**: Lock specific events (like "Dinner at 6:00 PM"). The scheduler automatically reshuffles flexible tasks and inserts "Free Time" gaps to ensure you hit your deadlines.
- **🔄 Standing Items**: Set recurring daily tasks (e.g., "Piano Practice", "Vocal Warmup") in your settings. These are automatically included in every schedule.
- **📅 Google Calendar Sync**: Export your generated schedule directly to your Google Calendar with one click.
- **🌈 Playful UI**: A "glassmorphism" design system tailored for a premium, accessible student experience.
- **🔐 Secure Google Auth**: Login safely with your Google account to save settings and access calendar features.

## 🛠️ Tech Stack

- **Frontend**: React, Vite, Tailwind CSS (Vanilla CSS for custom components)
- **AI**: Google Gemini 1.5 Flash
- **Auth/API**: Google OAuth 2.0, Google Calendar API
- **Deployment**: Google Cloud Run (Dockerized)

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18+)
- **NPM** or **Yarn**
- A **Google Cloud Project** (for OAuth Client ID)
- A **Google AI Studio** API Key (for Gemini)

### 2. Installation
```bash
git clone https://github.com/hatchetboy/homework-planner-app.git
cd homework-planner-app
npm install
```

### 3. Configuration
Create a `.env` file in the root directory and add your credentials:
```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
VITE_GEMINI_API_KEY=your_gemini_api_key
```

### 4. Running Locally
```bash
npm run dev
```
Open `http://localhost:5174` in your browser.

## 📦 Building & Deployment

### Local Build
```bash
npm run build
```

### Docker
```bash
docker build -t homework-planner .
docker run -p 8080:8080 homework-planner
```

### Cloud Run Deployment
You can deploy directly using the Google Cloud CLI:
```bash
gcloud run deploy homework-planner --source . --region us-central1 --allow-unauthenticated
```

## 📝 License
MIT
