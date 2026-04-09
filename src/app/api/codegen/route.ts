import { NextResponse } from "next/server";
import { getSqlClient } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

interface CodegenEntry {
  id: number;
  filename: string;
  purpose: string;
  kind: string;
  sizeBytes: number;
  lines: number;
  source: string | null;
  outcome: string | null;
  createdAt: string;
}

interface CodegenResponse {
  entries: CodegenEntry[];
  totalCount: number;
}

export async function GET() {
  try {
    const sql = getSqlClient();

    // Check table exists
    const tableExists = await sql<{ exists: boolean }[]>`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'codegen_log'
      )
    `;

    if (!tableExists[0]?.exists) {
      return NextResponse.json<CodegenResponse>({ entries: [], totalCount: 0 });
    }

    const rows = await sql<CodegenEntry[]>`
      SELECT id, filename, purpose, kind,
             size_bytes AS "sizeBytes",
             lines,
             source,
             outcome,
             created_at AS "createdAt"
      FROM codegen_log
      ORDER BY created_at DESC
      LIMIT 100
    `;

    const countRows = await sql<{ count: number }[]>`
      SELECT COUNT(*)::int AS count FROM codegen_log
    `;

    return NextResponse.json<CodegenResponse>({
      entries: rows,
      totalCount: countRows[0]?.count ?? 0,
    });
  } catch {
    return NextResponse.json<CodegenResponse>({ entries: [], totalCount: 0 });
  }
}
