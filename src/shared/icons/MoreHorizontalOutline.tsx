import type { SVGProps } from "react";

export function MoreHorizontalOutline(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      {...props}
    >
      <g className="more-horizontal-outline">
        <path
          fill="currentColor"
          d="M6 12a2 2 0 1 1-4 0a2 2 0 0 1 4 0m8 0a2 2 0 1 1-4 0a2 2 0 0 1 4 0m8 0a2 2 0 1 1-4 0a2 2 0 0 1 4 0"
          className="Vector"
        ></path>
      </g>
    </svg>
  );
}
