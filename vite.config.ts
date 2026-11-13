import { handleCurrencies } from "./server/currencies";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import { handleApi } from "./server/api";
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [
      react(),
      {
        name: "local-finance-api",
        configureServer(server) {
          server.middlewares.use("/api/currencies", async (_req, res) => {
            const response = await handleCurrencies();
            res.statusCode = response.status;
            response.headers.forEach((v, k) => res.setHeader(k, v));
            res.end(await response.text());
          });
          server.middlewares.use("/api/data", async (req, res) => {
            try {
              const response = await handleApi(
                new Request("http://localhost/api/data" + (req.url ?? "")),
                env.BRAPI_API_KEY,
              );
              res.statusCode = response.status;
              response.headers.forEach((v, k) => res.setHeader(k, v));
              res.end(await response.text());
            } catch {
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json");
              res.end(
                JSON.stringify({
                  error: "Falha ao consultar os dados. Tente novamente.",
                }),
              );
            }
          });
        },
      },
    ],
    server: { port: 5173, strictPort: true },
  };
});
