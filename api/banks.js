import { getDb } from '../lib/db.js';
import { requireAuth } from '../lib/auth.js';
import cors from 'cors';

const corsHandler = cors({ origin: true });

export default async function handler(req, res) {
  await new Promise((resolve) => {
    corsHandler(req, res, resolve);
  });

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const db = getDb();
    const tenantId = req.query.tenant_id || null;
    
    let banks;
    if (tenantId) {
      banks = await db`
        SELECT * FROM banks 
        WHERE tenant_id = ${tenantId} AND is_active = true 
        ORDER BY name
      `;
    } else {
      // Public access - get all active banks
      banks = await db`
        SELECT * FROM banks 
        WHERE is_active = true 
        ORDER BY name
      `;
    }
    
    // Map to expected format (bank_name instead of name)
    const formattedBanks = banks.map(b => ({
      ...b,
      bank_name: b.name
    }));
    
    res.json({ success: true, data: formattedBanks });
  } catch (error) {
    console.error('Error fetching banks:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في جلب البنوك' });
  }
}


