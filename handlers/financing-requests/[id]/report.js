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

export default async function handler(req, res) {
  await new Promise((resolve) => {
    corsHandler(req, res, resolve);
  });

  if (req.method !== 'GET') {
    return res.status(405).send('Method not allowed');
  }

  try {
    // Support auth via query (?auth=...) for "open in new tab" use-cases
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
      SELECT
        fr.*,
        COALESCE(fr.requested_amount, fr.amount) as requested_amount,
        COALESCE(fr.duration_months, fr.duration) as duration_months,
        c.full_name as customer_name,
        c.phone as customer_phone,
        c.email as customer_email,
        c.national_id as customer_national_id,
        c.birthdate as customer_birthdate,
        c.monthly_salary as customer_monthly_salary,
        b.name as selected_bank_name,
        ft.name as financing_type_name
      FROM financing_requests fr
      LEFT JOIN customers c ON fr.customer_id = c.id
      LEFT JOIN banks b ON COALESCE(fr.selected_bank_id, fr.bank_id) = b.id
      LEFT JOIN financing_types ft ON fr.financing_type_id = ft.id
      WHERE fr.id = ${id} AND fr.tenant_id = ${tenantId}
      LIMIT 1
    `;

    if (!rows || rows.length === 0) {
      return res.status(404).send('لم يتم العثور على الطلب');
    }

    const r = rows[0];
    const nationalId =
      r.customer_national_id && !String(r.customer_national_id).startsWith('TEMP-')
        ? r.customer_national_id
        : 'غير محدد';

    const statusMap = {
      pending: { text: 'قيد الانتظار', cls: 'bg-yellow-100 text-yellow-800' },
      under_review: { text: 'قيد المراجعة', cls: 'bg-blue-100 text-blue-800' },
      approved: { text: 'مقبول', cls: 'bg-green-100 text-green-800' },
      rejected: { text: 'مرفوض', cls: 'bg-red-100 text-red-800' },
      completed: { text: 'مكتمل', cls: 'bg-gray-100 text-gray-800' }
    };
    const st = statusMap[r.status] || { text: r.status || '-', cls: 'bg-gray-100 text-gray-800' };

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(`<!doctype html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>تقرير طلب التمويل #${escapeHtml(r.id)}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
      @media print { .no-print { display:none !important; } body { background:white; } }
    </style>
  </head>
  <body class="bg-gray-50 text-gray-900">
    <div class="max-w-4xl mx-auto p-6">
      <div class="rounded-2xl p-6 text-white bg-gradient-to-l from-purple-600 to-pink-600 shadow-lg">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-2xl font-extrabold">تقرير طلب التمويل</div>
            <div class="opacity-90 mt-1">رقم الطلب: <span class="font-bold">#${escapeHtml(r.id)}</span></div>
          </div>
          <div class="no-print flex gap-2">
            <button onclick="window.print()" class="px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30">طباعة</button>
          </div>
        </div>
      </div>

      <div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="bg-white rounded-xl p-5 shadow border">
          <div class="flex items-center justify-between">
            <div class="font-bold text-lg">حالة الطلب</div>
            <span class="px-3 py-1 rounded-full text-sm font-bold ${st.cls}">${escapeHtml(st.text)}</span>
          </div>
          <div class="mt-3 text-sm text-gray-600">
            تاريخ الطلب: <span class="font-medium text-gray-800">${escapeHtml(r.created_at ? new Date(r.created_at).toLocaleString('ar-SA') : '-')}</span>
          </div>
        </div>

        <div class="bg-white rounded-xl p-5 shadow border">
          <div class="font-bold text-lg mb-3">معلومات العميل</div>
          <div class="text-sm space-y-1">
            <div><span class="text-gray-600">الاسم:</span> <span class="font-medium">${escapeHtml(r.customer_name || '-')}</span></div>
            <div><span class="text-gray-600">الجوال:</span> <span class="font-medium">${escapeHtml(r.customer_phone || '-')}</span></div>
            <div><span class="text-gray-600">البريد:</span> <span class="font-medium">${escapeHtml(r.customer_email || '-')}</span></div>
            <div><span class="text-gray-600">رقم الهوية:</span> <span class="font-medium">${escapeHtml(nationalId)}</span></div>
          </div>
        </div>
      </div>

      <div class="mt-6 bg-white rounded-xl p-6 shadow border">
        <div class="font-bold text-lg mb-4">تفاصيل التمويل</div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div class="p-4 rounded-lg bg-purple-50 border border-purple-100">
            <div class="text-gray-600">نوع التمويل</div>
            <div class="text-lg font-bold text-purple-800">${escapeHtml(r.financing_type_name || '-')}</div>
          </div>
          <div class="p-4 rounded-lg bg-indigo-50 border border-indigo-100">
            <div class="text-gray-600">البنك المختار</div>
            <div class="text-lg font-bold text-indigo-800">${escapeHtml(r.selected_bank_name || '-')}</div>
          </div>
          <div class="p-4 rounded-lg bg-green-50 border border-green-100">
            <div class="text-gray-600">المبلغ المطلوب</div>
            <div class="text-lg font-bold text-green-800">${escapeHtml(r.requested_amount ?? '-')}</div>
          </div>
          <div class="p-4 rounded-lg bg-blue-50 border border-blue-100">
            <div class="text-gray-600">مدة التمويل (شهر)</div>
            <div class="text-lg font-bold text-blue-800">${escapeHtml(r.duration_months ?? '-')}</div>
          </div>
          <div class="p-4 rounded-lg bg-yellow-50 border border-yellow-100">
            <div class="text-gray-600">القسط الشهري</div>
            <div class="text-lg font-bold text-yellow-800">${escapeHtml(r.monthly_payment ?? '-')}</div>
          </div>
          <div class="p-4 rounded-lg bg-gray-50 border border-gray-100">
            <div class="text-gray-600">الالتزامات الشهرية</div>
            <div class="text-lg font-bold text-gray-800">${escapeHtml(r.monthly_obligations ?? '-')}</div>
          </div>
        </div>

        ${r.notes ? `<div class="mt-5 pt-5 border-t">
          <div class="font-bold mb-1">ملاحظات</div>
          <div class="text-sm text-gray-700 whitespace-pre-wrap">${escapeHtml(r.notes)}</div>
        </div>` : ''}
      </div>

      <div class="mt-8 text-center text-xs text-gray-500">
        تم إنشاء التقرير بواسطة النظام — Vercel + NeonDB
      </div>
    </div>
  </body>
</html>`);
  } catch (error) {
    console.error('Error generating request report:', error);
    return res.status(500).send('حدث خطأ أثناء إنشاء التقرير');
  }
}


