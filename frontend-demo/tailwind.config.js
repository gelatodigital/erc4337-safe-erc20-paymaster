const flowbite = require("flowbite-react/tailwind");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js,jsx,ts,tsx}", flowbite.content()],
  plugins: [
    // ...
    flowbite.plugin(),
  ],
};
