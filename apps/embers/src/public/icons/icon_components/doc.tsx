import type { SVGProps } from "react";
const SvgDoc = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="{24}"
    height="{25}"
    fill="none"
    {...props}
  >
    <path
      fill="#F1F3F5"
      fillRule="evenodd"
      d="M17 6H7a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1M7 4a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3z"
      clipRule="evenodd"
    />
    <path fill="#F1F3F5" d="M8 8h8v2H8zm0 4h8v2H8zm0 4h5v2H8z" />
  </svg>
);
export default SvgDoc;
