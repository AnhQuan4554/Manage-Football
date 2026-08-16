# Pinkstorm FC Manage

Base PWA quản lý đội bóng sân 7 Pinkstorm FC, dựng theo brief kỹ thuật:
Next.js App Router, TypeScript, Ant Design, Supabase, PWA, mobile-first.

## Chạy local

```bash
npm install
npm run dev
```

Tạo `.env.local` từ `.env.example`:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Cấu trúc chính

- `src/app`: routes App Router, gồm auth và protected app.
- `src/components`: shared layout/common components.
- `src/features`: feature modules theo Clean Architecture vừa phải.
- `src/lib/supabase`: browser/server/middleware Supabase clients.
- `src/lib/response.ts`: response helper `ok/fail`.
- `supabase/migrations`: schema SQL khởi đầu.
- `.codex/skills/pinkstorm-next-base`: skill cho AI agent tiếp tục phát triển đúng brief.

## Scope phase đầu

- Login/register/pending approval prototype.
- Mobile bottom navigation và desktop sidebar.
- Dashboard trả lời nhanh: trận tiếp theo, ai đã xác nhận, việc cần xử lý, quỹ.
- Match list/detail/create/edit và UX bình chọn Zalo trung thực.
- Lineup Builder sân 7 với sơ đồ 2-3-1, 3-2-1, 2-2-2.
- Members list/detail/add/edit, role-aware theo đội trưởng/thủ quỹ/thành viên.
- Funds overview, split cost theo trận và thu chi nhẹ.
- Media gallery và team public/profile page.

## Deploy

Deploy Next.js bằng Vercel, Supabase dùng cloud free tier. Workflow mong muốn:
push GitHub main -> Vercel tự build production.
