import { Context } from "@netlify/edge-functions";

const pickHeaders = (headers: Headers, keys: (string | RegExp)[]): Headers => {
  const picked = new Headers();
  for (const key of headers.keys()) {
    if (keys.some((k) => (typeof k === "string" ? k === key : k.test(key)))) {
      const value = headers.get(key);
      if (typeof value === "string") {
        picked.set(key, value);
      }
    }
  }
  return picked;
};

const CORS_HEADERS: Record<string, string> = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "*",
  "access-control-allow-headers": "*",
};

export default async (request: Request, context: Context) => {

  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: CORS_HEADERS,
    });
  }

  const { pathname, searchParams } = new URL(request.url);
  if(pathname === "/") {
    let blank_html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>UptimeBot API</title>
</head>
<body>
  <p>uptimebot api：https://api.uptimerobot.com/</p>
</body>
</html>
    `
    return new Response(blank_html, {
      headers: {
        ...CORS_HEADERS,
        "content-type": "text/html"
      },
    });
  }

  const url = new URL(pathname, "https://api.uptimerobot.com");
  searchParams.delete("_path");

  searchParams.forEach((value, key) => {
    url.searchParams.append(key, value);
  });

  const headers = pickHeaders(request.headers);

  const response = await fetch(url, {
    body: request.body,
    method: request.method,
    duplex: 'half',
    headers,
  });

  const responseHeaders = {
    ...CORS_HEADERS,
    ...Object.fromEntries(response.headers),
    "content-encoding": null
  };

  return new Response(response.body, {
    headers: responseHeaders,
    status: response.status
  });
};
