import bcrypt from "bcryptjs";
import { Admin, Settings } from "./index.js";

export async function seedAdminAndSettings() {
  const s = await Settings.findByPk(1);
  if (!s) {
    await Settings.create({
      id: 1,
      siteName: "DramaStream",
      logoUrl: "/public/logo.svg",
      theme: "dark",
      adsHeadScript: "",
      adsBodyTop: "",
      adsPlayerOverlayHtml: ""
    });
    console.log("Default settings created");
  }

  const username = process.env.ADMIN_USER || "admin";
  const existA = await Admin.findOne({ where: { username } });
  if (!existA) {
    const plain = process.env.ADMIN_PASS || "admin123";
    const hash = await bcrypt.hash(plain, 10);
    await Admin.create({ username, passwordHash: hash });
    console.log(`Default admin: ${username} / ${plain}`);
  }
}

// standalone: npm run seed
if (process.argv[1]?.endsWith("seed.js")) {
  (async () => {
    await seedAdminAndSettings();
    process.exit(0);
  })();
}
