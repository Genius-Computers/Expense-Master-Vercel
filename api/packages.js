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
        FROM packages
        WHERE tenant_id = ${tenantId}
        ORDER BY created_at DESC
      `;
      return res.json({ success: true, data: rows });
    }

    if (req.method === 'POST') {
      const { package_name, description, price, duration_months, max_calculations, max_users } = req.body || {};

      if (!package_name || duration_months === undefined) {
        return res.status(400).json({ success: false, error: 'اسم الباقة والمدة مطلوبة' });
      }

      const inserted = await db`
        INSERT INTO packages (
          tenant_id, package_name, description, price, duration_months, max_calculations, max_users, is_active
        )
        VALUES (
          ${tenantId},
          ${package_name},
          ${description || null},
          ${price || 0},
          ${parseInt(duration_months, 10)},
          ${max_calculations ? parseInt(max_calculations, 10) : null},
          ${max_users ? parseInt(max_users, 10) : null},
          true
        )
        RETURNING id
      `;

      return res.json({ success: true, id: inserted[0].id, message: 'تم إضافة الباقة بنجاح' });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    if (error.message === 'UNAUTHORIZED') {
      return res.status(401).json({ success: false, error: 'غير مصرح' });
    }
    console.error('Error with packages:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في العملية' });
  }
}


