import * as React from "react";
import { forwardRef } from "react";

const SvgSmallPancake = (props, ref) => (
  <svg
    viewBox="0 0 128 128"
    xmlns="http://www.w3.org/2000/svg"
    width="1em"
    height="1em"
    ref={ref}
    {...props}
  >
    <svg
      width="1em"
      height="1em"
      viewBox="0 0 128 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      ref={ref}
      {...props}
    >
      <path
        d="M56.72 37.586c0 7.796 1.307 16.53 3.57 23.273 1.135 3.378 2.48 6.17 3.959 8.087 1.493 1.937 2.942 2.764 4.282 2.764 2.66 0 5.885-1.18 9.307-3.358 3.397-2.162 6.862-5.229 9.975-8.804 6.271-7.204 10.865-16.179 10.865-23.606 0-7.777-1.521-14.678-4.685-19.588-3.114-4.832-7.857-7.811-14.637-7.811-6.755 0-12.373 3.373-16.349 8.713-3.99 5.36-6.287 12.67-6.287 20.33Z"
        fill="#FEDC90"
        stroke="#D1884F"
        strokeWidth={2.891}
      />
      <path
        d="M32.744 66.786c6.692-3.864 14.514-6.265 21.101-6.86 3.296-.299 6.211-.138 8.491.467 2.293.61 3.772 1.619 4.5 2.881 2.776 4.806 3.107 13.212.914 21.576-2.184 8.333-6.742 16.107-13.143 19.803-6.664 3.847-13.657 5.532-19.778 4.801-6.076-.725-11.353-3.828-14.756-9.722-3.407-5.901-3.537-12.18-1.197-17.957 2.352-5.81 7.226-11.154 13.868-14.99Z"
        fill="#D1884F"
        stroke="#633001"
        strokeWidth={2.891}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M73.612 7.76c-4.197 1.105-8.791 3.327-12.372 8.396-7.96 11.267-9.54 25.803-2.69 44.583 6.848 18.779 4.793 29.185-2.501 37.58-7.295 8.395-26.574 10.366-32.7 3.61-1.5-1.655-5.854-4.47-2.982.611 2.873 5.082 10.386 9.208 19.223 9.208s16.004-3.602 22.368-10.41c6.364-6.807 12.334-22.95 6.369-39.567-7.694-21.432-5.496-34.263-.038-41.99 2.799-3.961 7.256-7.418 10.319-9.194 3.215-1.865 6.272-2.164 8.26-2.164-3.535-1.768-9.058-1.768-13.256-.663Z"
        fill="#633001"
      />
    </svg>
  </svg>
);

const ForwardRef = forwardRef(SvgSmallPancake);
export default ForwardRef;
