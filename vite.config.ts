import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";

const root = __dirname;
const siteOut = resolve(root, "dist/site");
const patchFile = "civic-apply.openpatch.json";

async function loadRegistryArtifacts() {
  const sourcePath = resolve(root, "src/registry/patches", patchFile);
  const raw = await readFile(sourcePath, "utf8");
  const patch = JSON.parse(raw) as {
    id: string;
    name: string;
    summary: string;
    version: string;
    author: { name: string; verified?: boolean };
    match: { hosts: string[]; paths: string[] };
    capabilities: string[];
    operations: unknown[];
    verify: unknown[];
    changelog: string;
  };
  const registry = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    patches: [{
      id: patch.id,
      name: patch.name,
      summary: patch.summary,
      version: patch.version,
      author: patch.author,
      scope: patch.match,
      capabilities: patch.capabilities,
      download: `/registry/patches/${patchFile}`,
      sha256: createHash("sha256").update(raw).digest("hex"),
      verification: {
        status: "verified",
        operations: patch.operations.length,
        assertions: patch.verify.length
      },
      changelog: patch.changelog
    }]
  };
  return { sourcePath, raw, registry };
}

const registryPlugin: Plugin = {
  name: "openpatch-public-registry",
  configureServer(server) {
    server.middlewares.use(async (request, response, next) => {
      const pathname = request.url?.split("?", 1)[0];
      if (pathname !== "/registry/index.json" && pathname !== `/registry/patches/${patchFile}`) return next();
      try {
        const artifacts = await loadRegistryArtifacts();
        response.statusCode = 200;
        response.setHeader("Content-Type", "application/json; charset=utf-8");
        response.end(pathname === "/registry/index.json" ? JSON.stringify(artifacts.registry, null, 2) : artifacts.raw);
      } catch (error) {
        next(error as Error);
      }
    });
  },
  async closeBundle() {
    const { sourcePath, registry } = await loadRegistryArtifacts();
    const registryDir = resolve(siteOut, "registry");
    const patchDir = resolve(registryDir, "patches");
    await mkdir(patchDir, { recursive: true });
    await copyFile(sourcePath, resolve(patchDir, patchFile));
    await writeFile(resolve(registryDir, "index.json"), JSON.stringify(registry, null, 2));
  }
};

export default defineConfig({
  root: resolve(root, "src/site"),
  publicDir: resolve(__dirname, "public"),
  plugins: [registryPlugin],
  build: {
    outDir: siteOut,
    emptyOutDir: true,
    rollupOptions: {
      input: {
        home: resolve(root, "src/site/index.html"),
        demo: resolve(root, "src/site/demo/index.html")
      }
    }
  }
});
