# security/

Test configs for this project. What they protect and why: `docs/SECURITY.md`. The scripts that read them are in the Web Integrations knowledge base (`skills\web-security-check\scripts`).

| File | What it is |
|---|---|
| `probe.site.json` | Endpoints of the Next.js site for `sec-probe`: the lead form, the three secret-protected routes, the preview redirect. `--base` points it at a local build, staging or production |
| `probe.wordpress.json` | The CMS's secret-protected routes and the sign-in throttle check |
| `hostile-cms.mjs` | Pretends to be a compromised WordPress on port 9400 for 90 seconds and checks the HTML a visitor would get from a local production build on port 3001 |

Rules:
- The lead form's `safeBody` fills the honeypot field, so the site answers "ok" and drops it: no lead reaches n8n. Keep it that way.
- No secrets in these files. The probes only ever send wrong ones.
- A new form, API route, webhook or login gets an entry here in the commit that adds it.

`hostile-cms.mjs` is the proof that `src/lib/json-ld.ts` works. With the escape broken, the run prints `raw </script><script> anywhere in the HTML: true`. Expected output:

```
raw </script><script> anywhere in the HTML: false
escaped inside JSON-LD (</script>): true
JSON-LD parses back to the exact title: true
entry with javascript:/data: links and a foreign picture: 404 | rendered: false
```
