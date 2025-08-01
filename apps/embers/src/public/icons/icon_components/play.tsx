import type { SVGProps } from "react";
const SvgPlay = (props: SVGProps<SVGSVGElement>) => (
  <svg
    fill="none"
    height="{24}"
    width="{25}"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M21.364 9.353a2.998 2.998 0 0 1 0 5.294L8.552 21.614c-2.063 1.123-4.597-.337-4.597-2.646V5.033c0-2.31 2.534-3.769 4.597-2.648z"
      stroke="#F1F3F5"
      strokeWidth="{1.5}"
    />
  </svg>
);
export default SvgPlay;
