export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { filename, data } = req.body;

    if (!filename || !data) {
      return res.status(400).json({ success: false, error: '缺少檔案名稱或資料' });
    }

    const base64Data = data.replace(/^data:image\/\w+;base64,/, '');
    const uniqueFilename = `${Date.now()}-${filename}`;
    
    const owner = process.env.GITHUB_OWNER || 'pengpinxin';
    const repo = process.env.GITHUB_REPO || 'pinxin-web';
    const token = process.env.GITHUB_TOKEN;

    if (!token) {
      return res.status(500).json({ success: false, error: '伺服器未設定 GITHUB_TOKEN' });
    }

    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${uniqueFilename}`;

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'User-Agent': 'Vercel-Upload-App'
      },
      body: JSON.stringify({
        message: `Upload new artwork: ${uniqueFilename}`,
        content: base64Data,
        branch: 'main'
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'GitHub 上傳失敗');
    }

    return res.status(200).json({
      success: true,
      url: uniqueFilename
    });

  } catch (error) {
    console.error('上傳失敗:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
