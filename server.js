const http = require('http');
const fs = require('fs');
const path = require('path');

function buildPrompt(theme) {
return `
Je bent een zakelijke intake assistent.

Je taak:
- Stel EXACT 1 korte zakelijke vraag
- De vraag moet passen binnen het thema: "${theme}"

REGELS:
- Alleen een vraagzin
- Geen uitleg
- Geen intro
- Geen opsommingen
- Geen labels
- Geen meerdere vragen
- Geen herhaling
- Maximaal 1 zin

VOORBEELDEN:
"Wat kost momenteel de meeste tijd binnen jullie bedrijf?"
"Waar lopen medewerkers het vaakst tegenaan?"
"Welke processen verlopen nog handmatig?"

Output uitsluitend de vraag.
`;
}

const server = http.createServer((req, res) => {

    // =========================
    // CHAT API
    // =========================
    if (req.url === '/chat' && req.method === 'POST') {

        let body = '';

        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', async () => {

            try {

                const { message, theme } = JSON.parse(body);

                const ollamaResponse = await fetch('http://localhost:11434/api/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: 'llama3.1',
                        messages: [
                            {
                                role: 'system',
                                content: buildPrompt(theme)
                            },
                            {
                                role: 'user',
                                content: message
                            }
                        ],
                        stream: false,
                        temperature: 0.3
                    })
                });

                const data = await ollamaResponse.json();

                res.writeHead(200, {
                    'Content-Type': 'application/json'
                });

                res.end(JSON.stringify({
                    reply: data.message.content.trim()
                }));

            } catch (error) {

                console.error(error);

                res.writeHead(500, {
                    'Content-Type': 'application/json'
                });

                res.end(JSON.stringify({
                    reply: 'Er ging iets fout.'
                }));
            }
        });

        return;
    }

    // =========================
    // STATIC FILES
    // =========================
    let filePath = req.url === '/'
        ? path.join(__dirname, 'public', 'index.html')
        : path.join(__dirname, 'public', req.url);

    const ext = path.extname(filePath);

    const contentTypes = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'text/javascript'
    };

    const contentType = contentTypes[ext] || 'text/plain';

    fs.readFile(filePath, (err, content) => {

        if (err) {
            res.writeHead(404, {
                'Content-Type': 'text/plain'
            });

            res.end('Bestand niet gevonden');
            return;
        }

        res.writeHead(200, {
            'Content-Type': contentType
        });

        res.end(content);
    });
});

server.listen(3000, () => {
    console.log('Server draait op http://localhost:3000');
});