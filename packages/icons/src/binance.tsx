import * as React from "react";
import { forwardRef } from "react";

const SvgBinance = (props, ref) => (
  <svg
    viewBox="0 0 16 16"
    width="1em"
    xmlns="http://www.w3.org/2000/svg"
    height="1em"
    ref={ref}
    {...props}
  >
    <circle cx={8} cy={8} r={8} fill="#F0B90B" />
    <path
      d="M5.017 8 3.793 9.233 2.56 8l1.233-1.232L5.017 8ZM8 5.017l2.108 2.108 1.233-1.233-2.108-2.1L8 2.56 6.768 3.793l-2.1 2.1 1.233 1.232L8 5.017Zm4.208 1.75L10.984 8l1.232 1.233L13.44 8l-1.232-1.232ZM8 10.985 5.892 8.876l-1.224 1.232 2.108 2.108L8 13.44l1.233-1.232L11.34 10.1l-1.233-1.224L8 10.984Zm0-1.751L9.233 8 8 6.768 6.768 8 8 9.233Z"
      fill="#FFFDFA"
    />
  </svg>
);

const ForwardRef = forwardRef(SvgBinance);
export default ForwardRef;
