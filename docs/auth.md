# Đăng nhập và phân quyền — cập nhật 27/09/2026

## Mục tiêu và trạng thái bàn giao

Ai có link web/PWA đều xem được các màn hình công khai ngay, không phải đăng nhập hoặc chọn chế độ khách. Chỉ tài khoản được cấp `profiles.role = admin` và có `profiles.status = active` mới được tạo, sửa, xóa và thao tác thanh toán.

- Code đã cập nhật tại repository; chưa build hoặc triển khai production.
- Migration phân quyền đã áp dụng lên Supabase project `ysosiwdwmwyqnhkgsjnh` (`supabase-spice`): `20260927042140_public_read_admin_write.sql`.
- Google Login **chưa hoạt động trên cấu hình hiện tại**: provider đang tắt và cần OAuth Client ID/Client Secret của chủ dự án. Connector hiện có không hỗ trợ cập nhật cấu hình provider.
- Email/password và đăng ký đang bật, yêu cầu xác nhận email. Chưa kiểm thử việc giao nhận email/SMTP hay đăng nhập bằng tài khoản thật.
- Không tự tạo admin, không đổi quyền của tài khoản thực, không sửa/xóa dữ liệu nghiệp vụ trong migration.

Lưu ý triển khai: database đã chặn ghi trái quyền ngay. Bản giao diện cũ chưa deploy có thể vẫn hiện nút nhưng thao tác sẽ bị database từ chối. Cần triển khai code này để đồng bộ trải nghiệm.

## Ma trận quyền

| Thao tác                                         | Chưa đăng nhập   | Member            | Admin active                    | Admin không active |
| ------------------------------------------------ | ---------------- | ----------------- | ------------------------------- | ------------------ |
| Xem dữ liệu công khai                            | Có               | Có                | Có                              | Có                 |
| Thấy nút tạo/sửa/xóa/thanh toán                  | Không            | Không             | Có                              | Không              |
| Mở form tạo/sửa qua URL                          | Chuyển đến login | Thông báo chỉ xem | Có                              | Thông báo chỉ xem  |
| Gọi API ghi nghiệp vụ                            | 401              | 403               | Được kiểm tra payload/nghiệp vụ | 403                |
| Ghi trực tiếp qua Supabase bằng session/anon key | Bị chặn          | Bị chặn           | Theo RLS                        | Bị chặn            |

Quyền admin hiện áp dụng **toàn hệ thống, mọi đội**. `team_members.role` (đội trưởng/thủ quỹ/cầu thủ) không cấp quyền quản trị ứng dụng. Member ở đây là vai trò tài khoản, không có nghĩa đã được thêm vào danh sách cầu thủ.

## Luồng người dùng

1. Mở một link, ví dụ `/matches?teamId=...`: đọc dữ liệu ngay; các nút quản trị không được render.
2. Chọn **Đăng nhập** từ menu tài khoản. URL hiện tại và query được giữ trong `next`.
3. Đăng nhập Google hoặc email/password. Google chuyển qua Supabase → Google → Supabase → `/api/auth/callback`.
4. Callback xác thực, lưu session cookie và quay lại đường dẫn nội bộ hợp lệ. `safeNextPath()` không cho chuyển hướng ra domain ngoài.
5. Server xác minh user bằng Supabase Auth, đọc role/status từ `public.profiles`; không lấy quyền từ cookie tự đặt, localStorage hoặc user metadata.
6. Tài khoản mới mặc định member: vẫn chỉ xem. Sau khi được cấp admin active trong DB và tải lại trang, các nút quản trị xuất hiện.
7. Đăng xuất chỉ kết thúc phiên trên thiết bị hiện tại, ẩn quyền quản trị và trở lại màn hình đang xem. Nếu đang ở `/new` hoặc `/edit`, chuyển về trang danh sách/chi tiết tương ứng.

Cookie `pinkstorm_guest` còn được ghi khi chọn “Tiếp tục không đăng nhập” để tương thích, nhưng không còn là điều kiện vào ứng dụng và không cấp quyền.

Đăng ký không tự tạo cầu thủ, không tự gia nhập đội và không cần duyệt yêu cầu tham gia. `pending/blocked/inactive` không có quyền ghi nhưng vẫn xem được phần công khai. Vì dữ liệu là công khai, khóa tài khoản không thể ngăn người đó xem bằng phiên khách.

## Những thay đổi chính

### Giao diện

`PermissionsProvider` nhận quyền đã được server xác minh; `AdminOnly` mặc định ẩn khi thiếu quyền. Đã áp dụng cho:

- Dashboard: khu vực yêu cầu xử lý.
- Đội bóng, trận đấu, thành viên: tạo mới, chỉnh sửa, xóa; cả link sửa trên thẻ trận.
- Chi tiết trận: quản lý người tham gia và nhóm thao tác cập nhật/hoàn tất/thanh toán.
- Danh sách khoản thu: chọn dòng, chọn nhiều, xác nhận đã thanh toán, hoàn tác thanh toán và modal thao tác.
- Thống kê công nợ: thanh toán từng người/hàng loạt và nút quản lý.
- Quỹ, chi phí, media: các nút nhập/sửa/lưu/tải lên.
- Đội hình: khách/member được xem, chỉ admin được bật chế độ chỉnh sửa.

Tên, số tiền, trạng thái đã/chưa thanh toán vẫn hiển thị để người xem theo dõi. Menu tài khoản thể hiện Admin hoặc Chỉ xem. Layout `AdminPage` bảo vệ các trang tạo/sửa kể cả khi nhập URL trực tiếp.

Một số màn hình vốn là prototype (chỉnh quỹ cục bộ, chi phí, media, đội hình) vẫn giữ phạm vi lưu dữ liệu cũ; việc hiện nút cho admin không có nghĩa bản cập nhật này đã bổ sung API lưu cho chúng.

### API

Toàn bộ **11 handler ghi nghiệp vụ trong 9 route thuộc `/api/teams`** gọi `requireAdmin()` trước khi đọc body hoặc gọi service:

- Tạo đội.
- Tạo/sửa/xóa trận.
- Chia khoản thu và cập nhật thanh toán một/nhiều khoản.
- Tạo/sửa/xóa thành viên.
- Endpoint tạo đối thủ (nghiệp vụ này vẫn giữ trạng thái hỗ trợ hiện có).

GET giữ quyền xem công khai. Response lỗi vẫn theo contract chung của dự án. Các endpoint đăng nhập, đăng ký thiết bị push và tác vụ cron giữ cơ chế xác thực riêng; không áp dụng bừa quyền admin lên chúng.

### Database / RLS

Thay policy `allow_all` bằng SELECT công khai và INSERT/UPDATE/DELETE chỉ cho admin active trên:
`teams`, `team_members`, `guest_players`, `formations`, `matches`, `match_participants`, `lineups`, `lineup_slots`, `collections`, `collection_items`, `albums`, `media`; áp dụng thêm `opponents` nếu bảng tồn tại.

- Thu hồi quyền ghi của anon, kể cả TRUNCATE.
- Tài khoản authenticated chỉ ghi được khi RLS đọc thấy profile của chính user là admin active.
- Các bảng nội bộ `join_requests`, `notification_jobs`, `audit_logs` không còn cho khách đọc; authenticated chỉ admin đọc, ghi do service/DB.
- Giữ cơ chế bảo vệ profile và bảng push hiện có. Người dùng không tự sửa role/status.
- Thu hồi quyền gọi hàm cũ `complete_past_matches()` từ client nếu tồn tại; service_role vẫn gọi được.
- Default privileges cho object mới do role chạy migration tạo phải được cấp quyền rõ ràng; không mặc định công khai.

Quyền được đọc từ DB ở mỗi request, không nhét role admin vào JWT. Thu hồi quyền có hiệu lực với request mới ngay cả khi token cũ chưa hết hạn. UI cập nhật khi tải lại/điều hướng/đồng bộ phiên; không có subscription realtime theo dõi thay đổi role. API và RLS vẫn chặn nếu UI đang cũ.

### Giới hạn dữ liệu công khai

Bản cập nhật giữ nguyên phạm vi đọc nghiệp vụ theo yêu cầu, bao gồm thông tin thành viên, số điện thoại và thu/chi đang có trong dữ liệu công khai. Chưa bổ sung lọc theo `public_enabled`, `visibility` hoặc ẩn cột nhạy cảm. Nếu muốn giữ riêng các dữ liệu này, cần thay đồng bộ API, RLS và các màn hình đọc trong một thay đổi riêng.

## Đăng nhập Google qua Supabase Auth

Ứng dụng dùng `NEXT_PUBLIC_SUPABASE_URL` và `NEXT_PUBLIC_SUPABASE_ANON_KEY` để gọi Supabase Auth. `SUPABASE_ACCESS_TOKEN`, Google Client Secret và service-role key không cần trong Vercel runtime. Không đưa Client Secret vào repository, chat hoặc biến `NEXT_PUBLIC_*`.

### Cấu hình Google Cloud và Supabase

1. Trong [Google Auth Platform → Clients](https://console.cloud.google.com/auth/clients), dùng OAuth client loại **Web application**. Authorized JavaScript origins của dự án là `http://localhost:3001` và `https://manage-football-anhquan4554s-projects.vercel.app`. Authorized redirect URI của Google là `https://ysosiwdwmwyqnhkgsjnh.supabase.co/auth/v1/callback`.
2. Trong [Supabase → Authentication → Sign In / Providers → Google](https://supabase.com/dashboard/project/ysosiwdwmwyqnhkgsjnh/auth/providers?provider=Google), bật Google và nhập Client ID/Secret của OAuth client. Không cần Personal Access Token để làm việc này trên Dashboard.
3. Trong [Supabase → Authentication → URL Configuration](https://supabase.com/dashboard/project/ysosiwdwmwyqnhkgsjnh/auth/url-configuration), đặt Site URL là `https://manage-football-anhquan4554s-projects.vercel.app`. Redirect URLs gồm `https://manage-football-anhquan4554s-projects.vercel.app/api/auth/callback**` và `http://localhost:3001/api/auth/callback**`. `**` cho phép tham số `next` trong URL callback. Nếu chạy ứng dụng ở cổng khác, thêm callback tương ứng.
4. Google OAuth app hiện ở chế độ **Testing**. Thêm từng tài khoản cần thử trong [Audience → Test users](https://console.cloud.google.com/auth/audience) trước khi đăng nhập. Chủ project đã được thêm; người dùng khác chưa thể đăng nhập cho đến khi được thêm hoặc ứng dụng Google được xuất bản.
5. Triển khai source Auth lên Vercel và bảo đảm project có `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Bản web đang chạy lúc kiểm tra ngày 03/10/2026 vẫn là giao diện prototype nên chưa thể dùng Google Login trên production dù provider đã bật.

Google trả về Supabase callback trước; Supabase sau đó chuyển về `/api/auth/callback` của ứng dụng để đổi mã lấy phiên. Xem [hướng dẫn Google](https://supabase.com/docs/guides/auth/social-login/auth-google) và [Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls) của Supabase.

### Kiểm tra

Trên localhost:3001, nút **Tiếp tục với Google** đã chuyển tới trang chọn tài khoản Google với đúng OAuth client và callback. Hoàn tất chọn tài khoản thử để xác nhận phiên, việc quay lại đúng trang, hồ sơ trong `auth.users` và `public.profiles`, rồi kiểm tra đăng xuất. Trigger `auth_private.sync_user_profile` tạo/cập nhật profile; role mặc định là `member`. Việc cấp admin là bước riêng.

## Cấp / thu hồi admin

Chủ dự án thao tác trong Supabase, không qua tài khoản ứng dụng:

1. Người dùng đăng ký hoặc đăng nhập thành công để có user/profile.
2. Xác minh đúng tài khoản ở **Authentication → Users** và đối chiếu email/UUID với **Table Editor → public.profiles**.
3. Đặt `role = admin`, `status = active` cho đúng UUID.
4. Người dùng tải lại trang.

Ví dụ SQL Editor (thay UUID mẫu bằng UUID đã xác minh):

```sql
update public.profiles
set role = 'admin', status = 'active'
where id = '<UUID-DA-XAC-MINH>'::uuid;
```

Thu hồi:

```sql
update public.profiles
set role = 'member'
where id = '<UUID-DA-XAC-MINH>'::uuid;
```

Không đặt tất cả người đăng nhập Google thành admin, không tự cấp admin cho người đăng ký đầu tiên. Không sửa role bằng user metadata. Việc trả lại role member không xóa tài khoản/dữ liệu.

## Email và khôi phục mật khẩu

Có đăng ký, đăng nhập, quên mật khẩu và đặt lại mật khẩu. Email confirmation đang bật; phải xác nhận trước khi đăng nhập theo cấu hình hiện tại.

PKCE mặc định nên mở email trong cùng trình duyệt gửi yêu cầu. Callback cũng hỗ trợ TokenHash nếu chủ dự án cấu hình template:

**Confirm signup**

```html
<a href="{{ .SiteURL }}/api/auth/callback?token_hash={{ .TokenHash }}&type=email">Xác nhận email</a>
```

**Reset password**

```html
<a href="{{ .SiteURL }}/api/auth/callback?token_hash={{ .TokenHash }}&type=recovery"
  >Đặt lại mật khẩu</a
>
```

Template dùng Site URL nên cần đặt đúng domain. Cần kiểm tra SMTP/khả năng gửi thư thực tế trước khi bàn giao luồng email cho người dùng.

## Kiểm chứng và checklist triển khai

Đã kiểm tra:

- `node --test tests/auth.test.mjs tests/admin-permissions.test.mjs tests/pwa-notifications.test.mjs`: **76 test pass**.
- `pnpm exec tsc --noEmit --incremental false`: pass.
- `supabase/tests/optional_auth.sql` và `supabase/tests/admin_permissions.sql`: pass trên project liên kết, fixture trong transaction rollback; không để lại tài khoản/dữ liệu test.
- DB test bao phủ khách/member không được ghi, admin được ghi/thanh toán/hoàn tác, admin pending/blocked/inactive hoặc bị thu hồi quyền bị chặn; metadata giả không cấp admin.
- HTTP trên server đang chạy cổng 3001: các trang dashboard/matches/members/statistics mở được không session; form tạo trận chuyển login và không render form cho khách.
- Kiểm thử render React xác nhận khách không thấy nút/checkbox thanh toán hay link sửa; admin thấy.

Chưa xác minh: OAuth Google bằng tài khoản thật, giao nhận email, hành trình tương tác/hiển thị responsive trong trình duyệt (in-app browser không khả dụng). Không chạy build, khởi động/restart server hoặc deploy trong phiên này theo quy tắc dự án.

Checklist còn lại:

1. Hoàn tất OAuth Google và URL Configuration bằng credential của chủ dự án.
2. Kiểm tra email/SMTP nếu dùng email login/khôi phục.
3. Đăng nhập tài khoản thật, cấp admin đúng UUID và kiểm thử luồng nêu trên.
4. Triển khai source, kiểm tra PWA sau refresh/cập nhật service worker và các request 401/403.
5. Không chạy lại migration baseline `0001_initial_schema.sql` trên DB hiện có; không reset DB để triển khai auth.

Các trang/API/Auth tiếp tục dùng NetworkOnly trong cấu hình PWA; middleware/callback đặt no-store cho phản hồi liên quan phiên. Không lưu bản giao diện có quyền admin để dùng offline.

Security Advisors vẫn còn thông tin RLS không policy của bảng push (chỉ service dùng), extension `pg_net` trong public và GraphQL schema discoverability. Không coi việc ẩn button là bảo mật, cũng không coi schema discoverable đồng nghĩa đọc được mọi dòng.

## Vận hành local: lỗi pnpm start

`pnpm start` chạy production server và cần build production trong `.next`. Lỗi “Could not find a production build” làm server thoát nên trình duyệt báo CONNECTION_REFUSED.

- Phát triển: dùng `pnpm dev`, dự án cấu hình cổng **3001**.
- Production local: chạy `pnpm build` thành công trước, sau đó `pnpm start` (mặc định **3000**).

Không chạy build chồng lên dev server vì cùng dùng `.next`. Đây là hướng dẫn vận hành; các lệnh build/start chưa được chạy trong thay đổi này.
