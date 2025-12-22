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
      full_name,
      phone,
      email,
      national_id,
      birthdate,
      employer,
      job_title,
      monthly_salary,
      work_start_date,
      city,
      financing_type_id,
      bank_id,
      requested_amount,
      monthly_obligations,
      duration,
      monthly_payment,
      notes
    } = req.body;
    
    // Default tenant_id to 1 (can be enhanced later with tenant detection)
    const tenant_id = 1;
    
    // Step 1: Check if customer exists (by national_id or phone)
    let customer = await db`
      SELECT id FROM customers 
      WHERE (national_id = ${national_id || ''} OR phone = ${phone}) 
      AND tenant_id = ${tenant_id}
      LIMIT 1
    `;
    
    let customer_id;
    
    if (customer && customer.length > 0) {
      // Customer exists, update info
      customer_id = customer[0].id;
      await db`
        UPDATE customers 
        SET full_name = ${full_name},
            phone = ${phone},
            email = ${email || null},
            national_id = ${national_id || null},
            birthdate = ${birthdate ? new Date(birthdate) : null},
            monthly_salary = ${monthly_salary || null},
            employer_name = ${employer || null},
            job_title = ${job_title || null},
            work_start_date = ${work_start_date ? new Date(work_start_date) : null},
            city = ${city || null}
        WHERE id = ${customer_id}
      `;
    } else {
      // Create new customer
      const customerResult = await db`
        INSERT INTO customers (
          tenant_id, full_name, phone, email, national_id, birthdate,
          monthly_salary, employer_name, job_title, work_start_date, city
        )
        VALUES (
          ${tenant_id}, ${full_name}, ${phone}, ${email || null}, 
          ${national_id || null}, ${birthdate ? new Date(birthdate) : null},
          ${monthly_salary || null}, ${employer || null}, ${job_title || null},
          ${work_start_date ? new Date(work_start_date) : null}, ${city || null}
        )
        RETURNING id
      `;
      customer_id = customerResult[0].id;
    }
    
    // Step 2: Create financing request
    const requestResult = await db`
      INSERT INTO financing_requests (
        tenant_id, customer_id, financing_type_id,
        bank_id, selected_bank_id,
        amount, requested_amount,
        duration, duration_months,
        monthly_obligations, monthly_payment,
        status, notes
      )
      VALUES (
        ${tenant_id}, ${customer_id}, ${financing_type_id || null},
        ${bank_id || null}, ${bank_id || null},
        ${requested_amount || null}, ${requested_amount || null},
        ${duration || null}, ${duration || null},
        ${monthly_obligations || 0}, ${monthly_payment || null},
        'pending', ${notes || null}
      )
      RETURNING id
    `;
    
    const requestId = requestResult[0].id;
    
    return res.json({ 
      success: true, 
      request_id: requestId,
      customer_id,
      message: 'تم إرسال طلبك بنجاح' 
    });
  } catch (error) {
    console.error('Error submitting request:', error);
    res.status(500).json({ 
      success: false, 
      error: 'حدث خطأ في إرسال الطلب',
      details: error.message 
    });
  }
}

