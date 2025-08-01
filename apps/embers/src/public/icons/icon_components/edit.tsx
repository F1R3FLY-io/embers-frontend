import type { SVGProps } from "react";
const SvgEdit = (props: SVGProps<SVGSVGElement>) => (
  <svg
    fill="none"
    height="{17}"
    width="{17}"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      clipRule="evenodd"
      d="M11.585 2.027a.667.667 0 0 1 .942 0l2 2a.667.667 0 0 1 0 .943l-6 6a.67.67 0 0 1-.47.195h-2a.667.667 0 0 1-.668-.666v-2c0-.177.07-.347.196-.472zM6.723 8.775v1.057H7.78l5.334-5.333-1.058-1.058zm-4.667-5.61a.667.667 0 0 1 .667-.666h4.666a.667.667 0 1 1 0 1.333h-4v9.333h9.334v-4a.667.667 0 0 1 1.333 0v4.667a.667.667 0 0 1-.666.667H2.723a.667.667 0 0 1-.667-.667z"
      fill="#F1F3F5"
      fillRule="evenodd"
    />
  </svg>
);
export default SvgEdit;
