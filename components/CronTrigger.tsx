/**
 * CronTrigger Component
 * Server-side component that triggers lazy cron jobs
 * Loaded in layout to run on every page load
 */

import { triggerLazyCron } from "@/lib/lazyCron";

export async function CronTrigger() {
  // Trigger cron jobs (non-blocking, runs in background)
  // This is fire-and-forget, won't block page rendering
  triggerLazyCron().catch((error) => {
    console.error("[CronTrigger] Error triggering cron:", error);
  });

  // Return null - this component doesn't render anything
  return null;
}
