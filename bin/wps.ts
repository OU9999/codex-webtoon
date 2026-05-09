#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "../server/config.js";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));

function readVersion(): string {
  try {
    const pkg = JSON.parse(readFileSync(join(rootDir, "package.json"), "utf-8"));
    return pkg.version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
}

function status() {
  console.log(`webtoon-panel-studio v${readVersion()}`);
  console.log(`config dir : ${config.storage.configDir}`);
  console.log(`projects   : ${config.storage.projectsRoot}`);
  const ad = config.storage.advertiseFile;
  if (existsSync(ad)) {
    console.log(`server     : ${readFileSync(ad, "utf-8").trim()}`);
  } else {
    console.log(`server     : not running`);
  }
}

function serve() {
  const serverEntry = join(rootDir, "build", "server", "server.js");
  const useBuilt = existsSync(serverEntry);
  const cmd = useBuilt ? "node" : "npx";
  const args = useBuilt ? [serverEntry] : ["tsx", join(rootDir, "server", "server.ts")];
  const child = spawn(cmd, args, { stdio: "inherit", cwd: rootDir });
  child.on("exit", (code) => process.exit(code ?? 0));
  process.on("SIGINT", () => child.kill("SIGINT"));
  process.on("SIGTERM", () => child.kill("SIGTERM"));
}

function help() {
  console.log(`webtoon-panel-studio v${readVersion()}

Commands:
  serve     Start the local server (default).
  status    Show config paths and running server info.
  help      Show this help.
`);
}

const cmd = process.argv[2] ?? "serve";
switch (cmd) {
  case "serve":
    serve();
    break;
  case "status":
    status();
    break;
  case "help":
  case "--help":
  case "-h":
    help();
    break;
  default:
    console.error(`unknown command: ${cmd}`);
    help();
    process.exit(1);
}
