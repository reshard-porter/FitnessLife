// Builds the web app into www/ (the folder Capacitor copies into the iOS project).
import { build } from "esbuild";
import { execSync } from "node:child_process";

await build({
  entryPoints: ["src/main.jsx"],
  bundle: true,
  minify: true,
  format: "iife",
  jsx: "automatic",
  target: ["safari15"],
  define: { "process.env.NODE_ENV": '"production"' },
  outfile: "www/app.js",
});
execSync("npx tailwindcss -i src/styles.css -o www/styles.css --minify", { stdio: "inherit" });
console.log("Built www/app.js and www/styles.css");
