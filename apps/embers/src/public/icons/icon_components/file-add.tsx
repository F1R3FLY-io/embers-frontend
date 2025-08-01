import type { SVGProps } from "react";
const SvgFileAdd = (props: SVGProps<SVGSVGElement>) => (
  <svg
    fill="none"
    height="{25}"
    width="{24}"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M12 18.5v-3m0 0v-3m0 3H9m3 0h3m-2-12H8.2c-1.12 0-1.68 0-2.108.218a2 2 0 0 0-.874.874C5 5.02 5 5.58 5 6.7v11.6c0 1.12 0 1.68.218 2.108a2 2 0 0 0 .874.874c.427.218.987.218 2.105.218h7.606c1.118 0 1.677 0 2.104-.218.377-.192.683-.498.875-.874.218-.428.218-.986.218-2.104V9.5m-6-6c.286.003.466.014.639.055q.308.075.578.24c.202.124.375.297.72.643l3.126 3.125c.346.346.518.518.642.72q.165.27.24.578c.04.173.052.354.055.639m-6-6v2.8c0 1.12 0 1.68.218 2.108a2 2 0 0 0 .874.874c.427.218.987.218 2.105.218H19"
      stroke="#F1F3F5"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="{2}"
    />
  </svg>
);
export default SvgFileAdd;
