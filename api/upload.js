export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { filename, data } = req.body;

    if (!filename || !data) {
      return res.status(400).json({ success: false, error: 'Missing filename or data' });
    }

    const base64Data = data.replace(/^data:image\/\w+;base64,/, '');
    const octokit = new (await import("@octokit/rest")).Octokit({
      auth: process.env.GITHUB_TOKEN,
    });

    const response = await octokit.repos.createOrUpdateFileContents({
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      path: filename,
      message: 'Upload image via web interface',
      content: base64Data,
      branch: process.env.GITHUB_BRANCH || 'pengpinxin-patch-1',
    });

    return res.status(200).json({ success: true, data: response.data });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
