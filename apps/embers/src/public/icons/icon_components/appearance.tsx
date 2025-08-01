import type { SVGProps } from "react";
const SvgAppearance = (props: SVGProps<SVGSVGElement>) => (
  <svg
    fill="none"
    height="{24}"
    width="{24}"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <g clipPath="url(#Appearance_svg__a)">
      <g clipPath="url(#Appearance_svg__b)">
        <path
          d="M9.205 3.5h8.727a2.774 2.774 0 0 1 2.773 2.772v2.182a2.774 2.774 0 0 1-2.773 2.773H9.205a2.774 2.774 0 0 1-2.773-2.773v-.5H4.84A1.59 1.59 0 0 0 3.25 9.546v3.272a1.59 1.59 0 0 0 1.59 1.591h6.547a2.77 2.77 0 0 1 2.772 2.773v1.59h.5a1.683 1.683 0 0 1 1.682 1.682v4.364a1.68 1.68 0 0 1-1.682 1.682h-2.182a1.68 1.68 0 0 1-1.681-1.682v-4.364a1.68 1.68 0 0 1 1.681-1.681h.5v-1.591a1.59 1.59 0 0 0-1.59-1.591H4.84a2.77 2.77 0 0 1-2.773-2.773V9.546a2.774 2.774 0 0 1 2.773-2.774h1.59v-.5A2.773 2.773 0 0 1 9.206 3.5Zm2.772 21.818h3.182v-5.364h-3.182zM9.205 4.682a1.59 1.59 0 0 0-1.59 1.59v2.182a1.59 1.59 0 0 0 1.59 1.592h8.727a1.59 1.59 0 0 0 1.59-1.592V6.272a1.59 1.59 0 0 0-1.59-1.59z"
          fill="#F1F3F5"
          stroke="#F1F3F5"
        />
      </g>
    </g>
    <defs>
      <clipPath id="Appearance_svg__a">
        <path d="M0 0h24v24H0z" fill="#fff" />
      </clipPath>
      <clipPath id="Appearance_svg__b">
        <path d="M0 0h24v24H0z" fill="#fff" />
      </clipPath>
    </defs>
  </svg>
);
export default SvgAppearance;
