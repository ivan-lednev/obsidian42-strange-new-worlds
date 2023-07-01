import esbuild from "esbuild";
import process from "process";
import fs from "fs";
import builtins from "builtin-modules";
import { ESLint } from "eslint";
import {solidPlugin} from "esbuild-plugin-solid";

const prod = (process.argv[2] === "production");


esbuild.build({
    entryPoints: ["src/main.ts"],
    bundle: true,
    format: "cjs",
    watch: {
      onRebuild(error, result) {
        if(prod==="production") return true;
      },
    },
    target: "es2018",
    logLevel: "info",
    sourcemap: prod ? false : "inline",
    treeShaking: true,
    minify: false,
    outdir: "./",
    external: [
      "obsidian",
      "electron",
      "codemirror",
      "@codemirror/commands",
      "@codemirror/language",
      "@codemirror/search",
      "@codemirror/state",
      "@codemirror/view",
      ...builtins,
    ],
  plugins: [solidPlugin()]
}).then(result => {
}).catch(() => process.exit(1));


// eslint won't slow down the build process, just runs after the build finishes
(async function eslintTest() {
  const eslint = new ESLint();
  const results = await eslint.lintFiles(["src/**/*.ts"]);
  const formatter = await eslint.loadFormatter("stylish");
  const resultText = formatter.format(results);
  console.log(resultText);
})().catch((error) => {
  process.exitCode = 1;
  console.error(error);
});
