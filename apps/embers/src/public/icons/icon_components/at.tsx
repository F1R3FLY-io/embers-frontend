import type { SVGProps } from "react";
const SvgAt = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="{20}"
    height="{20}"
    fill="none"
    {...props}
  >
    <path
      fill="#F1F3F5"
      stroke="#F1F3F5"
      d="M10 2.125A7.875 7.875 0 0 1 17.875 10v1.256a2.433 2.433 0 0 1-4.443 1.366l-.346-.51-.428.445a3.688 3.688 0 1 1-.445-5.507l.133.1h1.342v4.106a1.757 1.757 0 0 0 3.512 0V10a7.2 7.2 0 1 0-7.736 7.18 7.2 7.2 0 0 0 4.103-.928l.376.564a7.83 7.83 0 0 1-3.942 1.059H10a7.875 7.875 0 1 1 0-15.75Zm0 4.862a3.012 3.012 0 1 0 .001 6.025A3.012 3.012 0 0 0 10 6.987Z"
    />
  </svg>
);
export default SvgAt;
