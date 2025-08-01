import type { SVGProps } from "react";
const SvgFolderAdd = (props: SVGProps<SVGSVGElement>) => (
  <svg
    fill="none"
    height="{24}"
    width="{25}"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M12.955 11v4m-2-2h4m-11 4V5h7l2 2h9v10a2 2 0 0 1-2 2h-14a2 2 0 0 1-2-2"
      stroke="#F1F3F5"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="{2}"
    />
  </svg>
);
export default SvgFolderAdd;
