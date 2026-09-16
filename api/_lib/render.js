const DIACRITICS_RE = /[̀-ͯ]/g;

function slugify(text) {
  return String(text)
    .normalize('NFD').replace(DIACRITICS_RE, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80) || 'post';
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDatePtBr(dateStr) {
  try {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function renderPostPage(post) {
  const title = escapeHtml(post.title);
  const desc = escapeHtml(post.excerpt || '');
  const dateFmt = formatDatePtBr(post.date);
  const cover = post.coverImage
    ? `<img src="${escapeHtml(post.coverImage)}" alt="${title}" class="jb-post-cover"/>`
    : '';

  return `<!DOCTYPE html>
<html lang="pt-BR"><head>
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=AW-18441041326"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'AW-18441041326');
</script>
<!-- Event snippet for Contato (1) conversion page, fired on click of any WhatsApp button -->
<script>
document.addEventListener('click', function(e) {
  var link = e.target.closest('a[href*="api.whatsapp.com"]');
  if (link) {
    gtag('event', 'conversion', {
        'send_to': 'AW-18441041326/PX_OCObYl_McEK7rr9lE',
        'value': 1.0,
        'currency': 'BRL'
    });
  }
});
</script>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1" name="viewport"/>
<meta content="index, follow" name="robots"/>
<title>${title} | Blog João Batista de Sá</title>
<meta content="${desc}" name="description"/>
<meta content="pt_BR" property="og:locale"/>
<meta content="article" property="og:type"/>
<meta content="${title}" property="og:title"/>
<meta content="${desc}" property="og:description"/>
<meta content="João Batista de Sá - Psicólogo" property="og:site_name"/>
${post.coverImage ? `<meta content="${escapeHtml(post.coverImage)}" property="og:image"/>` : ''}
<link href="/assets/joao-logo-bj.png" rel="icon" sizes="32x32"/>
<link href="/assets/782b342f846f2900_dxs1xze.css" media="all" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Raleway:wght@400;500;600;700&display=swap" rel="stylesheet"/>
<link href="/blog/blog.css" rel="stylesheet"/>
</head>
<body class="jb-blog-body">
<header class="jb-blog-header">
<a href="/" class="jb-blog-logo"><img src="/assets/joao-logo-header.png" alt="João Batista de Sá - Psicólogo"/> João Batista de Sá</a>
<a href="/" class="jb-blog-back">← Voltar ao site</a>
</header>
<main class="jb-blog-main">
<article class="jb-post">
${cover}
<p class="jb-post-date">${dateFmt}</p>
<h1 class="jb-post-title">${title}</h1>
<div class="jb-post-content">${post.contentHtml || ''}</div>
<div class="jb-post-cta">
<p>Quer conversar sobre o que leu aqui?</p>
<a class="jb-post-cta-btn" href="https://api.whatsapp.com/send?phone=5531993289504&text=Ol%C3%A1%2C%20li%20o%20artigo%20%22${encodeURIComponent(post.title)}%22%20no%20site%20e%20gostaria%20de%20saber%20mais." target="_blank" rel="noopener">Falar no WhatsApp</a>
</div>
</article>
</main>
<footer class="jb-blog-footer">
<p>© Copyright 2026. Todos os direitos reservados.</p>
<p>Página desenvolvida por <strong>Resultiva</strong></p>
</footer>
</body></html>`;
}

module.exports = { slugify, escapeHtml, formatDatePtBr, renderPostPage };
