const withTM = require('next-transpile-modules')([
  '@pcs/ui',
  '@pcs/icons',
]);

/** @type {import('next').NextConfig} */
module.exports = withTM({
  reactStrictMode: true,
});
