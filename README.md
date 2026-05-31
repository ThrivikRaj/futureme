# FutureMe — Meet the Version of You Who Already Made It

FutureMe is a premium, AI-powered personal reflection platform built in **Nitish’s Founder Labs**. Users input details about their current life parameters, goals, struggles, and aspirations. FutureMe then simulates a connection with the successful version of the user one year in the future, providing a personalized reflection profile and enabling real-time conversational follow-ups.

---

## Technical Stack
- **Frontend**: Premium HTML5, CSS3 (with custom animations and glassmorphism styling), Vanilla JavaScript
- **Backend**: Node.js + Express (serving the frontend statically and exposing secure APIs)
- **AI Engine**: Google Gemini API via `@google/generative-ai` (`gemini-1.5-flash`)

---

## File Structure
```
futureme/
  frontend/
    index.html     # HTML Layout & DOM Nodes
    style.css      # Core resets, Apple-style variables, and Chat UI styles
    script.js      # Form submissions, validation, clipboard actions, and chat flow
  backend/
    server.js      # Express Server & Gemini Integration API routes
    package.json   # Server dependencies (Express, dotenv, cors, generative-ai)
    .env.example   # Configuration guidelines file
  README.md        # This setup instruction guide
```

---

## Installation & Setup

### Step 1: Clone or navigate into the backend directory
Open your command terminal and enter:
```bash
cd futureme/backend
```

### Step 2: Install dependencies
Install package dependencies using:
```bash
npm install
```

### Step 3: Setup your environment key
Create a `.env` file in the `backend/` directory by copying `.env.example` or creating one manually:
```bash
cp .env.example .env
```
Open the `.env` file and replace the placeholder value with your real Gemini API key:
```env
GEMINI_API_KEY=your_actual_gemini_api_key
PORT=5000
```

### Step 4: Run the application
Run the development server with `nodemon` automatic reload enabled:
```bash
npm run dev
```
Or start the server normally:
```bash
npm start
```
The server will start, logging:
`FutureMe server successfully launched and running at http://localhost:5000`

### Step 5: Open the application
Open your web browser and navigate to:
```
http://localhost:5000
```
*(Since Express serves the frontend static directory automatically, there is no need to run a separate static file server!)*

---

## Backend API Routes

### 1. `POST /api/generate-futureme`
Calibrates the user's details and triggers Gemini to generate the initial FutureMe profile response.

- **Request Body**:
  ```json
  {
    "name": "Nitish",
    "age": "23",
    "goal": "Build a successful AI startup",
    "struggle": "Lack of consistency",
    "oneYearVision": "Running a profitable AI company",
    "tone": "Brutally Honest"
  }
  ```
- **Response Body**:
  ```json
  {
    "success": true,
    "data": {
      "message": "Hey Nitish, let's bypass the validation seeking. I am the version of you at the other side of this transition...",
      "futureIdentity": "A non-negotiable execution entity...",
      "nextMoves": [
        "Cut the primary optimization theater habit that disguised itself as productive activity today.",
        "Isolate the precise core bottleneck...",
        "Establish clear analytical dashboards..."
      ],
      "habit": "Stop negotiating timelines with your anxiety...",
      "warning": "One mistake your future self warns you about.",
      "mantra": "A short memorable line you can repeat daily."
    }
  }
  ```

### 2. `POST /api/chat-futureme`
Handles active real-time dialogue questions sent by the user, maintaining historical context and character tone.

- **Request Body**:
  ```json
  {
    "userProfile": {
      "name": "Nitish",
      "age": "23",
      "goal": "Build a successful AI startup",
      "struggle": "Lack of consistency",
      "oneYearVision": "Running a profitable AI company",
      "tone": "Brutally Honest"
    },
    "chatHistory": [
      { "role": "futureme", "message": "Hey Nitish, let's bypass..." }
    ],
    "question": "What should I focus on this week?"
  }
  ```
- **Response Body**:
  ```json
  {
    "success": true,
    "reply": "Focus on shipping a raw functional iteration of the product core. Stop over-engineering design systems..."
  }
  ```
