# Five Letters · Games for One

A free, independent five-letter word game. Pick a puzzle whenever you like; there are no daily limits. Includes a curated answer collection, 12,578 accepted dictionary words, touch and physical keyboards, accessible colour symbols, local progress and offline support.

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

The repository has not been published by creating these files. Once the site is published, open it in iPhone Safari, choose **Share → Add to Home Screen**. Open **About & privacy** and wait for “Ready for offline play” before disconnecting. iOS can evict stored data; offline access and local progress are not permanent backups.

## Data and updates

Progress stays in local storage under `games-for-one.five-letters.v1`. It does not sync between devices. Clearing browser data removes progress; private browsing may discard it. If storage is blocked, the game still works for the session and shows a warning. Collection order is shuffled once per browser. Finished puzzles remain reviewable; this version has a finite collection, not an infinite puzzle generator.

When changing cached app files, increment `CACHE` in `sw.js`. The new worker activates after old app tabs/windows close, avoiding mixed versions. Keep existing answer IDs stable or add a saved-state migration before changing the collection.

The bundled guess dictionary is the five-letter ASCII subset of `word-list` 4.1.0 by Sindre Sorhus (MIT); see `DICTIONARY-LICENSE.txt`. Answers are curated separately. No NYT puzzle content, branding or assets are included. No external fonts, analytics, paid services or runtime network APIs are used.
