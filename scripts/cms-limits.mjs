/**
 * Pushes edge cases through the FAQ editing API and the public pages, to find
 * where the CMS stops. Needs both servers running (npm run wp, npm run dev)
 * and the local values in .env.local. Run: npm run cms:limits
 *
 * It creates test questions, checks them, and removes them again.
 */
process.loadEnvFile(".env.local");

const WP = process.env.WP_API_URL.replace(/\/+$/, "") + "/tca/v1";
const SITE = process.env.SITE_UNDER_TEST ?? "http://localhost:3000";
const SECRET = process.env.WP_SHARED_SECRET;
const DASH = "—";

const results = [];
const record = (name, pass, detail = "") => {
  results.push({ name, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`);
};

async function wp(path, { method = "GET", body, uid, secret = SECRET } = {}) {
  const response = await fetch(WP + path, {
    method,
    headers: {
      "content-type": "application/json",
      ...(secret ? { "x-webhook-secret": secret } : {}),
      ...(uid ? { "x-tca-user": String(uid) } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: response.status, data: await response.json().catch(() => null) };
}

async function refreshSite() {
  await fetch(`${SITE}/api/revalidate`, { method: "POST", headers: { "x-webhook-secret": SECRET } });
}
const page = async (path) => (await fetch(SITE + path)).text();

// ---- Sign-in ----
const login = (username, password, secret) =>
  wp("/session", { method: "POST", body: { username, password }, secret });

record("Sign-in without the site secret is refused", (await login("client", "x", null)).status === 401);
record("Wrong password is refused", (await login("client", "definitely-wrong")).status === 401);
const session = await login("client", process.env.WP_DEMO_EDITOR_PASSWORD);
record("Content manager can sign in", session.status === 200, session.data?.name);
const uid = session.data?.id;
if (!uid) process.exit(1);

record("Editing as an unknown account is refused", (await wp("/manage/faqs", { uid: 999999 })).status === 403);
record("Editing without the site secret is refused", (await wp("/manage/faqs", { uid, secret: null })).status === 401);

const before = (await wp("/manage/faqs", { uid })).data;
const { q: MAX_Q, a: MAX_A } = before.limits;
const startCount = before.items.length;
const created = [];
const add = async (q, a) => {
  const result = await wp("/manage/faqs", { method: "POST", uid, body: { q, a } });
  if (result.status === 200) {
    const known = new Set([...before.items.map((i) => i.id), ...created]);
    created.push(...result.data.items.map((i) => i.id).filter((id) => !known.has(id)));
  }
  return result;
};
const stored = async (q) => (await wp("/manage/faqs", { uid })).data.items.find((i) => i.q === q);

// ---- Required fields and the copy rule ----
record("Empty question is rejected", (await add("", "An answer")).status === 422);
record("Empty answer is rejected", (await add("A question?", "   ")).status === 422);
const dash = await add("Limit test: dash?", `It varies ${DASH} a lot.`);
record("Long dash is rejected with a plain message", dash.status === 422, dash.data?.errors?.a);

// ---- Length ----
record(`Question of ${MAX_Q} characters is accepted`, (await add("Q".repeat(MAX_Q), "Fits exactly.")).status === 200);
const longQ = await add("Q".repeat(MAX_Q + 1), "One too many.");
record(`Question of ${MAX_Q + 1} characters is rejected`, longQ.status === 422, longQ.data?.errors?.q);
record(`Answer of ${MAX_A} characters is accepted`, (await add("Limit test: longest answer?", "A".repeat(MAX_A))).status === 200);
record(`Answer of ${MAX_A + 1} characters is rejected`, (await add("Limit test: too long?", "A".repeat(MAX_A + 1))).status === 422);

// ---- Hostile and unusual text ----
await add("Limit test: HTML?", 'Before <script>alert("x")</script><b>bold</b> <img src=x onerror=alert(1)> after');
const html = await stored("Limit test: HTML?");
record("HTML and scripts are stripped before saving", !!html && !/[<>]/.test(html.a), html?.a);

const unicode =
  "Café, naïve, 日本語, العربية, 🚀 emoji, “curly quotes”, Tom & \"Jerry\", 5 > 3";
await add("Limit test: Unicode?", unicode);
const uni = await stored("Limit test: Unicode?");
record("Accents, CJK, Arabic, emoji, quotes and & survive unchanged", uni?.a === unicode, uni?.a === unicode ? "" : uni?.a);

const lines = "First line.\nSecond line.\n\nNew paragraph.";
await add("Limit test: line breaks?", lines);
const multi = await stored("Limit test: line breaks?");
record("Line breaks in an answer are kept", multi?.a === lines, multi?.a === lines ? "" : JSON.stringify(multi?.a));

await add("Limit test: duplicate?", "First copy.");
record("A duplicate question is allowed", (await add("Limit test: duplicate?", "Second copy.")).status === 200);

// ---- What reaches the public pages ----
await refreshSite();
let faqPage = await page("/faq");
record("New questions appear on /faq after a refresh", faqPage.includes("Limit test: Unicode?"));
record(
  "No injected script or tag reaches the page",
  !faqPage.includes('alert("x")</script>') && !faqPage.includes("onerror=alert")
);
record("Emoji and non-Latin text render on the page", faqPage.includes("🚀 emoji") && faqPage.includes("日本語"));
const home = await page("/");
record("Homepage still shows only the first six questions", !home.includes("Limit test: Unicode?"));

// ---- Ordering ----
const list = (await wp("/manage/faqs", { uid })).data.items;
const last = list.at(-1);
const moved = (await wp(`/manage/faqs/${last.id}/move`, { method: "POST", uid, body: { direction: "up" } })).data.items;
record("Move up swaps a question with the one above", moved.at(-2).id === last.id);
const top = (await wp(`/manage/faqs/${moved[0].id}/move`, { method: "POST", uid, body: { direction: "up" } })).data.items;
record("Moving the first question up changes nothing", top[0].id === moved[0].id);

// ---- Two people saving the same question at once ----
const target = created[0];
const both = await Promise.all(
  ["Edit from person A.", "Edit from person B."].map((a) =>
    wp(`/manage/faqs/${target}`, { method: "POST", uid, body: { q: "Limit test: two editors?", a } })
  )
);
const winner = (await stored("Limit test: two editors?"))?.a;
record("Simultaneous saves both succeed; the last one wins silently", both.every((r) => r.status === 200), `kept: ${winner}`);

// ---- Volume: more than WordPress returns in one request ----
const bulk = Math.max(0, 105 - (await wp("/manage/faqs", { uid })).data.items.length);
const started = Date.now();
for (let i = 0; i < bulk; i++) await add(`Limit test: bulk question ${i + 1}?`, `Bulk answer ${i + 1}.`);
const total = (await wp("/manage/faqs", { uid })).data.items.length;
await refreshSite();
faqPage = await page("/faq");
const shown = (faqPage.match(/<details/g) ?? []).length;
record(
  `${total} questions: all of them reach /faq (WordPress pages at 100)`,
  shown === total,
  `${shown} shown, ${bulk} added in ${Math.round((Date.now() - started) / 1000)}s`
);

// ---- Removing ----
const gone = await wp(`/manage/faqs/${target}`, { method: "DELETE", uid });
record("Remove takes a question off the list", gone.status === 200 && !gone.data.items.some((i) => i.id === target));
record("Removing it twice is refused cleanly", (await wp(`/manage/faqs/${target}`, { method: "DELETE", uid })).status === 404);

// ---- Clean up ----
for (const id of created) await wp(`/manage/faqs/${id}`, { method: "DELETE", uid });
const after = (await wp("/manage/faqs", { uid })).data.items.length;
await refreshSite();
record("Clean-up: back to the original number of questions", after === startCount, `${after} of ${startCount}`);

const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length} of ${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
