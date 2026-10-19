/** Runs once per server start. Node only: the outbox lives on the filesystem. */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startOutboxRetry } = await import("@/lib/lead-outbox");
    startOutboxRetry();
  }
}
