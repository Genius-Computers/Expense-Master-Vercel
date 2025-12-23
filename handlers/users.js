import { getDb } from '../lib/db.js';
import { requireAuth } from '../lib/auth.js';
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
    const db = getDb();

    if (req.method === 'GET') {
      const rows = await db`
        SELECT id, tenant_id, username, full_name, email, phone, role, role_id, is_active, created_at
        FROM users
        WHERE tenant_id = ${tenantId}
        ORDER BY created_at DESC
      `;

      const data = rows.map((u) => {
        const roleId = u.role_id ?? (u.role === 'superadmin' ? 1 : u.role === 'admin' ? 2 : 3);
        const roleInfo = roleFromRoleId(roleId);
        return {
          ...u,
          role_id: roleId,
          role_name: roleInfo.role_name,
          permissions_count: 0
        };
      });

      return res.json({ success: true, data });
    }

    if (req.method === 'POST') {
      const { full_name, username, password, email, phone, role_id, is_active } = req.body || {};

      if (!full_name || !username || !password) {
        return res.status(400).json({ success: false, error: 'الاسم واسم المستخدم وكلمة المرور مطلوبة' });
      }

      const roleId = parseInt(role_id || 3, 10);
      const roleInfo = roleFromRoleId(roleId);

      const inserted = await db`
        INSERT INTO users (tenant_id, username, password, full_name, email, phone, role, role_id, is_active)
        VALUES (
          ${tenantId},
          ${username},
          ${password},
          ${full_name},
          ${email || null},
          ${phone || null},
          ${roleInfo.role},
          ${roleId},
          ${is_active === undefined ? true : !!parseInt(is_active, 10)}
        )
        RETURNING id
      `;

      return res.json({ success: true, id: inserted[0].id, message: 'تم إضافة المستخدم بنجاح' });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    if (error.message === 'UNAUTHORIZED') {
      return res.status(401).json({ success: false, error: 'غير مصرح' });
    }
    console.error('Error with users:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في العملية' });
  }
}


