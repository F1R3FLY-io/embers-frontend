import type { SVGProps } from "react";
const SvgHide = (props: SVGProps<SVGSVGElement>) => (
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="{21}"
  height="{20}"
  fill="none"
  {...props}
>
  <g clipPath="url(#_Hide__svg__a)">
    <path fill="#F1F3F5" d="m3.444 2.5 15 15z" />
    <path
      stroke="#F1F3F5"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="{2}"
      d="m3.444 2.5 15 15"
    />
    <path
      fill="#F1F3F5"
      stroke="#F1F3F5"
      d="M8.244 8.696a2.998 2.998 0 0 0 2.406 4.288 3 3 0 0 0 1.596-.286l2.55 2.55c-1.08.55-2.36.917-3.852.917-2.566 0-4.51-1.086-5.893-2.328l-.269-.25A12.1 12.1 0 0 1 2.384 10.3a.7.7 0 0 1 0-.608A12.1 12.1 0 0 1 4.784 6.41q.292-.282.622-.554zm2.7-4.864c2.567 0 4.511 1.086 5.894 2.328l.27.251c.979.952 1.79 2.064 2.398 3.287a.7.7 0 0 1 0 .602c-.38.766-.842 1.488-1.374 2.156L9.61 3.934q.661-.103 1.333-.102Z"
    />
  </g>
  <defs>
    <clipPath id="_Hide__svg__a">
      <path fill="#fff" d="M.944 0h20v20h-20z" />
    </clipPath>
  </defs></svg>); export default SvgHide;
