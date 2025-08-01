import type { SVGProps } from "react";
const SvgFiles = (props: SVGProps<SVGSVGElement>) => (
  <svg
    fill="none"
    height="{25}"
    width="{24}"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path d="M20 7.5h-3a2 2 0 0 1-2-2v-3" fill="#F1F3F5" />
    <path
      d="M20 7.5h-3a2 2 0 0 1-2-2v-3"
      stroke="#F1F3F5"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="{2}"
    />
    <path
      d="M9 18.5a2 2 0 0 1-2-2v-12a2 2 0 0 1 2-2h7l4 4v10a2 2 0 0 1-2 2z"
      stroke="#F1F3F5"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="{2}"
    />
    <path
      d="M3 8.1v12.8a1.6 1.6 0 0 0 1.6 1.6h9.8"
      stroke="#F1F3F5"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="{2}"
    />
  </svg>
);
export default SvgFiles;
