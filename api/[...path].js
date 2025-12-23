import cors from 'cors';

// Static imports so Vercel bundles all handlers into this single function.
import loginHandler from '../handlers/login.js';
import banksHandler from '../handlers/banks.js';
import ratesHandler from '../handlers/rates.js';
import financingTypesHandler from '../handlers/financing-types.js';
import customersHandler from '../handlers/customers.js';
import requestsHandler from '../handlers/requests.js';
import financingRequestsHandler from '../handlers/financing-requests.js';
import dashboardStatsHandler from '../handlers/dashboard/stats.js';
import saveCustomerHandler from '../handlers/calculator/save-customer.js';
import submitRequestHandler from '../handlers/calculator/submit-request.js';
import attachmentsUploadHandler from '../handlers/attachments/upload.js';
import attachmentByIdHandler from '../handlers/attachments/[id].js';
import tenantCalculatorsHandler from '../handlers/tenant-calculators.js';
import tenantsHandler from '../handlers/tenants.js';
import paymentsHandler from '../handlers/payments.js';
import notificationsHandler from '../handlers/notifications.js';
import packagesHandler from '../handlers/packages.js';
import packageByIdHandler from '../handlers/packages/[id].js';
import subscriptionsHandler from '../handlers/subscriptions.js';
import subscriptionByIdHandler from '../handlers/subscriptions/[id].js';
import usersHandler from '../handlers/users.js';
import userByIdHandler from '../handlers/users/[id].js';
import financingRequestByIdHandler from '../handlers/financing-requests/[id].js';
import financingRequestStatusHandler from '../handlers/financing-requests/[id]/status.js';
import financingRequestReportHandler from '../handlers/financing-requests/[id]/report.js';
import financingRequestTimelineHandler from '../handlers/financing-requests/[id]/timeline.js';

const corsHandler = cors({ origin: true });

function setQueryParam(req, key, value) {
  if (!req.query) req.query = {};
  req.query[key] = value;
}

export default async function handler(req, res) {
  // CORS once at the edge
  await new Promise((resolve) => {
    corsHandler(req, res, resolve);
  });

  // Vercel sets the catch-all param on req.query.path, but some local setups may not.
  // Fallback: parse from req.url.
  const segmentsRaw = req.query?.path;
  let segments = Array.isArray(segmentsRaw) ? segmentsRaw : (segmentsRaw ? [segmentsRaw] : []);
  if (segments.length === 0 && typeof req.url === 'string') {
    // req.url might be like "/api/login?x=y"
    const urlPath = req.url.split('?')[0] || '';
    const cleaned = urlPath.replace(/^\/+/, '');
    const parts = cleaned.split('/'); // ["api", "..."]
    if (parts[0] === 'api') {
      segments = parts.slice(1).filter(Boolean);
    }
  }

  // No /api -> not expected
  if (segments.length === 0) {
    return res.status(404).json({ success: false, error: 'Not found' });
  }

  const [s0, s1, s2] = segments;

  // Top-level routes
  if (segments.length === 1) {
    switch (s0) {
      case 'login': return loginHandler(req, res);
      case 'banks': return banksHandler(req, res);
      case 'rates': return ratesHandler(req, res);
      case 'financing-types': return financingTypesHandler(req, res);
      case 'customers': return customersHandler(req, res);
      case 'requests': return requestsHandler(req, res);
      case 'financing-requests': return financingRequestsHandler(req, res);
      case 'tenants': return tenantsHandler(req, res);
      case 'tenant-calculators': return tenantCalculatorsHandler(req, res);
      case 'payments': return paymentsHandler(req, res);
      case 'notifications': return notificationsHandler(req, res);
      case 'packages': return packagesHandler(req, res);
      case 'subscriptions': return subscriptionsHandler(req, res);
      case 'users': return usersHandler(req, res);
      default:
        return res.status(404).json({ success: false, error: 'Not found' });
    }
  }

  // Two-level routes
  if (segments.length === 2) {
    // /api/dashboard/stats
    if (s0 === 'dashboard' && s1 === 'stats') {
      return dashboardStatsHandler(req, res);
    }

    // /api/calculator/save-customer | submit-request
    if (s0 === 'calculator' && s1 === 'save-customer') {
      return saveCustomerHandler(req, res);
    }
    if (s0 === 'calculator' && s1 === 'submit-request') {
      return submitRequestHandler(req, res);
    }

    // /api/attachments/upload OR /api/attachments/:id
    if (s0 === 'attachments' && s1 === 'upload') {
      return attachmentsUploadHandler(req, res);
    }
    if (s0 === 'attachments') {
      setQueryParam(req, 'id', s1);
      return attachmentByIdHandler(req, res);
    }

    // /api/packages/:id
    if (s0 === 'packages') {
      setQueryParam(req, 'id', s1);
      return packageByIdHandler(req, res);
    }

    // /api/subscriptions/:id
    if (s0 === 'subscriptions') {
      setQueryParam(req, 'id', s1);
      return subscriptionByIdHandler(req, res);
    }

    // /api/users/:id
    if (s0 === 'users') {
      setQueryParam(req, 'id', s1);
      return userByIdHandler(req, res);
    }

    // /api/financing-requests/:id (GET/DELETE)
    if (s0 === 'financing-requests') {
      setQueryParam(req, 'id', s1);
      return financingRequestByIdHandler(req, res);
    }

    return res.status(404).json({ success: false, error: 'Not found' });
  }

  // Three-level routes: financing request actions
  if (segments.length === 3 && s0 === 'financing-requests') {
    setQueryParam(req, 'id', s1);
    if (s2 === 'status') return financingRequestStatusHandler(req, res);
    if (s2 === 'report') return financingRequestReportHandler(req, res);
    if (s2 === 'timeline') return financingRequestTimelineHandler(req, res);
  }

  return res.status(404).json({ success: false, error: 'Not found' });
}


