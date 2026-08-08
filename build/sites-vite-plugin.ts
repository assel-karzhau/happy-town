import { access, cp, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";
import type { Plugin } from "vite";

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return false;
    }
    throw error;
  }
}

// Packages Sites metadata and migrations after Vite finishes compiling.
export function sites(): Plugin {
  let root = process.cwd();

  return {
    name: "sites",
    apply: "build",
    transform(code, id) {
      // Prisma's generated client assigns __dirname from import.meta.url. The
      // Sites worker wrapper does not expose import.meta.url at runtime, while
      // the client-engine build already bundles its WASM imports. Keep the
      // compatibility global without evaluating an unavailable URL.
      if (id.endsWith("/generated/prisma/client.ts")) {
        return code.replace(
          /globalThis\[['"]__dirname['"]\]\s*=\s*(?:path\.)?dirname\(fileURLToPath\(import\.meta\.url\)\)\s*;?/,
          'globalThis["__dirname"] = "."',
        );
      }
      return null;
    },
    configResolved(config) {
      root = config.root;
    },
    async closeBundle() {
      const outputDirectory = resolve(root, "dist", ".openai");
      const hostingConfig = resolve(root, ".openai", "hosting.json");
      const drizzleSource = resolve(root, "drizzle");

      await rm(outputDirectory, { recursive: true, force: true });
      await mkdir(outputDirectory, { recursive: true });

      if (await exists(hostingConfig)) {
        await cp(hostingConfig, resolve(outputDirectory, "hosting.json"));
      }
      if (await exists(drizzleSource)) {
        await cp(drizzleSource, resolve(outputDirectory, "drizzle"), {
          recursive: true,
        });
      }
    },
  };
}
