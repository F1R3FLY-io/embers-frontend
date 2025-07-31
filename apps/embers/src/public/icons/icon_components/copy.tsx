import type { SVGProps } from "react";
const SvgCopy = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="{17}"
    height="{16}"
    fill="none"
    {...props}
  >
    <path
      stroke="#F1F3F5"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="{1.5}"
      d="M5.39 2.665v8A1.333 1.333 0 0 0 6.722 12h5.333a1.334 1.334 0 0 0 1.333-1.334V4.827a1.33 1.33 0 0 0-.4-.954l-2.21-2.161a1.33 1.33 0 0 0-.933-.38H6.723a1.333 1.333 0 0 0-1.334 1.333"
    />
    <path
      stroke="#F1F3F5"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="{1.5}"
      d="M10.723 11.997v1.334a1.333 1.333 0 0 1-1.334 1.333H4.056a1.333 1.333 0 0 1-1.333-1.333V5.997a1.333 1.333 0 0 1 1.333-1.333H5.39"
    />
  </svg>
);
export default SvgCopy;
