/**
 * Embed layout — injected for all /embed/* routes.
 *
 * To match your Squarespace site, edit the CSS variables below.
 * Every color, font, radius, and spacing used by the embed pages
 * is defined here in one place.
 */
export default function EmbedLayout({ children }) {
  return (
    <>
      <style>{`
        /* ─── One Love Embed Theme ───────────────────────────────────────────
         * Edit these variables to match your Squarespace site.
         * ----------------------------------------------------------------- */
        :root {
          /* Fonts */
          --ol-font-heading: Georgia, "Times New Roman", serif;
          --ol-font-body:    "Helvetica Neue", Helvetica, Arial, sans-serif;

          /* Backgrounds */
          --ol-bg:           transparent;     /* embed sits on Squarespace bg */
          --ol-bg-input:     #ffffff;
          --ol-bg-callout:   #f5f2ec;         /* cream tint for info boxes */
          --ol-bg-success:   #f0ede6;         /* confirmation / in-area box */
          --ol-bg-error:     #fdf2f2;

          /* Text */
          --ol-text:         #1a1a18;         /* near-black body text */
          --ol-text-muted:   #5a5750;         /* secondary / placeholder */
          --ol-text-hint:    #9a948c;         /* fine print */

          /* Borders */
          --ol-border:       #d8d3ca;         /* default input/card border */
          --ol-border-error: #c0392b;

          /* Buttons — primary */
          --ol-btn-bg:       #1a1a18;         /* dark button */
          --ol-btn-text:     #ffffff;
          --ol-btn-disabled: #b8b3aa;

          /* Accent — used for "in service area", selected chips, links */
          --ol-accent:       #2a5a3c;         /* dark forest, not bright green */
          --ol-accent-light: #e8f0eb;         /* light tint for accent boxes */
          --ol-accent-border:#b8d0c0;

          /* Border radius */
          --ol-radius-sm:    3px;
          --ol-radius-md:    5px;
          --ol-radius-lg:    6px;

          /* Chip / pill buttons (issue selection, contact pref) */
          --ol-chip-bg:          #ffffff;
          --ol-chip-border:      #d8d3ca;
          --ol-chip-selected-bg: #1a1a18;
          --ol-chip-selected-text: #ffffff;
          --ol-chip-selected-border: #1a1a18;
        }

        /* ── Base reset for embed pages ── */
        .ol-embed * { box-sizing: border-box; }
        .ol-embed input,
        .ol-embed select,
        .ol-embed textarea,
        .ol-embed button { font-family: var(--ol-font-body); }
      `}</style>
      <div className="ol-embed">{children}</div>
    </>
  );
}
