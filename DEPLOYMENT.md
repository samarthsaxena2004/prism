# Deploying Prism 🚀

Prism consists of two parts: a Python FastAPI backend (`prism-api`) and a Next.js frontend (`prism-app`). For the hackathon, we highly recommend deploying the backend to **Railway** and the frontend to **Vercel** because both services are free, fast, and require almost zero configuration.

---

## 1. Deploying the Backend (Railway)

We use Railway for the backend because it natively supports Python and automatically installs the Linux `tesseract-ocr` package required for vision extraction, simply because we included an `Aptfile`.

### Steps:
1. Push all your latest code to your GitHub repository (`prism`).
2. Go to [Railway.app](https://railway.app/) and log in with GitHub.
3. Click **New Project** → **Deploy from GitHub repo**.
4. Select your `samarthsaxena2004/prism` repository.
5. Railway will automatically detect the backend because of the `Procfile`.
6. Once the project is created, click on the deployed service, go to the **Variables** tab, and add your API keys:
   - `CEREBRAS_API_KEY` = `your_cerebras_key`
   - `OPENROUTER_API_KEY` = `your_openrouter_key`
   - `BING_API_KEY` = `your_bing_key` (optional, for deep research)
7. Go to the **Settings** tab, scroll down to **Networking**, and click **Generate Domain**.
8. Copy that domain URL! You will need it for the frontend.

---

## 2. Deploying the Frontend (Vercel)

Next.js apps deploy effortlessly on Vercel. 

### Steps:
1. Go to [Vercel.com](https://vercel.com/) and log in with GitHub.
2. Click **Add New...** → **Project**.
3. Import your `samarthsaxena2004/prism` repository.
4. **CRITICAL STEP**: Before clicking Deploy, you must configure the **Framework Preset** and **Root Directory**:
   - Next to **Root Directory**, click `Edit` and select `prism-app`.
   - Vercel will automatically detect the Framework Preset as `Next.js`.
5. Open the **Environment Variables** section and add:
   - Name: `NEXT_PUBLIC_API_URL`
   - Value: `https://<YOUR-RAILWAY-DOMAIN>` (Paste the domain you generated in Railway, e.g., `https://prism-api-production.up.railway.app`)
6. Click **Deploy**!

Within 2 minutes, your frontend will be live and talking to your Railway backend. Good luck with the Hackathon! 🎉
