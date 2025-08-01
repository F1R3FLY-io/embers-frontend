import type { SVGProps } from "react";
const SvgPasskey = (props: SVGProps<SVGSVGElement>) => (
  <svg
    fill="none"
    height="{17}"
    width="{16}"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <g clipPath="url(#_Passkey__svg__a)">
      <path
        d="M4.5 8.03h5.825a3.2 3.2 0 0 0 .961 1.83v3.216c-.83.58-1.94.953-3.286.953-3.14 0-5-2.029-5-4v-.5a1.5 1.5 0 0 1 1.5-1.5M8 1.53a2.75 2.75 0 1 1 0 5.5 2.75 2.75 0 0 1 0-5.5m6.241 8.387A2.501 2.501 0 1 0 12 9.53v3.858c0 .091.035.18.097.245l1.166 1.24c.137.144.366.15.509.01l1.166-1.13a.357.357 0 0 0 .033-.476L14 12.03l.9-.77a.357.357 0 0 0 .042-.5zm.009-3.138a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0"
        fill="#F1F3F5"
      />
    </g>
    <defs>
      <clipPath id="_Passkey__svg__a">
        <path d="M0 .03h16v16H0z" fill="#fff" />
      </clipPath>
    </defs>
  </svg>
);
export default SvgPasskey;
