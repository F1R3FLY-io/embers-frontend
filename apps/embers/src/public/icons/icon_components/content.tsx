import type { SVGProps } from "react";
const SvgContent = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="{24}"
    height="{24}"
    fill="none"
    {...props}
  >
    <path
      fill="#F1F3F5"
      stroke="#F1F3F5"
      d="M4 3.5h16c.827 0 1.5.673 1.5 1.5v14c0 .827-.673 1.5-1.5 1.5H4c-.827 0-1.5-.673-1.5-1.5V5c0-.827.673-1.5 1.5-1.5Zm-.5 16h8v-15h-8zm9 0h8.001V19L20.5 5v-.5h-8z"
    />
    <path
      fill="#F1F3F5"
      stroke="#F1F3F5"
      d="M17.5 11.5v1h-2v-1zm0-4v1h-2v-1z"
    />
  </svg>
);
export default SvgContent;
