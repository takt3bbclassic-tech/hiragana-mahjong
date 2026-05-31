import React, { useMemo, useState } from "react";
import { Home, RotateCcw, Save, Shuffle, Sparkles, Trash2, Undo2, HelpCircle, MessageSquareText, PlusCircle } from "lucide-react";

const BASIC_TILES = "あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわん".split("");
const EXTRA_TILES = "がぎぐげござじずぜぞだぢづでどばびぶべぼぱぴぷぺぽゃゅょっー".split("");
const TILE_POOL = [...BASIC_TILES.flatMap((tile) => [tile, tile]), ...EXTRA_TILES];
const SAVE_KEY = "hiragana-mahjong-solo-save";
const USER_WORDS_KEY = "hiragana-mahjong-user-words";

const BASE_WORDS = [
  "あい", "あお", "あさ", "あし", "あめ", "いえ", "いぬ", "いも", "うえ", "うし", "うた", "うみ", "えき", "えび", "おに",
  "かお", "かぎ", "かさ", "かに", "かわ", "くさ", "くつ", "くま", "こめ", "さけ", "すし", "そら", "たこ", "つき", "とり",
  "ねこ", "はな", "ひと", "ふね", "ほし", "みこ", "みず", "むし", "もり", "やま", "ゆき", "ぱん", "ぺん", "ぞう", "ぶた",
  "あかり", "あくび", "あさひ", "あじさい", "あそび", "あたま", "あたり", "あぶら", "あまぐも", "あめふり", "あやとり",
  "いちご", "いなり", "いのち", "いろは", "うさぎ", "うどん", "うなぎ", "うらにわ", "えがお", "えほん", "おかし", "おかわり",
  "おさら", "おしろ", "おちゃ", "おにぎり", "おもちゃ", "おんがく", "かえる", "かがみ", "かぞく", "かばん", "かまくら",
  "からだ", "かるた", "かわら", "がっき", "がっこう", "きつね", "きのこ", "きもち", "きもの", "きらきら", "ぎゅうどん",
  "くじら", "くるま", "くるみ", "けしき", "けむり", "げんかん", "こおり", "こころ", "こたつ", "ことば", "こども", "こまどり",
  "さかな", "さくら", "さしみ", "さとう", "さよなら", "しおり", "しかく", "しずく", "しりとり", "しんぶん", "すいか", "すずめ",
  "すみれ", "せかい", "せっけん", "せんせい", "そよかぜ", "たいこ", "たから", "たぬき", "たまご", "だいこん", "ちから",
  "ちきゅう", "ちくわ", "ちゃわん", "ちょうちん", "つくえ", "つばめ", "つみき", "てがみ", "てぶくろ", "てんき", "とうふ",
  "ところてん", "とけい", "ともだち", "どんぐり", "ながれ", "なつやすみ", "なまえ", "にがおえ", "にわとり", "ぬいぐるみ",
  "ねずみ", "ねむり", "のりもの", "はさみ", "はなび", "はやし", "ひこうき", "ひまわり", "ふうせん", "ふとん", "へいわ",
  "べんとう", "ほたる", "ほのお", "まくら", "まつり", "まどべ", "まほう", "みかん", "みずうみ", "みどり", "みらい",
  "むぎちゃ", "むしめがね", "めがね", "めだか", "もみじ", "ものがたり", "やきそば", "やさい", "やまびこ", "ゆうぐれ",
  "ゆきだるま", "ゆびわ", "よあけ", "よこがお", "よみもの", "らくがき", "らっぱ", "りぼん", "りんご", "れいぞうこ",
  "れんが", "ろうそく", "わたあめ", "わらびもち", "うみねこ", "おおぞら", "おとしもの", "かきごおり", "かたつむり",
  "かみひこうき", "きんぎょ", "くつした", "こうえん", "こいのぼり", "さくらもち", "しゃぼんだま", "じゃぐち", "しろくま",
  "すなば", "たんぽぽ", "ちず", "つみきばこ", "てんとうむし", "なぞなぞ", "にじいろ", "はなむけ", "ひらがな", "ふでばこ",
  "ほしぞら", "まんげつ", "みずたまり", "めざまし", "やきいも", "ゆきぐに", "よせがき", "わすれもの", "ぎょうざ",
  "ぴかぴか", "ぽんこつ", "どらやき", "たいやき", "ちゃいろ", "きょうしつ", "しょうがっこう", "じてんしゃ", "じどうしゃ",
  "でんしゃ", "でんわ", "びょういん", "びじゅつ", "ぶらんこ", "ぷりん", "ぺんぎん", "ぽけっと"
];

function cleanText(text) {
  return Array.from(String(text || ""))
    .map((ch) => ch.replace(/[ァ-ヶ]/, (s) => String.fromCharCode(s.charCodeAt(0) - 0x60)))
    .filter((ch) => ![" ", "　", ",", "、", "/", "・", "\n", "\t", "。", "，"].includes(ch))
    .join("");
}

function parseWords(text) {
  return Array.from(new Set(String(text || "")
    .split(/[\s,、/・。]+/)
    .map(cleanText)
    .filter((word) => word.length >= 2)));
}

function makeDictionary(userWords = []) {
  return Array.from(new Set([...BASE_WORDS.map(cleanText), ...userWords.map(cleanText)]))
    .filter(Boolean)
    .map((word) => ({ word, label: word, score: word.length * 10 + (word.length >= 3 ? 15 : 0) }));
}

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

function isConfirmedBlock(block) {
  return block.confirmed !== false;
}

function getConfirmedBlocks(fixedBlocks) {
  return fixedBlocks.filter(isConfirmedBlock);
}

function getKanDrawCount(block) {
  return Math.max(0, (block?.tiles?.length || 0) - 3);
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

function getWordsFromTiles(tiles, dictionary) {
  return dictionary.filter((entry) => canMakeWord(entry.word, tiles))
    .sort((a, b) => b.word.length - a.word.length || b.score - a.score || a.word.localeCompare(b.word, "ja"))
    .slice(0, 36);
}

function getWaits(tiles, dictionary) {
  const chars = tiles.map((tile) => tile.char);
  const waits = [];
  for (const entry of dictionary) {
    const remain = [...chars];
    const missing = [];
    for (const ch of entry.word) {
      const idx = remain.indexOf(ch);
      if (idx >= 0) remain.splice(idx, 1);
      else missing.push(ch);
    }
    if (missing.length === 1) waits.push({ ...entry, wait: missing[0] });
  }
  return waits.sort((a, b) => b.word.length - a.word.length || b.score - a.score || a.word.localeCompare(b.word, "ja")).slice(0, 30);
}

function getCompletionStatus(fixedBlocks) {
  const confirmedBlocks = getConfirmedBlocks(fixedBlocks);
  const lengths = confirmedBlocks.map((block) => block.tiles.length);
  const pairCount = lengths.filter((len) => len === 2).length;
  const mentsuCount = lengths.filter((len) => len >= 3).length;
  const tentativeCount = fixedBlocks.length - confirmedBlocks.length;
  const lockedTileCount = confirmedBlocks.reduce((sum, block) => sum + block.tiles.length, 0);
  if (pairCount >= 7) return { complete: true, title: "七対子型の完成候補", detail: `確定済みの2枚ブロックが${pairCount}個あります。`, pairCount, mentsuCount, lockedTileCount, tentativeCount };
  if (mentsuCount >= 4 && pairCount >= 1) return { complete: true, title: "4メンツ＋雀頭型の完成候補", detail: `確定済みメンツ${mentsuCount}個、雀頭${pairCount}個があります。`, pairCount, mentsuCount, lockedTileCount, tentativeCount };
  return { complete: false, title: "まだ完成ではありません", detail: `確定済みメンツ${mentsuCount}個、雀頭${pairCount}個です。`, pairCount, mentsuCount, lockedTileCount, tentativeCount };
}

function Tile({ tile, selected, onClick, disabled = false }) {
  return (
    <button type="button" disabled={disabled} onClick={onClick} className={`grid h-12 w-10 shrink-0 place-items-center rounded-xl border-2 bg-gradient-to-b from-white to-stone-100 text-xl font-black shadow-sm transition active:scale-95 disabled:opacity-60 sm:h-14 sm:w-11 sm:text-2xl ${selected ? "border-emerald-500 ring-4 ring-emerald-100" : "border-stone-300"}`}>
      {tile.char}
    </button>
  );
}

function AdBox({ label }) {
  return <div className="grid h-10 shrink-0 place-items-center rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-3 text-center text-[11px] text-stone-400 sm:h-12 sm:text-xs">{label} / AdMob差し替え予定</div>;
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/40 p-3 sm:p-4">
      <div className="w-full max-w-lg rounded-3xl bg-white p-4 shadow-xl sm:p-5">
        <h2 className="mb-3 text-lg font-black sm:text-xl">{title}</h2>
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
        {status.tentativeCount > 0 && <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-800">仮固定 {status.tentativeCount}</span>}
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
        <div className="rounded-2xl bg-white/80 p-2"><b className="block text-base">{status.mentsuCount}</b>確定メンツ</div>
        <div className="rounded-2xl bg-white/80 p-2"><b className="block text-base">{status.pairCount}</b>確定雀頭</div>
        <div className="rounded-2xl bg-white/80 p-2"><b className="block text-base">{status.lockedTileCount}</b>確定牌</div>
      </div>
      <p className="mt-2 text-xs opacity-80">{status.detail}</p>
    </div>
  );
}

function AssistPanel({ level, hand, fixedBlocks, selectedTiles, dictionary }) {
  const words = useMemo(() => getWordsFromTiles(hand, dictionary), [hand, dictionary]);
  const waits = useMemo(() => getWaits(hand, dictionary), [hand, dictionary]);
  const status = useMemo(() => getCompletionStatus(fixedBlocks), [fixedBlocks]);
  const selectedText = selectedTiles.map((tile) => tile.char).join("");
  const score = Math.min(100, status.mentsuCount * 22 + status.pairCount * 12 + words.length * 7 + waits.length * 3);

  if (level === 0) {
    return <aside className="flex h-full min-h-0 flex-col overflow-hidden rounded-3xl bg-white p-4 shadow-sm"><h2 className="mb-2 flex items-center gap-2 font-black"><Sparkles size={18} />アシスト Lv0</h2><p className="text-sm text-stone-500">完全ノーアシストです。</p></aside>;
  }

  const longWords = words.filter((entry) => entry.word.length >= 3);
  const pairWords = words.filter((entry) => entry.word.length === 2);

  return (
    <aside className="flex h-full min-h-0 flex-col overflow-hidden rounded-3xl bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2"><h2 className="flex items-center gap-2 font-black"><Sparkles size={18} />アシスト Lv{level}</h2>{level >= 2 && <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-bold">形評価 {score}</span>}</div>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1 sm:pr-2">
        <section><h3 className="mb-2 font-bold">待ち候補</h3>{waits.length ? <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">{waits.map((w, i) => <div key={`${w.word}-${i}`} className="rounded-2xl bg-emerald-50 p-2 text-sm text-emerald-900"><b>{w.word}</b> <span className="text-xs">待ち:{w.wait}</span></div>)}</div> : <p className="text-sm text-stone-400">待ち候補なし</p>}</section>
        {level >= 2 && <section><h3 className="mb-2 font-bold">3文字以上の候補</h3><div className="flex flex-wrap gap-2">{longWords.length ? longWords.slice(0, 24).map((entry) => <span key={entry.word} className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-900">{entry.word}</span>) : <p className="text-sm text-stone-400">3文字以上の成立候補なし</p>}</div></section>}
        {level >= 2 && <section><h3 className="mb-2 font-bold">雀頭候補</h3><div className="flex flex-wrap gap-2">{pairWords.length ? pairWords.slice(0, 12).map((entry) => <span key={entry.word} className="rounded-full border px-3 py-1 text-xs font-bold">{entry.word}</span>) : <p className="text-sm text-stone-400">2文字候補なし</p>}</div></section>}
        {level >= 3 && <section className="rounded-2xl bg-amber-50 p-3 text-sm text-amber-950"><h3 className="mb-2 font-bold">おすすめ</h3><p>固定候補：{selectedText || longWords[0]?.word || words[0]?.word || "まず2〜3枚選択"}</p><p>捨て牌候補：{hand.at(-1)?.char || "-"}</p><p className="mt-2 text-xs text-amber-700">3文字以上の語を優先して、長めのメンツを作りやすくしています。</p></section>}
      </div>
    </aside>
  );
}

function HomeScreen({ onStart, savedGame, onLoadSaved, onClearSaved, userWords, onAddUserWords }) {
  const [mode, setMode] = useState("random");
  const [handSize, setHandSize] = useState(13);
  const [assistLevel, setAssistLevel] = useState(2);
  const [manualText, setManualText] = useState("さくらうみねこ");
  const [requestText, setRequestText] = useState("");
  const [contactText, setContactText] = useState("");
  const [modal, setModal] = useState(null);
  const parsedRequestWords = useMemo(() => parseWords(requestText).filter((word) => word.length >= 3), [requestText]);

  const submitRequestWords = () => {
    const added = onAddUserWords(parsedRequestWords);
    if (added.length) {
      setRequestText("");
      setModal("words-added");
    } else {
      alert("追加できる3文字以上の単語が見つかりませんでした。空白・読点・スラッシュ区切りで入力してください。");
    }
  };

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-emerald-50 via-white to-stone-100 p-3 text-stone-900 sm:p-4">
      <div className="mx-auto flex min-h-[calc(100dvh-24px)] max-w-5xl flex-col justify-between gap-4 sm:min-h-[calc(100dvh-32px)]">
        <div className="space-y-4">
          <header className="rounded-[1.5rem] bg-emerald-700 p-5 text-white shadow-lg sm:rounded-[2rem] sm:p-6">
            <div className="text-xs font-bold text-emerald-100 sm:text-sm">Solo Practice v1</div>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Hiragana Mahjong</h1>
            <p className="mt-2 text-sm text-emerald-50">ひらがな牌で言葉を作る、ソロ練習用アシストアプリ。</p>
          </header>
          {savedGame && <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm"><div className="font-bold text-emerald-900">保存中の練習があります</div><p className="mt-1 text-sm text-emerald-800">手牌 {savedGame.hand?.length || 0}枚 / 固定 {savedGame.fixedBlocks?.length || 0}ブロック / 捨て牌 {savedGame.discarded?.length || 0}枚</p><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={onLoadSaved} className="rounded-2xl bg-emerald-700 px-4 py-2 font-bold text-white">再開する</button><button type="button" onClick={onClearSaved} className="rounded-2xl border bg-white px-4 py-2">削除</button></div></section>}
          <section className="rounded-3xl bg-white p-4 shadow-sm sm:p-5">
            <h2 className="mb-4 text-xl font-black">開始設定</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-bold">開始方法</label>
                <div className="mt-2 grid grid-cols-2 rounded-2xl bg-stone-100 p-1">
                  <button type="button" onClick={() => setMode("random")} className={`rounded-xl px-4 py-2 font-bold ${mode === "random" ? "bg-emerald-700 text-white" : ""}`}>ランダム</button>
                  <button type="button" onClick={() => setMode("manual")} className={`rounded-xl px-4 py-2 font-bold ${mode === "manual" ? "bg-emerald-700 text-white" : ""}`}>手動</button>
                </div>
                {mode === "manual" && <input value={manualText} onChange={(e) => setManualText(e.target.value)} className="mt-3 w-full rounded-2xl border p-3" placeholder="例：さくらうみねこ" />}
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="text-sm font-bold">手牌枚数<select value={handSize} onChange={(e) => setHandSize(Number(e.target.value))} className="mt-2 w-full rounded-2xl border bg-white p-3">{[7, 10, 13, 16, 20].map((n) => <option key={n} value={n}>{n}枚</option>)}</select></label>
                <label className="text-sm font-bold">アシストLv<select value={assistLevel} onChange={(e) => setAssistLevel(Number(e.target.value))} className="mt-2 w-full rounded-2xl border bg-white p-3">{[0, 1, 2, 3].map((n) => <option key={n} value={n}>Lv{n}</option>)}</select></label>
              </div>
            </div>
            <div className="mt-4 rounded-2xl bg-stone-50 p-3 text-xs text-stone-600">追加済みユーザー単語：<b>{userWords.length}</b>語。要望欄から3文字以上の単語を即時追加できます。</div>
            <div className="mt-5 grid gap-2 sm:flex sm:flex-wrap">
              <button type="button" onClick={() => setModal("help")} className="rounded-2xl border px-4 py-2"><HelpCircle className="mr-2 inline" size={16} />遊び方</button>
              <button type="button" onClick={() => setModal("feedback")} className="rounded-2xl border px-4 py-2"><MessageSquareText className="mr-2 inline" size={16} />要望/単語追加</button>
              <button type="button" onClick={() => onStart({ mode, handSize, assistLevel, manualText })} className="rounded-2xl bg-emerald-700 px-8 py-3 font-bold text-white sm:ml-auto sm:py-2"><Shuffle className="mr-2 inline" size={16} />開始する</button>
            </div>
          </section>
        </div>
        <AdBox label="ホーム下部広告枠" />
      </div>
      {modal === "help" && <Modal title="ソロ練習の遊び方" onClose={() => setModal(null)}><div className="space-y-2 text-sm text-stone-700"><p>手牌から文字を選び、「仮固定」で候補ブロックにします。</p><p>仮固定を「確定」するとブロックが完成扱いになります。4枚以上のブロックは槓扱いになり、確定時に枚数-3枚を追加で自摸します。</p><p>「1枚引く」で1枚だけ引き、不要な牌を選んで「捨てる」。1枚引いた後は、捨てるまで次の牌は引けません。</p><p>Lv1は待ち候補、Lv2は候補と形評価、Lv3はおすすめまで表示します。</p></div></Modal>}
      {modal === "feedback" && <Modal title="要望/単語追加" onClose={() => setModal(null)}><div className="space-y-3"><input value={contactText} onChange={(e) => setContactText(e.target.value)} className="w-full rounded-2xl border p-3" placeholder="返信先メール（任意）" /><textarea value={requestText} onChange={(e) => setRequestText(e.target.value)} className="w-full rounded-2xl border p-3" rows={5} placeholder="追加したい単語や要望。例：かたつむり、しゃぼんだま / ゆきだるま" /><div className="rounded-2xl bg-emerald-50 p-3 text-xs text-emerald-900">検出中の3文字以上単語：{parsedRequestWords.length ? parsedRequestWords.join("、") : "なし"}</div><button type="button" onClick={submitRequestWords} className="w-full rounded-2xl bg-emerald-700 px-4 py-3 font-bold text-white sm:w-auto sm:py-2"><PlusCircle className="mr-2 inline" size={16} />単語を追加する</button><p className="text-xs text-stone-500">現時点では端末内保存です。送信機能をFirebase等につなぐ前でも、候補辞書には即時反映されます。</p></div></Modal>}
      {modal === "words-added" && <Modal title="単語を追加しました" onClose={() => setModal(null)}><p className="text-sm text-stone-700">追加した単語はこの端末に保存され、待ち候補・メンツ候補に反映されます。</p></Modal>}
    </div>
  );
}

function SoloPlayScreen({ settings, onBack, dictionary }) {
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
  const fixSelected = () => { if (!selectedTiles.length) return; setFixedBlocks((prev) => [...prev, { id: `block-${Date.now()}`, tiles: selectedTiles, confirmed: false }]); setHand((prev) => prev.filter((tile) => !selectedIds.includes(tile.id))); setSelectedIds([]); };
  const confirmFixedBlock = (blockId) => {
    const target = fixedBlocks.find((block) => block.id === blockId);
    if (!target || isConfirmedBlock(target)) return;
    const drawCount = Math.min(getKanDrawCount(target), wall.length);
    const kanDraws = wall.slice(0, drawCount);
    setFixedBlocks((prev) => prev.map((block) => block.id === blockId ? { ...block, confirmed: true, kanDrawCount: drawCount } : block));
    if (drawCount > 0) {
      setHand((prev) => [...prev, ...kanDraws]);
      setWall((prev) => prev.slice(drawCount));
    }
  };
  const returnFixedBlock = (blockId) => { setFixedBlocks((prev) => { const target = prev.find((block) => block.id === blockId); if (!target) return prev; setHand((h) => [...h, ...target.tiles]); return prev.filter((block) => block.id !== blockId); }); };
  const undoLastBlock = () => { if (fixedBlocks.length) returnFixedBlock(fixedBlocks[fixedBlocks.length - 1].id); };
  const reset = () => { const next = createGame({ mode: "random", handSize: settings.handSize || 13 }); setHand(next.hand); setWall(next.wall); setFixedBlocks([]); setDiscarded([]); setSelectedIds([]); setHasDrawnThisTurn(false); };
  const makeSaveData = () => ({ hand, wall, fixedBlocks, discarded, hasDrawnThisTurn, assistLevel, savedAt: Date.now(), settings: { ...settings, savedState: undefined } });

  return (
    <div className="min-h-[100dvh] bg-stone-100 p-2 text-stone-900 sm:p-3 lg:h-screen lg:overflow-hidden">
      <div className="mx-auto grid min-h-[calc(100dvh-16px)] max-w-7xl gap-3 lg:h-full lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_360px]">
        <main className="flex min-h-0 flex-col gap-3 lg:overflow-hidden">
          <header className="flex shrink-0 flex-wrap items-center gap-2 rounded-3xl bg-emerald-700 p-3 text-white shadow-sm">
            <button type="button" onClick={() => setExitOpen(true)} className="rounded-2xl bg-white px-3 py-2 font-bold text-emerald-800"><Home className="mr-1 inline" size={16} />ホーム</button>
            <strong>ソロ練習</strong>
            <span className="ml-auto rounded-full bg-white px-3 py-1 text-xs font-bold text-emerald-800">山 {wall.length}</span>
            <select value={assistLevel} onChange={(e) => setAssistLevel(Number(e.target.value))} className="rounded-2xl bg-white p-2 text-stone-900">{[0, 1, 2, 3].map((n) => <option key={n} value={n}>Lv{n}</option>)}</select>
          </header>
          <section className="shrink-0 rounded-3xl bg-white p-3 shadow-sm sm:p-4"><h2 className="mb-2 font-bold">手牌</h2><div className="flex max-h-44 min-h-20 flex-wrap gap-2 overflow-y-auto rounded-3xl bg-emerald-900/5 p-2 pr-2 sm:max-h-32 sm:p-3">{hand.map((tile) => <Tile key={tile.id} tile={tile} selected={selectedIds.includes(tile.id)} onClick={() => setSelectedIds((prev) => prev.includes(tile.id) ? prev.filter((x) => x !== tile.id) : [...prev, tile.id])} />)}</div></section>
          <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-2 lg:overflow-hidden">
            <section className="flex min-h-0 flex-col overflow-hidden rounded-3xl bg-white p-3 shadow-sm sm:p-4"><h2 className="mb-2 shrink-0 font-bold">固定ブロック</h2><div className="max-h-64 min-h-32 flex-1 space-y-2 overflow-y-auto pr-1 lg:max-h-none lg:min-h-0 lg:pr-2">{fixedBlocks.length ? fixedBlocks.map((block, i) => { const drawCount = getKanDrawCount(block); const confirmed = isConfirmedBlock(block); return <div key={block.id} className={`flex items-center gap-2 overflow-x-auto rounded-2xl p-2 ${confirmed ? "bg-stone-50" : "bg-sky-50 ring-2 ring-sky-100"}`}><span className={`shrink-0 rounded-full px-2 py-1 text-xs font-bold ${confirmed ? "bg-stone-200" : "bg-sky-600 text-white"}`}>{confirmed ? i + 1 : "仮"}</span><div className="flex gap-1">{block.tiles.map((tile) => <Tile key={tile.id} tile={tile} disabled />)}</div>{!confirmed && <button type="button" onClick={() => confirmFixedBlock(block.id)} className="ml-auto shrink-0 rounded-xl bg-emerald-700 px-3 py-2 text-sm font-bold text-white">確定{drawCount > 0 ? `＋${drawCount}自摸` : ""}</button>}{confirmed && block.kanDrawCount > 0 && <span className="ml-auto shrink-0 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">槓自摸 +{block.kanDrawCount}</span>}<button type="button" onClick={() => returnFixedBlock(block.id)} className={`${confirmed && block.kanDrawCount > 0 ? "" : confirmed ? "ml-auto" : ""} shrink-0 rounded-xl border bg-white px-3 py-2 text-sm`}>戻す</button></div>; }) : <p className="text-sm text-stone-400">まだ固定なし</p>}</div></section>
            <section className="flex min-h-0 flex-col overflow-hidden rounded-3xl bg-white p-3 shadow-sm sm:p-4"><h2 className="mb-2 shrink-0 font-bold">捨て牌</h2><div className="grid max-h-48 min-h-32 flex-1 grid-cols-5 content-start gap-2 overflow-y-auto rounded-2xl bg-stone-50 p-2 pr-1 sm:grid-cols-6 sm:p-3 lg:max-h-none lg:min-h-0 lg:pr-2">{discarded.map((tile) => <Tile key={tile.id} tile={tile} disabled />)}</div></section>
          </div>
          <CompletionCard status={completionStatus} />
          <div className="grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6"><button type="button" disabled={hasDrawnThisTurn || wall.length === 0} onClick={drawOne} className="rounded-2xl bg-emerald-700 px-3 py-3 font-bold text-white disabled:opacity-40 sm:py-2">1枚引く</button><button type="button" disabled={!selectedTiles.length} onClick={fixSelected} className="rounded-2xl border bg-white px-3 py-3 font-bold disabled:opacity-40 sm:py-2">仮固定</button><button type="button" disabled={!fixedBlocks.length} onClick={undoLastBlock} className="rounded-2xl border bg-white px-3 py-3 font-bold disabled:opacity-40 sm:py-2"><Undo2 className="mr-1 inline" size={16} />最後を戻す</button><button type="button" disabled={!hasDrawnThisTurn || selectedTiles.length !== 1} onClick={discardSelected} className="rounded-2xl bg-red-600 px-3 py-3 font-bold text-white disabled:opacity-40 sm:py-2"><Trash2 className="mr-1 inline" size={16} />捨てる</button><button type="button" onClick={() => alert(finishText)} className={`rounded-2xl px-3 py-3 font-bold sm:py-2 ${completionStatus.complete ? "bg-amber-500 text-white" : "bg-white border"}`}>完成判定</button><button type="button" onClick={reset} className="rounded-2xl border bg-white px-3 py-3 font-bold sm:py-2"><RotateCcw className="mr-1 inline" size={16} />リセット</button></div>
          <AdBox label="プレイ画面下部広告枠" />
        </main>
        <div className="min-h-[360px] overflow-hidden lg:min-h-0"><AssistPanel level={assistLevel} hand={hand} fixedBlocks={fixedBlocks} selectedTiles={selectedTiles} dictionary={dictionary} /></div>
      </div>
      {exitOpen && <Modal title="練習を終了しますか？" onClose={() => setExitOpen(false)}><p className="mb-4 text-sm text-stone-600">現在の手牌・固定ブロック・捨て牌を保存してホームに戻れます。</p><div className="flex flex-wrap gap-2"><button type="button" onClick={() => onBack(makeSaveData())} className="rounded-2xl bg-emerald-700 px-4 py-2 font-bold text-white"><Save className="mr-2 inline" size={16} />保存して終了</button><button type="button" onClick={() => onBack(null)} className="rounded-2xl bg-red-600 px-4 py-2 font-bold text-white">保存せず終了</button></div></Modal>}
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState("home");
  const [settings, setSettings] = useState(null);
  const [savedGame, setSavedGame] = useState(() => { try { const raw = typeof window !== "undefined" ? window.localStorage.getItem(SAVE_KEY) : null; return raw ? JSON.parse(raw) : null; } catch { return null; } });
  const [userWords, setUserWords] = useState(() => { try { const raw = typeof window !== "undefined" ? window.localStorage.getItem(USER_WORDS_KEY) : null; return raw ? JSON.parse(raw) : []; } catch { return []; } });
  const dictionary = useMemo(() => makeDictionary(userWords), [userWords]);

  const addUserWords = (words) => {
    const cleaned = parseWords(words.join(" ")).filter((word) => word.length >= 3);
    const existing = new Set(userWords.map(cleanText));
    const added = cleaned.filter((word) => !existing.has(word));
    if (!added.length) return [];
    const next = [...userWords, ...added];
    setUserWords(next);
    if (typeof window !== "undefined") window.localStorage.setItem(USER_WORDS_KEY, JSON.stringify(next));
    return added;
  };

  const start = (nextSettings) => { setSettings(nextSettings); setScreen("play"); };
  const backToHome = (saveData) => { if (saveData) { setSavedGame(saveData); if (typeof window !== "undefined") window.localStorage.setItem(SAVE_KEY, JSON.stringify(saveData)); } setScreen("home"); };
  const loadSaved = () => { if (!savedGame) return; setSettings({ ...(savedGame.settings || {}), savedState: savedGame }); setScreen("play"); };
  const clearSaved = () => { setSavedGame(null); if (typeof window !== "undefined") window.localStorage.removeItem(SAVE_KEY); };
  if (screen === "play" && settings) return <SoloPlayScreen settings={settings} onBack={backToHome} dictionary={dictionary} />;
  return <HomeScreen onStart={start} savedGame={savedGame} onLoadSaved={loadSaved} onClearSaved={clearSaved} userWords={userWords} onAddUserWords={addUserWords} />;
}
