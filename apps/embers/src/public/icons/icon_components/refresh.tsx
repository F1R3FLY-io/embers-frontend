import type { SVGProps } from "react";
const SvgRefresh = (props: SVGProps<SVGSVGElement>) => (
  <svg
    fill="none"
    height="{25}"
    width="{24}"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M20 20.5v-5h-5M4 4.5v5h5m10.938 2a8.001 8.001 0 0 0-14.868-3m-1.008 5a8.001 8.001 0 0 0 14.868 3"
      stroke="#F1F3F5"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="{2}"
    />
  </svg>
);
export default SvgRefresh;
