export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function signed(n: number): string {
  return n > 0 ? `+${n}` : `${n}`;
}
