const { requireAuth } = require('../../_lib/auth');
const { getFile, putFile, deleteFile } = require('../../_lib/github');
const { renderPostPage } = require('../../_lib/render');

const POSTS_PATH = 'blog/posts.json';

async function readPosts() {
  const file = await getFile(POSTS_PATH);
  if (!file) return [];
  try {
    return JSON.parse(file.content);
  } catch {
    return [];
  }
}

async function writePosts(posts, message) {
  await putFile(POSTS_PATH, JSON.stringify(posts, null, 2), message);
}

module.exports = async (req, res) => {
  if (!requireAuth(req, res)) return;

  const { slug } = req.query;
  const posts = await readPosts();
  const idx = posts.findIndex((p) => p.slug === slug);

  if (req.method === 'GET') {
    if (idx === -1) {
      res.status(404).json({ error: 'Post não encontrado.' });
      return;
    }
    res.status(200).json({ post: posts[idx] });
    return;
  }

  if (req.method === 'PUT') {
    if (idx === -1) {
      res.status(404).json({ error: 'Post não encontrado.' });
      return;
    }
    let body = req.body;
    if (!body || typeof body === 'string') {
      try { body = JSON.parse(body || '{}'); } catch { body = {}; }
    }
    const { title, excerpt, coverImage, contentHtml, published, date } = body || {};

    const updated = {
      ...posts[idx],
      title: title !== undefined ? String(title).trim() : posts[idx].title,
      excerpt: excerpt !== undefined ? String(excerpt).trim() : posts[idx].excerpt,
      coverImage: coverImage !== undefined ? String(coverImage).trim() : posts[idx].coverImage,
      date: date || posts[idx].date,
      published: published !== undefined ? Boolean(published) : posts[idx].published,
      contentHtml: contentHtml !== undefined ? contentHtml : posts[idx].contentHtml,
      updatedAt: new Date().toISOString(),
    };
    posts[idx] = updated;
    await writePosts(posts, `Blog: atualiza post "${updated.title}"`);

    if (updated.published) {
      await putFile(`blog/${slug}.html`, renderPostPage(updated), `Blog: atualiza página "${updated.title}"`);
    } else {
      await deleteFile(`blog/${slug}.html`, `Blog: despublica "${updated.title}"`).catch(() => {});
    }

    res.status(200).json({ post: updated });
    return;
  }

  if (req.method === 'DELETE') {
    if (idx === -1) {
      res.status(404).json({ error: 'Post não encontrado.' });
      return;
    }
    const [removed] = posts.splice(idx, 1);
    await writePosts(posts, `Blog: remove post "${removed.title}"`);
    await deleteFile(`blog/${slug}.html`, `Blog: remove página "${removed.title}"`).catch(() => {});
    res.status(200).json({ ok: true });
    return;
  }

  res.status(405).json({ error: 'Método não permitido.' });
};
