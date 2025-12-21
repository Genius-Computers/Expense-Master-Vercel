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
    const requests = await db`
      SELECT fr.*, c.full_name as customer_name, b.name as bank_name, u.full_name as employee_name
      FROM financing_requests fr
      LEFT JOIN customers c ON fr.customer_id = c.id
      LEFT JOIN banks b ON fr.bank_id = b.id
      LEFT JOIN users u ON fr.assigned_to = u.id
      WHERE fr.tenant_id = ${tenantId}
      ORDER BY fr.created_at DESC
    `;
    
    res.json(requests);
  } catch (error) {
    if (error.message === 'UNAUTHORIZED') {
      return res.status(401).json({ success: false, error: 'غير مصرح' });
    }
    console.error('Error fetching requests:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في جلب الطلبات' });
  }
}


