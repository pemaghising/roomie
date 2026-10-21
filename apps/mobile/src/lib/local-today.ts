/** The household's calendar date (YYYY-MM-DD) at `now`, in its own time zone. */
export const localToday = (now: Date = new Date(), tz = 'Asia/Kathmandu') =>
  new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(now);
