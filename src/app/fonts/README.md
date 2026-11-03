# Local fonts

The app and global error page share `../fonts.ts`. Both fonts are bundled with
the project, so `next dev` and `next build` do not download fonts from Google.
Next.js serves the files as hashed assets with `font-display: swap` and adjusted
fallback fonts.

Sources downloaded from the official Google Fonts repository:

- [Manrope 4.505](https://github.com/google/fonts/tree/main/ofl/manrope):
  `Manrope[wght].ttf`, variable weight 200–800, downloaded on 2026-10-26.
  Used for body text and controls.
- [Roboto Condensed 3.008](https://github.com/google/fonts/tree/main/ofl/robotocondensed):
  `RobotoCondensed[wght].ttf`, variable weight 100–900, downloaded on 2026-11-03.
  Used for upright display text, headings and barber names, primarily at 500–600.

The SIL Open Font License files in `public/fonts/licenses/` apply to the
respective fonts and are included in the production Docker image.
Both active WOFF2 files contain Latin, Cyrillic (including Ukrainian), common
punctuation and arrows. Manrope also supplies the hryvnia sign used in prices.
Standard OpenType layout features and variable weights are retained. Only files
imported by `../fonts.ts` are bundled; the former Cormorant files are unused.

To regenerate a file from the corresponding upstream TTF, use FontTools 4.46.0
with Brotli support (a maintenance tool, not an app/build dependency):

```bash
python3 -m fontTools.subset 'Manrope[wght].ttf' \
  --output-file=manrope-variable.woff2 \
  --flavor=woff2 \
  --unicodes='U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0301,U+0304,U+0308,U+0329,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2000-206F,U+20AC,U+20B4,U+2116,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD'
```

Use the same options for `RobotoCondensed[wght].ttf`, changing the input and output
filenames. Check the Ukrainian glyphs ҐґЄєІіЇї and the actual weights used by the
site when updating either file.
