import type { SVGProps } from "react";
const SvgDonate = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="{16}"
    height="{16}"
    fill="none"
    {...props}
  >
    <path
      fill="#F1F3F5"
      fillRule="evenodd"
      d="M8 1.334a6.667 6.667 0 1 1 0 13.333A6.667 6.667 0 0 1 8 1.334m-5.286 7.38a5.336 5.336 0 0 0 4.572 4.573 5.336 5.336 0 0 0-4.573-4.573m10.572 0a5.336 5.336 0 0 0-4.572 4.572 5.336 5.336 0 0 0 4.572-4.572M8 4.91A6.7 6.7 0 0 1 4.91 8 6.7 6.7 0 0 1 8 11.092a6.7 6.7 0 0 1 3.09-3.09A6.7 6.7 0 0 1 8 4.91m-.714-2.195a5.34 5.34 0 0 0-4.573 4.572 5.336 5.336 0 0 0 4.574-4.573m1.428 0a5.336 5.336 0 0 0 4.572 4.572 5.336 5.336 0 0 0-4.574-4.572"
      clipRule="evenodd"
    />
  </svg>
);
export default SvgDonate;
