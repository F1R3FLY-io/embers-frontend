import type { SVGProps } from "react";
const SvgStatus = (props: SVGProps<SVGSVGElement>) => (
  <svg
    fill="none"
    height="{24}"
    width="{25}"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <circle
      cx="{12.057}"
      cy="{12.216}"
      fill="#F1F3F5"
      r="{2.841}"
      stroke="#F1F3F5"
    />
  </svg>
);
export default SvgStatus;
