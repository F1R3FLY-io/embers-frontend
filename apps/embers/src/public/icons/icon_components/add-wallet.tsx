import type { SVGProps } from "react";
const SvgAddWallet = (props: SVGProps<SVGSVGElement>) => (
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="{16}"
  height="{16}"
  fill="none"
  {...props}
>
  <path fill="#fff" d="M10.668 9a1 1 0 1 0 2 0 1 1 0 0 0-2 0" />
  <path
    fill="#F1F3F6"
    d="M13.327 3.473a2.307 2.307 0 0 1 2.307 2.307v6.392a2.307 2.307 0 0 1-2.307 2.307H7.93a.71.71 0 0 1 0-1.42h5.396c.49 0 .887-.397.887-.887V5.78a.89.89 0 0 0-.887-.887H2.674a.89.89 0 0 0-.887.887v1.718a.71.71 0 0 1-1.42 0V5.78a2.31 2.31 0 0 1 2.307-2.307z"
  />
  <path
    stroke="#F1F3F6"
    strokeLinejoin="round"
    strokeWidth="{1.42}"
    d="M13.172 4.182v-.999a1.665 1.665 0 0 0-1.976-1.634L2.43 3.045a1.664 1.664 0 0 0-1.353 1.636v1.631"
  />
  <path
    fill="#F1F3F6"
    stroke="#F1F3F6"
    strokeWidth="{0.022}"
    d="M11.523 7.941a1.055 1.055 0 1 1 .206 2.088 1.055 1.055 0 0 1-.206-2.088Z"
  />
  <path
    stroke="#F1F3F6"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="{1.361}"
    d="M6.385 11.419H3.966m0 0H1.547m2.42 0v2.419m0-2.42V9"
  /></svg>); export default SvgAddWallet;
