import { TRAILS as ORIGINAL } from './trails-puzzles.js';
const extra = [
 ['Life’s a beach','ATTHEBEACH','SAND WAVES SHELL TOWEL BUCKET SHOVEL SUNSCREEN SWIM SURF DUNES PICNIC PARASOL COAST SHORE'],
 ['Among the trees','WOODLAND','FOREST LEAVES ACORN MOSS FERN BARK BRANCH ROOTS CANOPY BADGER FOXES DEER OWLS PINE'],
 ['A day on the farm','FARMLIFE','TRACTOR SHEEP COWS BARN FENCE FIELD GATE WHEAT HARVEST CHICKEN HORSE GOATS PIGS HAYSTACK'],
 ['A cosy corner','READING','BOOK PAGE STORY NOVEL POETRY AUTHOR CHAPTER COVER SPINE LIBRARY READER WORDS PAPER FICTION'],
 ['Let’s get creative','ARTCLASS','PAINT BRUSH CANVAS EASEL PENCIL PAPER COLOUR SKETCH PASTEL CHARCOAL FRAME PORTRAIT SCULPTURE'],
 ['Something to wear','WARDROBE','SHIRT SKIRT DRESS COAT SOCKS SHOES SCARF GLOVES JACKET JEANS TROUSERS BOOTS HATPIN BELT'],
 ['Small but mighty','INSECTS','BEETLE MOTH ANTENNA WINGS LEGS CRICKET CICADA LADYBIRD TERMITE WASP BEES ANTS LARVA'],
 ['Birds of a feather','BIRDLIFE','ROBIN SPARROW SWALLOW EAGLE HAWK FALCON HERON SWAN DUCK GOOSE CROW RAVEN FINCH THRUSH'],
 ['Fresh from the patch','VEGETABLES','CARROT POTATO ONION LEEK KALE PEAS BEANS TURNIP RADISH CELERY CABBAGE SPINACH SQUASH'],
 ['Sweet and juicy','FRUITBOWL','APPLE PEAR PEACH PLUM GRAPE MELON ORANGE LEMON MANGO PAPAYA CHERRY BERRY BANANA KIWI'],
 ['A little exercise','SPORTSDAY','RUNNING JUMPING RACE RELAY BALL GOAL TEAM TRACK FIELD BATON SCORE TENNIS HOCKEY RUGBY'],
 ['Beneath your feet','GEOLOGY','ROCK MINERAL QUARTZ GRANITE SLATE MARBLE FOSSIL CRYSTAL CLAY SAND STONE LAVA BASALT'],
 ['A stitch in time','SEWING','NEEDLE THREAD BUTTON COTTON FABRIC SEAM HEMLINE THIMBLE SCISSORS PATTERN STITCH ZIPPER LINEN'],
 ['Under canvas','CAMPING','TENT PEGS ROPE FIRE LOGS TORCH BOOTS TRAIL HIKE COMPASS MAPS RUCKSACK SLEEPINGBAG KETTLE'],
 ['Fix it up','TOOLBOX','HAMMER NAILS SCREW WRENCH PLIERS DRILL SAWING LEVEL CLAMP CHISEL MALLET FILE TAPE BOLTS'],
 ['A new day begins','BREAKFAST','TOAST CEREAL MILK EGGS BACON COFFEE JUICE BUTTER HONEY JAMJAR WAFFLE PANCAKE PORRIDGE YOGURT']
];
export const THEMES = [...ORIGINAL.map(p=>({clue:p.clue,span:p.words.find(w=>w.span).word,bank:p.words.filter(w=>!w.span).map(w=>w.word)})),...extra.map(([clue,span,words])=>({clue,span,bank:words.split(' ')}))];
function rng(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function shuffle(items,rand){const out=[...items];for(let i=out.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}
const neighbours=Array.from({length:48},(_,i)=>Array.from({length:48},(_,j)=>j).filter(j=>Math.abs(i%6-j%6)+Math.abs(Math.floor(i/6)-Math.floor(j/6))===1));
const near=Array.from({length:48},(_,i)=>Array.from({length:48},(_,j)=>j).filter(j=>j!==i&&Math.abs(i%6-j%6)<=1&&Math.abs(Math.floor(i/6)-Math.floor(j/6))<=1));
export function uniqueWord(letters,word){let count=0;const seen=new Set();function visit(i,k){if(k===word.length){count++;return;}for(const j of near[i]){if(count>1)return;if(!seen.has(j)&&letters[j]===word[k]){seen.add(j);visit(j,k+1);seen.delete(j);}}}for(let i=0;i<48;i++){if(letters[i]===word[0]){seen.add(i);visit(i,1);seen.delete(i);}if(count>1)return false;}return count===1;}
function wordSet(theme,rand){const bank=shuffle(theme.bank,rand);function search(i,left,list){if(!left&&list.length>=5)return list;if(left<0||i===bank.length)return null;return search(i+1,left-bank[i].length,[...list,bank[i]])||search(i+1,left,list);}const words=search(0,48-theme.span.length,[]);if(!words)throw Error('Theme cannot fill 48 letters');return [theme.span,...words];}
export function generateTrail(sequence,existing=new Set()){
 const rand=rng(91827+sequence*7919);let theme=THEMES[sequence%THEMES.length],words=wordSet(theme,rand);
 for(let attempt=0;attempt<90000;attempt++){
  if(attempt===30000)theme=THEMES[(sequence+1)%THEMES.length];
  if(attempt===60000)theme=THEMES[sequence%8];
  if(attempt%300===0)words=wordSet(theme,rand);
  let path=Array.from({length:48},(_,i)=>Math.floor(i/6)*6+(Math.floor(i/6)%2?5-i%6:i%6));
  for(let k=0;k<180;k++){if(rand()<.5)path.reverse();const choices=neighbours[path[0]].filter(c=>c!==path[1]);if(choices.length){const at=path.indexOf(choices[Math.floor(rand()*choices.length)]);path=[...path.slice(0,at).reverse(),...path.slice(at)];}}
  let offset=0;const letters=Array(48),entries=[];
  for(const word of shuffle(words,rand)){const cells=path.slice(offset,offset+word.length);offset+=word.length;cells.forEach((i,k)=>letters[i]=word[k]);entries.push({word,path:cells,span:word===theme.span});}
  const span=entries.find(w=>w.span).path;
  if(!((span.some(i=>i%6===0)&&span.some(i=>i%6===5))||(span.some(i=>i<6)&&span.some(i=>i>=42))))continue;
  const grid=letters.join('');if(existing.has(grid)||!words.every(word=>uniqueWord(grid,word)))continue;
  return{id:`trail-auto-${String(sequence).padStart(6,'0')}`,clue:theme.clue,letters:grid,words:entries};
 }
 throw Error('Could not create a fresh board. Please try again.');
}
