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
    const { request_id, attachment_type, filename, content_type, data_base64 } = req.body || {};

    if (!request_id || !attachment_type || !filename || !data_base64) {
      return res.status(400).json({ success: false, error: 'بيانات المرفق غير مكتملة' });
    }

    const typeMap = {
      id: 'id_attachment_url',
      bank_statement: 'bank_statement_attachment_url',
      salary: 'salary_attachment_url',
      additional: 'additional_attachment_url'
    };
    const targetColumn = typeMap[attachment_type];
    if (!targetColumn) {
      return res.status(400).json({ success: false, error: 'نوع مرفق غير صالح' });
    }

    const db = getDb();

    // Derive tenant from request
    const reqRows = await db`
      SELECT id, tenant_id
      FROM financing_requests
      WHERE id = ${request_id}
      LIMIT 1
    `;
    if (!reqRows || reqRows.length === 0) {
      return res.status(404).json({ success: false, error: 'لم يتم العثور على الطلب' });
    }
    const tenant_id = reqRows[0].tenant_id;

    const data = Buffer.from(String(data_base64), 'base64');

    const inserted = await db`
      INSERT INTO attachments (tenant_id, request_id, attachment_type, filename, content_type, data)
      VALUES (${tenant_id}, ${request_id}, ${attachment_type}, ${filename}, ${content_type || null}, ${data})
      RETURNING id
    `;

    const attachmentId = inserted[0].id;
    const url = `/api/attachments/${attachmentId}`;

    // Update request with URL
    if (targetColumn === 'id_attachment_url') {
      await db`UPDATE financing_requests SET id_attachment_url = ${url}, updated_at = CURRENT_TIMESTAMP WHERE id = ${request_id}`;
    } else if (targetColumn === 'bank_statement_attachment_url') {
      await db`UPDATE financing_requests SET bank_statement_attachment_url = ${url}, updated_at = CURRENT_TIMESTAMP WHERE id = ${request_id}`;
    } else if (targetColumn === 'salary_attachment_url') {
      await db`UPDATE financing_requests SET salary_attachment_url = ${url}, updated_at = CURRENT_TIMESTAMP WHERE id = ${request_id}`;
    } else if (targetColumn === 'additional_attachment_url') {
      await db`UPDATE financing_requests SET additional_attachment_url = ${url}, updated_at = CURRENT_TIMESTAMP WHERE id = ${request_id}`;
    }

    return res.json({ success: true, url, id: attachmentId, filename });
  } catch (error) {
    console.error('Error uploading attachment:', error);
    return res.status(500).json({ success: false, error: 'حدث خطأ أثناء رفع المرفق' });
  }
}


