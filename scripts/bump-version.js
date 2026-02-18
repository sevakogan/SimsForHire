#!/usr/bin/env node

/**
 * Auto-increment patch version on each build.
 * Reads version.json, bumps the patch number, writes it back.
 *
 * 1.0.0 → 1.0.1 → 1.0.2 → 1.0.3 …
 */

const fs = require("fs");
const path = require("path");

const versionFile = path.join(__dirname, "..", "version.json");

const data = JSON.parse(fs.readFileSync(versionFile, "utf-8"));
const parts = data.version.split(".").map(Number);

// Bump patch
parts[2] = parts[2] + 1;

const newVersion = parts.join(".");
const updated = { version: newVersion };

fs.writeFileSync(versionFile, JSON.stringify(updated, null, 2) + "\n", "utf-8");

console.log(`✓ Version bumped to v${newVersion}`);
