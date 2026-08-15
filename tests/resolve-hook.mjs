/**
 * Resolves extensionless relative imports and `@/` aliases for Node's
 * built-in test runner (`--experimental-strip-types`).
 */
export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const mapped = new URL(
      `../src/${specifier.slice(2)}.ts`,
      import.meta.url,
    ).href;
    return nextResolve(mapped, context);
  }

  if (
    (specifier.startsWith("./") || specifier.startsWith("../")) &&
    !specifier.endsWith(".ts") &&
    !specifier.endsWith(".js") &&
    !specifier.endsWith(".json")
  ) {
    try {
      return await nextResolve(`${specifier}.ts`, context);
    } catch {
      // fall through to default
    }
  }

  return nextResolve(specifier, context);
}
