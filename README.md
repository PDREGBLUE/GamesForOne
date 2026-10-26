# Games for One

A free, independent puzzle collection with a main menu, Five Letters and Common Thread. Pick a puzzle whenever you like; there are no daily limits. Includes a curated answer collection, 12,578 accepted dictionary words, touch and physical keyboards, accessible colour symbols, local progress and offline support.

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

Five Letters has 274 puzzles. Common Thread has 12 original puzzles, each with four groups ranked from straightforward through tricky and hard to wordplay. The ranking is editorial, not a guarantee of how difficult each player will find it. Categories include double meanings, hidden words, homophones, anagrams and spelling changes. Four mistakes end a puzzle and reveal the remaining groups. Duplicate guesses do not consume another mistake.

The main menu opens at the root address. Game routes are `#five-letters` and `#common-thread`; the Games link returns to the menu without losing progress. Layouts use the dynamic viewport height and account for safe areas. Normal gameplay is checked for no vertical or horizontal scrolling at 320×568, 375×550, 390×664, 390×844, 768×1024, 1440×900 and 844×390. Help and collection dialogs intentionally scroll when needed; very large accessibility text settings may also require scrolling.

Wins, current streak and best streak are separate for each game and saved locally. Streaks count completed puzzles in completion order, not calendar days. A loss resets the current streak; breaks and puzzle switching do not. Revisiting a completed puzzle cannot earn another win. Existing Five Letters saves retain all guesses and win totals. Old saves lack completion order, so streak tracking starts from the update instead of inventing a historical streak. Common Thread uses `games-for-one.common-thread.v1`; Five Letters keeps its original storage key.

The v2 service worker caches both games and the menu. To receive an update, open online, then fully close the installed app and any tabs for this site, and reopen. Do not clear website data: that would erase progress. Deploying to GitHub Pages may take a few minutes.
