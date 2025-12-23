import { getDb } from '../../../lib/db.js';
import { requireAuth } from '../../../lib/auth.js';
import cors from 'cors';

const corsHandler = cors({ origin: true });

export default async function handler(req, res) {
  await new Promise((resolve) => {
    corsHandler(req, res, resolve);
  });

  if (req.method !== 'PUT') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const user = requireAuth(req);
    const tenantId = req.query.tenant_id || user.tenant_id;
    const { id } = req.query;
    const { status, notes } = req.body || {};

    if (!status) {
      return res.status(400).json({ success: false, error: 'الحالة مطلوبة' });
    }

    const db = getDb();

    const existing = await db`
      SELECT id, status FROM financing_requests
      WHERE id = ${id} AND tenant_id = ${tenantId}
      LIMIT 1
    `;

    if (!existing || existing.length === 0) {
      return res.status(404).json({ success: false, error: 'لم يتم العثور على الطلب' });
    }

    const oldStatus = existing[0].status;

    await db`
      UPDATE financing_requests
      SET status = ${status},
          notes = ${notes || null},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id} AND tenant_id = ${tenantId}
    `;

    // Record status change in history table (if exists)
    if (oldStatus !== status) {
      try {
        await db`
          INSERT INTO financing_request_status_history
            (tenant_id, request_id, old_status, new_status, changed_by, notes)
          VALUES
            (${tenantId}, ${id}, ${oldStatus || null}, ${status}, ${user.id || null}, ${notes || null})
        `;
      } catch (e) {
        // If table doesn't exist yet, don't fail the request
        console.warn('Status history insert skipped (table may not exist):', e?.message);
      }
    }

    return res.json({ success: true });
  } catch (error) {
    if (error.message === 'UNAUTHORIZED') {
      return res.status(401).json({ success: false, error: 'غير مصرح' });
    }
    console.error('Error updating request status:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ أثناء التحديث' });
  }
}


