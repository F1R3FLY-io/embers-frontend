import type { SVGProps } from "react";
const SvgDraft = (props: SVGProps<SVGSVGElement>) => (
  <svg
    fill="none"
    height="{16}"
    width="{17}"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M9.5 4v2.667h1.667m-.877-5.333H7.167a1.333 1.333 0 0 0-1.334 1.333v8a1.333 1.333 0 0 0 1.334 1.334H12.5a1.333 1.333 0 0 0 1.333-1.334V4.83a1.33 1.33 0 0 0-.401-.954l-2.21-2.161a1.33 1.33 0 0 0-.932-.38"
      stroke="#F1F3F5"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="{1.5}"
    />
    <path
      d="M11.167 12.001v1.334a1.333 1.333 0 0 1-1.334 1.333H4.5a1.333 1.333 0 0 1-1.333-1.333V6A1.333 1.333 0 0 1 4.5 4.668h1.333"
      stroke="#F1F3F5"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="{1.5}"
    />
  </svg>
);
export default SvgDraft;
