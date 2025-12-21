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
    const tenantId = req.query.tenant_id || user.tenant_id;
    
    const db = getDb();
    const customers = await db`
      SELECT * FROM customers 
      WHERE tenant_id = ${tenantId} 
      ORDER BY created_at DESC
    `;
    
    res.json(customers);
  } catch (error) {
    if (error.message === 'UNAUTHORIZED') {
      return res.status(401).json({ success: false, error: 'غير مصرح' });
    }
    console.error('Error fetching customers:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في جلب العملاء' });
  }
}


