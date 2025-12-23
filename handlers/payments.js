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
        SELECT
          p.*,
          c.full_name as customer_name,
          u.full_name as employee_name
        FROM payments p
        LEFT JOIN customers c ON p.customer_id = c.id
        LEFT JOIN users u ON p.assigned_to = u.id
        WHERE p.tenant_id = ${tenantId}
        ORDER BY p.payment_date DESC, p.created_at DESC
      `;
      return res.json({ success: true, data: rows });
    }

    if (req.method === 'POST') {
      const {
        customer_id,
        amount,
        payment_date,
        payment_method,
        receipt_number,
        notes,
        assigned_to
      } = req.body || {};

      if (!customer_id || !amount || !payment_date) {
        return res.status(400).json({ success: false, error: 'بيانات الدفع غير مكتملة' });
      }

      const inserted = await db`
        INSERT INTO payments (
          tenant_id, customer_id, amount, payment_date,
          payment_method, receipt_number, notes, assigned_to
        )
        VALUES (
          ${tenantId}, ${customer_id}, ${amount}, ${new Date(payment_date)},
          ${payment_method || null}, ${receipt_number || null}, ${notes || null},
          ${assigned_to || user.id || null}
        )
        RETURNING id
      `;

      return res.json({ success: true, id: inserted[0].id, message: 'تم إضافة الدفعة بنجاح' });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    if (error.message === 'UNAUTHORIZED') {
      return res.status(401).json({ success: false, error: 'غير مصرح' });
    }
    console.error('Error with payments:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في العملية' });
  }
}


