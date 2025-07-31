import type { SVGProps } from "react";
const SvgGas = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="{16}"
    height="{16}"
    fill="none"
    {...props}
  >
    <path
      fill="#F1F3F5"
      d="M4.5 2a1.833 1.833 0 0 0-1.833 1.833v9.834H2.5a.5.5 0 1 0 0 1h9a.5.5 0 0 0 0-1h-.167v-1.202A1.83 1.83 0 0 0 14 10.837V6.945c0-.397-.129-.783-.367-1.1l-.733-.978a.5.5 0 0 0-.8.6l.733.978c.108.144.167.32.167.5v3.892a.83.83 0 0 1-1.66 0v-1.17a1 1 0 0 0-.007-.081V3.833A1.834 1.834 0 0 0 9.5 2zm.167 2.5a.5.5 0 0 1 .5-.5h3.666a.5.5 0 0 1 .5.5v2.333a.5.5 0 0 1-.5.5H5.167a.5.5 0 0 1-.5-.5z"
    />
  </svg>
);
export default SvgGas;
