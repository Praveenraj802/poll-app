# Deployment Guide - Polling App

Follow these steps to deploy your Polling App worldwide.

## 1. Database Setup (MongoDB Atlas)
1.  Create a free account on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2.  Create a new project and a free cluster (Shared).
3.  Go to **Database Access** and create a user (Username & Password). **Note these down.**
4.  Go to **Network Access** and click **Add IP Address**. Choose **Allow Access from Anywhere** (0.0.0.0/0).
5.  Go to **Database** -> **Browse Collections** -> **Connect**.
6.  Select **Connect your application** -> **Drivers** (Node.js).
7.  Copy the Connection String. It should look like:
    `mongodb+srv://<username>:<password>@cluster0.xxxx.mongodb.net/polling-app?retryWrites=true&w=majority`
    Replace `<username>` and `<password>` with your database user credentials.

## 2. Backend Deployment (Render)
1.  Push your code to a GitHub repository.
2.  Login to [Render](https://render.com/).
3.  Click **New +** -> **Web Service**.
4.  Connect your GitHub repository.
5.  Set the following:
    - **Name**: `polling-app-backend`
    - **Root Directory**: `backend` (If you push the whole repo, specify `backend` as the base directory)
    - **Runtime**: `Node`
    - **Build Command**: `npm install`
    - **Start Command**: `npm start`
6.  Go to the **Environment** tab and add:
    - `MONGODB_URI`: (Your Atlas Connection String)
    - `PORT`: `5000`
    - `JWT_SECRET`: (A long random string, e.g., `supersecretkey123`)
    - `FRONTEND_URL`: (You will get this after deploying the frontend, update it later)
7.  Deploy. Once successful, copy the service URL (e.g., `https://polling-app-backend.onrender.com`).

## 3. Frontend Deployment (Vercel)
1.  Login to [Vercel](https://vercel.com/).
2.  Click **Add New** -> **Project**.
3.  Connect your GitHub repository.
4.  Set the following:
    - **Project Name**: `polling-app-frontend`
    - **Framework Preset**: `Create React App`
    - **Root Directory**: `frontend`
5.  Open **Environment Variables** and add:
    - `REACT_APP_API_URL`: `https://polling-app-backend.onrender.com/api` (Use your actual backend URL + `/api`)
6.  Click **Deploy**.
7.  Once deployed, copy your frontend URL (e.g., `https://polling-app-frontend.vercel.app`).

## 4. Final Connection
1.  Go back to your **Render** (Backend) service settings.
2.  Update the `FRONTEND_URL` environment variable to your actual frontend URL.
3.  Restart the backend service.

Your Polling App is now live!
