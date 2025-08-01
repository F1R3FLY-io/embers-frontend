import type { SVGProps } from "react";
const SvgSearch = (props: SVGProps<SVGSVGElement>) => (
  <svg
    fill="none"
    height="{21}"
    width="{21}"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      clipRule="evenodd"
      d="M9.223 4.666a5 5 0 1 0 0 10 5 5 0 0 0 0-10m-6.667 5a6.667 6.667 0 1 1 11.933 4.088l2.823 2.823a.833.833 0 0 1-1.178 1.178l-2.823-2.823A6.667 6.667 0 0 1 2.556 9.666"
      fill="#F1F3F5"
      fillRule="evenodd"
    />
  </svg>
);
export default SvgSearch;
