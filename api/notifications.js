import { getDb } from '../lib/db.js';
import { requireAuth } from '../lib/auth.js';
import cors from 'cors';

const corsHandler = cors({ origin: true });

export default async function handler(req, res) {
  await new Promise((resolve) => {
    corsHandler(req, res, resolve);
  });

  try {
    const user = requireAuth(req);
    const tenantId = req.query.tenant_id || user.tenant_id;
    const db = getDb();

    if (req.method === 'GET') {
      const rows = await db`
        SELECT *
        FROM notifications
        WHERE tenant_id = ${tenantId}
        ORDER BY created_at DESC
      `;
      return res.json({ success: true, data: rows });
    }

    if (req.method === 'POST') {
      const { title, message, type } = req.body || {};
      if (!title || !message) {
        return res.status(400).json({ success: false, error: 'العنوان والرسالة مطلوبة' });
      }

      const inserted = await db`
        INSERT INTO notifications (tenant_id, title, message, type)
        VALUES (${tenantId}, ${title}, ${message}, ${type || 'info'})
        RETURNING id
      `;

      return res.json({ success: true, id: inserted[0].id });
    }

    if (req.method === 'PUT') {
      const { id, is_read } = req.body || {};
      if (!id) return res.status(400).json({ success: false, error: 'id مطلوب' });

      await db`
        UPDATE notifications
        SET is_read = ${!!is_read}
        WHERE id = ${id} AND tenant_id = ${tenantId}
      `;
      return res.json({ success: true });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    if (error.message === 'UNAUTHORIZED') {
      return res.status(401).json({ success: false, error: 'غير مصرح' });
    }
    console.error('Error with notifications:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في العملية' });
  }
}


