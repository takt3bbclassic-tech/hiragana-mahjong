import fs from "node:fs";
import path from "node:path";

const CHECK_ONLY = process.argv.includes("--check");
const srcDir = path.join(process.cwd(), "src");
const legacyAppPath = path.join(srcDir, "App.jsx");
const generatedAppPath = path.join(srcDir, "App.generated.jsx");
let source = fs.readFileSync(legacyAppPath, "utf8");

function replaceRequired(search, replacement, label) {
  if (!source.includes(search)) {
    throw new Error(`Could not find ${label}`);
  }
  source = source.split(search).join(replacement);
}

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

replaceRequired(
  " const [drawPicker, setDrawPicker] = useState(null);",
  "",
  "draw picker state"
);

replaceRequired(
  " const selectedTiles = hand.filter((tile) => selectedIds.includes(tile.id));",
  " const selectedTiles = selectedIds.map((id) => hand.find((tile) => tile.id === id)).filter(Boolean);",
  "selected tiles click order"
);

replaceRequired(
  " const drawCounts = useMemo(() => wall.reduce((acc, tile) => { acc[tile.char] = (acc[tile.char] || 0) + 1; return acc; }, {}), [wall]); const openNormalDrawPicker = () => { if (hasDrawnThisTurn || wall.length === 0) return; setDrawPicker({ type: \"normal\" }); }; const addTileFromWall = (char, mode = \"normal\") => { const index = wall.findIndex((tile) => tile.char === char); if (index < 0) return; const tile = wall[index]; setHand((prev) => [...prev, tile]); setWall((prev) => prev.filter((_, i) => i !== index)); if (mode === \"normal\") { setHasDrawnThisTurn(true); setDrawPicker(null); return; } setDrawPicker((prev) => { if (!prev || prev.type !== \"kan\") return null; const remaining = prev.remaining - 1; return remaining > 0 ? { ...prev, remaining } : null; }); };",
  " const drawFromWall = (count = 1, markTurnDrawn = false) => { if (wall.length === 0 || count <= 0) return; const drawCount = Math.min(count, wall.length); const drawn = wall.slice(0, drawCount); setHand((prev) => [...prev, ...drawn]); setWall((prev) => prev.slice(drawCount)); if (markTurnDrawn) setHasDrawnThisTurn(true); }; const drawOneTile = () => { if (hasDrawnThisTurn || wall.length === 0) return; drawFromWall(1, true); };",
  "draw picker handlers"
);

replaceRequired(
  " if (drawCount > 0) setDrawPicker({ type: \"kan\", blockId, remaining: drawCount, total: drawCount });",
  " if (drawCount > 0) drawFromWall(drawCount, false);",
  "kan draw picker trigger"
);

source = source.split(" setDrawPicker(null);").join("");
source = source.split("onClick={openNormalDrawPicker}").join("onClick={drawOneTile}");
source = source.split(">文字を追加</button>").join(">一枚引く</button>");

replaceRequired(
  "{drawPicker?.type === \"normal\" && <TilePickerModal title=\"追加する文字を選択\" note=\"山に残っている文字だけ選べます。\" counts={drawCounts} onPick={(char) => addTileFromWall(char, \"normal\")} onClose={() => setDrawPicker(null)} />}{drawPicker?.type === \"kan\" && <TilePickerModal title=\"カン追加牌を選択\" note={`あと${drawPicker.remaining}枚選択してください。`} counts={drawCounts} onPick={(char) => addTileFromWall(char, \"kan\")} />}",
  "",
  "draw picker modals"
);

if (!source.includes(wordsImport)) {
  throw new Error("Generated App is missing words import");
}
if (source.includes("const BASE_WORDS_TEXT =")) {
  throw new Error("Generated App still contains inline BASE_WORDS_TEXT");
}
if (source.includes("drawPicker") || source.includes("TilePickerModal title=\"追加する文字を選択\"")) {
  throw new Error("Generated App still contains draw picker behavior");
}
if (source.includes(">ツモ</button>") || !source.includes(">一枚引く</button>")) {
  throw new Error("Generated App has wrong draw button label");
}
if (!source.includes("const selectedTiles = selectedIds.map((id) => hand.find((tile) => tile.id === id)).filter(Boolean);")) {
  throw new Error("Generated App does not preserve selected tile click order");
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
