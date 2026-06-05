import { NextRequest, NextResponse } from "next/server";
import {
  forceRunCronJobs,
  getCronStatus,
  runJobManually,
} from "@/lib/lazyCron";

/**
 * GET /api/cron
 * Get cron job status
 */
export async function GET(request: NextRequest) {
  try {
    const status = getCronStatus();
    
    return NextResponse.json({
      success: true,
      status,
    });
  } catch (error) {
    console.error("Get cron status error:", error);
    return NextResponse.json(
      { error: "Failed to get cron status" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cron
 * Manually trigger cron jobs
 * 
 * Body options:
 * - { action: "forceAll" } - Run all jobs now
 * - { action: "runJob", job: "expireContracts" } - Run specific job
 * - { action: "runJob", job: "cleanup" } - Run cleanup job
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, job } = body;

    if (action === "forceAll") {
      // Force run all cron jobs
      await forceRunCronJobs();
      
      return NextResponse.json({
        success: true,
        message: "All cron jobs triggered",
      });
    }

    if (action === "runJob" && job) {
      // Run specific job
      if (job !== "expireContracts" && job !== "cleanup") {
        return NextResponse.json(
          { error: "Invalid job name. Must be 'expireContracts' or 'cleanup'" },
          { status: 400 }
        );
      }

      await runJobManually(job);

      return NextResponse.json({
        success: true,
        message: `Job '${job}' executed`,
      });
    }

    return NextResponse.json(
      { error: "Invalid action. Use 'forceAll' or 'runJob'" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Cron trigger error:", error);
    return NextResponse.json(
      { error: "Failed to trigger cron jobs" },
      { status: 500 }
    );
  }
}
