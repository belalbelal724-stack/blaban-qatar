# 🥛 ب لبن قطر — نظام تقييم الفروع المتكامل

## ✨ الميزات
- 📋 تقييم شامل للفروع (٥٩ بند فحص)
- ☁️ مزامنة سحابية عبر Supabase + Realtime
- 🔐 PIN-gated editing + Cloud Auth
- 📊 لوحة تحكم + تحليلات + تقرير شامل PDF
- 🤖 شات بوت ذكي
- 📱 PWA - يعمل offline
- 🎨 RTL عربي كامل بتصميم مارون/ذهبي

## 🚀 النشر

### 1. Supabase Setup
1. اذهب إلى [supabase.com](https://supabase.com) → New Project
2. SQL Editor → الصق محتوى `supabase_schema.sql` → Run
3. Authentication → Providers → Email → Enable
4. Settings → API → انسخ URL و anon key

### 2. تكوين التطبيق
أول مرة تفتح التطبيق:
- اضغط `☁️ السحابة` في الـ header
- افتح `⚙️ إعدادات Supabase المتقدمة`
- ضع URL و anon key الخاصين بك
- احفظ

### 3. GitHub Pages
```
ارفع كل الملفات على repo → Settings → Pages → main branch → Save
```

### 4. Vercel
```
vercel.com → New Project → Import → Deploy
```
