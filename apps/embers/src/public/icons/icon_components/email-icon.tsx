import type { SVGProps } from "react";
const SvgEmailIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    fill="none"
    height="{16}"
    width="{16}"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M3.333 4.667v6.667h9.334V4.667zm9.334-1.333c.733 0 1.333.6 1.333 1.333v6.667c0 .733-.6 1.333-1.333 1.333H3.333c-.733 0-1.333-.6-1.333-1.333V4.667c0-.733.6-1.333 1.333-1.333z"
      fill="#F1F3F5"
    />
    <path
      clipRule="evenodd"
      d="M3.665 4.334H2.083c.099.293.266.57.5.803l3.921 3.921a2.08 2.08 0 0 0 2.94 0l3.921-3.92c.234-.235.4-.51.5-.804h-1.582L8.5 8.115a.746.746 0 0 1-1.055 0z"
      fill="#F1F3F5"
      fillRule="evenodd"
    />
  </svg>
);
export default SvgEmailIcon;
