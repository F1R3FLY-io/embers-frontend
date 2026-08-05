/** Derives a readable default handle from the team's name, so a published
 * team announces itself as "research-desk" rather than an opaque token. AT
 * protocol handles are DNS labels: lowercase alphanumerics and hyphens, no
 * leading/trailing hyphen, 63 chars max per label (kept well short of that so
 * the domain suffix and any user edits have room). The publish form stays
 * editable; this only seeds it. */
export function teamHandleSlug(name: string | undefined): string {
  const slug = (name ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30)
    .replace(/-+$/, "");
  return slug === "" ? "team" : slug;
}
