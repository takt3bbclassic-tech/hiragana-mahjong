import React, { useMemo, useState } from "react";
import { Home, RotateCcw, Save, Shuffle, Sparkles, Trash2, Undo2, HelpCircle, MessageSquareText } from "lucide-react";

const BASIC_TILES = "あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわん".split("");
const EXTRA_TILES = "がぎぐげござじずぜぞだぢづでどばびぶべぼぱぴぷぺぽゃゅょっー".split("");
const TILE_POOL = [...BASIC_TILES.flatMap((tile) => [tile, tile]), ...EXTRA_TILES];
const SAVE_KEY = "hiragana-mahjong-solo-save";

const DICTIONARY = [
  "あい", "あお", "あさ", "あし", "あめ", "いえ", "いぬ", "いも", "うえ", "うし", "うた", "うみ", "えき", "えび", "おに",
  "かお", "かぎ", "かさ", "かに", "かわ", "くさ", "くつ", "くま", "こめ", "さけ", "すし", "そら", "たこ", "つき", "とり",
  "ねこ", "はな", "ひと", "ふね", "ほし", "みこ", "みず", "むし", "もり", "やま", "ゆき", "ぱん", "ぺん", "ぞう", "ぶた",
  "さくら", "ことば", "うみねこ", "ひらがな", "おにぎり", "ぎょうざ", "じゃぐち", "ぴかぴか", "ぽんこつ", "れいぞうこ",
  "あかり", "あくび", "あげもの", "あじさい", "いちご", "うさぎ", "うどん", "うなぎ", "えがお", "おかし", "おもちゃ",
  "かがみ", "かぞく", "かばん", "からだ", "がっき", "がっこう", "きつね", "きのこ", "ぎゅうどん", "くじら", "げんかん",
  "こども", "さかな", "すいか", "せんせい", "だいこん", "ちゃわん", "どんぐり", "ぬいぐるみ", "ねずみ", "のりもの", "はさみ", "みかん", "めがね", "りんご"
].map((word) => ({ word, label: word, score: word.length * 10 }));

function shuffle(list) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function makeTile(char, prefix = "tile") {
  return { id: `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`, char };
}

function buildDeck() {
  return shuffle(TILE_POOL.map((char) => makeTile(char)));
}

function cleanText(text) {
  return Array.from(text).filter((ch) => ![" ", "　", ",", "、", "/", "・", "\n", "\t"].includes(ch)).join("");
}

function createGame({ mode, handSize, manualText }) {
  const deck = buildDeck();
  if (mode === "manual") {
    return {
      hand: Array.from(cleanText(manualText)).map((char) => makeTile(char, "manual")),
      wall: deck,
      fixedBlocks: [],
      discarded: [],
      hasDrawnThisTurn: false,
    };
  }
  return {
    hand: deck.slice(0, handSize),
    wall: deck.slice(handSize),
    fixedBlocks: [],
    discarded: [],
    hasDrawnThisTurn: false,
  };
}

function canMakeWord(word, tiles) {
  const remain = tiles.map((tile) => tile.char);
  for (const ch of word) {
    const idx = remain.indexOf(ch);
    if (idx < 0) return false;
    remain.splice(idx, 1);
  }
  return true;
}

function getWordsFromTiles(tiles) {
  return DICTIONARY.filter((entry) => canMakeWord(entry.word, tiles))
    .sort((a, b) => b.word.length - a.word.length || b.score - a.score)
    .slice(0, 20);
}

function getWaits(tiles) {
  const chars = tiles.map((tile) => tile.char);
  const waits = [];
  for (const entry of DICTIONARY) {
    const remain = [...chars];
    const missing = [];
    for (const ch of entry.word) {
      const idx = remain.indexOf(ch);
      if (idx >= 0) remain.splice(idx, 1);
      else missing.push(ch);
    }
    if (missing.length === 1) waits.push({ ...entry, wait: missing[0] });
  }
  return waits.sort((a, b) => b.word.length - a.word.length || b.score - a.score).slice(0, 18);
}

function getCompletionStatus(fixedBlocks) {
  const lengths = fixedBlocks.map((block) => block.tiles.length);
  const pairCount = lengths.filter((len) => len === 2).length;
  const mentsuCount = lengths.filter((len) => len >= 3).length;
  const lockedTileCount = fixedBlocks.reduce((sum, block) => sum + block.tiles.length, 0);
  if (pairCount >= 7) return { complete: true, title: "七対子型の完成候補", detail: `2枚ブロックが${pairCount}個あります。`, pairCount, mentsuCount, lockedTileCount };
  if (mentsuCount >= 4 && pairCount >= 1) return { complete: true, title: "4メンツ＋雀頭型の完成候補", detail: `メンツ${mentsuCount}個、雀頭${pairCount}個があります。`, pairCount, mentsuCount, lockedTileCount };
  return { complete: false, title: "まだ完成ではありません", detail: `メンツ${mentsuCount}個、雀頭${pairCount}個です。`, pairCount, mentsuCount, lockedTileCount };
}

function Tile({ tile, selected, onClick, disabled = false }) {
  return (
    <button type="button" disabled={disabled} onClick={onClick} className={`grid h-14 w-11 shrink-0 place-items-center rounded-xl border-2 bg-gradient-to-b from-white to-stone-100 text-2xl font-black shadow-sm transition active:scale-95 disabled:opacity-60 ${selected ? "border-emerald-500 ring-4 ring-emerald-100" : "border-stone-300"}`}>
      {tile.char}
    </button>
  );
}

function AdBox({ label }) {
  return <div className="grid h-12 shrink-0 place-items-center rounded-2xl border border-dashed border-stone-300 bg-stone-50 text-xs text-stone-400">{label} / AdMob差し替え予定</div>;
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-3xl bg-white p-5 shadow-xl">
        <h2 className="mb-3 text-xl font-black">{title}</h2>
        {children}
        <button type="button" onClick={onClose} className="mt-4 rounded-2xl border px-4 py-2">閉じる</button>
      </div>
    </div>
  );
}

function CompletionCard({ status }) {
  return (
    <div className={`shrink-0 rounded-3xl border p-3 text-sm ${status.complete ? "border-amber-300 bg-amber-50 text-amber-950" : "border-stone-200 bg-white"}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${status.complete ? "bg-amber-500 text-white" : "bg-stone-100"}`}>{status.complete ? "完成候補" : "未完成"}</span>
        <b>{status.title}</b>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
        <div className="rounded-2xl bg-white/80 p-2"><b className="block text-base">{status.mentsuCount}</b>メンツ</div>
        <div className="rounded-2xl bg-white/80 p-2"><b className="block text-base">{status.pairCount}</b>雀頭</div>
        <div className="rounded-2xl bg-white/80 p-2"><b className="block text-base">{status.lockedTileCount}</b>固定牌</div>
      </div>
      <p className="mt-2 text-xs opacity-80">{status.detail}</p>
    </div>
  );
}

function AssistPanel({ level, hand, fixedBlocks, selectedTiles }) {
  const words = useMemo(() => getWordsFromTiles(hand), [hand]);
  const waits = useMemo(() => getWaits(hand), [hand]);
  const status = useMemo(() => getCompletionStatus(fixedBlocks), [fixedBlocks]);
  const selectedText = selectedTiles.map((tile) => tile.char).join("");
  const score = Math.min(100, status.mentsuCount * 22 + status.pairCount * 12 + words.length * 7 + waits.length * 3);

  if (level === 0) {
    return <aside className="flex h-full min-h-0 flex-col overflow-hidden rounded-3xl bg-white p-4 shadow-sm"><h2 className="mb-2 flex items-center gap-2 font-black"><Sparkles size={18} />アシスト Lv0</h2><p className="text-sm text-stone-500">完全ノーアシストです。</p></aside>;
  }

  return (
    <aside className="flex h-full min-h-0 flex-col overflow-hidden rounded-3xl bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2"><h2 className="flex items-center gap-2 font-black"><Sparkles size={18} />アシスト Lv{level}</h2>{level >= 2 && <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-bold">形評価 {score}</span>}</div>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-2">
        <section><h3 className="mb-2 font-bold">待ち候補</h3>{waits.length ? <div className="grid grid-cols-2 gap-2">{waits.map((w, i) => <div key={`${w.word}-${i}`} className="rounded-2xl bg-emerald-50 p-2 text-sm text-emerald-900"><b>{w.word}</b> <span className="text-xs">待ち:{w.wait}</span></div>)}</div> : <p className="text-sm text-stone-400">待ち候補なし</p>}</section>
        {level >= 2 && <section><h3 className="mb-2 font-bold">雀頭/メンツ候補</h3><div className="flex flex-wrap gap-2">{words.length ? words.slice(0, 14).map((entry) => <span key={entry.word} className="rounded-full border px-3 py-1 text-xs font-bold">{entry.word}</span>) : <p className="text-sm text-stone-400">成立候補なし</p>}</div></section>}
        {level >= 3 && <section className="rounded-2xl bg-amber-50 p-3 text-sm text-amber-950"><h3 className="mb-2 font-bold">おすすめ</h3><p>固定候補：{selectedText || words[0]?.word || "まず2〜3枚選択"}</p><p>捨て牌候補：{hand.at(-1)?.char || "-"}</p><p className="mt-2 text-xs text-amber-700">長めの語・スコア高めの語・待ち候補を残しやすい形を優先しています。</p></section>}
      </div>
    </aside>
  );
}

function HomeScreen({ onStart, savedGame, onLoadSaved, onClearSaved }) {
  const [mode, setMode] = useState("random");
  const [handSize, setHandSize] = useState(13);
  const [assistLevel, setAssistLevel] = useState(2);
  const [manualText, setManualText] = useState("さくらうみねこ");
  const [modal, setModal] = useState(null);
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-stone-100 p-4 text-stone-900">
      <div className="mx-auto flex min-h-[calc(100vh-32px)] max-w-5xl flex-col justify-between gap-4">
        <div className="space-y-4">
          <header className="rounded-[2rem] bg-emerald-700 p-6 text-white shadow-lg"><div className="text-sm font-bold text-emerald-100">Solo Practice v1</div><h1 className="mt-2 text-4xl font-black tracking-tight">Hiragana Mahjong</h1><p className="mt-2 text-sm text-emerald-50">ひらがな牌で言葉を作る、ソロ練習用アシストアプリ。</p></header>
          {savedGame && <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm"><div className="font-bold text-emerald-900">保存中の練習があります</div><p className="mt-1 text-sm text-emerald-800">手牌 {savedGame.hand?.length || 0}枚 / 固定 {savedGame.fixedBlocks?.length || 0}ブロック / 捨て牌 {savedGame.discarded?.length || 0}枚</p><div className="mt-3 flex gap-2"><button type="button" onClick={onLoadSaved} className="rounded-2xl bg-emerald-700 px-4 py-2 font-bold text-white">再開する</button><button type="button" onClick={onClearSaved} className="rounded-2xl border bg-white px-4 py-2">削除</button></div></section>}
          <section className="rounded-3xl bg-white p-5 shadow-sm"><h2 className="mb-4 text-xl font-black">開始設定</h2><div className="grid gap-4 md:grid-cols-2"><div><label className="text-sm font-bold">開始方法</label><div className="mt-2 grid grid-cols-2 rounded-2xl bg-stone-100 p-1"><button type="button" onClick={() => setMode("random")} className={`rounded-xl px-4 py-2 font-bold ${mode === "random" ? "bg-emerald-700 text-white" : ""}`}>ランダム</button><button type="button" onClick={() => setMode("manual")} className={`rounded-xl px-4 py-2 font-bold ${mode === "manual" ? "bg-emerald-700 text-white" : ""}`}>手動</button></div>{mode === "manual" && <input value={manualText} onChange={(e) => setManualText(e.target.value)} className="mt-3 w-full rounded-2xl border p-3" placeholder="例：さくらうみねこ" />}</div><div className="grid grid-cols-2 gap-3"><label className="text-sm font-bold">手牌枚数<select value={handSize} onChange={(e) => setHandSize(Number(e.target.value))} className="mt-2 w-full rounded-2xl border bg-white p-3">{[7, 10, 13, 16, 20].map((n) => <option key={n} value={n}>{n}枚</option>)}</select></label><label className="text-sm font-bold">アシストLv<select value={assistLevel} onChange={(e) => setAssistLevel(Number(e.target.value))} className="mt-2 w-full rounded-2xl border bg-white p-3">{[0, 1, 2, 3].map((n) => <option key={n} value={n}>Lv{n}</option>)}</select></label></div></div><div className="mt-5 flex flex-wrap gap-2"><button type="button" onClick={() => setModal("help")} className="rounded-2xl border px-4 py-2"><HelpCircle className="mr-2 inline" size={16} />遊び方</button><button type="button" onClick={() => setModal("feedback")} className="rounded-2xl border px-4 py-2"><MessageSquareText className="mr-2 inline" size={16} />要望/不具合</button><button type="button" onClick={() => onStart({ mode, handSize, assistLevel, manualText })} className="ml-auto rounded-2xl bg-emerald-700 px-8 py-2 font-bold text-white"><Shuffle className="mr-2 inline" size={16} />開始する</button></div></section>
        </div>
        <AdBox label="ホーム下部広告枠" />
      </div>
      {modal === "help" && <Modal title="ソロ練習の遊び方" onClose={() => setModal(null)}><div className="space-y-2 text-sm text-stone-700"><p>手牌から文字を選び、「固定」で単語ブロックにします。</p><p>「1枚引く」で1枚だけ引き、不要な牌を選んで「捨てる」。1枚引いた後は、捨てるまで次の牌は引けません。</p><p>Lv1は待ち候補、Lv2は候補と形評価、Lv3はおすすめまで表示します。</p></div></Modal>}
      {modal === "feedback" && <Modal title="要望/不具合" onClose={() => setModal(null)}><div className="space-y-3"><input className="w-full rounded-2xl border p-3" placeholder="返信先メール（任意）" /><textarea className="w-full rounded-2xl border p-3" rows={5} placeholder="例：この単語が出ない / スクロールが変 / Lv2候補が多すぎる" /><button type="button" className="rounded-2xl bg-emerald-700 px-4 py-2 font-bold text-white">送信する（仮）</button></div></Modal>}
    </div>
  );
}

function SoloPlayScreen({ settings, onBack }) {
  const initialGame = useMemo(() => settings.savedState || createGame(settings), [settings]);
  const [hand, setHand] = useState(initialGame.hand || []);
  const [wall, setWall] = useState(initialGame.wall || []);
  const [fixedBlocks, setFixedBlocks] = useState(initialGame.fixedBlocks || []);
  const [discarded, setDiscarded] = useState(initialGame.discarded || []);
  const [hasDrawnThisTurn, setHasDrawnThisTurn] = useState(initialGame.hasDrawnThisTurn || false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [assistLevel, setAssistLevel] = useState(settings.savedState?.assistLevel ?? settings.assistLevel);
  const [exitOpen, setExitOpen] = useState(false);
  const selectedTiles = hand.filter((tile) => selectedIds.includes(tile.id));
  const completionStatus = useMemo(() => getCompletionStatus(fixedBlocks), [fixedBlocks]);
  const finishText = [completionStatus.title, completionStatus.detail].join(String.fromCharCode(10));
  const drawOne = () => { if (hasDrawnThisTurn || wall.length === 0) return; setHand((prev) => [...prev, wall[0]]); setWall((prev) => prev.slice(1)); setHasDrawnThisTurn(true); };
  const discardSelected = () => { if (!hasDrawnThisTurn || selectedTiles.length !== 1) return; setDiscarded((prev) => [...prev, ...selectedTiles]); setHand((prev) => prev.filter((tile) => !selectedIds.includes(tile.id))); setSelectedIds([]); setHasDrawnThisTurn(false); };
  const fixSelected = () => { if (!selectedTiles.length) return; setFixedBlocks((prev) => [...prev, { id: `block-${Date.now()}`, tiles: selectedTiles }]); setHand((prev) => prev.filter((tile) => !selectedIds.includes(tile.id))); setSelectedIds([]); };
  const returnFixedBlock = (blockId) => { setFixedBlocks((prev) => { const target = prev.find((block) => block.id === blockId); if (!target) return prev; setHand((h) => [...h, ...target.tiles]); return prev.filter((block) => block.id !== blockId); }); };
  const undoLastBlock = () => { if (fixedBlocks.length) returnFixedBlock(fixedBlocks[fixedBlocks.length - 1].id); };
  const reset = () => { const next = createGame({ mode: "random", handSize: settings.handSize || 13 }); setHand(next.hand); setWall(next.wall); setFixedBlocks([]); setDiscarded([]); setSelectedIds([]); setHasDrawnThisTurn(false); };
  const makeSaveData = () => ({ hand, wall, fixedBlocks, discarded, hasDrawnThisTurn, assistLevel, savedAt: Date.now(), settings: { ...settings, savedState: undefined } });
  return (
    <div className="h-screen overflow-hidden bg-stone-100 p-3 text-stone-900">
      <div className="mx-auto grid h-full max-w-7xl gap-3 lg:grid-cols-[minmax(0,1fr)_360px]">
        <main className="flex min-h-0 flex-col gap-3 overflow-hidden">
          <header className="flex shrink-0 items-center gap-2 rounded-3xl bg-emerald-700 p-3 text-white shadow-sm"><button type="button" onClick={() => setExitOpen(true)} className="rounded-2xl bg-white px-3 py-2 font-bold text-emerald-800"><Home className="mr-1 inline" size={16} />ホーム</button><strong>ソロ練習</strong><span className="ml-auto rounded-full bg-white px-3 py-1 text-xs font-bold text-emerald-800">山 {wall.length}</span><select value={assistLevel} onChange={(e) => setAssistLevel(Number(e.target.value))} className="rounded-2xl bg-white p-2 text-stone-900">{[0, 1, 2, 3].map((n) => <option key={n} value={n}>Lv{n}</option>)}</select></header>
          <section className="shrink-0 rounded-3xl bg-white p-4 shadow-sm"><h2 className="mb-2 font-bold">手牌</h2><div className="flex max-h-32 min-h-20 flex-wrap gap-2 overflow-y-auto rounded-3xl bg-emerald-900/5 p-3 pr-2">{hand.map((tile) => <Tile key={tile.id} tile={tile} selected={selectedIds.includes(tile.id)} onClick={() => setSelectedIds((prev) => prev.includes(tile.id) ? prev.filter((x) => x !== tile.id) : [...prev, tile.id])} />)}</div></section>
          <div className="grid min-h-0 flex-1 grid-cols-2 gap-3 overflow-hidden"><section className="flex min-h-0 flex-col overflow-hidden rounded-3xl bg-white p-4 shadow-sm"><h2 className="mb-2 shrink-0 font-bold">固定ブロック</h2><div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-2">{fixedBlocks.length ? fixedBlocks.map((block, i) => <div key={block.id} className="flex items-center gap-2 overflow-x-auto rounded-2xl bg-stone-50 p-2"><span className="rounded-full bg-stone-200 px-2 py-1 text-xs font-bold">{i + 1}</span><div className="flex gap-1">{block.tiles.map((tile) => <Tile key={tile.id} tile={tile} disabled />)}</div><button type="button" onClick={() => returnFixedBlock(block.id)} className="ml-auto shrink-0 rounded-xl border bg-white px-3 py-2 text-sm">戻す</button></div>) : <p className="text-sm text-stone-400">まだ固定なし</p>}</div></section><section className="flex min-h-0 flex-col overflow-hidden rounded-3xl bg-white p-4 shadow-sm"><h2 className="mb-2 shrink-0 font-bold">捨て牌</h2><div className="grid min-h-0 flex-1 grid-cols-6 content-start gap-2 overflow-y-auto rounded-2xl bg-stone-50 p-3 pr-2">{discarded.map((tile) => <Tile key={tile.id} tile={tile} disabled />)}</div></section></div>
          <CompletionCard status={completionStatus} />
          <div className="grid shrink-0 grid-cols-3 gap-2 md:grid-cols-6"><button type="button" disabled={hasDrawnThisTurn || wall.length === 0} onClick={drawOne} className="rounded-2xl bg-emerald-700 px-3 py-2 font-bold text-white disabled:opacity-40">1枚引く</button><button type="button" disabled={!selectedTiles.length} onClick={fixSelected} className="rounded-2xl border bg-white px-3 py-2 font-bold disabled:opacity-40">固定</button><button type="button" disabled={!fixedBlocks.length} onClick={undoLastBlock} className="rounded-2xl border bg-white px-3 py-2 font-bold disabled:opacity-40"><Undo2 className="mr-1 inline" size={16} />最後を戻す</button><button type="button" disabled={!hasDrawnThisTurn || selectedTiles.length !== 1} onClick={discardSelected} className="rounded-2xl bg-red-600 px-3 py-2 font-bold text-white disabled:opacity-40"><Trash2 className="mr-1 inline" size={16} />捨てる</button><button type="button" onClick={() => alert(finishText)} className={`rounded-2xl px-3 py-2 font-bold ${completionStatus.complete ? "bg-amber-500 text-white" : "bg-white border"}`}>完成判定</button><button type="button" onClick={reset} className="rounded-2xl border bg-white px-3 py-2 font-bold"><RotateCcw className="mr-1 inline" size={16} />リセット</button></div>
          <AdBox label="プレイ画面下部広告枠" />
        </main>
        <div className="min-h-0 overflow-hidden"><AssistPanel level={assistLevel} hand={hand} fixedBlocks={fixedBlocks} selectedTiles={selectedTiles} /></div>
      </div>
      {exitOpen && <Modal title="練習を終了しますか？" onClose={() => setExitOpen(false)}><p className="mb-4 text-sm text-stone-600">現在の手牌・固定ブロック・捨て牌を保存してホームに戻れます。</p><div className="flex flex-wrap gap-2"><button type="button" onClick={() => onBack(makeSaveData())} className="rounded-2xl bg-emerald-700 px-4 py-2 font-bold text-white"><Save className="mr-2 inline" size={16} />保存して終了</button><button type="button" onClick={() => onBack(null)} className="rounded-2xl bg-red-600 px-4 py-2 font-bold text-white">保存せず終了</button></div></Modal>}
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState("home");
  const [settings, setSettings] = useState(null);
  const [savedGame, setSavedGame] = useState(() => { try { const raw = typeof window !== "undefined" ? window.localStorage.getItem(SAVE_KEY) : null; return raw ? JSON.parse(raw) : null; } catch { return null; } });
  const start = (nextSettings) => { setSettings(nextSettings); setScreen("play"); };
  const backToHome = (saveData) => { if (saveData) { setSavedGame(saveData); if (typeof window !== "undefined") window.localStorage.setItem(SAVE_KEY, JSON.stringify(saveData)); } setScreen("home"); };
  const loadSaved = () => { if (!savedGame) return; setSettings({ ...(savedGame.settings || {}), savedState: savedGame }); setScreen("play"); };
  const clearSaved = () => { setSavedGame(null); if (typeof window !== "undefined") window.localStorage.removeItem(SAVE_KEY); };
  if (screen === "play" && settings) return <SoloPlayScreen settings={settings} onBack={backToHome} />;
  return <HomeScreen onStart={start} savedGame={savedGame} onLoadSaved={loadSaved} onClearSaved={clearSaved} />;
}
