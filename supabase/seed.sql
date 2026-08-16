insert into public.teams (name, slug, logo_url)
values ('Pinkstorm FC', 'pinkstorm-fc', '/logo.jpg')
on conflict (slug) do nothing;
