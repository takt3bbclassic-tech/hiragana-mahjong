import fs from "node:fs";
import path from "node:path";

const CHECK_ONLY = process.argv.includes("--check");
const srcDir = path.join(process.cwd(), "src");
const legacyAppPath = path.join(srcDir, "App.jsx");
const generatedAppPath = path.join(srcDir, "App.generated.jsx");
let source = fs.readFileSync(legacyAppPath, "utf8");

const wordsImport = 'import { BASE_WORDS, BASE_WORD_COUNT } from "./words.js";';
if (!source.includes(wordsImport)) {
  const reactImport = 'import React, { useMemo, useState } from "react";';
  const reactIndex = source.indexOf(reactImport);
  if (reactIndex < 0) {
    throw new Error("React import line was not found in src/App.jsx");
  }
  const insertAt = reactIndex + reactImport.length;
  source = `${source.slice(0, insertAt)}\n${wordsImport}${source.slice(insertAt)}`;
}

const textStart = source.indexOf('\nconst BASE_WORDS_TEXT = "');
const setMarker = '\nconst BASE_WORD_SET = new Set(BASE_WORDS.map((word) => cleanText(word)));';
const setIndex = source.indexOf(setMarker);
if (textStart >= 0 && setIndex > textStart) {
  source = source.slice(0, textStart) + source.slice(setIndex);
}

if (!source.includes("const PRACTICE_BASE_WORD_COUNT = BASE_WORD_COUNT;")) {
  source = source.replace(
    "const BASE_WORD_SET = new Set(BASE_WORDS.map((word) => cleanText(word)));",
    "const PRACTICE_BASE_WORD_COUNT = BASE_WORD_COUNT;\nconst BASE_WORD_SET = new Set(BASE_WORDS.map((word) => cleanText(word)));"
  );
}

source = source.split("辞書数: {dictionaryLength}語").join("辞書数: {PRACTICE_BASE_WORD_COUNT}語");

if (!source.includes(wordsImport)) {
  throw new Error("Generated App is missing words import");
}
if (source.includes("const BASE_WORDS_TEXT =")) {
  throw new Error("Generated App still contains inline BASE_WORDS_TEXT");
}

if (CHECK_ONLY) {
  const current = fs.existsSync(generatedAppPath) ? fs.readFileSync(generatedAppPath, "utf8") : "";
  if (current !== source) {
    console.error("src/App.generated.jsx is out of date. Run: npm run generate");
    process.exit(1);
  }
  console.log("src/App.generated.jsx is up to date");
} else {
  fs.writeFileSync(generatedAppPath, source);
  console.log("generated src/App.generated.jsx from src/App.jsx and src/words.js");
}
