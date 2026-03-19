import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.VITE_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Cloudinary signature endpoint (for secure client-side uploads)
  app.get("/api/cloudinary-signature", (req, res) => {
    try {
      const cloudName = process.env.VITE_CLOUDINARY_CLOUD_NAME?.trim();
      const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
      const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
      const uploadPreset = process.env.VITE_CLOUDINARY_UPLOAD_PRESET?.trim();

      const missing = [];
      if (!cloudName) missing.push("VITE_CLOUDINARY_CLOUD_NAME");
      if (!apiKey) missing.push("CLOUDINARY_API_KEY");
      if (!apiSecret) missing.push("CLOUDINARY_API_SECRET");
      if (!uploadPreset) missing.push("VITE_CLOUDINARY_UPLOAD_PRESET");

      if (missing.length > 0) {
        console.error(`Missing Cloudinary environment variables: ${missing.join(", ")}`);
        return res.status(500).json({ 
          error: `Cloudinary configuration is incomplete. Missing: ${missing.join(", ")}` 
        });
      }

      const timestamp = Math.round(new Date().getTime() / 1000);
      const signature = cloudinary.utils.api_sign_request(
        {
          timestamp: timestamp,
          upload_preset: uploadPreset,
        },
        apiSecret
      );

      res.json({
        signature,
        timestamp,
        cloud_name: cloudName,
        api_key: apiKey,
      });
    } catch (error) {
      console.error("Signature generation error:", error);
      res.status(500).json({ error: "Failed to generate upload signature." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
