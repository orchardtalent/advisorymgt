module.exports = {
  plugins: {
    // Inline @import rules during the PostCSS pass so Tailwind sees
    // otg-components.css combined with the @tailwind directives below.
    // Without this, Next's css-loader compiles the imported file standalone
    // and its @layer components block errors (no @tailwind components in scope).
    "postcss-import": {},
    tailwindcss: {},
    autoprefixer: {},
  },
};
