# Branches

A math puzzle laid out like a crossword, but grown as branches instead of a square grid.
Each branch is an equation that reads toward its total; cells where branches cross count for both.
Players fill the board from a number bank (duplicates included), by dragging or tapping.
Android app with banner ads and rewarded-video petals (AdMob), same setup as Crossfigure.

## Where things are

| What | File |
|---|---|
| Game page (layout, styles, game logic) | `web/game.html` |
| Puzzle generator + solver | `generator/gen.js` |
| Page the app actually loads (built from the two above) | `app/src/main/assets/index.html` |
| Android wrapper + ads | `app/src/main/java/com/branchespuzzle/game/MainActivity.java` |
| Ad IDs (Google **test** IDs for now) | `app/src/main/res/values/strings.xml` |
| Build | `.github/workflows/build.yml` (debug APK + release `.aab` on every push) |
| Privacy policy | `docs/privacy.html` |

After editing `web/game.html` or `generator/gen.js`, run `python3 tools/build_web.py` to rebuild the
app's page. The GitHub build fails if you forget, so a stale page never ships.

## Getting the APK onto your phone
GitHub > **Actions** > latest "Build Branches" run > **Artifacts** > `branches-debug-apk`. Unzip it and
install the `.apk` on your phone (allow installs from unknown sources when asked).

## Before publishing
1. **App ID:** `com.branchessummerdelight.game` (in `app/build.gradle`). It can never change after the first
   Play upload, so change it now if you want a different one.
2. **Signing:** Branches needs its own upload key. Add `KEYSTORE_BASE64`, `KEYSTORE_PASSWORD`,
   `KEY_ALIAS` and `KEY_PASSWORD` as repository secrets (same as Crossfigure). Without them the
   release bundle is unsigned.
3. **Real ads:** replace the three Google test IDs in `strings.xml` with your own AdMob app ID,
   banner unit ID and rewarded unit ID. Never use real IDs while testing.
4. **Privacy policy:** publish `docs/` with GitHub Pages (Settings > Pages > branch `main`, folder `/docs`).

## Game design
- Difficulties: Easy 5 branches, Medium 7, Hard 9. Every puzzle has exactly one solution.
- Rewards: solve = 10/20/35 petals (+5 no hints); daily bonus 10 × streak (max 70);
  skins at 3, 7, 14 and 30 days played; first hint free, then 15 petals; ad = +30 petals.
- The leaderboard only appears in the Claude-hosted web version. On Android it is hidden
  (Google Play Games Services is the eventual replacement).
