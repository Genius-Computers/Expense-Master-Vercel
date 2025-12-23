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
    const db = getDb();

    // SuperAdmin can see all tenant calculators; others only see their own
    let tenants;
    if (user.role === 'superadmin') {
      tenants = await db`SELECT id, name, is_active FROM tenants ORDER BY name`;
    } else {
      tenants = await db`SELECT id, name, is_active FROM tenants WHERE id = ${user.tenant_id} LIMIT 1`;
    }

    const data = (tenants || []).map((t) => ({
      id: t.id,
      name: t.name,
      is_active: t.is_active,
      calculator_path: `/c/${t.id}/calculator`
    }));

    return res.json({ success: true, data });
  } catch (error) {
    if (error.message === 'UNAUTHORIZED') {
      return res.status(401).json({ success: false, error: 'غير مصرح' });
    }
    console.error('Error fetching tenant calculators:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في جلب البيانات' });
  }
}


