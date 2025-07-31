import type { SVGProps } from "react";
const SvgSort = (props: SVGProps<SVGSVGElement>) => (
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="{20}"
  height="{20}"
  fill="none"
  {...props}
>
  <path
    fill="#F1F3F5"
    d="M3.333 15h3.334a.836.836 0 0 0 .833-.833.836.836 0 0 0-.833-.834H3.333a.836.836 0 0 0-.833.834c0 .458.375.833.833.833M2.5 5.833c0 .459.375.834.833.834h13.334a.836.836 0 0 0 .833-.834.836.836 0 0 0-.833-.833H3.333a.836.836 0 0 0-.833.833m.833 5h8.334A.836.836 0 0 0 12.5 10a.836.836 0 0 0-.833-.833H3.333A.836.836 0 0 0 2.5 10c0 .458.375.833.833.833"
  /></svg>); export default SvgSort;
