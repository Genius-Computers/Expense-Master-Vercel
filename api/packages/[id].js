import { getDb } from '../../lib/db.js';
import { requireAuth } from '../../lib/auth.js';
import cors from 'cors';

const corsHandler = cors({ origin: true });

export default async function handler(req, res) {
  await new Promise((resolve) => {
    corsHandler(req, res, resolve);
  });

  try {
    const user = requireAuth(req);
    const tenantId = req.query.tenant_id || user.tenant_id;
    const { id } = req.query;
    const db = getDb();

    if (req.method === 'DELETE') {
      await db`
        DELETE FROM packages
        WHERE id = ${id} AND tenant_id = ${tenantId}
      `;
      return res.json({ success: true, message: 'تم حذف الباقة بنجاح' });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    if (error.message === 'UNAUTHORIZED') {
      return res.status(401).json({ success: false, error: 'غير مصرح' });
    }
    console.error('Error with package by id:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في العملية' });
  }
}


