import type { SVGProps } from "react";
const SvgArrowUp = (props: SVGProps<SVGSVGElement>) => (
  <svg
    fill="none"
    height="{21}"
    width="{21}"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path d="m10.258 4.666 5 5zm0 0-5 5zm0 0v11.667z" fill="#F1F3F5" />
    <path
      d="m10.258 4.666 5 5m-5-5-5 5m5-5v11.667"
      stroke="#F1F3F5"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="{1.5}"
    />
  </svg>
);
export default SvgArrowUp;
