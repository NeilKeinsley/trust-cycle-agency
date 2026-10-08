/** Shown on CMS-driven pages while Draft Mode is on (see /api/draft). */
export function PreviewBanner() {
  return (
    <form
      action="/api/draft/exit"
      method="post"
      className="flex flex-wrap items-center justify-center gap-3 border-b border-line bg-accent-soft px-4 py-2 text-sm text-foreground"
    >
      <p>Preview: you are seeing unpublished content from WordPress.</p>
      <button type="submit" className="link-line cursor-pointer font-medium">
        Exit preview
      </button>
    </form>
  );
}
