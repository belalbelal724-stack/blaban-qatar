# 🥛 إدارة تشغيل ب لبن قطر

نظام تقييم وإدارة فروع ب لبن قطر — مدير التشغيل: بلال الأنصاري

## 🚀 النشر على Vercel

```bash
git init
git add .
git commit -m "Initial"
git remote add origin https://github.com/USERNAME/REPO.git
git push -u origin main
```

ثم على vercel.com → New Project → Import → Deploy.

## ⚠️ مهم — لمستخدمي النسخ السابقة

إذا كنت ركبت النسخة السابقة على متصفحك (PWA أو cache)، **اضغط زر "🔄 تحديث"** في التطبيق بعد التحديث. سيقوم بـ:
- إلغاء تسجيل Service Worker القديم
- مسح كل caches
- إعادة تحميل التطبيق بآخر إصدار

أو يدوياً: **Ctrl+Shift+R** في المتصفح، أو **افتح في وضع التصفح الخاص**.

## 🗄️ Supabase

المفاتيح الافتراضية مضمّنة. لتغييرها: اضغط `☁️ السحابة → إعدادات Supabase المتقدمة`.

SQL Schema: شغّل `supabase_schema.sql` في Supabase Dashboard → SQL Editor.

## 🔐 إعداد الأمان أول مرة

اضغط `🔐 الأمان` → أدخل بريد إلكتروني + كلمة مرور (6 أحرف فأكثر) → تأكيد.
