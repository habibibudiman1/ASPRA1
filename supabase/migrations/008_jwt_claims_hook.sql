-- =============================================================================
-- 008_jwt_claims_hook.sql
-- Custom Access Token Hook — inject role & is_active ke JWT app_metadata
-- Tujuan: middleware tidak perlu query database untuk cek role/status user
-- =============================================================================

-- Buat fungsi hook yang dipanggil Supabase setiap kali token di-generate
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  claims jsonb;
  user_role text;
  user_is_active boolean;
BEGIN
  -- Ambil role dan is_active dari tabel profiles
  SELECT role, is_active
  INTO user_role, user_is_active
  FROM public.profiles
  WHERE id = (event->>'user_id')::uuid;

  claims := event->'claims';

  -- Inject ke app_metadata (tersedia di server-side)
  IF user_role IS NOT NULL THEN
    claims := jsonb_set(claims, '{app_metadata}',
      COALESCE(claims->'app_metadata', '{}'::jsonb)
      || jsonb_build_object(
        'role', user_role,
        'is_active', COALESCE(user_is_active, true)
      )
    );
  END IF;

  -- Return event yang sudah dimodifikasi
  RETURN jsonb_set(event, '{claims}', claims);
END;
$$;

-- Grant akses eksekusi ke supabase_auth_admin
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;

-- Revoke dari public untuk keamanan
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM PUBLIC;

-- Grant SELECT ke supabase_auth_admin agar bisa baca profiles
GRANT SELECT ON public.profiles TO supabase_auth_admin;

-- =============================================================================
-- SETELAH menjalankan migration ini:
-- Aktifkan hook di Supabase Dashboard:
-- Authentication > Hooks > Custom Access Token Hook
-- Pilih: public.custom_access_token_hook
-- =============================================================================
