/**
 * Example: Next.js API Route with Server Client
 *
 * Proxies logo requests through your server to keep secret keys private.
 * Works with Next.js App Router (route.ts) API routes.
 *
 * The server client authenticates via Authorization: Bearer header (not query
 * params), returns raw Buffers, and supports batch fetching with concurrency
 * control.
 *
 * File: app/api/logo/route.ts
 */

import { QuikturnLogos } from "@quikturn/logos/server";
import {
  LogoError,
  NotFoundError,
  AuthenticationError,
} from "@quikturn/logos";
import type { FormatShorthand } from "@quikturn/logos";
import { NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Client Singleton
// ---------------------------------------------------------------------------

// Create a single client instance -- reused across requests.
// The server client requires a secret key (sk_ prefix).
const logos = new QuikturnLogos({
  secretKey: process.env.QUIKTURN_SECRET_KEY!,
  // maxRetries: 2, // default
});

// ---------------------------------------------------------------------------
// GET /api/logo?domain=github.com&size=256&format=webp
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const domain = searchParams.get("domain");

  if (!domain) {
    return NextResponse.json(
      { error: "Missing required `domain` query parameter" },
      { status: 400 },
    );
  }

  try {
    const result = await logos.get(domain, {
      size: Number(searchParams.get("size")) || undefined,
      format: (searchParams.get("format") as FormatShorthand) || undefined,
      greyscale: searchParams.get("greyscale") === "true",
    });

    // Return the raw image buffer with appropriate headers
    return new NextResponse(result.buffer, {
      headers: {
        "Content-Type": result.contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: `Logo not found for domain: ${error.domain}` },
        { status: 404 },
      );
    }
    if (error instanceof AuthenticationError) {
      // Do not expose key details to the client
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 },
      );
    }
    if (error instanceof LogoError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status ?? 500 },
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/logo  (batch)
//
// Request body: { "domains": ["github.com", "google.com", "stripe.com"] }
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const { domains } = body as { domains?: string[] };

  if (!Array.isArray(domains) || domains.length === 0) {
    return NextResponse.json(
      { error: "Request body must include a non-empty `domains` array" },
      { status: 400 },
    );
  }

  // Cap batch size to prevent abuse
  if (domains.length > 50) {
    return NextResponse.json(
      { error: "Batch limited to 50 domains per request" },
      { status: 400 },
    );
  }

  // getMany() yields BatchResult items in order with concurrency control.
  // Each result indicates success/failure independently.
  const results = [];

  for await (const result of logos.getMany(domains, { concurrency: 3 })) {
    results.push({
      domain: result.domain,
      success: result.success,
      contentType: result.contentType,
      size: result.buffer?.length,
      error: result.error?.message,
    });
  }

  return NextResponse.json({ results });
}
