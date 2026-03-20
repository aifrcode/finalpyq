import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

// Sanitize CLOUDINARY_URL before the SDK uses it
if (process.env.CLOUDINARY_URL) {
  const url = process.env.CLOUDINARY_URL.trim().replace(/^["']|["']$/g, "");
  if (url && !url.startsWith("cloudinary://")) {
    console.warn("Warning: CLOUDINARY_URL does not start with 'cloudinary://'. Removing it to prevent SDK errors.");
    delete process.env.CLOUDINARY_URL;
  } else {
    process.env.CLOUDINARY_URL = url;
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cloudinary config
const cloudinaryConfig: any = {
  cloud_name: process.env.VITE_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
};

// If CLOUDINARY_URL is present and valid, the SDK will pick it up.
// If it's invalid, we've already sanitized/deleted it above to prevent crashes.
try {
  cloudinary.config(cloudinaryConfig);
} catch (e) {
  console.error("Cloudinary config error:", e);
}

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
      let cloudName = (process.env.VITE_CLOUDINARY_CLOUD_NAME || "").trim();
      let apiKey = (process.env.CLOUDINARY_API_KEY || "").trim();
      let apiSecret = (process.env.CLOUDINARY_API_SECRET || "").trim();
      const uploadPreset = (process.env.VITE_CLOUDINARY_UPLOAD_PRESET || "").trim();

      // Fallback to CLOUDINARY_URL if individual keys are missing
      const cloudinaryUrl = process.env.CLOUDINARY_URL;
      if (cloudinaryUrl && (!cloudName || !apiKey || !apiSecret)) {
        // More robust parsing: cloudinary://key:secret@name
        try {
          const urlStr = cloudinaryUrl.trim().replace(/^["']|["']$/g, "");
          if (urlStr.startsWith("cloudinary://")) {
            const authAndName = urlStr.slice(13); // remove 'cloudinary://'
            const [auth, name] = authAndName.split("@");
            if (auth && name) {
              const [key, secret] = auth.split(":");
              if (!apiKey) apiKey = key;
              if (!apiSecret) apiSecret = secret;
              if (!cloudName) cloudName = name;
            }
          }
        } catch (e) {
          console.error("Error parsing CLOUDINARY_URL:", e);
        }
      }

      const missing = [];
      if (!cloudName || cloudName.includes("<")) missing.push("VITE_CLOUDINARY_CLOUD_NAME (or cloud name in CLOUDINARY_URL)");
      if (!apiKey || apiKey.includes("<")) missing.push("CLOUDINARY_API_KEY (or api key in CLOUDINARY_URL)");
      if (!apiSecret || apiSecret.includes("<")) missing.push("CLOUDINARY_API_SECRET (or api secret in CLOUDINARY_URL)");
      if (!uploadPreset) missing.push("VITE_CLOUDINARY_UPLOAD_PRESET");

      if (missing.length > 0) {
        console.error("Cloudinary config missing or invalid keys:", missing);
        return res.status(500).json({ 
          error: `Cloudinary configuration is incomplete or contains placeholders. Missing: ${missing.join(", ")}. Please check your AI Studio Secrets.` 
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
        upload_preset: uploadPreset
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
