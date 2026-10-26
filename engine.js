export const ANSWERS = `ACORN AGILE ALBUM ALERT AMBER ANGEL APPLE APRON AUDIO AVAIL BAKER BEACH BERRY BIRCH BLEND BLOOM BLUSH BOARD BRAIN BRAVE BREAD BRICK BRIDE BRISK BROOK BRUSH CABIN CANDY CARGO CHAIR CHARM CHASE CHEER CHESS CHIME CHOIR CIDER CLOUD COAST CORAL CRANE CRISP CROWN DANCE DAISY DELTA DIARY DOUGH DREAM DRIFT EAGLE EARTH EMBER ENJOY ENTRY EQUAL FABLE FEAST FERRY FIELD FLAME FLEET FLOAT FLORA FLOUR FLUTE FOCUS FROST FRUIT GIANT GLADE GLASS GLEAM GLOBE GRACE GRAIN GRAPE GRASS GREEN GROVE HAPPY HAZEL HEART HONEY HORSE HOTEL HOUSE HUMOR IVORY JELLY JEWEL JOLLY JUICE KAYAK KNEEL LAYER LEMON LIGHT LILAC LINEN LODGE LUCKY LUNAR MAPLE MARCH MEDAL MELON MERCY MIGHT MINTY MODEL MOOSE MOTOR MOUNT MOUSE MUSIC NOBLE NORTH NOVEL OCEAN OLIVE OPERA ORBIT OTTER PAINT PANEL PAPER PARTY PASTA PATCH PEACH PEARL PEDAL PETAL PIANO PILOT PITCH PIZZA PLANT PLATE PLAZA PLUME POETRY POPPY PORCH PRIDE PRISM PROUD QUEEN QUEST QUICK QUIET QUILT RADIO RAVEN REACH READY RELAX RIDGE RIVER ROAST ROBIN ROUGE ROUND ROYAL SALAD SAUCE SCALE SCARF SCENE SCENT SCOOP SCOUT SHADE SHAPE SHARE SHEEP SHELL SHINE SHORE SILKY SKATE SKILL SLATE SLEEP SLICE SLOPE SMALL SMILE SMOKE SOLAR SOLID SOUND SOUTH SPACE SPARK SPEAR SPICE SPINE SPOON SPORT SPRAY SPRIG STACK STAGE STAIR STAMP STAND STARS STEAM STEEL STONE STORE STORM STORY STOVE SUGAR SUNNY SWEEP SWEET SWIFT TABLE TEACH THANK THEME THORN THUMB TIGER TOAST TODAY TOKEN TORCH TOUCH TOWER TRACE TRAIL TRAIN TREAT TREND TRIAL TULIP TWICE TWIRL UNDER UNION UNITY URBAN USHER VALOR VALUE VAULT VERSE VIDEO VIOLET VISIT VIVID VOICE WAGON WATER WHEAT WHEEL WHISK WHITE WHOLE WIDEN WILLOW WINDY WORLD WOVEN WRIST YACHT YEARN YEAST YIELD YOUNG YOUTH ZEBRA`.split(' ').filter(word => word.length === 5);

export function scoreGuess(guess, answer) {
  const result = Array(5).fill('absent');
  const remaining = {};
  for (let i = 0; i < 5; i++) {
    if (guess[i] === answer[i]) result[i] = 'correct';
    else remaining[answer[i]] = (remaining[answer[i]] || 0) + 1;
  }
  for (let i = 0; i < 5; i++) {
    if (result[i] !== 'correct' && remaining[guess[i]] > 0) {
      result[i] = 'present';
      remaining[guess[i]]--;
    }
  }
  return result;
}

export function outcome(game, answer) {
  if (game.guesses.includes(answer)) return 'won';
  return game.guesses.length >= 6 ? 'lost' : 'playing';
}

export function keyboardScores(guesses, answer) {
  const ranks = { absent: 1, present: 2, correct: 3 };
  const keys = {};
  for (const guess of guesses) scoreGuess(guess, answer).forEach((status, i) => {
    if ((ranks[keys[guess[i]]] || 0) < ranks[status]) keys[guess[i]] = status;
  });
  return keys;
}

export function freshState() {
  const order = [...ANSWERS];
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return { version: 1, order, index: 0, games: {} };
}

export function validState(state, dictionary) {
  if (!state || state.version !== 1 || !Array.isArray(state.order) ||
      state.order.length !== ANSWERS.length || new Set(state.order).size !== ANSWERS.length ||
      !state.order.every(word => ANSWERS.includes(word)) ||
      !Number.isInteger(state.index) || state.index < 0 || state.index >= state.order.length ||
      !state.games || typeof state.games !== 'object' || Array.isArray(state.games)) return false;
  if (state.results !== undefined && (!Array.isArray(state.results) || new Set(state.results).size !== state.results.length || !state.results.every(word => ANSWERS.includes(word) && state.games[word] && Array.isArray(state.games[word].guesses) && outcome(state.games[word], word) !== 'playing'))) return false;
  return Object.entries(state.games).every(([answer, game]) => {
    if (!ANSWERS.includes(answer) || !game || !Array.isArray(game.guesses) || game.guesses.length > 6 ||
        !game.guesses.every(word => typeof word === 'string' && dictionary.has(word)) ||
        typeof game.draft !== 'string' || !/^[A-Z]{0,5}$/.test(game.draft)) return false;
    const win = game.guesses.indexOf(answer);
    return win === -1 || win === game.guesses.length - 1;
  });
}
