// Simulates a compromised CMS for 90 seconds: a blog post whose title, excerpt
// and body try to break out of the page. Then asks the local site to re-read
// content and checks what the visitor's browser would receive.
import http from "node:http";

const SITE = "http://localhost:3001";
const HOSTILE = 'Probe </script><script>window.xss=1</script><img src=x onerror=alert(1)>';
const post = {
  id: 999,
  slug: "hostile-probe",
  tca_title: HOSTILE,
  tca_excerpt: `Excerpt ${HOSTILE}`,
  date_gmt: "2026-10-09T00:00:00",
  modified_gmt: "2026-10-09T00:00:00",
  tca_image: null,
  tca_blocks: [{ type: "paragraph", content: [{ text: `Body ${HOSTILE}` }, { text: "ok link", href: "https://example.com/" }] }],
};
// Same post with link and picture addresses the site must refuse: the whole entry should be dropped.
const badLinks = {
  ...post,
  id: 1000,
  slug: "hostile-links",
  tca_title: "Bad links",
  tca_blocks: [
    { type: "paragraph", content: [{ text: "javascript link", href: "javascript:alert(1)" }] },
    { type: "paragraph", content: [{ text: "data link", href: "data:text/html,x" }] },
    { type: "image", image: { url: "https://evil.example/x.png", width: 10, height: 10, alt: "" }, caption: [] },
  ],
};

const server = http.createServer((req, res) => {
  if (req.url.startsWith("/wp-json/wp/v2/blog")) {
    res.writeHead(200, { "Content-Type": "application/json", "x-wp-totalpages": "1" });
    res.end(JSON.stringify([post, badLinks]));
  } else {
    res.writeHead(503).end();
  }
});
await new Promise((r) => server.listen(9400, "127.0.0.1", r));
setTimeout(() => process.exit(0), 90000).unref();

try {
  const flush = await fetch(`${SITE}/api/revalidate`, { method: "POST", headers: { "x-webhook-secret": "local-dev-secret" } });
  console.log("revalidate:", flush.status);
  let html = "";
  for (let i = 0; i < 6; i++) {
    const page = await fetch(`${SITE}/blog/hostile-probe`, { cache: "no-store" });
    html = await page.text();
    if (page.status === 200 && html.includes("Probe")) { console.log("hostile post page:", page.status); break; }
    await new Promise((r) => setTimeout(r, 1500));
  }
  const ld = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  const block = ld.find((s) => s.includes("Probe"));
  console.log("JSON-LD holding the title:", block ? "found" : "NOT FOUND");
  console.log("  raw </script><script> anywhere in the HTML:", html.includes("</script><script>window.xss"));
  console.log("  raw <img onerror> anywhere in the HTML:", /<img src=x onerror/.test(html));
  console.log("  escaped inside JSON-LD (\\u003c/script>):", Boolean(block?.includes("\\u003c/script>\\u003cscript>window.xss")));
  if (block) {
    const data = JSON.parse(block);
    const article = (Array.isArray(data) ? data : [data]).find((n) => n.headline);
    console.log("  JSON-LD parses back to the exact title:", article?.headline === HOSTILE);
  }
  console.log("  visible text shows the tags as text (escaped by React):", html.includes("&lt;/script&gt;&lt;script&gt;window.xss"));
  const bad = await fetch(`${SITE}/blog/hostile-links`, { cache: "no-store" });
  const badHtml = await bad.text();
  console.log("entry with javascript:/data: links and a foreign picture:", bad.status, "| rendered:", /javascript link|evil\.example/.test(badHtml));
} finally {
  server.close();
}
