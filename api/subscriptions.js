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
        SELECT s.*,
               p.package_name
        FROM subscriptions s
        LEFT JOIN packages p ON s.package_id = p.id
        WHERE s.tenant_id = ${tenantId}
        ORDER BY s.created_at DESC
      `;
      return res.json({ success: true, data: rows });
    }

    if (req.method === 'POST') {
      const { company_name, package_id, start_date, end_date } = req.body || {};

      if (!company_name || !start_date || !end_date) {
        return res.status(400).json({ success: false, error: 'بيانات الاشتراك غير مكتملة' });
      }

      const inserted = await db`
        INSERT INTO subscriptions (tenant_id, company_name, package_id, start_date, end_date, status)
        VALUES (
          ${tenantId},
          ${company_name},
          ${package_id ? parseInt(package_id, 10) : null},
          ${new Date(start_date)},
          ${new Date(end_date)},
          'active'
        )
        RETURNING id
      `;

      return res.json({ success: true, id: inserted[0].id, message: 'تم إضافة الاشتراك بنجاح' });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    if (error.message === 'UNAUTHORIZED') {
      return res.status(401).json({ success: false, error: 'غير مصرح' });
    }
    console.error('Error with subscriptions:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في العملية' });
  }
}


