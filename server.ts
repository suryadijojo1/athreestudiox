import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";

// Memory cache for OTPs: key is email, value is object with { code: string, expires: number }
const otpStore = new Map<string, { code: string; expires: number }>();

async function getTransporter() {
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = parseInt(process.env.SMTP_PORT || '587');

  if (smtpUser && smtpPass) {
    return nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
  } else {
    // Generate ethereal test mail setup if credentials are not configured
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for body parsing
  app.use(express.json());

  // API Route: Send OTP
  app.post("/api/send-otp", async (req, res) => {
    try {
      const targetEmail = "athreestudiojayapura@gmail.com";
      const code = Math.floor(100000 + Math.random() * 900000).toString();

      otpStore.set(targetEmail, {
        code,
        expires: Date.now() + 5 * 60 * 1000 // 5 minutes validity
      });

      const transporter = await getTransporter();

      const mailOptions = {
        from: '"AThree Studio Security" <noreply@athreestudio.com>',
        to: targetEmail,
        subject: "🔑 KODE OTP: Verifikasi Penyetelan Ulang Sistem AThree Studio",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #f8fafc;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h1 style="color: #4f46e5; margin: 0; font-size: 26px; font-weight: 850; letter-spacing: -0.5px;">AThree Studio Jayapura</h1>
              <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0; font-weight: bold; letter-spacing: 0.5px;">SISTEM KASIR & MANAJEMEN NOTA STOK</p>
            </div>
            <div style="background-color: #ffffff; padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);">
              <h2 style="font-size: 16px; font-weight: 800; color: #0f172a; margin-top: 0; text-transform: uppercase; letter-spacing: 0.5px;">Permintaan Penyetelan Ulang Sistem</h2>
              <p style="color: #334155; font-size: 14px; line-height: 1.5; margin-bottom: 20px;">
                Sistem mendeteksi adanya permintaan untuk melakukan <strong>hard-reset / penyetelan ulang seluruh basis data</strong> kembali ke data default awal. Tindakan ini bersifat permanen dan akan menghapus seluruh data transaksi, invoice, stok produk, serta pembayaran.
              </p>
              <div style="background-color: #f5f3ff; border: 2px dashed #c7d2fe; padding: 18px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
                <span style="font-size: 11px; font-weight: 850; color: #4f46e5; text-transform: uppercase; letter-spacing: 1.5px; display: block; margin-bottom: 8px;">KODE OTP TRANSAKSI RESET</span>
                <strong style="font-size: 34px; font-weight: 950; color: #1e1b4b; letter-spacing: 6px; font-family: monospace;">${code}</strong>
              </div>
              <p style="color: #64748b; font-size: 12px; line-height: 1.4; margin-bottom: 0;">
                * Kode OTP di atas berumur pendek dan kedaluwarsa dalam <strong>5 menit</strong>. Jangan membagikan kode OTP ini demi menjaga integritas data bisnis Anda.
              </p>
            </div>
            <div style="text-align: center; margin-top: 24px; color: #94a3b8; font-size: 11px; font-weight: bold;">
              Keamanan Terpadu AThree Studio Jayapura &copy; 2026
            </div>
          </div>
        `
      };

      const info = await transporter.sendMail(mailOptions);
      // Retrieve the ethereal preview URL if generated dynamically
      const testPreviewUrl = nodemailer.getTestMessageUrl(info);

      res.json({
        success: true,
        message: "OTP successfully requested and simulated/sent to athreestudiojayapura@gmail.com",
        testPreviewUrl: testPreviewUrl || null
      });
    } catch (error: any) {
      console.error("Nodemailer routing failure:", error);
      res.status(500).json({
        success: false,
        message: "Gagal mengirimkan OTP ke email tujuan: " + error.message
      });
    }
  });

  // API Route: Verify OTP
  app.post("/api/verify-otp", (req, res) => {
    const { code } = req.body;
    const targetEmail = "athreestudiojayapura@gmail.com";

    const stored = otpStore.get(targetEmail);
    if (!stored) {
      return res.status(400).json({
        success: false,
        message: "OTP kedaluwarsa atau belum diminta sama sekali. Silakan kirim ulang OTP."
      });
    }

    if (Date.now() > stored.expires) {
      otpStore.delete(targetEmail);
      return res.status(400).json({
        success: false,
        message: "OTP tersebut telah kedaluwarsa (melampaui 5 menit)!"
      });
    }

    if (stored.code === code) {
      otpStore.delete(targetEmail); // burn on success
      return res.json({
        success: true,
        message: "OTP Berhasil Diverifikasi! Otoritas reset disetujui."
      });
    }

    res.status(400).json({
      success: false,
      message: "Kode OTP yang Anda masukkan salah. Silakan periksa kembali kotak masuk email Anda."
    });
  });

  // Vite middleware injection for serving frontend React elements in dev vs production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server successfully started, listening on http://localhost:${PORT}`);
  });
}

startServer();
