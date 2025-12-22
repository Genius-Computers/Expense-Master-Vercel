import { getDb } from '../lib/db.js';
import { requireAuth } from '../lib/auth.js';
import cors from 'cors';

const corsHandler = cors({ origin: true });

export default async function handler(req, res) {
  await new Promise((resolve) => {
    corsHandler(req, res, resolve);
  });

  try {
    const db = getDb();
    
    if (req.method === 'GET') {
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
      
      return res.json({ success: true, data: formattedTypes });
    }
    
    if (req.method === 'POST') {
      // Add new financing type
      try {
        const user = requireAuth(req);
        const tenantId = req.body.tenant_id || user.tenant_id || 1;
        const { name } = req.body;
        
        if (!name) {
          return res.status(400).json({ success: false, error: 'اسم نوع التمويل مطلوب' });
        }
        
        const result = await db`
          INSERT INTO financing_types (tenant_id, name, is_active)
          VALUES (${tenantId}, ${name}, true)
          RETURNING id, name, is_active
        `;
        
        return res.json({ 
          success: true, 
          data: {
            ...result[0],
            type_name: result[0].name
          },
          message: 'تم إضافة نوع التمويل بنجاح'
        });
      } catch (error) {
        if (error.message === 'UNAUTHORIZED') {
          return res.status(401).json({ success: false, error: 'غير مصرح' });
        }
        throw error;
      }
    }
    
    if (req.method === 'DELETE') {
      // Delete financing type
      try {
        const user = requireAuth(req);
        const { id } = req.query;
        
        if (!id) {
          return res.status(400).json({ success: false, error: 'معرف نوع التمويل مطلوب' });
        }
        
        await db`
          DELETE FROM financing_types 
          WHERE id = ${id} AND tenant_id = ${user.tenant_id || 1}
        `;
        
        return res.json({ 
          success: true, 
          message: 'تم حذف نوع التمويل بنجاح'
        });
      } catch (error) {
        if (error.message === 'UNAUTHORIZED') {
          return res.status(401).json({ success: false, error: 'غير مصرح' });
        }
        throw error;
      }
    }
    
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    if (error.message === 'UNAUTHORIZED') {
      return res.status(401).json({ success: false, error: 'غير مصرح' });
    }
    console.error('Error in financing types API:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في معالجة الطلب' });
  }
}


