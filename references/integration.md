# Integration

[Overview](../README.md) · [Architecture](../docs/architecture.md) · [Visual examples](../docs/gallery.md)

## Vue card

Copy `PhotoCard.vue`, `catalog.ts`, `styles.css` and `fonts/` together. The basic card requires Vue 3. The full studio additionally requires `three` (tested 0.184), `html-to-image` (1.11.13), and `fflate` (0.8.3), with compatible `@types/three` for TypeScript. No Serene backend, API key or account is needed.

```vue
<script setup lang="ts">
import { reactive } from 'vue';
import PhotoCard from './photo-card-styles/PhotoCard.vue';
import type { ShowcaseCard } from './photo-card-styles/catalog';
const card = reactive<ShowcaseCard>({
  id: 1,
  image: '/photos/summer.jpg',
  type: 'postcard-jade',
  label: 'Summer in the hills',
  alt: 'Green hills in summer sunlight',
  position: 'center',
});
</script>
<template><PhotoCard :card="card" /></template>
```

`id` is a unique string or number. `image` is a URL or public asset path. `type` is a `PhotoStyleId`. `label` is plain text; the editor accepts up to 80 characters. Optional `alt` describes the image; optional `position` controls object-position. `lazy` enables image lazy loading in larger galleries. Reactive updates to images, styles and captions work without remounting the card.

## Choosing a style

The five original IDs are `polaroid`, `glass`, `neon`, `shadow`, `vintage`.

The other 120 IDs follow `{family}-{palette}`. Use the exported `photoStyles` list for labels and IDs. There are 24 distinct structures, each in five palettes; these are intentional variants.

Families:

- Framing: `gallery`, `double-mat`, `inset`, `keyline`, `corners`, `bevel`.
- Analog and paper: `tape`, `filmstrip`, `contact`, `postage`, `postcard`, `ticket`, `notebook`, `stitched`, `offset`.
- Typography: `blueprint`, `editorial`, `sidebar`, `caption-band`, `overlay`, `floating-label`.
- Shaped windows and printing: `arch`, `oval`, `duotone`.

Palettes: `ink` (neutral), `jade` (green), `rose` (berry), `cobalt` (blue), `citrus` (yellow).

Examples: `filmstrip-ink`, `arch-rose`, `editorial-cobalt`, `stitched-jade`, `caption-band-citrus`.

`resolvePhotoStyle` supplies the structural family and CSS custom properties. Unknown IDs fall back to `polaroid` for rendering; the editor rejects unknown IDs when importing or saving.

## Optional editor

The editor groups presets into classic, framing, paper and editorial categories. Favorites are stored separately under `serene.photo-style-favorites.v1` in browser localStorage and can be combined with search, family and palette filters. They are not part of the exported five-card configuration. On mobile, browsing and editing are separate views; selecting a style opens the editor.

`PhotoStyleStudio.vue` works with Vue 3 in a browser. Its imports are relative to the other bundled assets. Register it as a route, adapt its home anchor, and replace `saveCards` if the host app needs server persistence. Material Symbols are used for controls; load that font or replace those controls with the receiving app's icon library. The standalone card does not depend on these icons.

The bundled `state.ts` intentionally stores only a five-card showcase under `serene.photo-cards.v1` in localStorage. Apply saves to the current browser, not a backend or other users' accounts. Each input image can be a public URL or an embedded PNG/JPEG/WebP/GIF data URL. Local files are limited to 1.5 MB each; storage quota failures are displayed without claiming success. Export embeds local image data so the configuration remains portable. A new image URL replaces any previous failed-image state.

The JSON format is an array of exactly five `ShowcaseCard` objects with unique IDs. `parseCards` validates this showcase format; do not use its five-item restriction for unrelated galleries. Preserve the existing project structure when using a different card count. Do not store temporary blob URLs in exported or persistent data.

## Other frameworks

The media utilities also contain Vue mounting code. Port that small offscreen rendering step to the receiving framework together with the card renderer; the Three.js and canvas/ZIP operations can be reused. Do not describe `export.ts` as framework-independent without this adaptation.

Reuse `catalog.ts` and `styles.css`. Render this structure using the host framework, assigning class `pc-{family}` (or `pc-{id}` for original presets) and the resolved CSS variables on the article:

```html
<article class="serene-photo-card pc-postcard">
  <div class="pc-inner">
    <div class="pc-image-wrap"><img class="pc-image" src="/photos/summer.jpg" alt="Summer hills"></div>
    <span class="pc-label"><span>Summer in the hills</span></span>
  </div>
</article>
```

Use framework text bindings, not innerHTML. Port image-error reset and text fitting from the Vue component. Keep `box-sizing: border-box`, fixed responsive outer sizes, `min-height: 0` on the image flex region, and the reserved caption area. The current renderer is browser/H5 code; native uni-app or mini-program targets need platform-native image and measurement adapters.

## Finished image export

`ExportPanel` accepts `cards` and a zero-based `slot`. `export.ts` mounts a dedicated offscreen card, embeds its image and local fonts, then rasterizes its CSS with html-to-image. Output is a fixed 200 x 250 logical card at scale 2, 4, 6 or 10; mobile viewport dimensions do not change the output aspect ratio. Source-photo resolution still limits photographic detail. Captions and frame styling are rasterized at the selected resolution.

PNG can retain transparency. JPG always has a solid background, defaulting to white. The exported image is bounded by the card rectangle: outside drop shadows and page backdrops are not captured. In particular, backdrop blur on the glass card has no surrounding page to sample; use a chosen solid export background when needed. Files use sanitized, numbered names. ZIP export processes the five snapshot configurations sequentially and downloads only after all succeed. Cancellation stops subsequent work and prevents the final download; an already-running rasterization can take a moment to finish.

Remote images must permit CORS reads. A URL may display normally in an HTML image but still be unavailable to the exporter. Show the existing error and offer local upload; do not introduce a general-purpose image proxy. Invalid images and missing fonts fail explicitly rather than silently exporting blank media. Rendered fonts come from the bundled font files, without a live Google Fonts dependency.

```ts
import { exportCard, downloadBlob } from './photo-card-styles/export';
const result = await exportCard(card, {
  format: 'png', scale: 6, background: 'transparent',
});
downloadBlob(result, 'my-photo.png');
```

## Interactive 3D

Copy the entire `assets/` directory for the full 3D editor: `PhotoScene.vue` imports `frame3d.ts`, `layered3d.ts`, `game3d.ts`, `anime3d.ts`, `extra3d.ts`, `NativeField.ts`, `NativeButton.ts`, `studio-tokens.css` and the card export utilities. Copying only the scene and frame files is insufficient. Six independent physical-frame presets surround the printed card without changing its dimensions: gallery white, walnut with procedural grain, anisotropic silver, narrow black, transmissive acrylic with metal fixings, and a recessed floating mount. These use beveled ring geometry and a locally generated RoomEnvironment reflection map; no external HDR file is needed. The studio background (white, rose or graphite), exposure and frame thickness affect the live view and its PNG snapshot. They are temporary scene controls, not additional IDs in the 125-card catalog or persisted homepage settings.

Mount `PhotoScene` with a reactive `card` prop in a full-width, unframed area. The scene fits its camera to the available canvas area and retains the card's 4:5 proportions. The card texture is generated by the same exporter. Real front, back and side geometry supports orbit, zoom, thickness, flip, pointer-follow tilt and auto-rotation. Auto-rotation and drag rotation default to off; pointer-follow and animated light effects are enabled unless reduced motion applies. The canvas supports arrow keys, Home and +/-; visible directional buttons also work with keyboard activation. Keep controls below the bounded canvas. Wheel gestures scroll the page; touch scrolls until drag rotation is enabled. Resize observers, controls, GPU textures and geometries are disposed on unmount.

Depth relief displaces a subdivided front mesh within the photo region. With no uploaded map it uses blurred image brightness; a supplied grayscale map overrides that estimate, with lighter areas projecting farther forward and a taper near the photo edges. This does not recover hidden scene content. Depth-map uploads are limited to PNG/JPG/WebP under 5 MB; switching source photos clears the old map. The scene snapshot is PNG at 1600 pixels wide and the current canvas aspect ratio, showing the current camera pose and effect. It is not a GLB/OBJ export. Camera and effect controls are not saved in the existing five-card JSON configuration.

WebGL failure leaves an explicit error while flat-photo export remains available. Do not replace the actual renderer with a static screenshot while advertising interactive 3D.

## Layered effects and finished exports

The independent layered catalog contains 21 presets: 12 creative effects in
`extra3d.ts`, three anime effects in `anime3d.ts`, three game variants and three
optical variants. Use `layeredPresets` for IDs and labels; derive category counts
from that data instead of hardcoding them. Filtering a category does not change
the current selection. These effects decorate a supplied photograph, not convert
it to anime or automatically separate a subject from its background.

Finished export uses a front orthographic camera at exact 2 x 2.5 artwork bounds.
It preserves the full frame, geometry, foil rim, effects and caption. A temporary
composition with `fillCorners = true` adds one aligned photo plane below all
original layers, so the silhouette's corner cutouts contain photo pixels. Do not
shrink or remove the frame, crop the composition or fill those corners with a
solid color. Output filenames start with `serene-photo-rect-`.

The result is a static PNG at 1000 x 1250 or 2000 x 2500. Animation uses a fixed
phase for reproducible still exports. The temporary composition is disposed and
the live preview's pose, renderer size and animation state are restored. Verify
the decoded PNG's four corners and compare unchanged original layers, not just
whether the browser downloaded a file.

## Receiving application checklist

- Keep `NativeButton.ts` and `NativeField.ts`; they supply browser-native control
  semantics in uni-app H5. Style native buttons by their `.native-button` class.
- Load the receiving app's icon font or replace Material Symbols usage. The
  standalone `PhotoCard` component does not need an icon font.
- Replace the Serene home URL and branding in `PhotoStyleStudio.vue`; adapt the
  apply action if the receiving app does not have a five-photo homepage.
- Rename localStorage keys when multiple independent editors share one origin.
- Keep `fonts/` at the same relative location and retain both OFL license files.
- Import browser-only state and scene components client-side in SSR frameworks.
- Verify image replacement, long captions, local storage errors, JSON round-trip,
  keyboard/touch controls, flat export, ZIP and composed 3D PNG on desktop/mobile.
