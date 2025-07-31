import type { SVGProps } from "react";
const SvgPrivacy = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="{24}"
    height="{24}"
    fill="none"
    {...props}
  >
    <path
      stroke="#F1F3F5"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="{2}"
      d="M12 15v2.4m-4.8-7.2V7.8a4.8 4.8 0 1 1 9.6 0v2.4M6 21h12a1.2 1.2 0 0 0 1.2-1.2v-8.4a1.2 1.2 0 0 0-1.2-1.2H6a1.2 1.2 0 0 0-1.2 1.2v8.4A1.2 1.2 0 0 0 6 21"
    />
  </svg>
);
export default SvgPrivacy;
