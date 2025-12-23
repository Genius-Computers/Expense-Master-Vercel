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
      // Ensure request belongs to tenant
      const existing = await db`
        SELECT id FROM financing_requests
        WHERE id = ${id} AND tenant_id = ${tenantId}
        LIMIT 1
      `;

      if (!existing || existing.length === 0) {
        return res.status(404).json({ success: false, error: 'لم يتم العثور على الطلب' });
      }

      await db`
        DELETE FROM financing_requests
        WHERE id = ${id} AND tenant_id = ${tenantId}
      `;

      return res.json({ success: true, message: 'تم حذف الطلب بنجاح' });
    }

    if (req.method === 'GET') {
      const rows = await db`
        SELECT fr.*,
               COALESCE(fr.requested_amount, fr.amount) as requested_amount,
               COALESCE(fr.duration_months, fr.duration) as duration_months,
               c.full_name as customer_name,
               c.phone as customer_phone,
               c.email as customer_email,
               c.national_id as customer_national_id,
               c.birthdate as customer_birthdate,
               c.monthly_salary as customer_monthly_salary,
               b.name as selected_bank_name,
               ft.name as financing_type_name
        FROM financing_requests fr
        LEFT JOIN customers c ON fr.customer_id = c.id
        LEFT JOIN banks b ON COALESCE(fr.selected_bank_id, fr.bank_id) = b.id
        LEFT JOIN financing_types ft ON fr.financing_type_id = ft.id
        WHERE fr.id = ${id} AND fr.tenant_id = ${tenantId}
        LIMIT 1
      `;

      if (!rows || rows.length === 0) {
        return res.status(404).json({ success: false, error: 'لم يتم العثور على الطلب' });
      }

      return res.json({ success: true, data: rows[0] });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    if (error.message === 'UNAUTHORIZED') {
      return res.status(401).json({ success: false, error: 'غير مصرح' });
    }
    console.error('Error in financing request handler:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في العملية' });
  }
}


