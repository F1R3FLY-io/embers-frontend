import type { SVGProps } from "react";
const SvgEditBig = (props: SVGProps<SVGSVGElement>) => (
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="{20}"
  height="{20}"
  fill="none"
  {...props}
>
  <path
    stroke="#F1F3F5"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="{2}"
    d="M11.877 15.96h4.059m-11.43-3.168a1.51 1.51 0 0 0-.442 1.069v2.125h2.14c.4 0 .784-.159 1.068-.443l8.221-8.326a1.513 1.513 0 0 0 0-2.137l-.623-.623a1.51 1.51 0 0 0-2.138 0z"
  /></svg>); export default SvgEditBig;
