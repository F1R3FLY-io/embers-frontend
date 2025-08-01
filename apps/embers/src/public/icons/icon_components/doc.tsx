import type { SVGProps } from "react";
const SvgDoc = (props: SVGProps<SVGSVGElement>) => (
  <svg
    fill="none"
    height="{25}"
    width="{24}"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      clipRule="evenodd"
      d="M17 6H7a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1M7 4a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3z"
      fill="#F1F3F5"
      fillRule="evenodd"
    />
    <path d="M8 8h8v2H8zm0 4h8v2H8zm0 4h5v2H8z" fill="#F1F3F5" />
  </svg>
);
export default SvgDoc;
