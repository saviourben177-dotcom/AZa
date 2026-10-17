-- Idea posts: images and links
alter table public.ideas
  add column if not exists image_url text,
  add column if not exists link_url text;

-- Idea comments: replies (self-referencing parent) + like/dislike counters
alter table public.idea_comments
  add column if not exists parent_comment_id uuid references public.idea_comments(id) on delete cascade,
  add column if not exists likes_count integer not null default 0,
  add column if not exists dislikes_count integer not null default 0;

create index if not exists idx_idea_comments_parent_comment_id
  on public.idea_comments (parent_comment_id);

-- Reactions table: one like OR dislike per user per comment (mirrors idea_upvotes pattern)
create table if not exists public.idea_comment_reactions (
  user_id uuid not null references public.profiles(id) on delete cascade,
  comment_id uuid not null references public.idea_comments(id) on delete cascade,
  reaction text not null check (reaction in ('like', 'dislike')),
  created_at timestamptz not null default now(),
  primary key (user_id, comment_id)
);

alter table public.idea_comment_reactions enable row level security;

create policy idea_comment_reactions_select_all
  on public.idea_comment_reactions for select
  using (true);

create policy idea_comment_reactions_insert_own
  on public.idea_comment_reactions for insert
  with check (auth.uid() = user_id);

create policy idea_comment_reactions_update_own
  on public.idea_comment_reactions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy idea_comment_reactions_delete_own
  on public.idea_comment_reactions for delete
  using (auth.uid() = user_id);

-- Keep idea_comments.likes_count / dislikes_count in sync, same style as handle_idea_upvote_change()
create or replace function public.handle_idea_comment_reaction_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'INSERT') then
    if new.reaction = 'like' then
      update public.idea_comments set likes_count = likes_count + 1 where id = new.comment_id;
    else
      update public.idea_comments set dislikes_count = dislikes_count + 1 where id = new.comment_id;
    end if;
    return new;
  elsif (tg_op = 'DELETE') then
    if old.reaction = 'like' then
      update public.idea_comments set likes_count = greatest(0, likes_count - 1) where id = old.comment_id;
    else
      update public.idea_comments set dislikes_count = greatest(0, dislikes_count - 1) where id = old.comment_id;
    end if;
    return old;
  elsif (tg_op = 'UPDATE') then
    if old.reaction <> new.reaction then
      if old.reaction = 'like' then
        update public.idea_comments set likes_count = greatest(0, likes_count - 1) where id = old.comment_id;
      else
        update public.idea_comments set dislikes_count = greatest(0, dislikes_count - 1) where id = old.comment_id;
      end if;
      if new.reaction = 'like' then
        update public.idea_comments set likes_count = likes_count + 1 where id = new.comment_id;
      else
        update public.idea_comments set dislikes_count = dislikes_count + 1 where id = new.comment_id;
      end if;
    end if;
    return new;
  end if;
  return null;
end;
$$;

drop trigger if exists on_idea_comment_reaction_change on public.idea_comment_reactions;
create trigger on_idea_comment_reaction_change
  after insert or update or delete on public.idea_comment_reactions
  for each row execute function public.handle_idea_comment_reaction_change();

-- Storage: idea-images bucket, mirroring marketplace-images policies exactly
insert into storage.buckets (id, name, public)
values ('idea-images', 'idea-images', true)
on conflict (id) do nothing;

drop policy if exists idea_images_owner_write on storage.objects;
create policy idea_images_owner_write
  on storage.objects for insert
  with check (bucket_id = 'idea-images' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists idea_images_owner_delete on storage.objects;
create policy idea_images_owner_delete
  on storage.objects for delete
  using (bucket_id = 'idea-images' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists idea_images_public_read on storage.objects;
create policy idea_images_public_read
  on storage.objects for select
  using (bucket_id = 'idea-images');
