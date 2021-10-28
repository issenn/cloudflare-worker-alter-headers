let contentTypeHeaders = [
    "text/plain; charset=utf-8",
  ]

let securityHeaders = {
  // "Content-Security-Policy" : "upgrade-insecure-requests",
  // "Strict-Transport-Security" : "max-age=1000",
  // "X-Xss-Protection" : "1; mode=block",
  // "X-Frame-Options" : "DENY",
  // "X-Content-Type-Options" : "nosniff",
  // "Referrer-Policy" : "strict-origin-when-cross-origin",
}

let sanitiseHeaders = {
  // "Server" : "My New Server Header!!!",
}

let removeHeaders = [
  // "Public-Key-Pins",
  // "X-Powered-By",
  // "X-AspNet-Version",
]

addEventListener('fetch', event => {
  event.respondWith(
    handleRequest(event.request).catch(
      (err) => new Response(err.stack, { status: 500 })
    )
  )
})

/**
 * Respond with hello worker text
 * @param {Request} request
 */
async function handleRequest(request) {
  const response = await fetch(request)

  const headers = handleHeaders(request, response.headers)

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: headers
  })
}

function handleHeaders(request, headers) {
  const { pathname } = new URL(request.url);
  const content_type = get_content_type(pathname)

  let newHeaders = new Headers(headers)

  newHeaders = addContentTypeHeaders(newHeaders, content_type, contentTypeHeaders);

  Object.keys(securityHeaders).map(function(name, index) {
    newHeaders = addHeaders(newHeaders, name, securityHeaders[name]);
  })

  Object.keys(sanitiseHeaders).map(function(name, index) {
    newHeaders = addHeaders(newHeaders, name, sanitiseHeaders[name]);
  })

  removeHeaders.forEach(function(name){
    newHeaders.delete(name)
  })

  return newHeaders
}

function addContentTypeHeaders(headers, content_type, values) {
  // if (headers.has("Content-Type") && !headers.get("Content-Type").includes("text/html")) {
  //   console.log("Content-Type has not text/html, not Modified.")
  //   return headers
  // }
  if (content_type === "text/yaml") {
    if (!values.includes("text/plain; charset=utf-8")) {
      values = ["text/plain; charset=utf-8"].concat(values)
    }
  }
  return addHeaders(headers, "Content-Type", values)
}

function addHeaders(headers, key, values) {
  if (values?.length) {
    if (Array.isArray(values)) {
      values.filter(value => (!(headers.has(key) && headers.get(key).includes(value)))).forEach(function(value){
        headers.append(key, value);
      })
    } else {
      const value = values
      if (!(headers.has(key) && headers.get(key).includes(value))) {
        headers.append(key, value);
      }
    }
  }
  return headers
}

function get_content_type(pathname) {
  if (pathname.endsWith(".svg")) {
    return "image/svg+xml"
  } else if (pathname.endsWith(".png")) {
    return "image/png"
  } else if (pathname.endsWith(".jpg")) {
    return "image/jpg"
  } else if (pathname.endsWith(".css")) {
    return "text/css"
  } else if (pathname.endsWith(".yaml") || pathname.endsWith(".yml")) {
    return "text/yaml"
  } else if (pathname.endsWith(".pdf")) {
    return "application/pdf"
  } else if (pathname.startsWith("/api") || pathname.endsWith(".json")) {
    return "application/json"
  } else {
    return "text/html; charset=utf-8"
  }
}
