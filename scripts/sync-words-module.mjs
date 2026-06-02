import fs from "node:fs";
import path from "node:path";

const srcDir = path.join(process.cwd(), "src");
const legacyAppPath = path.join(srcDir, "App.jsx");
const generatedAppPath = path.join(srcDir, "App.generated.jsx");
let source = fs.readFileSync(legacyAppPath, "utf8");

const wordsImport = 'import { BASE_WORDS, BASE_WORD_COUNT } from "./words.js";';
if (!source.includes(wordsImport)) {
  source = source.replace(
    'import React, { useMemo, useState } from "react";\n',
    `import React, { useMemo, useState } from "react";\n${wordsImport}\n`
  );
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

fs.writeFileSync(generatedAppPath, source);
console.log("generated src/App.generated.jsx from src/App.jsx and src/words.js");
