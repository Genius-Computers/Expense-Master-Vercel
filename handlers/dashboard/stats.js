import { getDb } from '../../lib/db.js';
import { requireAuth } from '../../lib/auth.js';
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
    const user = requireAuth(req);
    const tenantId = req.query.tenant_id || user.tenant_id;
    const db = getDb();

    // Get stats based on role
    let customersQuery = db`SELECT COUNT(*) as count FROM customers WHERE tenant_id = ${tenantId}`;
    let requestsQuery = db`SELECT COUNT(*) as count FROM financing_requests WHERE tenant_id = ${tenantId}`;
    let pendingQuery = db`SELECT COUNT(*) as count FROM financing_requests WHERE tenant_id = ${tenantId} AND status = 'pending'`;
    let approvedQuery = db`SELECT COUNT(*) as count FROM financing_requests WHERE tenant_id = ${tenantId} AND status = 'approved'`;
    let banksQuery = db`SELECT COUNT(*) as count FROM banks WHERE tenant_id = ${tenantId} AND is_active = true`;
    
    // Super admin sees all
    if (user.role === 'superadmin' || user.role_id === 1) {
      customersQuery = db`SELECT COUNT(*) as count FROM customers`;
      requestsQuery = db`SELECT COUNT(*) as count FROM financing_requests`;
      pendingQuery = db`SELECT COUNT(*) as count FROM financing_requests WHERE status = 'pending'`;
      approvedQuery = db`SELECT COUNT(*) as count FROM financing_requests WHERE status = 'approved'`;
      banksQuery = db`SELECT COUNT(*) as count FROM banks WHERE is_active = true`;
    }

    const [customers, requests, pending, approved, banks] = await Promise.all([
      customersQuery,
      requestsQuery,
      pendingQuery,
      approvedQuery,
      banksQuery
    ]);

    const stats = {
      total_customers: parseInt(customers[0]?.count || 0),
      total_requests: parseInt(requests[0]?.count || 0),
      pending_requests: parseInt(pending[0]?.count || 0),
      approved_requests: parseInt(approved[0]?.count || 0),
      active_banks: parseInt(banks[0]?.count || 0),
      active_tenants: 0, // TODO: Add tenants table query if needed
      active_subscriptions: 0, // TODO: Add subscriptions table query if needed
      active_users: 0, // TODO: Add users table query if needed
      total_calculations: 0 // TODO: Add calculations tracking if needed
    };

    return res.json({ success: true, data: stats });
  } catch (error) {
    if (error.message === 'UNAUTHORIZED') {
      return res.status(401).json({ success: false, error: 'غير مصرح' });
    }
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في جلب الإحصائيات' });
  }
}

