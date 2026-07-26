-- ============================================================
-- 039_template_images.sql
--
-- Adds the `template_images` Supabase Storage bucket used when
-- a user uploads header images for WhatsApp message templates.
--
-- Mirrors the account-scoped storage RLS pattern from migrations
-- 020/023 so that writes are scoped to account members and the
-- bucket is public so Meta can fetch the URL.
--
-- Path convention:
--   template_images/account-<account_id>/<timestamp>-<basename>.<ext>
--
-- Size limit 5 MB — Meta's image cap for template headers.
-- Allowed MIME types: image/jpeg, image/png.
--
-- Idempotent — safe to re-run.
-- ============================================================

-- ============================================================
-- 1. template_images storage bucket
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'template_images',
  'template_images',
  TRUE,
  5242880, -- 5 MB (Meta's image cap for template headers)
  ARRAY[
    'image/jpeg',
    'image/png'
  ]
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================================
-- 2. Storage RLS — account-scoped writes, public reads
-- ============================================================
DROP POLICY IF EXISTS "Template images are publicly readable" ON storage.objects;
CREATE POLICY "Template images are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'template_images');

DROP POLICY IF EXISTS "Members can upload template images" ON storage.objects;
CREATE POLICY "Members can upload template images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'template_images'
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND ('account-' || p.account_id::text) = (storage.foldername(name))[1]
    )
  );

DROP POLICY IF EXISTS "Members can update template images" ON storage.objects;
CREATE POLICY "Members can update template images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'template_images'
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND ('account-' || p.account_id::text) = (storage.foldername(name))[1]
    )
  );

DROP POLICY IF EXISTS "Members can delete template images" ON storage.objects;
CREATE POLICY "Members can delete template images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'template_images'
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND ('account-' || p.account_id::text) = (storage.foldername(name))[1]
    )
  );
