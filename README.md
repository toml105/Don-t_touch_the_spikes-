# Cloudline Express

A sky-fishing tycoon built for phone sessions on a train. You run a flying steam train above an endless sea of clouds. Drop a lantern hook through five painted layers of sky, catch strange creatures on the way back up, and sell the haul to grow the train.

All art was generated with Higgsfield: the painted skies with GPT Image 2.5, and the train, carriage and 15 creatures turned into textured 3D models with Higgsfield image-to-3D. The models ship as one compressed zip (meshopt geometry, WebP textures, 3.7 MB) from Higgsfield's CDN. The scene is rendered with Three.js, blending realism with a light low-poly touch: the painted skies show through with a fine faceted grain, the models keep their full painted detail with crisply cut silhouettes, and the clouds are faceted 3D islands. Each layer has its own lighting. The interface follows Swiss typographic style: one grotesk (Archivo), a strict grid, hairline rules and a single red accent.

## How to play

1. Tap **Cast**. The hook drops.
2. **On the way down**, drag left and right to dodge creatures. The first one you touch stops the drop and starts the reel. Hitting the end of your line does the same.
3. **On the way up**, sweep through as many creatures as your hook can hold.
4. **Sell the haul**, then spend the coins:
   - **Gear**: longer line, bigger hook, faster winch, and a lantern shield that absorbs bumps on the way down. Every 4 levels the hook visibly evolves (Brass → Silver → Gold → Crystal → Starforged) and the lantern changes colour (Candle → Oil lamp → Aurora → Nebula → Sunheart).
   - **Train**: carriages that earn coins every second, including while the game is closed (up to 2 hours, plus 30 minutes per Sleeper Car level). Each one couples onto the train in 3D with its own roof prop: a steaming teapot, a fish tank, an observatory dome, a glowing moon, neon rings or a crown.
5. **Spin** for new hooks. There are 13 to collect, from Common to Legendary, and each has its own look and perk: a longer line, extra shields, bigger catch reach, more hook space, higher sale prices or more golden creatures. Duplicates add a star (up to 5), and each star makes the perk stronger. You get a free spin every 20 minutes. Rare catches give 1 ticket and each new layer gives 2. You can also spin for coins. Epic or better is guaranteed at least every 10 spins.
6. Fill the **Skydex** with all 15 species. The first catch of each species pays a 5× bonus.

Every hook starts each dive with one free shield. Deeper hauls pay a depth bonus (×1.3 at 120 m, ×2 at 400 m). About 1 creature in 25 is golden and sells for 5×.

| Layer | Depth | Residents |
|---|---|---|
| Cloud Sea | 0–120 m | Puffling, Blush Jelly, Sunbeam Koi |
| Storm Belt | 120–300 m | Drizzle Puffer, Volt Eel, Thunder Manta |
| Aurora Reef | 300–550 m | Aurora Seahorse, Geode Turtle, Prism Angler |
| Sunken Sky City | 550–850 m | Lantern Moth, Clockwork Carp, Gilded Temple Whale |
| The Underneath | 850 m+ | Star Squid, Nebula Ray, Leviathan of Dusk |

Progress is saved in your browser's local storage.

## Running it

It's a static site with no build step. Serve the folder with any static server:

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

The `Deploy to GitHub Pages` workflow publishes `main` once Pages is set to **GitHub Actions** under *Settings → Pages*.

## Files

- `index.html`: layout, HUD and styles
- `js/game.js`: the game (scene, gameplay, economy, saving)
