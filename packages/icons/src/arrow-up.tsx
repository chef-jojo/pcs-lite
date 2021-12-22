import * as React from "react";
import { forwardRef } from "react";

const SvgArrowUp = (props, ref) => (
  <svg
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    width="1em"
    height="1em"
    ref={ref}
    {...props}
  >
    <path d="M13 19V7.83l4.88 4.88c.39.39 1.03.39 1.42 0a.996.996 0 0 0 0-1.41l-6.59-6.59a.996.996 0 0 0-1.41 0l-6.6 6.58a.996.996 0 1 0 1.41 1.41L11 7.83V19c0 .55.45 1 1 1s1-.45 1-1Z" />
  </svg>
);

const ForwardRef = forwardRef(SvgArrowUp);
export default ForwardRef;
