/** Derives a readable default handle from the team's name, so a published
 * team announces itself as "research-desk" rather than an opaque token. AT
 * protocol handles are DNS labels: lowercase alphanumerics and hyphens, no
 * leading/trailing hyphen. The bundled PDS restricts account usernames to
 * 3–18 characters, which is stricter than DNS syntax. The publish form stays
 * editable for other PDS policies; this only seeds a compatible default. */
export const DEMO_USERNAME_MAX_LENGTH = 18;

export function teamHandleSlug(name: string | undefined): string {
  const slug = (name ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, DEMO_USERNAME_MAX_LENGTH)
    .replace(/-+$/, "");
  if (slug === "") {
    return "embers-team";
  }
  return slug.length < 3 ? `${slug}-team` : slug;
}
