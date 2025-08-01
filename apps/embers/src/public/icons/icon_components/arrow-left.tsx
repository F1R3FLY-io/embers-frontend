import type { SVGProps } from "react";
const SvgArrowLeft = (props: SVGProps<SVGSVGElement>) => (
  <svg
    fill="none"
    height="{21}"
    width="{21}"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path d="m4.424 10.5 5-5zm0 0 5 5zm0 0h11.667z" fill="#F1F3F5" />
    <path
      d="m4.424 10.5 5-5m-5 5 5 5m-5-5h11.667"
      stroke="#F1F3F5"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="{1.5}"
    />
  </svg>
);
export default SvgArrowLeft;
