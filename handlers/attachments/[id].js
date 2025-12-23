import { getDb } from '../../lib/db.js';
import { getAuthUser } from '../../lib/auth.js';
import cors from 'cors';

const corsHandler = cors({ origin: true });

export default async function handler(req, res) {
  await new Promise((resolve) => {
    corsHandler(req, res, resolve);
  });

  if (req.method !== 'GET') {
    return res.status(405).send('Method not allowed');
  }

  try {
    const user =
      (req.query?.auth
        ? getAuthUser({ headers: { authorization: `Bearer ${req.query.auth}` } })
        : null) || getAuthUser(req);

    if (!user) {
      return res.status(401).send('غير مصرح');
    }

    const tenantId = req.query.tenant_id || user.tenant_id;
    const { id } = req.query;

    const db = getDb();
    const rows = await db`
      SELECT id, tenant_id, filename, content_type, data
      FROM attachments
      WHERE id = ${id} AND tenant_id = ${tenantId}
      LIMIT 1
    `;

    if (!rows || rows.length === 0) {
      return res.status(404).send('لم يتم العثور على المرفق');
    }

    const att = rows[0];
    res.setHeader('Content-Type', att.content_type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(att.filename || 'attachment')}"`);
    return res.send(att.data);
  } catch (error) {
    console.error('Error downloading attachment:', error);
    return res.status(500).send('حدث خطأ أثناء تنزيل المرفق');
  }
}


