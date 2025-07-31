import type { SVGProps } from "react";
const SvgPlayFull = (props: SVGProps<SVGSVGElement>) => (
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="{17}"
  height="{16}"
  fill="none"
  {...props}
>
  <g clipPath="url(#_PlayFull__svg__a)">
    <path
      fill="#F1F3F5"
      stroke="#F1F3F5"
      strokeWidth="{1.5}"
      d="M14.381 6.236a1.999 1.999 0 0 1 0 3.53l-8.54 4.644c-1.376.749-3.066-.225-3.066-1.764v-9.29c0-1.54 1.69-2.512 3.065-1.765z"
    />
  </g>
  <defs>
    <clipPath id="_PlayFull__svg__a">
      <path fill="#fff" d="M.775 0h16v16h-16z" />
    </clipPath>
  </defs></svg>); export default SvgPlayFull;
