import { getDb } from '../../../lib/db.js';
import { getAuthUser } from '../../../lib/auth.js';
import cors from 'cors';

const corsHandler = cors({ origin: true });

function escapeHtml(s) {
  return String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatDurationMs(diffMs) {
  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  const remMinutes = minutes % 60;
  if (days > 0) return `${days} يوم و ${remHours} ساعة`;
  if (hours > 0) return `${hours} ساعة و ${remMinutes} دقيقة`;
  return `${Math.max(0, minutes)} دقيقة`;
}

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

    const reqRows = await db`
      SELECT
        fr.*,
        COALESCE(fr.requested_amount, fr.amount) as requested_amount,
        COALESCE(fr.duration_months, fr.duration) as duration_months,
        c.full_name as customer_name,
        c.phone as customer_phone,
        b.name as selected_bank_name,
        ft.name as financing_type_name
      FROM financing_requests fr
      LEFT JOIN customers c ON fr.customer_id = c.id
      LEFT JOIN banks b ON COALESCE(fr.selected_bank_id, fr.bank_id) = b.id
      LEFT JOIN financing_types ft ON fr.financing_type_id = ft.id
      WHERE fr.id = ${id} AND fr.tenant_id = ${tenantId}
      LIMIT 1
    `;

    if (!reqRows || reqRows.length === 0) {
      return res.status(404).send('لم يتم العثور على الطلب');
    }

    const r = reqRows[0];

    let history = [];
    try {
      history = await db`
        SELECT h.*, u.full_name as changed_by_name
        FROM financing_request_status_history h
        LEFT JOIN users u ON h.changed_by = u.id
        WHERE h.request_id = ${id} AND h.tenant_id = ${tenantId}
        ORDER BY h.created_at ASC
      `;
    } catch (e) {
      history = [];
    }

    // Build events: request creation + status changes
    const events = [];
    if (r.created_at) {
      events.push({
        title: '📋 تم إنشاء طلب التمويل',
        when: new Date(r.created_at),
        meta: `رقم الطلب #${r.id}`
      });
    }
    for (const h of history) {
      events.push({
        title: `🔄 تغيير الحالة: ${h.new_status}`,
        when: new Date(h.created_at),
        meta: `بواسطة: ${h.changed_by_name || h.changed_by || '-'}` + (h.notes ? ` — ملاحظات: ${h.notes}` : '')
      });
    }

    // Duration summary
    const totalMs =
      events.length >= 2 ? events[events.length - 1].when.getTime() - events[0].when.getTime() : 0;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(`<!doctype html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Timeline الطلب #${escapeHtml(r.id)}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
      @media print { .no-print { display:none !important; } body { background:white; } }
    </style>
  </head>
  <body class="bg-gray-50 text-gray-900">
    <div class="max-w-4xl mx-auto p-6">
      <div class="rounded-2xl p-6 text-white bg-gradient-to-l from-blue-600 to-purple-600 shadow-lg">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-2xl font-extrabold">⏱️ الجدول الزمني التفصيلي</div>
            <div class="opacity-90 mt-1">طلب التمويل رقم: <span class="font-bold">#${escapeHtml(r.id)}</span></div>
          </div>
          <div class="no-print flex gap-2">
            <button onclick="window.print()" class="px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30">طباعة</button>
          </div>
        </div>
      </div>

      <div class="mt-6 bg-white rounded-xl p-6 shadow border">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <div class="text-gray-600">العميل</div>
            <div class="font-bold">${escapeHtml(r.customer_name || '-')}</div>
            <div class="text-gray-600 mt-1">${escapeHtml(r.customer_phone || '-')}</div>
          </div>
          <div>
            <div class="text-gray-600">البنك</div>
            <div class="font-bold">${escapeHtml(r.selected_bank_name || '-')}</div>
          </div>
          <div>
            <div class="text-gray-600">نوع التمويل</div>
            <div class="font-bold">${escapeHtml(r.financing_type_name || '-')}</div>
          </div>
        </div>
      </div>

      <div class="mt-6 bg-white rounded-xl p-6 shadow border">
        <div class="font-bold text-lg mb-4">الأحداث</div>
        ${events.length === 0 ? `<div class="text-gray-600">لا توجد بيانات Timeline بعد.</div>` : `
        <ol class="relative border-r border-gray-200">
          ${events.map((ev, idx) => {
            const prev = idx === 0 ? null : events[idx - 1];
            const duration = prev ? formatDurationMs(ev.when.getTime() - prev.when.getTime()) : null;
            return `
            <li class="mb-8 mr-6">
              <span class="absolute -right-3 flex items-center justify-center w-6 h-6 bg-indigo-100 rounded-full ring-8 ring-white">
                <span class="w-2.5 h-2.5 bg-indigo-600 rounded-full"></span>
              </span>
              <div class="flex flex-col gap-1">
                <div class="font-bold">${escapeHtml(ev.title)}</div>
                <time class="text-xs text-gray-500">${escapeHtml(ev.when.toLocaleString('ar-SA'))}</time>
                ${duration ? `<div class="text-xs text-gray-600">⏱️ المدة منذ الحدث السابق: <span class="font-medium">${escapeHtml(duration)}</span></div>` : ''}
                ${ev.meta ? `<div class="text-xs text-gray-600">${escapeHtml(ev.meta)}</div>` : ''}
              </div>
            </li>
            `;
          }).join('')}
        </ol>
        `}
      </div>

      <div class="mt-6 bg-green-50 border border-green-100 rounded-xl p-5">
        <div class="font-bold">⏰ إجمالي الوقت الكلي</div>
        <div class="mt-1 text-sm text-green-800">${escapeHtml(formatDurationMs(totalMs))}</div>
        <div class="mt-1 text-xs text-green-700">من أول حدث حتى آخر حدث مسجل</div>
      </div>
    </div>
  </body>
</html>`);
  } catch (error) {
    console.error('Error generating timeline:', error);
    return res.status(500).send('حدث خطأ أثناء إنشاء Timeline');
  }
}


