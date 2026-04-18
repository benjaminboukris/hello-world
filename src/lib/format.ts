export function formatFrenchDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function statusLabel(status: string): string {
  switch (status) {
    case "success":
      return "OK";
    case "partial":
      return "Partiel";
    case "failed":
      return "Échec";
    case "pending":
      return "En cours";
    default:
      return status;
  }
}
