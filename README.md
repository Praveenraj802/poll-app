# 🗳️ Worldwide Polling App

A full-stack polling application built with React, Node.js, Express, and MongoDB. Secure, deployable, and ready for the world.

## 📂 Project Structure

```
polling-app/
├── backend/
│   ├── models/
│   │   └── Poll.js       # Mongoose Schema
│   ├── routes/
│   │   └── polls.js      # API Routes
│   ├── server.js         # Main Server File
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── CreatePoll.js
    │   │   ├── PollDetails.js
    │   │   └── PollList.js
    │   ├── api.js        # Axios Setup
    │   ├── App.js        # Routing
    │   └── index.js
    └── package.json
```

---

## 🚀 Setup & Deployment Guide

### 1. Database Setup (MongoDB Atlas)
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a generic free cluster.
3. In "Database Access", create a user (e.g., `admin`) and password.
4. In "Network Access", allow access from anywhere (`0.0.0.0/0`).
5. Go to "Database" > "Connect" > "Drivers" and copy your connection string.
   - Replace `<password>` with your actual password.
   - Example: `mongodb+srv://admin:mypassword@cluster0.mongodb.net/polling-app?retryWrites=true&w=majority`

---

### 2. Backend Deployment (Render or Railway)

#### Option A: Render
1. Push your code to GitHub.
2. Go to [Render](https://render.com/).
3. Create a **Web Service**.
4. Connect your repository.
5. **Root Directory**: `backend` (Important!)
6. **Build Command**: `npm install`
7. **Start Command**: `node server.js`
8. **Environment Variables**:
   - `MONGODB_URI`: *Paste your MongoDB connection string*
   - `FRONTEND_URL`: *Leave blank for now, come back and update after frontend deployment (e.g., https://my-poll-app.vercel.app)*
   - `PORT`: `5000` (Optional, Render sets this automatically)
9. Click **Create Web Service**.
10. Copy your **Backend URL** (e.g., `https://polling-backend.onrender.com`).

---

### 3. Frontend Deployment (Vercel or Netlify)

#### Option A: Vercel
1. Go to [Vercel](https://vercel.com/).
2. Click **Add New** > **Project**.
3. Import your repository.
4. **Root Directory**: Edit and select `frontend`.
5. **Environment Variables**:
   - `REACT_APP_API_URL`: *Paste your Backend URL + /api/polls*
     - Example: `https://polling-backend.onrender.com/api/polls`
6. Click **Deploy**.
7. Copy your **Frontend URL** (e.g., `https://my-poll-app.vercel.app`).

---

### 4. Final Connection
1. Go back to your Backend setup (Render/Railway).
2. Update the `FRONTEND_URL` environment variable with your new Frontend URL.
   - Example: `https://my-poll-app.vercel.app`
3. Redeploy the backend (Manual deploy or auto-deploy on push).

---

### 🏃 Run Locally

**1. Install all dependencies:**
```powershell
npm.cmd run install-all
```

**2. Database Connection:**
Update `backend/.env` with your `MONGODB_URI`.

**3. Demo Data (Optional):**
To quickly see an example poll, run:
```powershell
cd backend
node seed.js
```

**4. Start the App:**
```powershell
npm.cmd start
```
The app will open at `http://localhost:3000`.

---

## 🛠️ Tech Stack
- **Frontend**: React, Axios, React Router
- **Backend**: Node.js, Express
- **Database**: MongoDB Atlas
