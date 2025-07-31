import type { SVGProps } from "react";
const SvgWarning = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="{17}"
    height="{16}"
    fill="none"
    {...props}
  >
    <path
      fill="#F5CD47"
      fillRule="evenodd"
      d="M7.633 3.31c.344-.65.905-.652 1.25 0l4.75 8.972c.344.65.03 1.18-.705 1.18h-9.34c-.735 0-1.05-.528-.705-1.18zm.153 6.494a.667.667 0 0 0 1.139-.472V6a.667.667 0 0 0-1.334 0v3.333c0 .177.07.347.195.472m0 2a.667.667 0 1 0 .943-.943.667.667 0 0 0-.943.943"
      clipRule="evenodd"
    />
  </svg>
);
export default SvgWarning;
