// `?react` SVG imports are React components under vite-plugin-svgr, so the mock
// has to be one too -- a string would make React warn about an invalid element
// type the moment a test renders an icon.
export default function SvgMock() {
  return null;
}
