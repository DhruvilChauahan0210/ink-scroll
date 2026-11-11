/**
 * The converter's sample: a cup of coffee, drawn for this page (no outside
 * artwork), written the way an editor exports a file, so most rules show at
 * once: an XML declaration and comments, xmlns:xlink, class, data-name, a
 * style string with a custom property, hyphenated stroke attributes, a
 * <title>, and a width and height on the root.
 */
export const SAMPLE = `<?xml version="1.0" encoding="UTF-8"?>
<!-- A cup of coffee, drawn for this page -->
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="240" height="200" viewBox="0 0 240 200" class="cup" data-name="Coffee cup" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
  <title>A cup of coffee</title>
  <!-- steam -->
  <g class="steam" style="opacity: 0.6; --rise: 12px">
    <path d="M92 66 C 80 54, 104 42, 92 28"/>
    <path d="M120 66 C 108 54, 132 42, 120 28"/>
    <path d="M148 66 C 136 54, 160 42, 148 28"/>
  </g>
  <!-- cup, handle, saucer -->
  <path d="M64 84 H176 V122 A42 42 0 0 1 134 164 H106 A42 42 0 0 1 64 122 Z"/>
  <path d="M176 96 H188 A18 18 0 0 1 188 132 H174"/>
  <path d="M40 180 H200" stroke-width="3"></path>
</svg>`;

/** The component name the sample starts with. */
export const SAMPLE_NAME = 'CoffeeCup';
