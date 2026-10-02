create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

-- Every 10 minutes: plans, locks, sweeps, expiries, streak, digest, push.
-- Reads the function URL and shared secret from Vault (created once by hand, never committed).
select cron.schedule('roomie-tick', '*/10 * * * *', $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'tick_url'),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000)
$$);
