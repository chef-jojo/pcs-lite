import * as React from "react";
import { forwardRef } from "react";

const SvgCheckmarkCircleFill = (props, ref) => (
  <svg
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    width="1em"
    height="1em"
    ref={ref}
    {...props}
  >
    <path
      fill="currentColor"
      d="M12 2.757c-5.52 0-10 4.48-10 10s4.48 10 10 10 10-4.48 10-10-4.48-10-10-10Zm-2.71 14.29-3.59-3.59a.996.996 0 1 1 1.41-1.41l2.89 2.88 6.88-6.88a.996.996 0 1 1 1.41 1.41l-7.59 7.59a.996.996 0 0 1-1.41 0Z"
    />
  </svg>
);

const ForwardRef = forwardRef(SvgCheckmarkCircleFill);
export default ForwardRef;
