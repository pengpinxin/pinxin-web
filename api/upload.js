import { google } from 'googleapis';
import { Readable } from 'stream';

// 放大 Next.js 預設的傳輸大小限制（避免大圖片上傳失敗）
export const config = {
    api: {
        bodyParser: {
            sizeLimit: '10mb',
        },
    },
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        let bodyData = req.body;
        if (typeof bodyData === 'string') {
            bodyData = JSON.parse(bodyData);
        }

        const { filename, data, mimeType } = bodyData;
        if (!data) {
            return res.status(400).json({ success: false, error: 'No image data provided' });
        }

        const base64Data = data.split(';base64,').pop();
        const buffer = Buffer.from(base64Data, 'base64');

        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: process.env.GOOGLE_CLIENT_EMAIL,
                private_key: process.env.GOOGLE_PRIVATE_KEY ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
            },
            scopes: ['https://www.googleapis.com/auth/drive.file'],
        });

        const drive = google.drive({ version: 'v3', auth });

        const bufferStream = new Readable();
        bufferStream.push(buffer);
        bufferStream.push(null);

        const response = await drive.files.create({
            requestBody: {
                name: filename || 'art_upload.jpg',
                parents: process.env.GOOGLE_DRIVE_FOLDER_ID ? [process.env.GOOGLE_DRIVE_FOLDER_ID] : [],
            },
            media: {
                mimeType: mimeType || 'image/jpeg',
                body: bufferStream,
            },
            fields: 'id',
        });

        const fileId = response.data.id;

        await drive.permissions.create({
            fileId: fileId,
            requestBody: {
                role: 'reader',
                type: 'anyone',
            },
        });

        const fileUrl = `https://lh3.googleusercontent.com/d/${fileId}`;

        return res.status(200).json({ success: true, url: fileUrl });
    } catch (err) {
        console.error('Google Drive Upload Error:', err);
        return res.status(500).json({ success: false, error: err.message });
    }
}
