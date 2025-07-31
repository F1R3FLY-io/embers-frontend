import type { SVGProps } from "react";
const SvgRefresh = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="{24}"
    height="{25}"
    fill="none"
    {...props}
  >
    <path
      stroke="#F1F3F5"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="{2}"
      d="M20 20.5v-5h-5M4 4.5v5h5m10.938 2a8.001 8.001 0 0 0-14.868-3m-1.008 5a8.001 8.001 0 0 0 14.868 3"
    />
  </svg>
);
export default SvgRefresh;
