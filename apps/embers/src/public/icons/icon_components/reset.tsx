import type { SVGProps } from "react";
const SvgReset = (props: SVGProps<SVGSVGElement>) => (
  <svg
    fill="none"
    height="{24}"
    width="{25}"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      clipRule="evenodd"
      d="M12.056 1.5c5.799 0 10.5 4.702 10.5 10.5s-4.701 10.5-10.5 10.5c-5.798 0-10.5-4.702-10.5-10.5s4.702-10.5 10.5-10.5"
      fill="#161E27"
      fillRule="evenodd"
    />
    <path
      d="m16.114 14.997-.003.001-.002-.002-.001.001-1.053 1.052-2.994-2.994 1.055-1.056zm0 0V15m0-.002-.002.001v.001h.003m-.001.004-.001-.001-.002-.001-.002.002.002.002zm0 0V15m0 .002L16.112 15h.003m0 0v-.002m0 .002L16.113 15l.002-.001m-4.064-1.944L9.056 16.05l-1.05-1.05L11 12.005zM16.105 9l-1.933 1.935-2.116 2.115-1.05-1.05 1.056-1.055 2.993-2.995zm-4.055 1.944L11 11.994 8.007 9.001l1.05-1.05z"
      fill="#93A4B7"
      stroke="#93A4B7"
      strokeWidth="{0.016}"
    />
  </svg>
);
export default SvgReset;
