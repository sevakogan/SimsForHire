#!/usr/bin/env node

/**
 * Auto-increment patch version and build number on each build.
 *
 * version: 1.0.4 → 1.0.5 → 1.0.6 …
 * build:   4     → 5     → 6     …
 */

const fs = require("fs");
const path = require("path");

const versionFile = path.join(__dirname, "..", "version.json");

const data = JSON.parse(fs.readFileSync(versionFile, "utf-8"));
const parts = data.version.split(".").map(Number);

// Bump patch
parts[2] = parts[2] + 1;

const newVersion = parts.join(".");
const newBuild = (data.build || 0) + 1;

const updated = { version: newVersion, build: newBuild, builtAt: new Date().toISOString() };

fs.writeFileSync(versionFile, JSON.stringify(updated, null, 2) + "\n", "utf-8");

console.log(`✓ Version bumped to v${newVersion}, Build #${newBuild}`);
