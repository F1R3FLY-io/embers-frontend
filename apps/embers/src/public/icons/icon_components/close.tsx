import type { SVGProps } from "react";
const SvgClose = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="{17}"
    height="{16}"
    fill="none"
    {...props}
  >
    <path
      fill="#93A4B7"
      stroke="#93A4B7"
      strokeWidth="{0.016}"
      d="m12.113 10.997-.003.001-.002-.002v.001l-1.054 1.052L8.06 9.055l1.055-1.056zm0 0 .001.002m-.001-.002-.002.001.001.001h.002m-.001.004v-.001l-.003-.001-.002.002.002.002zm0 0 .001-.002m-.001.002L12.111 11h.003m0 0v-.002m0 .002L12.112 11l.002-.001M8.051 9.055 5.055 12.05l-1.05-1.05L7 8.005zM12.104 5l-1.932 1.935L8.055 9.05 7.005 8l1.056-1.055 2.993-2.995zM8.05 6.944 7 7.994 4.007 5.001l1.05-1.05z"
    />
  </svg>
);
export default SvgClose;
