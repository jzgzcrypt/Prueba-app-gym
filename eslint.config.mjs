import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  // Salida generada: no es codigo fuente y no se revisa.
  { ignores: [".next/**", "node_modules/**", "out/**", "next-env.d.ts", "repro-tmp.mjs"] },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    // Un import que falta NO rompe el build: webpack lo deja pasar y revienta
    // en el navegador, en el momento en que el usuario toca ese componente.
    // Fue exactamente lo que paso al pasar de dia: `claveDia is not defined`.
    // Los tests tampoco lo ven, porque no montan los componentes.
    // Esta regla es lo unico que lo detecta antes de desplegarlo.
    files: ["**/*.js", "**/*.jsx"],
    languageOptions: {
      globals: {
        window: "readonly", document: "readonly", navigator: "readonly",
        localStorage: "readonly", console: "readonly", process: "readonly",
        setTimeout: "readonly", clearTimeout: "readonly",
        setInterval: "readonly", clearInterval: "readonly",
        fetch: "readonly", Blob: "readonly", URL: "readonly",
        FileReader: "readonly", Image: "readonly", alert: "readonly",
        structuredClone: "readonly", requestAnimationFrame: "readonly",
      },
    },
    rules: { "no-undef": "error" },
  },
];

export default eslintConfig;
