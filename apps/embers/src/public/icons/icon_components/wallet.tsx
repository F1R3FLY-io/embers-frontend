import type { SVGProps } from "react";
const SvgWallet = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="{24}"
    height="{25}"
    fill="none"
    {...props}
  >
    <path
      stroke="#F1F3F5"
      strokeLinejoin="round"
      strokeWidth="{2}"
      d="M19.357 7.625h-15a2.25 2.25 0 0 0-2.25 2.25v9a2.25 2.25 0 0 0 2.25 2.25h15a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25Z"
    />
    <path
      stroke="#F1F3F5"
      strokeLinejoin="round"
      strokeWidth="{2}"
      d="M19.14 7.624V6.218a2.345 2.345 0 0 0-2.783-2.302L4.012 6.023a2.344 2.344 0 0 0-1.905 2.304v2.297"
    />
    <path
      fill="#F1F3F5"
      stroke="#F1F3F5"
      strokeWidth="{0.031}"
      d="M16.817 12.919a1.49 1.49 0 0 1 1.524.632 1.484 1.484 0 1 1-1.524-.632Z"
    />
  </svg>
);
export default SvgWallet;
