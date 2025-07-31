import type { SVGProps } from "react";
const SvgHeartFull = (props: SVGProps<SVGSVGElement>) => (
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
      strokeWidth="{2}"
      d="M19.5 12.572 12 20l-7.5-7.428A5 5 0 1 1 12 6.006a5 5 0 1 1 7.5 6.572"
    />
  </svg>
);
export default SvgHeartFull;
