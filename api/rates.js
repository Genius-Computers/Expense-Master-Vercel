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
      const rates = await db`
        SELECT r.*, b.name as bank_name, ft.name as financing_type_name
        FROM rates r
        LEFT JOIN banks b ON r.bank_id = b.id
        LEFT JOIN financing_types ft ON r.financing_type_id = ft.id
        WHERE r.tenant_id = ${tenantId}
        ORDER BY b.name, ft.name
      `;
      
      return res.json(rates);
    }

    if (req.method === 'POST') {
      const { bank_id, financing_type_id, rate, min_amount, max_amount, min_duration, max_duration } = req.body;

      const result = await db`
        INSERT INTO rates (tenant_id, bank_id, financing_type_id, rate, min_amount, max_amount, min_duration, max_duration)
        VALUES (${tenantId}, ${bank_id}, ${financing_type_id}, ${rate}, ${min_amount}, ${max_amount}, ${min_duration}, ${max_duration})
        RETURNING id
      `;

      return res.json({ success: true, id: result[0].id });
    }

    if (req.method === 'PUT') {
      const { id } = req.query;
      const { bank_id, financing_type_id, rate, min_amount, max_amount, min_duration, max_duration } = req.body;

      await db`
        UPDATE rates 
        SET bank_id = ${bank_id}, financing_type_id = ${financing_type_id}, rate = ${rate}, 
            min_amount = ${min_amount}, max_amount = ${max_amount}, 
            min_duration = ${min_duration}, max_duration = ${max_duration}
        WHERE id = ${id} AND tenant_id = ${tenantId}
      `;

      return res.json({ success: true });
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;

      await db`
        DELETE FROM rates 
        WHERE id = ${id} AND tenant_id = ${tenantId}
      `;

      return res.json({ success: true });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    if (error.message === 'UNAUTHORIZED') {
      return res.status(401).json({ success: false, error: 'غير مصرح' });
    }
    console.error('Error in rates API:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ' });
  }
}


