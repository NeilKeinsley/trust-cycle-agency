import { draftMode } from "next/headers";
import { redirect } from "next/navigation";

/** Leaves Draft Mode (the form in PreviewBanner posts here). */
export async function POST() {
  (await draftMode()).disable();
  redirect("/");
}
