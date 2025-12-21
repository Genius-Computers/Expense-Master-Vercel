import { getDb } from '../lib/db.js';
import { requireAuth } from '../lib/auth.js';
import cors from 'cors';

const corsHandler = cors({ origin: true });

export default async function handler(req, res) {
  await new Promise((resolve) => {
    corsHandler(req, res, resolve);
  });

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const user = requireAuth(req);
    
    if (user.role !== 'superadmin') {
      return res.status(403).json({ success: false, error: 'غير مصرح' });
    }

    const db = getDb();
    const tenants = await db`
      SELECT * FROM tenants 
      ORDER BY name
    `;
    
    res.json(tenants);
  } catch (error) {
    if (error.message === 'UNAUTHORIZED') {
      return res.status(401).json({ success: false, error: 'غير مصرح' });
    }
    console.error('Error fetching tenants:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في جلب الشركات' });
  }
}


