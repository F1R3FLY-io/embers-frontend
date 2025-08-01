import type { SVGProps } from "react";
const SvgRegularExpression = (props: SVGProps<SVGSVGElement>) => (
  <svg
    fill="none"
    height="{25}"
    width="{25}"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="m16.605 14.166.228-3.526-2.952 1.977-1.222-2.15 3.18-1.55-3.18-1.55 1.222-2.15 2.952 1.978-.228-3.527h2.452l-.237 3.527 2.953-1.978 1.22 2.15-3.17 1.55 3.17 1.55-1.22 2.15-2.953-1.977.237 3.526zM2.235 21.333v-8.276h8.277v8.276z"
      fill="#F1F3F5"
    />
  </svg>
);
export default SvgRegularExpression;
