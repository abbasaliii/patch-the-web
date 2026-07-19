import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/extension",
  timeout: 40_000,
  workers: 1,
  fullyParallel: false,
  reporter: [["list"]],
  webServer: {
    command: "npm run build:site && npm run preview -- --port 4174",
    url: "http://127.0.0.1:4174/demo/",
    reuseExistingServer: true,
    timeout: 60_000
  }
});
