import { getDb } from '../../lib/db.js';
import { requireAuth } from '../../lib/auth.js';
import cors from 'cors';

const corsHandler = cors({ origin: true });

function roleFromRoleId(roleId) {
  if (roleId === 1) return { role: 'superadmin', role_name: 'مدير النظام' };
  if (roleId === 2) return { role: 'admin', role_name: 'شركة مشتركة' };
  return { role: 'employee', role_name: 'مستخدم عادي' };
}

export default async function handler(req, res) {
  await new Promise((resolve) => {
    corsHandler(req, res, resolve);
  });

  try {
    const user = requireAuth(req);
    const tenantId = req.query.tenant_id || user.tenant_id;
    const { id } = req.query;
    const db = getDb();

    if (req.method === 'PUT') {
      const { full_name, email, phone, role_id, is_active } = req.body || {};
      const roleId = role_id !== undefined ? parseInt(role_id, 10) : undefined;
      const roleInfo = roleId ? roleFromRoleId(roleId) : null;

      await db`
        UPDATE users
        SET full_name = COALESCE(${full_name}, full_name),
            email = COALESCE(${email}, email),
            phone = COALESCE(${phone}, phone),
            role_id = COALESCE(${roleId ?? null}, role_id),
            role = COALESCE(${roleInfo?.role ?? null}, role),
            is_active = COALESCE(${is_active === undefined ? null : !!parseInt(is_active, 10)}, is_active)
        WHERE id = ${id} AND tenant_id = ${tenantId}
      `;

      return res.json({ success: true });
    }

    if (req.method === 'DELETE') {
      await db`
        DELETE FROM users
        WHERE id = ${id} AND tenant_id = ${tenantId}
      `;
      return res.json({ success: true, message: 'تم حذف المستخدم بنجاح' });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    if (error.message === 'UNAUTHORIZED') {
      return res.status(401).json({ success: false, error: 'غير مصرح' });
    }
    console.error('Error with user by id:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في العملية' });
  }
}


