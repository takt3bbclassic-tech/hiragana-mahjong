import fs from "node:fs";
import path from "node:path";

const appPath = path.join(process.cwd(), "src", "App.jsx");
let source = fs.readFileSync(appPath, "utf8");

if (!source.includes('import { BASE_WORDS, BASE_WORD_COUNT } from "./words.js";')) {
  source = source.replace(
    'import React, { useMemo, useState } from "react";\n',
    'import React, { useMemo, useState } from "react";\nimport { BASE_WORDS, BASE_WORD_COUNT } from "./words.js";\n'
  );
}

source = source.replace(/\nconst BASE_WORDS_TEXT = "[\s\S]*?";\nconst BASE_WORDS = BASE_WORDS_TEXT\.split\(\/\\s\+\/\)\.filter\(Boolean\);/, "");

if (!source.includes("const PRACTICE_BASE_WORD_COUNT = BASE_WORD_COUNT;")) {
  source = source.replace(
    "const BASE_WORD_SET = new Set(BASE_WORDS.map((word) => cleanText(word)));",
    "const PRACTICE_BASE_WORD_COUNT = BASE_WORD_COUNT;\nconst BASE_WORD_SET = new Set(BASE_WORDS.map((word) => cleanText(word)));"
  );
}

source = source.replace(/辞書数: \{dictionaryLength\}語/g, "辞書数: {PRACTICE_BASE_WORD_COUNT}語");

fs.writeFileSync(appPath, source);
console.log("synced App.jsx to src/words.js");
