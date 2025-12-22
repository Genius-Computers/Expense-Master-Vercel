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
      const customers = await db`
        SELECT * FROM customers 
        WHERE tenant_id = ${tenantId} 
        ORDER BY created_at DESC
      `;
      
      return res.json({ success: true, data: customers });
    }

    if (req.method === 'POST') {
      const { full_name, phone, email, national_id, employment_type, monthly_salary, monthly_obligations, assigned_to } = req.body;

      if (!full_name) {
        return res.status(400).json({ success: false, error: 'اسم العميل مطلوب' });
      }

      const result = await db`
        INSERT INTO customers (tenant_id, full_name, phone, email, national_id, employment_type, monthly_salary, monthly_obligations, assigned_to)
        VALUES (${tenantId}, ${full_name}, ${phone || null}, ${email || null}, ${national_id || null}, ${employment_type || null}, ${monthly_salary || null}, ${monthly_obligations || null}, ${assigned_to || null})
        RETURNING id
      `;

      return res.json({ success: true, id: result[0].id });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    if (error.message === 'UNAUTHORIZED') {
      return res.status(401).json({ success: false, error: 'غير مصرح' });
    }
    console.error('Error with customers:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في العملية' });
  }
}


