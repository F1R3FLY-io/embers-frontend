import type { SVGProps } from "react";
const SvgDownload = (props: SVGProps<SVGSVGElement>) => (
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="{16}"
  height="{16}"
  fill="none"
  {...props}
>
  <path
    fill="#F1F3F5"
    stroke="#F1F3F5"
    d="M3.5 10.499v2h9v-2h.334v1.5c0 .233-.077.42-.245.589a.78.78 0 0 1-.588.245H4a.79.79 0 0 1-.588-.245.79.79 0 0 1-.245-.589v-1.5zm4.667-7.333v6.14l.853-.853 1.373-1.374.24.247L8 9.96 5.367 7.326l.238-.248 2.229 2.229V3.166z"
  /></svg>); export default SvgDownload;
