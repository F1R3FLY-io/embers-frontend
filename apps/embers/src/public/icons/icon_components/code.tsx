import type { SVGProps } from "react";
const SvgCode = (props: SVGProps<SVGSVGElement>) => (
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="{24}"
  height="{24}"
  fill="none"
  {...props}
>
  <path
    stroke="#F1F3F5"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="{1.5}"
    d="m14.66 16.653 4.653-4.654-4.654-4.653m-5.318 0-4.653 4.653 4.653 4.653"
  /></svg>); export default SvgCode;
