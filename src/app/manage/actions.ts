"use server";

import { revalidatePath, updateTag } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { CMS_TAG } from "@/lib/cms";
import { endSession, readSession, startSession, wordpress } from "@/lib/manage";
import { RateLimiter } from "@/lib/rate-limit";

export type FormState = {
  ok?: boolean;
  message?: string;
  errors?: { q?: string; a?: string };
};

const UNREACHABLE = "The content system is not responding. Nothing was changed. Please try again in a minute.";
const SIGNED_OUT = "You have been signed out. Reload the page and sign in again.";

const loginLimiter = new RateLimiter(5, 60_000, "manage-login");

export async function signIn(_: FormState, form: FormData): Promise<FormState> {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!(await loginLimiter.check(ip)).allowed) {
    return { message: "Too many attempts. Wait a minute and try again." };
  }

  const { status, data } = await wordpress("/session", {
    method: "POST",
    body: { username: String(form.get("username") ?? ""), password: String(form.get("password") ?? "") },
  });
  const user = z.object({ id: z.number(), name: z.string() }).safeParse(data);
  if (status === 0) return { message: UNREACHABLE };
  if (status === 403) return { message: "This account is not allowed to edit the website content." };
  if (status !== 200 || !user.success) return { message: "Wrong username or password." };

  await startSession({ uid: user.data.id, name: user.data.name });
  redirect("/manage");
}

export async function signOut(): Promise<void> {
  await endSession();
  redirect("/manage");
}

/** Runs one change in WordPress as the signed-in editor, then refreshes the public site. */
async function change(
  path: string,
  init: { method: "POST" | "DELETE"; body?: unknown },
  done: string
): Promise<FormState> {
  const session = await readSession();
  if (!session) return { message: SIGNED_OUT };

  const { status, data } = await wordpress(path, { ...init, uid: session.uid });
  if (status === 422) {
    const errors = z.object({ errors: z.record(z.string(), z.string()) }).safeParse(data);
    return { message: "Not saved yet. Please fix the highlighted field.", errors: errors.data?.errors };
  }
  if (status === 404) return { message: "That question was already removed by someone else. Reload the page." };
  if (status === 401 || status === 403) return { message: SIGNED_OUT };
  if (status !== 200) return { message: UNREACHABLE };

  updateTag(CMS_TAG);
  revalidatePath("/manage");
  return { ok: true, message: done };
}

const id = (form: FormData) => z.coerce.number().int().positive().parse(form.get("id"));

export async function saveFaq(_: FormState, form: FormData): Promise<FormState> {
  const body = { q: String(form.get("q") ?? ""), a: String(form.get("a") ?? "") };
  return form.get("id")
    ? change(`/manage/faqs/${id(form)}`, { method: "POST", body }, "Saved. The website is updated.")
    : change("/manage/faqs", { method: "POST", body }, "Added. It is now on the website.");
}

export async function deleteFaq(_: FormState, form: FormData): Promise<FormState> {
  return change(`/manage/faqs/${id(form)}`, { method: "DELETE" }, "Removed from the website.");
}

export async function moveFaq(_: FormState, form: FormData): Promise<FormState> {
  const direction = form.get("direction") === "up" ? "up" : "down";
  return change(`/manage/faqs/${id(form)}/move`, { method: "POST", body: { direction } }, "Order updated.");
}
