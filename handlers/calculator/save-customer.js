import { getDb } from '../../lib/db.js';
import cors from 'cors';

const corsHandler = cors({ origin: true });

export default async function handler(req, res) {
  await new Promise((resolve) => {
    corsHandler(req, res, resolve);
  });

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const db = getDb();
    const {
      name,
      phone,
      birthdate,
      salary,
      amount,
      obligations,
      financing_type_id,
      duration_months,
      best_bank_id,
      best_rate,
      monthly_payment,
      total_payment,
      tenant_slug
    } = req.body;
    
    // Get tenant_id if tenant_slug provided
    let tenant_id = null;
    if (tenant_slug) {
      const tenant = await db`
        SELECT id FROM tenants WHERE name = ${tenant_slug} OR id::text = ${tenant_slug}
        LIMIT 1
      `;
      if (tenant && tenant.length > 0) {
        tenant_id = tenant[0].id;
      }
    }
    
    // Default to tenant_id = 1 if not provided
    if (!tenant_id) {
      tenant_id = 1;
    }

    // Resolve financing type name (store denormalized for admin UI)
    let financing_type_name = null;
    if (financing_type_id) {
      const ft = await db`
        SELECT name FROM financing_types
        WHERE id = ${financing_type_id} AND tenant_id = ${tenant_id}
        LIMIT 1
      `;
      if (ft && ft.length > 0) financing_type_name = ft[0].name;
    }
    
    // Check if customer already exists
    const existing = await db`
      SELECT id FROM customers WHERE phone = ${phone} AND tenant_id = ${tenant_id}
      LIMIT 1
    `;
    
    let customer_id;
    
    if (existing && existing.length > 0) {
      // Update existing customer
      customer_id = existing[0].id;
      await db`
        UPDATE customers 
        SET full_name = ${name},
            birthdate = ${birthdate ? new Date(birthdate) : null},
            monthly_salary = ${salary || null},
            monthly_obligations = ${obligations || 0},
            financing_amount = ${amount || null},
            financing_type_name = ${financing_type_name || null},
            financing_duration_months = ${duration_months || null},
            best_bank_id = ${best_bank_id || null},
            best_rate = ${best_rate || null},
            monthly_payment = ${monthly_payment || null},
            total_payment = ${total_payment || null},
            calculation_date = CURRENT_TIMESTAMP
        WHERE id = ${customer_id}
      `;
    } else {
      // Create new customer
      const result = await db`
        INSERT INTO customers (
          tenant_id, full_name, phone, birthdate, monthly_salary, monthly_obligations,
          financing_amount, financing_type_name, financing_duration_months,
          best_bank_id, best_rate, monthly_payment, total_payment, calculation_date
        )
        VALUES (
          ${tenant_id}, ${name}, ${phone}, ${birthdate ? new Date(birthdate) : null}, ${salary || null}, ${obligations || 0},
          ${amount || null}, ${financing_type_name || null}, ${duration_months || null},
          ${best_bank_id || null}, ${best_rate || null}, ${monthly_payment || null}, ${total_payment || null}, CURRENT_TIMESTAMP
        )
        RETURNING id
      `;
      customer_id = result[0].id;
    }
    
    return res.json({ 
      success: true, 
      customer_id,
      message: 'تم حفظ بيانات العميل بنجاح' 
    });
  } catch (error) {
    console.error('Error saving customer:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في حفظ بيانات العميل' });
  }
}

