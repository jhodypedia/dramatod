import { Sequelize, DataTypes } from "sequelize";

export const sequelize = new Sequelize(
  process.env.MYSQL_DB || "drama",
  process.env.MYSQL_USER || "root",
  process.env.MYSQL_PASS || "",
  {
    host: process.env.MYSQL_HOST || "localhost",
    dialect: "mysql",
    logging: false
  }
);

export const Settings = sequelize.define("settings", {
  id: { type: DataTypes.INTEGER, primaryKey: true, defaultValue: 1 },
  siteName: DataTypes.STRING,
  logoUrl: DataTypes.STRING,
  theme: DataTypes.STRING,
  adsHeadScript: DataTypes.TEXT,
  adsBodyTop: DataTypes.TEXT,
  adsPlayerOverlayHtml: DataTypes.TEXT
}, { timestamps: false });

export const Admin = sequelize.define("admins", {
  username: { type: DataTypes.STRING, unique: true },
  passwordHash: DataTypes.STRING
});

export const Stats = sequelize.define("stats", {
  date: { type: DataTypes.DATEONLY, unique: true },
  visitors: { type: DataTypes.INTEGER, defaultValue: 0 },
  pageviews: { type: DataTypes.INTEGER, defaultValue: 0 },
  adClicks: { type: DataTypes.INTEGER, defaultValue: 0 }
});

export async function initDb() {
  await sequelize.authenticate();
  await sequelize.sync();
}
