// Original, hand-authored puzzles. IDs remain stable for saved progress.
export const DIFFICULTIES = ['Straightforward', 'Tricky', 'Hard', 'Wordplay'];
const puzzle = (id, groups) => ({ id, groups: groups.map(([name, words]) => ({ name, words: words.split('|') })) });
export const PUZZLES = [
  puzzle('thread-01', [
    ['Parts of a tree', 'ROOT|TRUNK|BRANCH|LEAF'],
    ['Things with keys', 'PIANO|LOCK|KEYBOARD|MAP'],
    ['A kind of roll', 'BREAD|DRUM|DICE|CAMERA'],
    ['End with a spelled-out number', 'STONE|ALONE|OFTEN|FREIGHT']
  ]),
  puzzle('thread-02', [
    ['Chess pieces', 'ROOK|BISHOP|KNIGHT|PAWN'],
    ['Ways to cook an egg', 'POACH|FRY|BOIL|SCRAMBLE'],
    ['Parts of a book', 'SPINE|COVER|INDEX|CHAPTER'],
    ['Start with a silent letter', 'KNIFE|WRIST|GNOME|PSALM']
  ]),
  puzzle('thread-03', [
    ['String instruments', 'VIOLIN|CELLO|HARP|BANJO'],
    ['Sound like letter names', 'BEE|CUE|JAY|TEA'],
    ['Things you can draw', 'CURTAIN|BATH|BREATH|PICTURE'],
    ['Add S at the start to make a new word', 'WORD|MILE|NAIL|PARK']
  ]),
  puzzle('thread-04', [
    ['Birds of prey', 'HAWK|EAGLE|FALCON|OWL'],
    ['Words meaning fast', 'SWIFT|RAPID|QUICK|SPEEDY'],
    ['Things with teeth', 'COMB|SAW|ZIPPER|GEAR'],
    ['End in a bird’s name: OWL', 'BOWL|COWL|HOWL|SCOWL']
  ]),
  puzzle('thread-05', [
    ['Baking ingredients', 'FLOUR|YEAST|BUTTER|SUGAR'],
    ['On a playing card', 'HEART|DIAMOND|CLUB|SPADE'],
    ['Things you can break', 'PROMISE|RECORD|SILENCE|HABIT'],
    ['Reverse them to get another word', 'DIAPER|DELIVER|REWARD|STRESSED']
  ]),
  puzzle('thread-06', [
    ['Ways to travel on water', 'FERRY|CANOE|YACHT|RAFT'],
    ['Parts of a shoe', 'SOLE|HEEL|TONGUE|LACE'],
    ['Words meaning clever', 'SMART|BRIGHT|SHARP|WITTY'],
    ['Sound like a number', 'WON|TOO|FOR|ATE']
  ]),
  puzzle('thread-07', [
    ['Pasta shapes', 'PENNE|FUSILLI|RIGATONI|FARFALLE'],
    ['Weather forecasts', 'SUNNY|CLOUDY|WINDY|FOGGY'],
    ['Things you can cast', 'VOTE|SPELL|SHADOW|NET'],
    ['Start with a body part', 'ARMOUR|LEGEND|LIPSTICK|EARTH']
  ]),
  puzzle('thread-08', [
    ['In a sewing kit', 'NEEDLE|THREAD|THIMBLE|SCISSORS'],
    ['Types of dance', 'WALTZ|TANGO|SALSA|POLKA'],
    ['Things you can run', 'RACE|BUSINESS|ERRAND|BATH'],
    ['Sound like animal names', 'BARE|BORE|DEAR|HOARSE']
  ]),
  puzzle('thread-09', [
    ['Precious gemstones', 'RUBY|SAPPHIRE|EMERALD|DIAMOND'],
    ['Computer actions', 'COPY|PASTE|SAVE|DELETE'],
    ['Things you can strike', 'MATCH|POSE|DEAL|CHORD'],
    ['Start with a musical note', 'RELAY|MIRED|FABLE|SOLDIER']
  ]),
  puzzle('thread-10', [
    ['In an orchestra’s brass section', 'TRUMPET|TROMBONE|TUBA|HORN'],
    ['Words meaning small', 'TINY|LITTLE|MINUTE|PETITE'],
    ['Things you can fold', 'PAPER|LAUNDRY|ARMS|CHAIR'],
    ['Anagrams of EAST', 'EATS|SEAT|TEAS|SATE']
  ]),
  puzzle('thread-11', [
    ['In a toolbox', 'HAMMER|PLIERS|WRENCH|DRILL'],
    ['A stretch of land', 'FIELD|MEADOW|PRAIRIE|PASTURE'],
    ['Things you can catch', 'COLD|BUS|FISH|BALL'],
    ['Hide a tree in consecutive letters', 'CLOAK|HELMET|PINEAPPLE|ASHORE']
  ]),
  puzzle('thread-12', [
    ['Citrus fruits', 'ORANGE|LEMON|LIME|GRAPEFRUIT'],
    ['Words meaning look', 'PEEK|GLANCE|GAZE|STARE'],
    ['Things you can pitch', 'TENT|IDEA|BALL|VOICE'],
    ['Palindrome words', 'LEVEL|RADAR|CIVIC|KAYAK']
  ])
];

// Stable deterministic catalogue: preserve the 12 original puzzles and add
// disjoint combinations with exactly one authored category at each difficulty.
const BANK = PUZZLES.map(p => p.groups);
const seen = new Set(PUZZLES.map(p => p.groups.map(g => g.name).join('|')));
let combinationCursor = 0;
export function ensurePuzzleCount(count) {
  if (!Number.isInteger(count) || count < 0 || count > 20748) return false;
  while (PUZZLES.length < count && combinationCursor < 20736) {
    let code = (combinationCursor++ * 7919 + 37) % 20736;
    const groups = [];
    for (let level = 0; level < 4; level++) {
      groups.push(BANK[code % 12][level]); code = Math.floor(code / 12);
    }
    const signature = groups.map(g => g.name).join('|');
    if (seen.has(signature) || new Set(groups.flatMap(g => g.words)).size !== 16) continue;
    seen.add(signature);
    PUZZLES.push({id: 'mix-' + String(PUZZLES.length + 1).padStart(5, '0'), groups});
  }
  return PUZZLES.length >= count;
}
ensurePuzzleCount(120);

export const allWords = puzzle => puzzle.groups.flatMap(group => group.words);
export const signature = words => [...words].sort().join('|');
export function shuffle(words) {
  const result = [...words];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export function evaluate(puzzle, attempts) {
  const solved = [];
  let mistakes = 0;
  for (const attempt of attempts) {
    const match = puzzle.groups.findIndex(group => signature(group.words) === signature(attempt));
    if (match >= 0 && !solved.includes(match)) solved.push(match);
    else mistakes++;
  }
  return { solved, mistakes, status: solved.length === 4 ? 'won' : mistakes >= 4 ? 'lost' : 'playing' };
}
export function submit(puzzle, game, selected) {
  const current = evaluate(puzzle, game.attempts);
  if (current.status !== 'playing') return { accepted: false, message: 'This puzzle is finished.' };
  const remaining = allWords(puzzle).filter(word => !current.solved.some(i => puzzle.groups[i].words.includes(word)));
  if (selected.length !== 4 || new Set(selected).size !== 4 || !selected.every(word => remaining.includes(word))) return { accepted: false, message: 'Select four different words.' };
  if (game.attempts.some(attempt => signature(attempt) === signature(selected))) return { accepted: false, message: 'You’ve already tried that group. No mistake lost.' };
  game.attempts.push([...selected]);
  const next = evaluate(puzzle, game.attempts);
  const found = next.solved.length > current.solved.length;
  return { accepted: true, found, message: found ? 'You found a common thread!' : puzzle.groups.some(group => selected.filter(word => group.words.includes(word)).length === 3) ? 'One away — 3 of 4 belong together. Find the missing word.' : 'Not quite. Try a different connection.' };
}
export function validThreadState(state) {
  if (state?.puzzleCount !== undefined && (!Number.isInteger(state.puzzleCount) || state.puzzleCount < 120 || !ensurePuzzleCount(state.puzzleCount))) return false;
  if (!state || state.version !== 1 || !Number.isInteger(state.index) || !PUZZLES[state.index] || !state.games || typeof state.games !== 'object' || Array.isArray(state.games) || !Array.isArray(state.results) || new Set(state.results).size !== state.results.length) return false;
  for (const [id, game] of Object.entries(state.games)) {
    const puzzle = PUZZLES.find(p => p.id === id);
    if (!puzzle || !game || !Array.isArray(game.attempts) || game.attempts.length > 7 || !Array.isArray(game.order) || game.order.length !== 16 || new Set(game.order).size !== 16 || !game.order.every(word => allWords(puzzle).includes(word)) || !Array.isArray(game.selected) || game.selected.length > 4 || new Set(game.selected).size !== game.selected.length) return false;
    const replay = { attempts: [] };
    for (const attempt of game.attempts) {
      if (!Array.isArray(attempt) || !submit(puzzle, replay, attempt).accepted) return false;
    }
    const { solved } = evaluate(puzzle, game.attempts);
    if (!game.selected.every(word => allWords(puzzle).includes(word) && !solved.some(i => puzzle.groups[i].words.includes(word)))) return false;
  }
  return state.results.every(id => state.games[id] && evaluate(PUZZLES.find(p => p.id === id), state.games[id].attempts).status !== 'playing');
}
