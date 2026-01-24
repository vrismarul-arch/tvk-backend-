import { google } from "googleapis";
import { Readable } from "stream";
import path from "path";

const keyPath = path.resolve("service-account.json");

console.log("USING KEY FILE:", keyPath);

const auth = new google.auth.GoogleAuth({
  keyFile: keyPath,
  scopes: ["https://www.googleapis.com/auth/drive"],
});

const drive = google.drive({ version: "v3", auth });

export const uploadToDrive = async (file) => {
  const stream = new Readable();
  stream.push(file.buffer);
  stream.push(null);

  const res = await drive.files.create({
    requestBody: {
      name: Date.now() + "-" + file.originalname,
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
    },
    media: {
      mimeType: file.mimetype,
      body: stream,
    },
  });

  await drive.permissions.create({
    fileId: res.data.id,
    requestBody: { role: "reader", type: "anyone" },
  });

  return `https://drive.google.com/uc?id=${res.data.id}`;
};
