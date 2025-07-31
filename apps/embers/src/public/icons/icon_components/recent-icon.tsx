import type { SVGProps } from "react";
const SvgRecentIcon = (props: SVGProps<SVGSVGElement>) => (
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
      d="M7.333 5.335v2.668c0 .187.078.354.2.475l1.648 1.647a.67.67 0 0 0 .942 0 .67.67 0 0 0 0-.944L8.667 7.725V4a.667.667 0 1 0-1.334 0zM8 14.667A6.666 6.666 0 1 1 8 1.334a6.666 6.666 0 0 1 0 13.333"
      clipRule="evenodd"
    />
  </svg>
);
export default SvgRecentIcon;
