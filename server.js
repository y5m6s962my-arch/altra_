const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const baseDir = __dirname;

// Convert markdown to HTML with better formatting
function markdownToHtml(content) {
  let html = content;
  
  // Code blocks
  html = html.replace(/```(?:javascript|bash|js|typescript|ts)?\n([\s\S]*?)```/g, 
    '<pre><code>$1</code></pre>');
  
  // Bold and italic
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  
  // Links
  html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');
  
  // Inline code
  html = html.replace(/`(.+?)`/g, '<code>$1</code>');
  
  // Headings
  html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');
  
  // Lists
  html = html.replace(/^\- (.*?)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>');
  
  // Paragraphs
  html = html.split('\n\n').map(para => {
    if (!para.match(/<(h[1-3]|pre|ul|li)/)) {
      return '<p>' + para.trim() + '</p>';
    }
    return para;
  }).join('\n');
  
  return html;
}

function getPageTitle(filePath) {
  const names = {
    'index.md': 'Home',
    'getting-started.md': 'Getting Started',
    'guide.md': 'User Guide'
  };
  return names[path.basename(filePath)] || 'Documentation';
}

const server = http.createServer((req, res) => {
  let filePath = path.join(baseDir, req.url === '/' ? 'index.md' : req.url);
  
  if (!filePath.startsWith(baseDir)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  if (filePath.endsWith('.md') || req.url === '/') {
    filePath = path.join(baseDir, req.url === '/' ? 'index.md' : req.url);
    
    fs.readFile(filePath, 'utf8', (err, content) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end(`
          <!DOCTYPE html>
          <html>
          <head><meta charset="UTF-8"><title>404</title></head>
          <body style="background:#1a1a1a;color:#fff;font-family:sans-serif;padding:40px">
            <h1>404 - Page Not Found</h1>
            <p>The page you're looking for doesn't exist.</p>
          </body>
          </html>
        `);
        return;
      }

      const pageTitle = getPageTitle(filePath);
      const htmlContent = markdownToHtml(content);

      let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pageTitle} - My Project Docs</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      background: #0f0f0f;
      color: #e0e0e0;
      line-height: 1.6;
    }
    
    .container { display: flex; min-height: 100vh; }
    
    /* Sidebar */
    .sidebar {
      width: 270px;
      background: #1a1a1a;
      border-right: 1px solid #333;
      padding: 30px 0;
      position: fixed;
      height: 100vh;
      overflow-y: auto;
      scrollbar-width: thin;
      scrollbar-color: #444 #1a1a1a;
    }
    
    .sidebar::-webkit-scrollbar { width: 6px; }
    .sidebar::-webkit-scrollbar-track { background: #1a1a1a; }
    .sidebar::-webkit-scrollbar-thumb { background: #444; border-radius: 3px; }
    
    .logo {
      padding: 0 25px 25px;
      border-bottom: 1px solid #333;
      margin-bottom: 20px;
    }
    
    .logo h2 {
      font-size: 16px;
      font-weight: 700;
      color: #fff;
      letter-spacing: -0.5px;
    }
    
    .logo p {
      font-size: 12px;
      color: #888;
      margin-top: 5px;
    }
    
    .nav-section {
      margin-bottom: 25px;
    }
    
    .nav-section-title {
      font-size: 11px;
      font-weight: 600;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 1px;
      padding: 0 25px 10px;
      margin-top: 15px;
    }
    
    .nav-links { list-style: none; }
    .nav-links li { margin: 0; }
    
    .nav-links a {
      display: flex;
      align-items: center;
      padding: 10px 25px;
      color: #b0b0b0;
      text-decoration: none;
      font-size: 14px;
      transition: all 0.2s;
      border-left: 3px solid transparent;
    }
    
    .nav-links a:hover {
      color: #0084ff;
      background: rgba(0, 132, 255, 0.08);
    }
    
    .nav-links a.active {
      color: #0084ff;
      background: rgba(0, 132, 255, 0.1);
      border-left-color: #0084ff;
    }
    
    .nav-links a::before {
      content: '';
      width: 4px;
      height: 4px;
      background: currentColor;
      border-radius: 50%;
      margin-right: 10px;
      opacity: 0.5;
    }
    
    /* Main Content */
    main {
      margin-left: 270px;
      flex: 1;
      padding: 60px;
      background: linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%);
      max-width: 1200px;
    }
    
    /* Topbar */
    .topbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 50px;
      padding-bottom: 20px;
      border-bottom: 1px solid #333;
    }
    
    .breadcrumb {
      font-size: 13px;
      color: #888;
    }
    
    /* Typography */
    h1 {
      font-size: 42px;
      font-weight: 700;
      margin: 40px 0 25px;
      color: #fff;
      letter-spacing: -1px;
    }
    
    h1:first-child {
      margin-top: 0;
    }
    
    h2 {
      font-size: 28px;
      font-weight: 600;
      margin: 35px 0 20px;
      color: #f0f0f0;
      border-bottom: 1px solid #333;
      padding-bottom: 12px;
    }
    
    h3 {
      font-size: 20px;
      font-weight: 600;
      margin: 25px 0 15px;
      color: #e0e0e0;
    }
    
    p {
      margin: 15px 0;
      color: #c0c0c0;
      font-size: 15px;
    }
    
    code {
      background: #2a2a2a;
      border: 1px solid #404040;
      padding: 3px 8px;
      border-radius: 4px;
      font-family: 'Fira Code', 'Monaco', 'Courier New', monospace;
      font-size: 13px;
      color: #87ceeb;
    }
    
    pre {
      background: #1e1e1e;
      border: 1px solid #404040;
      color: #d4d4d4;
      padding: 20px;
      border-radius: 6px;
      overflow-x: auto;
      margin: 20px 0;
      font-family: 'Fira Code', 'Monaco', 'Courier New', monospace;
      font-size: 13px;
      line-height: 1.5;
    }
    
    pre code {
      background: none;
      border: none;
      color: inherit;
      padding: 0;
    }
    
    a {
      color: #0084ff;
      text-decoration: none;
      border-bottom: 1px solid transparent;
      transition: border-color 0.2s;
    }
    
    a:hover {
      border-bottom-color: #0084ff;
    }
    
    ul, ol {
      margin: 15px 0 15px 30px;
    }
    
    li {
      margin: 8px 0;
      color: #c0c0c0;
    }
    
    /* Info boxes */
    .info-box {
      background: rgba(0, 132, 255, 0.1);
      border-left: 4px solid #0084ff;
      padding: 16px 20px;
      border-radius: 4px;
      margin: 20px 0;
      color: #b0d4ff;
    }
    
    .warning-box {
      background: rgba(255, 179, 0, 0.1);
      border-left: 4px solid #ffb300;
      padding: 16px 20px;
      border-radius: 4px;
      margin: 20px 0;
      color: #ffd580;
    }
    
    /* Responsive */
    @media (max-width: 768px) {
      .sidebar { width: 100%; height: auto; position: relative; border-right: none; border-bottom: 1px solid #333; }
      main { margin-left: 0; padding: 40px 20px; }
      h1 { font-size: 28px; }
      h2 { font-size: 20px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="sidebar">
      <div class="logo">
        <h2>📚 My Project</h2>
        <p>Documentation</p>
      </div>
      <div class="nav-section">
        <ul class="nav-links">
          <li><a href="/" class="${req.url === '/' ? 'active' : ''}">Welcome</a></li>
        </ul>
      </div>
      <div class="nav-section">
        <div class="nav-section-title">Resources</div>
        <ul class="nav-links">
          <li><a href="/getting-started.md" class="${req.url === '/getting-started.md' ? 'active' : ''}">Getting Started</a></li>
          <li><a href="/guide.md" class="${req.url === '/guide.md' ? 'active' : ''}">User Guide</a></li>
        </ul>
      </div>
    </div>
    
    <main>
      ${htmlContent}
    </main>
  </div>
</body>
</html>`;

      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
    });
  } else {
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('404 Not Found');
        return;
      }
      res.writeHead(200);
      res.end(data);
    });
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`🚀 Professional documentation running at http://127.0.0.1:${PORT}`);
  console.log(`📝 Edit markdown files and refresh your browser to see changes`);
  console.log(`⏹️  Press Ctrl+C to stop`);
});

