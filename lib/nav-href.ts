// Single source for the nav label → route mapping (server- and client-safe).
export function navHrefFor(item: string): string {
  return item === "Watch" ? "/" : `/${item.toLowerCase()}`;
}
