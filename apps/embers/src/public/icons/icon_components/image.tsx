import type { SVGProps } from "react";
const SvgImage = (props: SVGProps<SVGSVGElement>) => (
  <svg
    fill="none"
    height="{17}"
    width="{17}"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <g clipPath="url(#_Image__svg__a)">
      <path
        d="M12.984 1.414c1.191 0 2.157.967 2.157 2.158v9.855a2.16 2.16 0 0 1-2.157 2.157H3.129a2.16 2.16 0 0 1-2.158-2.157V3.572c0-1.191.967-2.158 2.158-2.158zm-1.76 7.363a.66.66 0 0 0-.465.193l-5.114 5.114h7.339a.66.66 0 0 0 .657-.657V10.92L11.69 8.97a.66.66 0 0 0-.465-.193M3.13 2.914a.66.66 0 0 0-.658.658v9.855c0 .363.295.657.658.657h.395l6.175-6.175.158-.143a2.16 2.16 0 0 1 2.893.143l.891.89V3.573a.66.66 0 0 0-.657-.658zM5.945 4.23a2.158 2.158 0 1 1-.002 4.317 2.158 2.158 0 0 1 .002-4.317m0 1.5a.659.659 0 1 0 0 1.318.659.659 0 0 0 0-1.318"
        fill="#F1F3F5"
      />
    </g>
    <defs>
      <clipPath id="_Image__svg__a">
        <path d="M.056.5h16v16h-16z" fill="#fff" />
      </clipPath>
    </defs>
  </svg>
);
export default SvgImage;
