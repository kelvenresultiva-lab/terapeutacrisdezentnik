const { requireAuth } = require('../_lib/auth');
const { getFile, putFile } = require('../_lib/github');
const { slugify, renderPostPage } = require('../_lib/render');

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

function uniqueSlug(base, posts) {
  let slug = base;
  let i = 2;
  while (posts.some((p) => p.slug === slug)) {
    slug = `${base}-${i}`;
    i += 1;
  }
  return slug;
}

module.exports = async (req, res) => {
  if (!requireAuth(req, res)) return;

  if (req.method === 'GET') {
    const posts = await readPosts();
    posts.sort((a, b) => (a.date < b.date ? 1 : -1));
    res.status(200).json({ posts });
    return;
  }

  if (req.method === 'POST') {
    let body = req.body;
    if (!body || typeof body === 'string') {
      try { body = JSON.parse(body || '{}'); } catch { body = {}; }
    }
    const { title, excerpt, coverImage, contentHtml, published, date } = body || {};
    if (!title || !String(title).trim()) {
      res.status(400).json({ error: 'Título é obrigatório.' });
      return;
    }

    const posts = await readPosts();
    const slug = uniqueSlug(slugify(title), posts);
    const post = {
      slug,
      title: String(title).trim(),
      excerpt: excerpt ? String(excerpt).trim() : '',
      coverImage: coverImage ? String(coverImage).trim() : '',
      date: date || new Date().toISOString().slice(0, 10),
      published: Boolean(published),
      contentHtml: contentHtml || '',
      createdAt: new Date().toISOString(),
    };

    posts.push(post);
    await writePosts(posts, `Blog: cria post "${post.title}"`);

    if (post.published) {
      await putFile(`blog/${slug}.html`, renderPostPage(post), `Blog: publica página "${post.title}"`);
    }

    res.status(201).json({ post });
    return;
  }

  res.status(405).json({ error: 'Método não permitido.' });
};
