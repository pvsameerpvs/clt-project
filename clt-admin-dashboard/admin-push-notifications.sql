-- CLE Admin Web Push setup for Supabase SQL editor.
-- Replace the two values below before running:
--   1. webhook_url must be your live HTTPS admin dashboard URL.
--   2. webhook_secret must match WEBHOOK_SECRET in the dashboard environment.

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS public.admin_push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT,
  subscription_json JSONB NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.admin_push_subscriptions
  ADD COLUMN IF NOT EXISTS endpoint TEXT,
  ADD COLUMN IF NOT EXISTS user_agent TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;

UPDATE public.admin_push_subscriptions
SET endpoint = subscription_json->>'endpoint'
WHERE endpoint IS NULL;

DELETE FROM public.admin_push_subscriptions
WHERE endpoint IS NULL;

ALTER TABLE public.admin_push_subscriptions
  ALTER COLUMN endpoint SET NOT NULL;

ALTER TABLE public.admin_push_subscriptions
  DROP CONSTRAINT IF EXISTS admin_push_subscriptions_user_id_key;

DROP INDEX IF EXISTS public.admin_push_subscriptions_user_id_key;

WITH ranked_subscriptions AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY endpoint
      ORDER BY updated_at DESC, created_at DESC, id DESC
    ) AS row_number
  FROM public.admin_push_subscriptions
)
DELETE FROM public.admin_push_subscriptions subscriptions
USING ranked_subscriptions ranked
WHERE subscriptions.id = ranked.id
  AND ranked.row_number > 1;

CREATE UNIQUE INDEX IF NOT EXISTS admin_push_subscriptions_endpoint_key
  ON public.admin_push_subscriptions(endpoint);

ALTER TABLE public.admin_push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view their own subscriptions" ON public.admin_push_subscriptions;
DROP POLICY IF EXISTS "Admins can insert their own subscriptions" ON public.admin_push_subscriptions;
DROP POLICY IF EXISTS "Admins can update their own subscriptions" ON public.admin_push_subscriptions;
DROP POLICY IF EXISTS "Admins can delete their own subscriptions" ON public.admin_push_subscriptions;

CREATE POLICY "Admins can view their own subscriptions"
ON public.admin_push_subscriptions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can insert their own subscriptions"
ON public.admin_push_subscriptions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update their own subscriptions"
ON public.admin_push_subscriptions
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can delete their own subscriptions"
ON public.admin_push_subscriptions
FOR DELETE
USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.notify_admin_push()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, net
AS $$
DECLARE
  webhook_url TEXT := 'https://admin.cleparfum.com/api/admin/push/notify';
  webhook_secret TEXT := 'PASTE_THE_SAME_WEBHOOK_SECRET_HERE';
  payload JSONB;
BEGIN
  payload := jsonb_build_object(
    'type', TG_OP,
    'table', TG_TABLE_NAME,
    'record', to_jsonb(NEW),
    'old_record', CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END
  );

  PERFORM net.http_post(
    url := webhook_url,
    body := payload,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', webhook_secret
    )
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_order_created_push_notify ON public.orders;
DROP TRIGGER IF EXISTS on_order_cancelled_push_notify ON public.orders;

CREATE TRIGGER on_order_created_push_notify
AFTER INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.notify_admin_push();

CREATE TRIGGER on_order_cancelled_push_notify
AFTER UPDATE OF status ON public.orders
FOR EACH ROW
WHEN (
  OLD.status IS DISTINCT FROM NEW.status
  AND lower(coalesce(NEW.status::text, '')) IN ('cancelled', 'canceled', 'refunded')
)
EXECUTE FUNCTION public.notify_admin_push();
