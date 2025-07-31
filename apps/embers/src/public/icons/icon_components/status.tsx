import type { SVGProps } from "react";
const SvgStatus = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="{25}"
    height="{24}"
    fill="none"
    {...props}
  >
    <circle
      cx="{12.057}"
      cy="{12.216}"
      r="{2.841}"
      fill="#F1F3F5"
      stroke="#F1F3F5"
    />
  </svg>
);
export default SvgStatus;
