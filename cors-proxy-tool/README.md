# Local CORS Proxy Tool

## Purpose
This is a lightweight local proxy server built using `cors-anywhere`. Its primary purpose is to bypass strict or malformed CORS (Cross-Origin Resource Sharing) policies during local frontend development.

## When to Use This
You should use this tool when developing locally (e.g., running your Next.js app on `http://localhost:3000`) and trying to connect to a remote backend API (such as `https://api.your-company.com/...`) that:
1. **Returns invalid CORS headers:** e.g., `Access-Control-Allow-Origin: http://localhost:3000, *` (which the browser blocks because only one value is allowed).
2. **Issues HTTP redirects (`301`/`302`):** Some backend endpoints redirect to other URLs. If you use a basic proxy, the browser follows the redirect directly to the remote server, bypassing the proxy and triggering a CORS error. This tool handles redirects correctly.
3. **Blocks requests from `localhost` entirely.**

This proxy acts as a middleman. It intercepts your local requests, forwards them to the real API, and injects clean, browser-friendly CORS headers into the response before sending it back to your local app.

## Installation
If you are setting this up from scratch or cloning the repository for the first time, navigate to this directory and install the dependencies:

```bash
cd cors-proxy-tool
npm install
```
*(This will install the required `cors-anywhere` package based on the `package.json`)*.

## How to Run
Open a **new terminal window** (keep this running alongside your Next.js frontend dev server) and start the proxy:

```bash
cd cors-proxy-tool
node cors-proxy.js
```

By default, the proxy will start listening on **port 9001**.
*(If you need to change the port, you can edit the `PORT` variable inside `cors-proxy.js`).*

## Usage in the App UI
Once the proxy is running, you must route your frontend requests through it. 

In the Agno Copilot UI **Server Configuration**, instead of entering the direct API URL like this:
❌ `https://api.your-company.com/v1/endpoint`

You need to **prepend the local proxy address** to the target URL:
✅ `http://localhost:9001/https://api.your-company.com/v1/endpoint`

The proxy will extract the destination URL, fetch the data on your behalf, strip out any problematic CORS headers, and return the response cleanly to your local frontend.