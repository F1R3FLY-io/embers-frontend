import type { SVGProps } from "react";
const SvgCalendar = (props: SVGProps<SVGSVGElement>) => (
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="{21}"
  height="{20}"
  fill="none"
  {...props}
>
  <path
    fill="#F1F3F5"
    d="M13.61 2h5.334v16h-16V2H13.61M8.278 3.778H4.722v1.778h12.444V3.778zM4.722 7.333v8.89h12.444v-8.89zM6.499 10a.889.889 0 1 1 1.778 0A.889.889 0 0 1 6.5 10m5.334 0a.889.889 0 1 0-1.778 0 .889.889 0 0 0 1.778 0m1.777 0a.889.889 0 1 1 1.778 0 .889.889 0 0 1-1.777 0m-5.333 3.556a.889.889 0 1 0-1.778 0 .889.889 0 0 0 1.778 0m1.778 0a.889.889 0 1 1 1.778 0 .889.889 0 0 1-1.778 0"
  /></svg>); export default SvgCalendar;
