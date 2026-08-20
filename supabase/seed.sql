insert into public.teams (
  name,
  slug,
  logo_url,
  cover_url,
  slogan,
  description,
  area,
  home_pitch,
  public_enabled,
  theme_color
)
values (
  'Pinkstorm FC',
  'pinkstorm-fc',
  '/logo.jpg',
  null,
  'Play hard. Sweat victory.',
  'Pinkstorm FC là đội bóng sân 7 phong trào tại Hà Đông, đá đều mỗi tuần với tinh thần Play hard. Sweat victory.',
  'Phạm Tu, Hà Đông, Hà Nội',
  'Sân Phạm Tu',
  true,
  '#d41478'
)
on conflict (slug) do nothing;

insert into public.teams (
  name,
  slug,
  logo_url,
  cover_url,
  slogan,
  description,
  area,
  home_pitch,
  public_enabled,
  theme_color
)
values (
  'TT03 FC',
  'tt03-fc',
  '/logo.jpg',
  null,
  'Play together. Grow together.',
  'TT03 FC là đội bóng sân 7 phong trào đang sinh hoạt tại Hà Nội.',
  'Cầu Giấy, Hà Nội',
  'Sân Yên Hòa',
  true,
  '#d41478'
)
on conflict (slug) do nothing;

with pinkstorm as (
  select id from public.teams where slug = 'pinkstorm-fc'
)
insert into public.team_members (
  team_id,
  full_name,
  nickname,
  phone,
  jersey_number,
  role,
  status,
  joined_at
)
select pinkstorm.id, member.full_name, member.nickname, member.phone, member.jersey_number, member.role, member.status, member.joined_at::timestamptz
from pinkstorm
cross join (
  values
    ('Nguyễn Minh Quân', 'Quân Béo', '0912 345 678', 10, 'captain', 'active', '2021-03-01'),
    ('Trần Hoàng Long', 'Long Ken', '0987 112 233', 7, 'treasurer', 'active', '2021-03-01'),
    ('Lê Đức Anh', 'Anh Cò', '0903 556 778', 4, 'member', 'active', '2021-05-14'),
    ('Phạm Tuấn Kiệt', 'Kiệt Sơ Vin', '0356 889 221', 8, 'member', 'active', '2022-01-08'),
    ('Đỗ Văn Hùng', 'Hùng Xoăn', '0977 654 321', 3, 'member', 'active', '2021-08-20'),
    ('Vũ Quang Huy', 'Huy Sún', '0866 223 114', 11, 'member', 'active', '2022-06-02'),
    ('Bùi Thanh Sơn', 'Sơn Lỳ', '0918 447 556', 5, 'member', 'active', '2021-03-01'),
    ('Hoàng Nam Trung', 'Trung Bo', '0932 118 909', 9, 'member', 'active', '2023-02-11'),
    ('Ngô Bảo Khánh', 'Khánh Gà', '0946 335 221', 1, 'member', 'active', '2021-10-30'),
    ('Dương Chí Thành', 'Thành Tồ', '0983 776 554', 6, 'member', 'active', '2022-09-15'),
    ('Trịnh Gia Bảo', 'Bảo Mèo', '0362 889 447', 14, 'member', 'active', '2023-07-04'),
    ('Lý Hải Đăng', 'Đăng Sờ', '0971 224 668', 17, 'member', 'active', '2024-01-19'),
    ('Cao Việt Dũng', 'Dũng Tây', '0919 003 442', 21, 'member', 'active', '2024-05-06'),
    ('Phan Anh Tú', 'Tú Híp', '0388 556 991', 20, 'member', 'pending', '2026-08-10')
) as member(full_name, nickname, phone, jersey_number, role, status, joined_at)
where not exists (
  select 1
  from public.team_members existing
  where existing.team_id = pinkstorm.id
    and existing.full_name = member.full_name
    and existing.jersey_number = member.jersey_number
);

insert into public.formations (code, name, slots_json)
values
  (
    '2-3-1',
    '2-3-1',
    '[
      {"id":"gk","label":"GK","x":50,"y":88},
      {"id":"d1","label":"CB","x":30,"y":68},
      {"id":"d2","label":"CB","x":70,"y":68},
      {"id":"m1","label":"LM","x":18,"y":48},
      {"id":"m2","label":"CM","x":50,"y":42},
      {"id":"m3","label":"RM","x":82,"y":48},
      {"id":"f1","label":"ST","x":50,"y":20}
    ]'::jsonb
  ),
  (
    '3-2-1',
    '3-2-1',
    '[
      {"id":"gk","label":"GK","x":50,"y":88},
      {"id":"d1","label":"CB","x":20,"y":70},
      {"id":"d2","label":"CB","x":50,"y":70},
      {"id":"d3","label":"CB","x":80,"y":70},
      {"id":"m1","label":"CM","x":35,"y":40},
      {"id":"m2","label":"CM","x":65,"y":40},
      {"id":"f1","label":"ST","x":50,"y":18}
    ]'::jsonb
  ),
  (
    '2-2-2',
    '2-2-2',
    '[
      {"id":"gk","label":"GK","x":50,"y":88},
      {"id":"d1","label":"CB","x":30,"y":68},
      {"id":"d2","label":"CB","x":70,"y":68},
      {"id":"m1","label":"LM","x":30,"y":42},
      {"id":"m2","label":"RM","x":70,"y":42},
      {"id":"f1","label":"LW","x":30,"y":18},
      {"id":"f2","label":"RW","x":70,"y":18}
    ]'::jsonb
  )
on conflict (code) do nothing;
