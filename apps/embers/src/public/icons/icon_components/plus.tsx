import type { SVGProps } from "react";
const SvgPlus = (props: SVGProps<SVGSVGElement>) => (
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="{24}"
  height="{24}"
  fill="none"
  {...props}
>
  <path
    fill="#161E27"
    fillRule="evenodd"
    d="M12 1.5c5.798 0 10.5 4.702 10.5 10.5S17.798 22.5 12 22.5 1.5 17.798 1.5 12 6.202 1.5 12 1.5"
    clipRule="evenodd"
  />
  <path
    fill="#93A4B7"
    stroke="#93A4B7"
    strokeWidth="{0.016}"
    d="m16.988 11.25-.001.003h-.003v1.489h-4.235V11.25zm0 0h.002m-.002 0v.002h.001l.001-.001m.002.003h-.003v.004h.003zm0 0v-.002m0 .002h-.002l.002-.002m0 0-.002-.001m.002.001h-.002v-.001m-4.248 1.498v4.235h-1.485V12.75zm0-5.733v5.726h-1.485l.001-1.492-.001-4.234zm-1.493 4.242v1.484H7.016v-1.484z"
  /></svg>); export default SvgPlus;
