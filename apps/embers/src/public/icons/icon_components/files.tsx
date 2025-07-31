import type { SVGProps } from "react";
const SvgFiles = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="{24}"
    height="{25}"
    fill="none"
    {...props}
  >
    <path fill="#F1F3F5" d="M20 7.5h-3a2 2 0 0 1-2-2v-3" />
    <path
      stroke="#F1F3F5"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="{2}"
      d="M20 7.5h-3a2 2 0 0 1-2-2v-3"
    />
    <path
      stroke="#F1F3F5"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="{2}"
      d="M9 18.5a2 2 0 0 1-2-2v-12a2 2 0 0 1 2-2h7l4 4v10a2 2 0 0 1-2 2z"
    />
    <path
      stroke="#F1F3F5"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="{2}"
      d="M3 8.1v12.8a1.6 1.6 0 0 0 1.6 1.6h9.8"
    />
  </svg>
);
export default SvgFiles;
