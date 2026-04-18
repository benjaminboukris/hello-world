import cron from "node-cron";
import { runDailyRecap } from "./pipeline";

let task: cron.ScheduledTask | null = null;

export function startScheduler(): void {
  if (task) return;

  const hour = Number(process.env.RECAP_HOUR ?? 7);
  const tz = process.env.TZ ?? "Europe/Paris";
  const expr = `0 ${hour} * * *`;

  task = cron.schedule(
    expr,
    async () => {
      try {
        const result = await runDailyRecap();
        console.log(`[scheduler] ${result.date} → ${result.status} (${result.itemCount} items)`);
      } catch (err) {
        console.error("[scheduler] error", err);
      }
    },
    { timezone: tz }
  );

  console.log(`[scheduler] registered cron "${expr}" TZ=${tz}`);
}
