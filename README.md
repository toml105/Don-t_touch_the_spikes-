# Cloudline Express

A sky-fishing tycoon built for phone sessions on a train. You run a flying steam train above an endless sea of clouds. Drop a lantern hook through five painted layers of sky, catch strange creatures on the way back up, and sell the haul to grow the train.

All art was generated with Higgsfield: the painted skies with GPT Image 2.5, and the train, carriage and 15 creatures turned into textured 3D models with Higgsfield image-to-3D. The models ship as one compressed zip (meshopt geometry, WebP textures, 3.7 MB) from Higgsfield's CDN. The scene is rendered with Three.js, with bloom, ACES tone mapping and its own lighting for each layer.

## How to play

1. Tap **Cast**. The hook drops.
2. **On the way down**, drag left and right to dodge creatures. The first one you touch stops the drop and starts the reel. Hitting the end of your line does the same.
3. **On the way up**, sweep through as many creatures as your hook can hold.
4. **Sell the haul**, then spend the coins:
   - **Gear**: longer line, bigger hook, faster winch, and a lantern shield that absorbs bumps on the way down. Every 4 levels the hook visibly evolves (Brass → Silver → Gold → Crystal → Starforged) and the lantern changes colour (Candle → Oil lamp → Aurora → Nebula → Sunheart).
   - **Train**: carriages that earn coins every second, including while the game is closed (up to 2 hours, plus 30 minutes per Sleeper Car level). Each one couples onto the train in 3D with its own roof prop: a steaming teapot, a fish tank, an observatory dome, a glowing moon, neon rings or a crown.
5. Fill the **Skydex** with all 15 species. The first catch of each species pays a 5× bonus.

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
