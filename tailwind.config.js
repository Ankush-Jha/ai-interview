/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: "#0D9488",
                    light: "#14B8A6",
                    dark: "#0F766E",
                    50: "#F0FDFA",
                    100: "#CCFBF1",
                    200: "#99F6E4",
                    500: "#14B8A6",
                    600: "#0D9488",
                    700: "#0F766E",
                    900: "#134E4A",
                },
                background: {
                    light: "#F9FAFB",
                    dark: "#111827",
                },
                surface: {
                    light: "#FFFFFF",
                    dark: "#1E293B",
                    "dark-hover": "#334155",
                },
            },
            fontFamily: {
                display: ["Inter", "sans-serif"],
                mono: ["Fira Code", "Consolas", "Monaco", "monospace"],
            },
            borderRadius: {
                DEFAULT: "0.5rem",
                lg: "1rem",
                xl: "1.5rem",
            },
            boxShadow: {
                subtle: "0 1px 2px 0 rgba(13, 148, 136, 0.05)",
                card: "0 4px 6px -1px rgba(13, 148, 136, 0.05), 0 2px 4px -1px rgba(13, 148, 136, 0.03)",
                glow: "0 0 20px -5px rgba(13, 148, 136, 0.3)",
            },
        },
    },
    plugins: [
        require("@tailwindcss/forms"),
    ],
}
