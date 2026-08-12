-- Create the private bucket 'trade-screenshots' if it doesn't exist
insert into storage.buckets (id, name, public)
values ('trade-screenshots', 'trade-screenshots', false)
on conflict (id) do nothing;

-- Enable Row Level Security
alter table storage.objects enable row level security;

-- Policy: Users can view their own trade screenshots
-- (A user can only select objects where the first part of the folder path matches their uid)
create policy "Users can view their own trade screenshots" 
on storage.objects for select to authenticated
using (
  bucket_id = 'trade-screenshots' 
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can upload their own trade screenshots
create policy "Users can upload their own trade screenshots" 
on storage.objects for insert to authenticated
with check (
  bucket_id = 'trade-screenshots' 
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can update their own trade screenshots
create policy "Users can update their own trade screenshots" 
on storage.objects for update to authenticated
using (
  bucket_id = 'trade-screenshots' 
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can delete their own trade screenshots
create policy "Users can delete their own trade screenshots" 
on storage.objects for delete to authenticated
using (
  bucket_id = 'trade-screenshots' 
  and (storage.foldername(name))[1] = auth.uid()::text
);
