import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/auth";
import type { MarathonEvent } from "@/lib/types";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN!;
const REPO_OWNER = "ta-tha";
const REPO_NAME = "marathon-calendar";
const FILE_PATH = "public/data/manual-events.json";

async function getFileFromGitHub(): Promise<{
  content: MarathonEvent[];
  sha: string;
}> {
  const res = await fetch(
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`,
    {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
      },
      cache: "no-store",
    }
  );

  if (!res.ok) {
    return { content: [], sha: "" };
  }

  const data = await res.json();
  const decoded = Buffer.from(data.content, "base64").toString("utf-8");
  return { content: JSON.parse(decoded), sha: data.sha };
}

async function updateFileOnGitHub(
  events: MarathonEvent[],
  sha: string,
  message: string
) {
  const res = await fetch(
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        content: Buffer.from(JSON.stringify(events, null, 2)).toString(
          "base64"
        ),
        sha,
      }),
    }
  );

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`GitHub API error: ${error}`);
  }
}

// GET: 수동 등록 대회 목록 조회
export async function GET() {
  try {
    const { content } = await getFileFromGitHub();
    return NextResponse.json(content);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}

// POST: 수동 대회 추가
export async function POST(request: NextRequest) {
  const token = request.cookies.get("admin_session")?.value;
  if (!token || !verifySessionToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const newEvent: MarathonEvent = await request.json();
    const { content: events, sha } = await getFileFromGitHub();

    events.push(newEvent);
    events.sort(
      (a, b) =>
        new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
    );

    await updateFileOnGitHub(
      events,
      sha,
      `chore: add manual event - ${newEvent.title}`
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

// DELETE: 수동 대회 삭제
export async function DELETE(request: NextRequest) {
  const token = request.cookies.get("admin_session")?.value;
  if (!token || !verifySessionToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await request.json();
    const { content: events, sha } = await getFileFromGitHub();

    const filtered = events.filter((e) => e.id !== id);
    if (filtered.length === events.length) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    await updateFileOnGitHub(
      filtered,
      sha,
      `chore: remove manual event - ${id}`
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
