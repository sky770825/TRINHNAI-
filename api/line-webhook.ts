const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "content-type,x-line-signature,user-agent",
};

function json(data: unknown, init: ResponseInit = {}) {
  return Response.json(data, {
    ...init,
    headers: {
      ...corsHeaders,
      ...(init.headers || {}),
    },
  });
}

function getTargetUrl() {
  const explicitTarget = process.env.LINE_WEBHOOK_TARGET_URL?.trim();
  if (explicitTarget) return explicitTarget;

  const supabaseUrl = (
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    ""
  ).trim().replace(/\/$/, "");
  if (!supabaseUrl) return "";

  return `${supabaseUrl}/functions/v1/trinh-line-webhook`;
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function GET() {
  const targetUrl = getTargetUrl();

  return json({
    ok: true,
    service: "trinhnai-line-webhook-proxy",
    targetConfigured: Boolean(targetUrl),
    targetHost: targetUrl ? new URL(targetUrl).host : null,
    targetPath: targetUrl ? new URL(targetUrl).pathname : null,
  });
}

export async function POST(request: Request) {
  const targetUrl = getTargetUrl();
  const bodyText = await request.text();

  let parsedBody: { events?: unknown[] } | null = null;
  try {
    parsedBody = bodyText ? JSON.parse(bodyText) : null;
  } catch {
    return json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  if (!targetUrl) {
    const eventCount = Array.isArray(parsedBody?.events) ? parsedBody.events.length : 0;
    return json(
      {
        ok: eventCount === 0,
        forwarded: false,
        eventCount,
        error: eventCount === 0 ? null : "LINE_WEBHOOK_TARGET_URL or SUPABASE_URL is not configured",
      },
      { status: eventCount === 0 ? 200 : 500 },
    );
  }

  const forwardedHeaders = new Headers({
    "content-type": request.headers.get("content-type") || "application/json",
  });

  const signature = request.headers.get("x-line-signature");
  if (signature) forwardedHeaders.set("x-line-signature", signature);

  const response = await fetch(targetUrl, {
    method: "POST",
    headers: forwardedHeaders,
    body: bodyText,
  });

  const responseText = await response.text();
  const contentType = response.headers.get("content-type") || "application/json";

  console.log(
    JSON.stringify({
      service: "trinhnai-line-webhook-proxy",
      targetStatus: response.status,
      eventCount: Array.isArray(parsedBody?.events) ? parsedBody.events.length : null,
    }),
  );

  return new Response(responseText, {
    status: response.status,
    headers: {
      ...corsHeaders,
      "content-type": contentType,
    },
  });
}
