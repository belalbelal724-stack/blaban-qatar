# 🛠️ ب لبن قطر — Source Code

ملفات المصدر الأصلية للتطبيق. للأرشفة والتعديل المستقبلي فقط.

## 📂 البنية

```
blaban-source/
├── parts/
│   ├── part1.html              ← Head, CSS, manifest, SW registration
│   ├── part2.html              ← Body HTML, modals, header, nav tabs
│   ├── part3_data.html         ← Constants, CHECKLIST, state, setRole, showPage
│   ├── part4_branches.html     ← renderBranch, renderChecklist, action plan, photos
│   ├── part5_weekly_tasks.html ← Weekly analysis + tasks
│   ├── part6_pages.html        ← Managers, analytics, recommendations, ops, depts
│   ├── part7_share.html        ← Unified share module (text/excel/sheets)
│   ├── part8_exports.html      ← Excel + Google Sheets exports
│   ├── part9_init.html         ← App initialization
│   ├── part10_advanced.html    ← Firebase, history, push, dashboard, auto-backup
│   └── part11_auth.html        ← Auth (password + WebAuthn + PIN gate)
├── manifest.json               ← PWA manifest
├── service-worker.js           ← Offline support
├── icon-*.png                  ← App icons (auto-generated)
├── make_icons.py               ← Icon generator script
└── README.md                   ← This file
```

## 🔨 إعادة البناء

لدمج الملفات في `index.html` واحد:

```bash
cd parts/
{ cat part1.html; cat part2.html; cat part3_data.html; \
  cat part4_branches.html; cat part5_weekly_tasks.html; \
  cat part6_pages.html; cat part7_share.html; \
  cat part8_exports.html; cat part10_advanced.html; \
  cat part11_auth.html; cat part9_init.html; } > ../index.html
```

ملاحظة: `part9_init.html` يجب أن يكون آخر ملف.

## 🎨 إعادة توليد الأيقونات

```bash
python3 make_icons.py
```

(يتطلب Pillow: `pip install Pillow`)

---
**مدير التشغيل: بِلَال الأَنْصَارِي / BELAL AL-ANSARY**
