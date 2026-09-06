# Hướng dẫn từng bước: thông báo PWA cho Pinkstorm FC

Tài liệu dành cho người mới tiếp quản repository này. Đọc theo thứ tự từ bước 1 đến bước 10. Đây là cách triển khai **Web Push không cần phát triển đăng nhập người dùng trước**, sử dụng Next.js, Vercel và Supabase Cron.

## 1. Hiểu kết quả cần đạt

| Sự kiện                   | Người nhận                                    | Điều kiện                                    |
| ------------------------- | --------------------------------------------- | -------------------------------------------- |
| Tạo trận mới thành công   | Thành viên đang hoạt động đã bật thông báo    | Trận chưa diễn ra, chưa hủy, chưa hoàn tất   |
| Thứ Ba, 17h giờ Việt Nam  | Thành viên đang hoạt động đã bật thông báo    | Có trận còn sắp diễn ra trong ngày           |
| Thứ Bảy, 17h giờ Việt Nam | Thiết bị đội trưởng đã được quản trị xác nhận | Chưa có trận không bị hủy trong tuần kế tiếp |

“Tuần kế tiếp” là từ thứ Hai đến hết Chủ nhật. Mỗi trận trong ngày có thông báo riêng. Thành viên chưa cài app hoặc chưa cấp quyền sẽ **không** nhận thông báo dù đang hoạt động.

Luồng xử lý:

```text
Tạo trận → lưu trận thành công → hàng đợi Supabase → Next.js gửi Web Push
                                      ↑                      ↓
Supabase Cron mỗi 5 phút → API có khóa bí mật         Apple/Google → điện thoại
```

Cron có mốc 17:00. Những lần chạy 17:05–17:55 giúp phục hồi nếu lần đầu lỗi; khóa duy nhất ngăn xếp lại cùng sự kiện/thiết bị. Không có cam kết thông báo đến đúng giây: mạng điện thoại, Focus và dịch vụ Push có thể làm chậm.

Supabase Cron sử dụng tài nguyên database hiện có, không cần mua một dịch vụ Cron riêng. Gói Free vẫn có hạn mức và khả năng bị pause; kiểm tra [gói Supabase hiện hành](https://supabase.com/pricing) trước khi áp dụng cho dự án khác. Quy mô một đội nhỏ phù hợp cách dùng thử này; không xem Free là cam kết SLA.

## 2. Chuẩn bị tài khoản và mã nguồn

Cần có:

- Repository chứa phần code PWA trong hướng dẫn này.
- Node.js 24.x, pnpm theo trường `packageManager` của `package.json`.
- Quyền quản trị project Supabase và quyền deploy project Vercel.
- URL HTTPS ổn định. Domain miễn phí của Vercel dùng được, chưa cần mua domain.
- iPhone iOS 16.4 trở lên hoặc trình duyệt Android hỗ trợ Web Push. iPhone 11/iOS 17.6.1 của đội đáp ứng yêu cầu phiên bản.

Cấu hình hiện tại:

| Mục               | Giá trị                                                  |
| ----------------- | -------------------------------------------------------- |
| Vercel project    | `manage-football`                                        |
| Nhánh production  | `main`                                                   |
| URL               | https://manage-football-anhquan4554s-projects.vercel.app |
| Supabase project  | `supabase-spice`                                         |
| Project ref       | `ysosiwdwmwyqnhkgsjnh`                                   |
| Supabase URL      | https://ysosiwdwmwyqnhkgsjnh.supabase.co                 |
| Múi giờ nghiệp vụ | `Asia/Ho_Chi_Minh`, UTC+7                                |
| Email VAPID       | `quanmanchester0405@gmail.com`                           |

Trong terminal tại thư mục dự án:

```powershell
node --version
pnpm --version
pnpm install --frozen-lockfile
```

Repository ghim `pnpm@11.25.0`. Không đổi lại `11.13.0`: bản đó đã làm bộ cài trên Vercel thất bại trong lần triển khai này. Commit cả `package.json` và `pnpm-lock.yaml`; không tự xóa lockfile để “chữa” lỗi.

Đăng nhập CLI nếu muốn cấu hình bằng terminal:

```powershell
pnpm dlx vercel@59.11.7 login
pnpm dlx vercel@59.11.7 link --project manage-football --team anhquan4554s-projects
pnpm dlx supabase@2.83.0 login
```

Đăng nhập Vercel không đồng nghĩa đã đăng nhập Supabase. Kết nối Supabase trong công cụ trợ lý cũng không tự đăng nhập CLI trên máy.

## 3. Các file làm nhiệm vụ gì?

| File/thư mục                                             | Trách nhiệm                                            |
| -------------------------------------------------------- | ------------------------------------------------------ |
| `public/manifest.json`                                   | Tên app, icon, chế độ mở như ứng dụng                  |
| `next.config.mjs`                                        | Giữ next-pwa hiện có, nạp worker nhận Push             |
| `public/push-worker.js`                                  | Hiện thông báo và mở đúng đường dẫn khi chạm           |
| `src/features/notifications/components/PushSettings.tsx` | Xin quyền, nhập mã, bật/tắt và gửi thử                 |
| `src/app/notifications/page.tsx`                         | Trang kích hoạt độc lập với đăng nhập                  |
| `src/app/api/notifications/`                             | API cấu hình, thiết bị và Cron                         |
| `src/features/notifications/server.ts`                   | Khóa thiết bị, xác thực, truy cập database và gửi Push |
| `src/features/notifications/dispatch.ts`                 | Chọn người nhận, hàng đợi và nhắc lịch                 |
| `src/features/notifications/utils.ts`                    | Giờ Việt Nam, nội dung trận, kiểm tra subscription     |
| `scripts/pwa-admin.mjs`                                  | Tạo khóa, cấp mã, thu hồi thiết bị                     |
| `scripts/pwa-vercel-env.mjs`                             | Nạp cấu hình PWA vào đúng project Vercel               |
| `tests/pwa-notifications.test.mjs`                       | Kiểm thử quy tắc và service worker                     |
| `.github/workflows/ci.yml`                               | Tự kiểm tra test, TypeScript và build khi push/PR      |

Không sửa trực tiếp `public/sw.js`: đây là file next-pwa sinh khi build. Chỉnh `push-worker.js` rồi build/deploy lại.

## 4. Thiết lập database

### Đối với project hiện tại

Migration `supabase/migrations/20260906050941_pwa_push_notifications.sql` **đã được áp dụng** lên project `ysosiwdwmwyqnhkgsjnh`. Không chạy lại.

**Không chạy lại `0001_initial_schema.sql`, không chạy `supabase db reset` vào production.** Migration cũ có thao tác xóa bảng; đây không phải bước setup thông báo.

### Đối với người học trên project khác

1. Dùng một project thử riêng, có schema nghiệp vụ tương thích với repository: đặc biệt `teams`, `team_members`, `matches`.
2. Trong Dashboard, mở SQL Editor và đọc toàn bộ migration PWA mới.
3. Kiểm tra project đích trước khi Run. Chỉ chạy một lần; không chạy toàn bộ migration cũ lên database đang chứa dữ liệu.
4. Nếu dùng luồng CLI migration cho dự án riêng, đồng bộ lịch sử migration trước khi push. SQL Editor không tự ghi lịch sử CLI migration.
5. Kiểm tra ba bảng và hai job đã xuất hiện:

```sql
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in ('push_devices', 'push_invites', 'push_deliveries');

select jobname, schedule, active
from cron.job
where jobname in ('pinkstorm-push-dispatch', 'pinkstorm-push-cleanup');
```

Ba bảng mới:

- `push_invites`: mã mời một lần, database chỉ lưu SHA-256.
- `push_devices`: subscription của thiết bị, thành viên tương ứng và trạng thái bật/tắt.
- `push_deliveries`: hàng đợi, lần thử, hạn gửi và kết quả.

Cả ba bật RLS, không cấp quyền cho `anon`/`authenticated`. Chỉ server có service-role truy cập. **Không thêm policy `allow_all` để xử lý lỗi quyền.**

## 5. Tạo và lưu các khóa bí mật

Chạy một lần:

```powershell
node scripts/pwa-admin.mjs keys
```

Lệnh tạo `.env.pwa.local`. Nếu file đã tồn tại, chương trình dừng và giữ nguyên; đây là chủ ý để không vô tình đổi khóa làm hỏng subscription đang dùng.

Mở file bằng editor, không chụp hoặc gửi nội dung lên nhóm. Khi áp dụng cho đội khác, sửa URL và email liên hệ của đội đó.

| Biến                            | Ý nghĩa                                    | Được công khai? |
| ------------------------------- | ------------------------------------------ | --------------- |
| `PWA_PUSH_ENABLED`              | `true` để bật ở Production                 | Có              |
| `VAPID_PUBLIC_KEY`              | Khóa công khai để trình duyệt đăng ký      | Có              |
| `VAPID_PRIVATE_KEY`             | Khóa ký yêu cầu Push                       | **Không**       |
| `VAPID_SUBJECT`                 | Email liên hệ, bắt đầu bằng `mailto:`      | Có              |
| `PWA_CRON_SECRET`               | Khóa xác thực Supabase → API Cron          | **Không**       |
| `NEXT_PUBLIC_APP_URL`           | URL production cố định                     | Có              |
| `NEXT_PUBLIC_SUPABASE_URL`      | URL Supabase của dự án                     | Có              |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Khóa client phục vụ phần ứng dụng hiện có  | Có, vẫn cần RLS |
| `SUPABASE_SERVICE_ROLE_KEY`     | Khóa server để truy cập bảng Push riêng tư | **Không**       |

Code cũng chấp nhận `SUPABASE_SECRET_KEY` thay service-role nếu dùng loại server key mới. Không bao giờ thêm tiền tố `NEXT_PUBLIC_` cho khóa server, VAPID private hoặc Cron secret.

Lấy server key trong Supabase Dashboard → Project Settings → API Keys. Chỉ đặt vào Vercel hoặc file local riêng; **không gửi vào chat**. Người chạy script quản trị cần điền URL và server key hợp lệ trong `.env.local`. File chỉ có tên biến nhưng giá trị trống vẫn được xem là chưa cấu hình.

`.env.pwa.local` không phải file Next.js tự nạp. Nó chỉ là nguồn cho script nạp cấu hình. Không xóa/đổi VAPID key sau mỗi deploy.

## 6. Cấu hình Vercel và deploy

1. Kiểm tra `.vercel/project.json` trỏ đúng project. File này không commit.
2. Chạy:

```powershell
node scripts/pwa-vercel-env.mjs manage-football
```

Script nạp sáu biến PWA từ `.env.pwa.local` vào **Production**, không in giá trị khóa. Nó từ chối khi tên project truyền vào không khớp project đã link.

3. Mở Vercel → Settings → Environment Variables, kiểm tra thêm cấu hình Supabase của bước 5. Việc “có tên biến” chưa chứng minh giá trị đúng.
4. Không bật Push trên Preview/Development dùng chung database production. Code cũng chặn gửi khi `VERCEL_ENV` không phải `production`.
5. Chạy các kiểm tra trước deploy:

```powershell
pnpm install --frozen-lockfile
node --test tests/pwa-notifications.test.mjs
pnpm exec tsc --noEmit
pnpm build
```

Không chạy build local trong lúc đang dùng dev server: cả hai dùng thư mục `.next`.

6. Deploy production sau khi kiểm tra đạt:

```powershell
pnpm dlx vercel@59.11.7 deploy --prod --yes
```

Đây là thao tác xuất bản thật, không phải chỉ kiểm tra build. Chờ deployment báo READY rồi kiểm tra URL chính. Các lần sau, merge vào `main` sẽ kích hoạt Git integration của Vercel.

7. Mở `/api/notifications/config`. Kết quả cần có:

```json
{ "success": true, "data": { "enabled": true, "publicKey": "KHÓA_CÔNG_KHAI" } }
```

Nếu `enabled: false`, dừng setup Cron để kiểm tra môi trường. Public key thực tế phải là chuỗi được sinh ở bước 5, không phải chuỗi minh họa trên.

8. `POST /api/notifications/cron` không có Bearer hoặc Bearer sai phải trả 401. HTTP 200 của trang đăng ký không đủ chứng minh backend đã sẵn sàng.

Sau khi sửa Environment Variables, cần deploy/redeploy mới. Bản đã build không tự lấy cấu hình mới chỉ vì bạn vừa bấm Save trong Dashboard.

## 7. Kết nối Supabase Vault và Cron

Chỉ làm sau khi production đã có cấu hình server hợp lệ.

Trong Supabase Dashboard → Vault, tạo hai secret bằng giao diện:

| Tên chính xác                | Giá trị                                              |
| ---------------------------- | ---------------------------------------------------- |
| `pinkstorm_push_app_url`     | URL production, không có dấu `/` cuối                |
| `pinkstorm_push_cron_secret` | Đúng giá trị `PWA_CRON_SECRET` đang dùng trên Vercel |

Không đặt secret trực tiếp trong migration, câu lệnh commit hoặc nội dung job Cron. Vault lưu secret; hàm `push_private.dispatch()` đọc chúng khi chạy.

Migration đã đăng ký:

- `pinkstorm-push-dispatch`: `*/5 * * * *`.
- `pinkstorm-push-cleanup`: `20 20 * * *`, dọn dữ liệu/log riêng của tính năng đã quá hạn hơn 7 ngày.

Không cần Vercel Cron, không thêm lịch vào `vercel.json`. Không tạo thêm job mỗi lần deploy.

Kiểm tra thủ công bằng đúng hàm của job:

```sql
select push_private.dispatch();
```

Hàm không gửi HTTP nếu thiếu một trong hai Vault secret. Khi đã đủ secret, đợi vài giây rồi kiểm tra:

```sql
select id, status_code, timed_out, error_msg, content
from net._http_response
order by created desc
limit 5;
```

Không xem/in request headers vì chứa khóa. HTTP cần trả 200 và `success: true`. Nếu chưa có thiết bị, `sent: 0` là đúng.

Cron run history báo `succeeded` chỉ cho biết câu SQL đã chạy, **không chứng minh request HTTP thành công**. Phải kiểm tra cả hai lớp:

```sql
select j.jobname, r.status, r.start_time, r.end_time
from cron.job_run_details r
join cron.job j using (jobid)
where j.jobname = 'pinkstorm-push-dispatch'
order by r.start_time desc
limit 10;
```

## 8. Cấp mã và bật thông báo trên điện thoại

Chưa có đăng nhập thật nên dùng **mã kích hoạt được gửi riêng**. Người dùng không được tự chọn danh tính hoặc tự nhận vai trò đội trưởng.

Liệt kê thành viên và cấp mã bằng máy quản trị đã có server key:

```powershell
node scripts/pwa-admin.mjs members
node scripts/pwa-admin.mjs invite MEMBER_UUID
node scripts/pwa-admin.mjs invite CAPTAIN_MEMBER_UUID --captain
```

Thay UUID bằng ID thật từ lệnh đầu. `--captain` chỉ hợp lệ khi thành viên có role `captain`.

Hoặc xuất mã cho tất cả thành viên active của đội:

```powershell
node scripts/pwa-admin.mjs export-invites pinkstorm-fc
```

Lệnh tạo `.pwa-invitations.local.md`, tự xác nhận người có role captain cho nhóm nhận nhắc tạo trận. File này là tài liệu **bí mật**, không phải tài liệu hướng dẫn công khai; chỉ gửi từng người đúng mã của họ, không gửi cả file lên nhóm. File có sẵn sẽ không bị ghi đè.

Mỗi mã dùng một lần cho một thiết bị, hạn 7 ngày. Khi thiết bị đã đăng ký, không phải nhập lại mã mỗi tuần. Muốn dùng thêm điện thoại phải có mã mới.

### Trên iPhone 11 / iOS 17.6.1

1. Dùng Safari mở URL production.
2. Chọn Chia sẻ → Thêm vào Màn hình chính.
3. Mở app từ biểu tượng vừa thêm, không chỉ mở lại tab Safari.
4. Vào Cài đặt → Thông báo, hoặc mở đường dẫn `/notifications` trong app.
5. Nhập mã được cấp riêng.
6. Chạm **Bật thông báo** → **Cho phép** khi iOS hỏi.
7. Chạm nút gửi thử. Khóa màn hình để kiểm tra điện thoại thực sự nhận.
8. Chạm thông báo để xác nhận app mở đúng đường dẫn.

Nếu trước đó đã từ chối, vào Cài đặt iPhone → Thông báo → Pinkstorm để kiểm tra quyền. Focus/Không làm phiền có thể làm thông báo không hiện như mong đợi.

### Tắt hoặc thu hồi

Người dùng có thể tắt/bật lại từ app mà không cần mã mới trong trường hợp bình thường. Token thiết bị lưu trong localStorage; không xóa dữ liệu app tùy tiện.

Quản trị thu hồi mọi thiết bị và mã chưa dùng của một thành viên:

```powershell
node scripts/pwa-admin.mjs revoke MEMBER_UUID
```

Đây là thao tác có tác động thật: thiết bị cũ không tự bật lại được. Nếu cần đăng ký lại trên cùng trình duyệt, quản trị phải xử lý bản ghi thiết bị đã thu hồi, người dùng xóa dữ liệu app và dùng mã mới; không tự xóa hàng loạt thiết bị khác.

## 9. Kiểm thử và quy trình merge vào main

### Tự động

`tests/pwa-notifications.test.mjs` hiện có 17 test: giờ Việt Nam, ranh giới tuần/năm, thành viên active, đội trưởng được xác nhận, bỏ nhắc khi đã có trận, chống xếp trùng, retry, subscription hết hạn, payload lỗi và đường dẫn click an toàn.

`supabase/tests/pwa_notifications.sql` kiểm tra mã một lần, quyền và claim hàng đợi trong transaction rồi ROLLBACK. Đọc file trước khi chạy; không thay bằng test tạo/xóa trận thật trên production.

Workflow `.github/workflows/ci.yml` chạy khi push/PR vào `main` hoặc `develop`: cài frozen lockfile → test → TypeScript → build. Workflow không dùng production secrets, không migrate database và không deploy, nên không gửi thông báo thật. Vercel vẫn deploy bằng Git integration.

### Trước khi merge

1. Commit đầy đủ code, migration, test, workflow, tài liệu và lockfile. Không chỉ commit vài file giao diện.
2. Kiểm tra `git diff --check`, `git status --short`; không stage `.env.local`, `.env.pwa.local`, `.pwa-invitations.local.md` hoặc `.vercel`.
3. Push nhánh đang làm và tạo PR vào `main`.
4. Đợi check **Tests and production build** và Vercel Preview đạt. Preview không gửi Push là chủ ý.
5. Nếu muốn GitHub bắt buộc chặn merge khi test lỗi, quản trị bật branch rules yêu cầu check này. Chỉ thêm workflow chưa tự bật branch protection.
6. Merge khi kiểm tra đạt; đợi Vercel Production READY và kiểm tra lại `/notifications`, `/api/notifications/config`, Cron HTTP.
7. Không chạy lại migration đã áp dụng chỉ vì merge code.

Ở lần kiểm tra ngày 06/09/2026, `origin/main` trỏ `011e5c1`; HEAD develop `c868b9c`. Kiểm tra merge-tree giữa hai commit không có xung đột. Đây là kiểm tra tại thời điểm đó, không bảo đảm các thay đổi main về sau hoặc mọi thay đổi chưa commit luôn không xung đột.

### Trên điện thoại thật

Chỉ kết luận toàn bộ luồng đã chạy sau khi:

- Điện thoại nhận thông báo thử.
- Tạo một trận được đội đồng ý dùng để kiểm thử; thành viên active đã bật Push nhận thông báo, không tạo lại trận chỉ vì chưa thấy thông báo.
- Chạm thông báo mở đúng trận.
- Kiểm tra nhắc thứ Ba có/không có trận, thứ Bảy có/không có trận tuần sau.
- Kiểm tra thiết bị bị tắt, thành viên inactive và trận đã hủy không nhận nhắc.

Không tự tạo trận giả để test trên dữ liệu đội khi chưa được đồng ý.

## 10. Chẩn đoán lỗi thường gặp

| Hiện tượng                                         | Kiểm tra/cách xử lý                                                       |
| -------------------------------------------------- | ------------------------------------------------------------------------- |
| Build Vercel lỗi bộ cài pnpm                       | Giữ `pnpm@11.25.0` và lockfile; không dùng `11.13.0`                      |
| Có biến trên Dashboard nhưng API báo chưa cấu hình | Kiểm tra giá trị thật, đúng Production, server key không rỗng; redeploy   |
| `enabled: false`                                   | Kiểm tra flag, VAPID, server key và có đang mở Preview không              |
| Cron HTTP 401                                      | Hai Cron secret không khớp hoặc thiếu Bearer                              |
| Cron HTTP 500 / API thiết bị 503                   | Kiểm tra URL/server key, bảng/RPC và log server; không mở RLS cho client  |
| Cron SQL succeeded nhưng không nhận Push           | Xem HTTP response và hàng đợi, không chỉ run history                      |
| Mã không hợp lệ                                    | Có thể đã dùng, hết 7 ngày hoặc người dùng đã inactive; cấp mã đúng người |
| iPhone không hỏi quyền                             | Phải mở PWA từ Màn hình chính và chạm nút; kiểm tra quyền đã từ chối      |
| Test thành công nhưng điện thoại im lặng           | Kiểm tra mạng, Focus, quyền iOS và cài đặt thông báo                      |
| Mất token sau khi xóa dữ liệu                      | Cấp mã mới, xử lý thiết bị cũ riêng; không chia sẻ token của người khác   |
| Hàng đợi pending/retry                             | Xem `attempts`, `available_at`, `error_code`; tối đa 5 lần thử            |
| `SUBSCRIPTION_EXPIRED`                             | Provider trả 404/410; thiết bị bị tắt để không gửi lặp vô ích             |
| Tạo trận thành công nhưng có cảnh báo Push         | Không tạo lại trận; xem `PUSH_ENQUEUE_FAILED` để tránh trùng dữ liệu      |

Lệnh xem log Vercel:

```powershell
pnpm dlx vercel@59.11.7 logs --environment production --level error --since 1h
```

Không log endpoint, khóa subscription, activation code, device token hoặc raw lỗi web-push. Trạng thái `sent` chỉ nghĩa provider đã chấp nhận; không chứng minh iOS đã hiện banner.

## 11. Vận hành, giới hạn và tạm dừng an toàn

- Giữ URL production và VAPID key ổn định. Đổi domain/key có thể cần đăng ký lại trên điện thoại.
- Hàng đợi có unique event/device, claim khóa và lease. Không bảo đảm exactly-once nếu tiến trình chết sau khi gửi nhưng trước khi lưu; tag ổn định giúp gom bản trùng.
- Cron mỗi 5 phút dùng tài nguyên cả khi chưa có thông báo. Theo dõi usage Supabase/Vercel và tình trạng project Free.
- Những bảng/API nghiệp vụ cũ vẫn có cơ chế quyền prototype. Phần Push bảo vệ bảng mới, **không thay thế triển khai auth/RLS toàn ứng dụng**. Chưa tự sửa logic cũ ngoài phạm vi.
- Advisor INFO “RLS enabled, no policy” ở ba bảng Push là chủ ý: chỉ server truy cập.
- Cảnh báo `pg_net` trong schema public còn tồn tại. Extension không relocatable; không drop/reinstall extension production khi chưa duyệt riêng. Không cần thao tác đó để chạy Push.

Muốn tạm dừng: đặt `PWA_PUSH_ENABLED=false` trên Vercel Production rồi redeploy. Khi cần dừng cả các HTTP tick, quản trị có thể tắt riêng job `pinkstorm-push-dispatch` trong Supabase Cron; không xóa extension hoặc bảng. Muốn bật lại, bật flag, redeploy và kích hoạt lại đúng job.

## 12. Trạng thái triển khai ngày 06/09/2026

- Đã áp dụng migration PWA và kiểm thử transaction/RLS/claim.
- Đã ghim lại pnpm, cài frozen lockfile thành công, 17/17 test và TypeScript đạt.
- Vercel production build READY; trang `/notifications`, manifest và hai worker trả HTTP 200. Worker chính có nạp `push-worker.js`.
- Request Cron thiếu khóa trả 401 đúng yêu cầu.
- Đã hoàn tất cấu hình Supabase server trên Vercel Production và deploy lại: `dpl_GcEzEUrZNmRkfnDXX2FZNCRwKkLd`, trạng thái READY; Next.js 15.5.23, thời gian build khoảng 48 giây. Bản deploy lấy mã nguồn local trên nền commit `c868b9c`, chưa phải một commit mới đã push.
- API config trả `enabled: true`, public key khớp cặp khóa đã tạo. API Cron có khóa trả HTTP 200, thiếu khóa trả 401.
- Đã lưu đủ hai secret vào Vault mà không in giá trị khóa. Gọi chính hàm `push_private.dispatch()` từ Supabase nhận HTTP 200, không timeout; `sent: 0`, `skipped: 0`, `retry: 0` vì chưa có thiết bị đăng ký.
- Lần Cron tự chạy lúc 19:40 giờ Việt Nam ngày 06/09/2026 cũng `succeeded` và nhận HTTP 200, không timeout; đã kiểm tra cả lịch tự động, không chỉ gọi thủ công.
- Đã tạo 13 mã kích hoạt trong `.pwa-invitations.local.md`, gồm một mã đội trưởng được xác nhận. File riêng được Git/Vercel bỏ qua; chỉ gửi từng người đúng mã của họ.
- Kiểm tra log lỗi của deployment mới không thấy lỗi tại thời điểm bàn giao. Đây là kiểm tra một thời điểm, không phải giám sát liên tục.
- **Còn bước kiểm thử trên thiết bị:** chưa có điện thoại được đăng ký, chưa xác nhận iPhone thực sự nhận và mở thông báo.
- Workflow đã có trong mã nguồn, chưa được chạy trên GitHub vì chưa push/commit thay người dùng.

Không dùng “build thành công” thay cho kết luận “điện thoại đã nhận thông báo”.

## Nguồn chính thức để học thêm

- [Hướng dẫn PWA và Web Push của Next.js](https://nextjs.org/docs/app/guides/progressive-web-apps).
- [Web Push cho ứng dụng Home Screen trên iOS](https://webkit.org/blog/13966/web-push-for-web-apps-on-ios-and-ipados/).
- [Supabase Cron](https://supabase.com/docs/guides/cron) và [Vault](https://supabase.com/docs/guides/database/vault).
- [API keys và phân biệt khóa client/server](https://supabase.com/docs/guides/api/api-keys).
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables) và [Git integration](https://vercel.com/docs/git).
- [GitHub Actions setup-node](https://github.com/actions/setup-node) và [pnpm action-setup](https://github.com/pnpm/action-setup).
