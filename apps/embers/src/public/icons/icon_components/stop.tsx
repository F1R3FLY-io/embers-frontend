import type { SVGProps } from "react";
const SvgStop = (props: SVGProps<SVGSVGElement>) => (
  <svg
    fill="none"
    height="{24}"
    width="{24}"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M16.667 5.5c.508 0 .93.176 1.295.54s.539.786.538 1.293v9.334c0 .508-.175.93-.54 1.295a1.74 1.74 0 0 1-1.293.538H7.333c-.508 0-.93-.175-1.293-.538a1.74 1.74 0 0 1-.531-1.108l-.009-.188V7.333c0-.508.175-.93.54-1.293a1.74 1.74 0 0 1 1.107-.531l.187-.009zM6.833 17.167h10.334V6.833H6.833z"
      fill="#F1F3F5"
      stroke="#F1F3F5"
    />
  </svg>
);
export default SvgStop;
