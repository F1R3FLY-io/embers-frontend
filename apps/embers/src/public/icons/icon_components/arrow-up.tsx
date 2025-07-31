import type { SVGProps } from "react";
const SvgArrowUp = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="{21}"
    height="{21}"
    fill="none"
    {...props}
  >
    <path fill="#F1F3F5" d="m10.258 4.666 5 5zm0 0-5 5zm0 0v11.667z" />
    <path
      stroke="#F1F3F5"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="{1.5}"
      d="m10.258 4.666 5 5m-5-5-5 5m5-5v11.667"
    />
  </svg>
);
export default SvgArrowUp;
