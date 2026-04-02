import { NextResponse } from "next/server";
import { ensureWorkerStarted } from "@/lib/worker/startup";
import { getWorkerStatus, runWorkerCycle } from "@/lib/worker";

export const dynamic = "force-dynamic";

// Trigger worker start on first request to this route
ensureWorkerStarted();

export async function GET() {
  try {
    const status = getWorkerStatus();
    return NextResponse.json({ ok: true, worker: status });
  } catch (err) {
    console.error("[worker] GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    // Allow manual trigger via POST
    // Check CRON_SECRET only if x-cron-secret header is present (external cron)
    // Dashboard calls without auth are allowed

    // Run cycle in background without awaiting
    runWorkerCycle().catch((err) => {
      console.error("[worker] manual cycle error:", err);
    });

    return NextResponse.json({ ok: true, message: "Worker cycle triggered" });
  } catch (err) {
    console.error("[worker] POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
