import type { SVGProps } from "react";
const SvgArrowLeft = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="{21}"
    height="{21}"
    fill="none"
    {...props}
  >
    <path fill="#F1F3F5" d="m4.424 10.5 5-5zm0 0 5 5zm0 0h11.667z" />
    <path
      stroke="#F1F3F5"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="{1.5}"
      d="m4.424 10.5 5-5m-5 5 5 5m-5-5h11.667"
    />
  </svg>
);
export default SvgArrowLeft;
