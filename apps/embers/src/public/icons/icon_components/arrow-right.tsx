import type { SVGProps } from "react";
const SvgArrowRight = (props: SVGProps<SVGSVGElement>) => (
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="{21}"
  height="{21}"
  fill="none"
  {...props}
>
  <path fill="#F1F3F5" d="m16.091 10.5-5 5zm0 0-5-5zm0 0H4.424z" />
  <path
    stroke="#F1F3F5"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="{1.5}"
    d="m16.091 10.5-5 5m5-5-5-5m5 5H4.424"
  /></svg>); export default SvgArrowRight;
