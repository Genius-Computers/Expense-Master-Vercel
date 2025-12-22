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
    
    let types;
    if (tenantId) {
      types = await db`
        SELECT * FROM financing_types 
        WHERE tenant_id = ${tenantId} AND is_active = true 
        ORDER BY name
      `;
    } else {
      // Public access - get all active types
      types = await db`
        SELECT * FROM financing_types 
        WHERE is_active = true 
        ORDER BY name
      `;
    }
    
    // Map to expected format (type_name instead of name)
    const formattedTypes = types.map(t => ({
      ...t,
      type_name: t.name
    }));
    
    res.json({ success: true, data: formattedTypes });
  } catch (error) {
    console.error('Error fetching financing types:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في جلب أنواع التمويل' });
  }
}


