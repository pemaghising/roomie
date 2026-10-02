export function isRateLimited(err: any): boolean {
  if (err.status === 429) return true;
  if (err.code === 'over_email_send_rate_limit' || err.code === 'over_sms_send_rate_limit') return true;
  if (typeof err.message === 'string' && /rate|security purposes/i.test(err.message)) return true;
  return false;
}
