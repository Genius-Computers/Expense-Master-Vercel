import { getDb } from '../lib/db.js';
import cors from 'cors';

const corsHandler = cors({ origin: true });

export default async function handler(req, res) {
  // Handle CORS
  await new Promise((resolve) => {
    corsHandler(req, res, resolve);
  });

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'اسم المستخدم وكلمة المرور مطلوبة' });
    }

    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ 
        success: false, 
        error: 'DATABASE_URL environment variable is not set. Please configure it in Vercel project settings.' 
      });
    }

    const db = getDb();
    const users = await db`
      SELECT * FROM users 
      WHERE username = ${username} AND password = ${password}
    `;

    if (users.length === 0) {
      return res.status(401).json({ success: false, error: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
    }

    const user = users[0];
    
    // Create session token
    const token = Buffer.from(JSON.stringify({
      id: user.id,
      username: user.username,
      role: user.role,
      tenant_id: user.tenant_id
    })).toString('base64');

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
        tenant_id: user.tenant_id
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في تسجيل الدخول' });
  }
}

