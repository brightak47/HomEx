export function formatShowtime(iso: string, timezone?: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    hour: "numeric",
    minute: "2-digit",
    timeZone: timezone,
  }).format(new Date(iso));
}
