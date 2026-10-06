# Third-Party Notices

The root MIT license applies to this project's original code and documentation.
It does not replace third-party licenses or grant rights to user photographs.

## Bundled fonts

- Great Vibes: Copyright 2015 The Great Vibes Pro Project Authors. Distributed
  under SIL Open Font License 1.1. Full notice: [GreatVibes-OFL.txt](assets/fonts/GreatVibes-OFL.txt).
- Playfair Display: Copyright 2017 The Playfair Display Project Authors,
  with Reserved Font Name "Playfair Display". Distributed under SIL Open Font
  License 1.1. Full notice: [Playfair-OFL.txt](assets/fonts/Playfair-OFL.txt).

Keep these notices with the font files when copying or redistributing the skill.

## Dependencies installed by the receiving application

Vue, Three.js (including its example modules), html-to-image and fflate are
dependencies, not bundled dependency source trees. Follow the LICENSE files
shipped with the installed versions when distributing a built application.
TypeScript declarations such as @types/three are development dependencies.

The optional editor uses Material Symbols icon names. The icon font itself is
not bundled. Supply it with its own license notices or adapt the editor to the
receiving application's existing icon library.

## Example photographs

`assets/catalog.ts` contains replaceable remote image URLs hosted on
`images.unsplash.com`. No photograph files are included in this distribution.
Those images are not licensed under this repository's MIT license. Check the
source image's applicable terms and permissions before publishing screenshots,
redistributing photographs, or using them in a product. Prefer your own images
or images for which you have confirmed the necessary rights.

Remote URLs may become unavailable, require network access, or fail CORS checks.
User-uploaded images and configuration exports must not be committed to this
repository as test fixtures without explicit permission.
