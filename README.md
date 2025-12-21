# 🚀 Expense Master - Vercel + NeonDB

Complete migration from Hostinger/MySQL to Vercel/NeonDB with all design preserved!

---

## ✅ What's Included

- ✅ **All API endpoints** converted to Vercel serverless functions
- ✅ **PostgreSQL schema** (NeonDB compatible)
- ✅ **All HTML/CSS design** preserved
- ✅ **Authentication system** maintained
- ✅ **Multi-tenant support** intact

---

## 🚀 Quick Start

### 1. Setup NeonDB
1. Sign up at [neon.tech](https://neon.tech)
2. Create a project
3. Run `schema.sql` in SQL Editor
4. Copy connection string

### 2. Deploy to Vercel
1. Push this folder to GitHub
2. Import to Vercel
3. Add environment variable: `DATABASE_URL` = your NeonDB connection string
4. Deploy!

See `DEPLOYMENT_GUIDE.md` for detailed steps.

---

## 📁 Project Structure

```
vercel-deploy/
├── api/              # Serverless API functions
│   ├── login.js
│   ├── banks.js
│   ├── rates.js
│   ├── customers.js
│   ├── requests.js
│   ├── financing-types.js
│   └── tenants.js
├── lib/              # Helper functions
│   ├── db.js         # Database connection
│   └── auth.js       # Authentication
├── public/           # Static files (HTML/CSS)
│   ├── index.html
│   └── login.html
├── schema.sql        # PostgreSQL database schema
├── package.json
├── vercel.json
└── DEPLOYMENT_GUIDE.md
```

---

## 🔑 Default Login Credentials

After running `schema.sql`:
- **Superadmin:** `superadmin` / `SuperAdmin@2025`
- **Admin:** `admin` / `Admin@2025`
- **Employee:** `admin1` / `Admin1@2025`

⚠️ **Change these after first login!**

---

## 📝 Environment Variables

Required in Vercel:
- `DATABASE_URL` - NeonDB PostgreSQL connection string

---

## 🎯 Features

- ✅ Serverless functions (no server management)
- ✅ Auto-scaling
- ✅ Global CDN
- ✅ HTTPS by default
- ✅ Free tier available
- ✅ Auto-deploy on Git push

---

**Ready to deploy?** Follow `DEPLOYMENT_GUIDE.md`!


