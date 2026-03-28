import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";

const CASE_PATH = path.join(process.cwd(), "data", "current-case.json");

export async function GET() {
  try {
    const data = await readFile(CASE_PATH, "utf-8");
    return NextResponse.json(JSON.parse(data));
  } catch {
    return NextResponse.json(
      { error: "No case data found. Extract a book first." },
      { status: 404 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const caseData = await request.json();

    await mkdir(path.dirname(CASE_PATH), { recursive: true });
    await writeFile(CASE_PATH, JSON.stringify(caseData, null, 2));

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
