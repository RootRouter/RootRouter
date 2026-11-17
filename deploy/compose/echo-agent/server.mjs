import http from 'http';

const PORT = Number(process.env.PORT ?? 8089);

const server = http.createServer(async (req, res) => {
  if (req.url?.includes('/chat/completions') && req.method === 'POST') {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const body = Buffer.concat(chunks).toString('utf8');
    let model = 'echo';
    try {
      model = JSON.parse(body).model ?? model;
    } catch {
      /* noop */
    }
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(
      JSON.stringify({
        id: 'echo',
        object: 'chat.completion',
        model,
        choices: [{ index: 0, message: { role: 'assistant', content: 'ok' }, finish_reason: 'stop' }],
        usage: { prompt_tokens: 10, completion_tokens: 2, total_tokens: 12 },
      })
    );
    return;
  }
  res.writeHead(404);
  res.end();
});

server.listen(PORT, () => console.log(`echo agent on ${PORT}`));