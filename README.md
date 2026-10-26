# Games for One

A free, independent puzzle collection with a main menu, Five Letters, Common Thread, Word Trails and Midi Crossword, in a shared dark theme. Pick a puzzle whenever you like; there are no daily limits. Includes a curated answer collection, 12,578 accepted dictionary words, touch and physical keyboards, accessible colour symbols, local progress and offline support.

## Run locally

Requires Python 3. From this directory, run:

```sh
python3 -m http.server 4173 --bind 0.0.0.0
```

Open the server in a browser. No build, production packages, accounts, API keys or backend are required. Serve over HTTPS when hosting; service workers also work on localhost during development.

## Validate

Node 22+ and Python 3 are recommended for development. Browser tests use system Chromium at `/usr/bin/chromium`; set `CHROMIUM_PATH` if yours is elsewhere.

```sh
npm ci --cache /tmp/games-npm-cache
npm test
npm run test:browser
```

Browser checks cover touch input, dictionary rejection, repeated letters, saved progress, wins/losses, collection switching, unavailable storage, mobile layouts and offline reloads. Chromium phone emulation is not a test on a physical iPhone.

## Free hosting with GitHub Pages

Use a public GitHub repository to host this without a paid GitHub plan. Commit the app files to `main` and push. In the repository's **Settings → Pages**, choose **Deploy from a branch**, select **main** and **/(root)**, then save. GitHub supplies the website address and HTTPS. No custom domain is necessary. All app paths are relative, so repository subpaths work.

The app is published from the main branch using GitHub Pages. Once the site is published, open it in iPhone Safari, choose **Share → Add to Home Screen**. Open **About & privacy** and wait for “Ready for offline play” before disconnecting. iOS can evict stored data; offline access and local progress are not permanent backups.

## Data and updates

Progress stays in local storage under `games-for-one.five-letters.v1`. It does not sync between devices. Clearing browser data removes progress; private browsing may discard it. If storage is blocked, the game still works for the session and shows a warning. Collection order is shuffled once per browser. Finished puzzles remain reviewable; this version has a finite collection, not an infinite puzzle generator.

When changing cached app files, increment `CACHE` in `sw.js`. The new worker activates after old app tabs/windows close, avoiding mixed versions. Keep existing answer IDs stable or add a saved-state migration before changing the collection.

The bundled guess dictionary is the five-letter ASCII subset of `word-list` 4.1.0 by Sindre Sorhus (MIT); see `DICTIONARY-LICENSE.txt`. Answers are curated separately. No NYT puzzle content, branding or assets are included. No external fonts, analytics, paid services or runtime network APIs are used.


## Games, statistics and compact layouts

Five Letters has 274 puzzles. Common Thread keeps its 12 original puzzles and preloads 108 additional combinations, each with four groups ranked from straightforward through tricky and hard to wordplay. The ranking is editorial, not a guarantee of how difficult each player will find it. Categories include double meanings, hidden words, homophones, anagrams and spelling changes. Four mistakes end a puzzle and reveal the remaining groups. Duplicate guesses do not consume another mistake.

The main menu opens at the root address. Game routes are `#five-letters`, `#common-thread` and `#word-trails` and `#midi`; the Games link returns to the menu without losing progress. Layouts use the dynamic viewport height and account for safe areas. Normal gameplay is checked for no vertical or horizontal scrolling at 320×568, 375×550, 390×664, 390×844, 768×1024, 1440×900 and 844×390. Help and collection dialogs intentionally scroll when needed; very large accessibility text settings may also require scrolling.

Wins, current streak and best streak are separate for each game and saved locally. Streaks count completed puzzles in completion order, not calendar days. A loss resets the current streak; breaks and puzzle switching do not. Revisiting a completed puzzle cannot earn another win. Existing Five Letters saves retain all guesses and win totals. Old saves lack completion order, so streak tracking starts from the update instead of inventing a historical streak. Common Thread uses `games-for-one.common-thread.v1`; Five Letters keeps its original storage key.

The v4 service worker caches all four games, their dictionaries and the menu. To receive an update, open online, then fully close the installed app and any tabs for this site, and reopen. Do not clear website data: that would erase progress. Deploying to GitHub Pages may take a few minutes.


## Automatic Common Thread packs

The catalogue starts with 120 puzzles. After finishing them, Next pack creates another 12 combinations locally, including offline. A deterministic combination sequence draws one group from each difficulty level of the original 48-category bank, rejects repeated words within a puzzle and never repeats an entire four-group combination. Individual categories recur: these are new combinations, not newly authored or AI-generated categories. There is a finite reserve of thousands of combinations; exhaustion is handled with an explicit message. Future app updates can supply new categories. Preserve the original bank and combination algorithm for existing saved puzzle IDs. The saved `puzzleCount` restores generated packs and maintains wins and streaks; old 12-puzzle saves migrate without losing progress. The collection picker displays one pack at a time.

## Word Trails

Word Trails starts with 120 original 6×8 boards across 24 themes, preserving the first eight boards and all existing saves. Every board uses all 48 letters exactly once across its theme answers. A spanning answer touches opposing edges. Each theme word is checked to have exactly one path even when diagonal moves are allowed. Tap letters and Submit, or drag and release; keyboard users can focus letters and press Enter or Space. Tapping an earlier letter backtracks. Blue paths and checkmarks identify theme words; a gold path and star identify the spanning answer. Three distinct dictionary words of at least four letters earn a hint that outlines an unfound word. Hints and progress persist under `games-for-one.word-trails.v1`. There is no loss condition or timer.

Word Trails now creates automatic packs of 12 fresh boards in a Web Worker after the available boards are completed. It uses a fixed theme library, varied answer selections where available, and new letter paths. Themes recur; this is not a source of infinitely many new topics. Generation works offline and has progress feedback and retry handling. Each generated board must cover every cell, have one spanning word and have a unique path for each theme answer. A pack is saved only when all 12 boards are ready and validated. Closing the app during generation leaves the old collection intact. Generated boards are stored alongside progress; opening another window restores the same pack. The local save has a 2,400-generated-board safety cap. Its bundled dictionary is the 4–16 letter ASCII subset of word-list 4.1.0, under the existing dictionary licence. No API calls, subscriptions or paid generation services are required. Browser tests cover offline play, drag/tap input, reloads, pack generation, save migration and phone layouts; physical iOS testing remains a user-device check.


## Midi Crossword

120 original 7×7 crosswords are bundled. Each grid has 41 open cells and 22 Across/Down clues, rotationally symmetric blocks, no entries shorter than three letters, connected open cells and two crossing answers through every letter. The current collection shares a grid pattern but has 120 distinct fills and 457 different answers. Clues combine written clues with adapted WordNet definitions; the WordNet notice is included in `WORDNET-LICENSE.txt`. These are independent crosswords and do not copy NYT clues, grids or assets. This version covers common solving controls, not every NYT app feature.

Tap a tile twice or tap the clue to switch direction. Physical arrow keys move through the grid; Space toggles direction and Tab/Shift+Tab navigate clues while the grid is focused. The on-screen keyboard supports typing and deletion. Both clue lists are available through Clues. Pencil mode marks tentative entries. Check tile, word or puzzle marks incorrect filled tiles with a red slash without flagging blanks; optional auto-check applies to new entries. Reveal tile and word apply immediately, while Reveal entire puzzle requires confirmation. Revealed letters are marked by a blue dot and cannot be accidentally overwritten. Checks and reveals mark completion as assisted.

The timer pauses when hidden, on another game screen, in a dialog or explicitly paused. Progress, pencil marks, errors, revealed cells, elapsed time and completion state persist under `games-for-one.midi.v1`. Collection switching keeps every puzzle's state. Midi currently has 120 puzzles, not automatic generated packs. WebKit/physical-iPhone behavior still needs testing on a real device; the automated mobile checks use Chromium.
