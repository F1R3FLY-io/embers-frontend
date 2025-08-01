import type { SVGProps } from "react";
const SvgArrowRight = (props: SVGProps<SVGSVGElement>) => (
  <svg
    fill="none"
    height="{21}"
    width="{21}"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path d="m16.091 10.5-5 5zm0 0-5-5zm0 0H4.424z" fill="#F1F3F5" />
    <path
      d="m16.091 10.5-5 5m5-5-5-5m5 5H4.424"
      stroke="#F1F3F5"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="{1.5}"
    />
  </svg>
);
export default SvgArrowRight;
