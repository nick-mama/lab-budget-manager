export function getApiBase(): string {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  return base.replace(/\/$/, "");
}
