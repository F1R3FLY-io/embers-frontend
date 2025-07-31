import type { SVGProps } from "react";
const SvgEditSmall = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="{16}"
    height="{16}"
    fill="none"
    {...props}
  >
    <path
      stroke="#F1F3F5"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9.501 12.767h3.248m-9.144-2.533a1.2 1.2 0 0 0-.354.855v1.7h1.711c.321 0 .629-.127.855-.355l6.577-6.66a1.21 1.21 0 0 0 0-1.71l-.498-.499a1.21 1.21 0 0 0-1.71 0z"
    />
  </svg>
);
export default SvgEditSmall;
