import type { SVGProps } from "react";
const SvgMoreIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    fill="none"
    height="{24}"
    width="{24}"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M5 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4M19 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4"
      fill="#F1F3F5"
    />
  </svg>
);
export default SvgMoreIcon;
