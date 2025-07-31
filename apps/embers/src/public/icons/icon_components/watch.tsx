import type { SVGProps } from "react";
const SvgWatch = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="{21}"
    height="{20}"
    fill="none"
    {...props}
  >
    <g fill="#F1F3F5" stroke="#F1F3F5" clipPath="url(#_Watch__svg__a)">
      <path d="M10.056 8.5a1.5 1.5 0 1 1-1.5 1.5l.007-.148a1.5 1.5 0 0 1 1.344-1.344z" />
      <path d="M10.056 3.5c4.198 0 7.758 2.723 9.014 6.5-1.256 3.777-4.816 6.5-9.014 6.5A9.5 9.5 0 0 1 1.04 10a9.5 9.5 0 0 1 9.016-6.5Zm0 2a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Z" />
    </g>
    <defs>
      <clipPath id="_Watch__svg__a">
        <path fill="#fff" d="M.056 0h20v20h-20z" />
      </clipPath>
    </defs>
  </svg>
);
export default SvgWatch;
