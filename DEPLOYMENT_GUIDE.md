# 🚀 Vercel + NeonDB Deployment Guide

Complete guide to deploy your Expense Master application to Vercel with NeonDB.

---

## 📋 Prerequisites

1. **Vercel Account** - Sign up at [vercel.com](https://vercel.com) (free)
2. **NeonDB Account** - Sign up at [neon.tech](https://neon.tech) (free tier available)
3. **GitHub Account** - For connecting your repository

---

## Step 1: Setup NeonDB Database

### 1.1 Create NeonDB Account
1. Go to [neon.tech](https://neon.tech)
2. Sign up (free tier is sufficient)
3. Create a new project

### 1.2 Get Connection String
1. In NeonDB dashboard, go to your project
2. Click on "Connection Details"
3. Copy the **Connection String** (looks like: `postgresql://user:password@host/database`)
4. Save this - you'll need it for Vercel environment variables

### 1.3 Run Database Schema
1. In NeonDB dashboard, go to **SQL Editor**
2. Open `schema.sql` from this folder
3. Copy all the SQL code
4. Paste into SQL Editor
5. Click **Run** to create all tables and sample data

---

## Step 2: Prepare Your Code

### 2.1 Copy Files
All files are in the `vercel-deploy` folder:
- `api/` - Serverless API functions
- `public/` - Static HTML files (design preserved!)
- `lib/` - Database and auth helpers
- `package.json` - Dependencies
- `vercel.json` - Vercel configuration

### 2.2 Verify Structure
Your folder should look like:
```
vercel-deploy/
├── api/
│   ├── login.js
│   ├── banks.js
│   ├── rates.js
│   ├── customers.js
│   ├── requests.js
│   ├── financing-types.js
│   └── tenants.js
├── lib/
│   ├── db.js
│   └── auth.js
├── public/
│   ├── index.html
│   └── login.html
├── package.json
├── vercel.json
└── schema.sql
```

---

## Step 3: Deploy to Vercel

### Option A: Via Vercel Dashboard (Easiest)

1. **Push to GitHub**
   ```bash
   cd vercel-deploy
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/expense-master.git
   git push -u origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click **Add New Project**
   - Import your GitHub repository
   - Select the `vercel-deploy` folder (or root if you put it there)

3. **Configure Environment Variables**
   - In Vercel project settings → Environment Variables
   - Add: `DATABASE_URL` = Your NeonDB connection string
   - Click **Save**

4. **Deploy**
   - Click **Deploy**
   - Wait for deployment to complete

### Option B: Via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   cd vercel-deploy
   vercel
   ```

4. **Set Environment Variable**
   ```bash
   vercel env add DATABASE_URL
   # Paste your NeonDB connection string when prompted
   ```

5. **Redeploy**
   ```bash
   vercel --prod
   ```

---

## Step 4: Verify Deployment

1. **Check Your Domain**
   - Vercel will give you a URL like: `your-app.vercel.app`
   - Visit it to see your homepage

2. **Test Login**
   - Go to `/login`
   - Use default credentials:
     - **Superadmin:** `superadmin` / `SuperAdmin@2025`
     - **Admin:** `admin` / `Admin@2025`

3. **Test API**
   ```bash
   curl https://your-app.vercel.app/api/banks
   ```

---

## ✅ What's Preserved

- ✅ **All Design** - HTML/CSS/Tailwind intact
- ✅ **All Features** - All API endpoints converted
- ✅ **Database Structure** - Converted from MySQL to PostgreSQL
- ✅ **Authentication** - Same auth system
- ✅ **Multi-tenant** - Full support maintained

---

## 🔧 Troubleshooting

### Database Connection Error
- Verify `DATABASE_URL` is set in Vercel environment variables
- Check NeonDB connection string is correct
- Ensure database schema was run successfully

### API Not Working
- Check Vercel function logs in dashboard
- Verify API routes are in `/api` folder
- Check `vercel.json` configuration

### Static Files Not Loading
- Ensure files are in `/public` folder
- Check `vercel.json` rewrites configuration

---

## 📝 Environment Variables

Required in Vercel:
- `DATABASE_URL` - Your NeonDB PostgreSQL connection string

---

## 🎉 Success!

Your app is now live on Vercel with NeonDB! 

**Benefits:**
- ✅ Free hosting (Vercel free tier)
- ✅ Free database (NeonDB free tier)
- ✅ Auto-deploy on Git push
- ✅ Global CDN
- ✅ HTTPS by default
- ✅ No server management needed

---

## 🔄 Updating Your App

1. Make changes to your code
2. Push to GitHub
3. Vercel automatically deploys!

---

**Need Help?** Check Vercel docs: https://vercel.com/docs


