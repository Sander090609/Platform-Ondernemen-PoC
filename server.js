const http = require('http');
const fs = require('fs');
const path = require('path');

// Bouwt een system prompt voor de AI op basis van het gekozen thema.
function buildPrompt(theme) {
    return `
Je bent een zakelijke intake assistent. Jouw doel is om informatie te verzamelen over een ondernemer en hun bedrijf, zodat je een duidelijk beeld krijgt van hun situatie, uitdagingen en behoeften. Je taak is om gerichte vragen te stellen die de ondernemer aan het denken zetten en waardevolle inzichten opleveren.

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

// HTTP server aanmaken
// Deze server handelt zowel AI requests (/chat) als statische bestanden (HTML/CSS/JS) af
const server = http.createServer((req, res) => {

    // =========================
    // AI ENDPOINT (/chat)
    // =========================
    if (req.url === '/chat' && req.method === 'POST') {

        let body = '';

        // Data komt in chunks binnen → samenvoegen tot 1 string
        req.on('data', chunk => {
            body += chunk.toString();
        });

        // Wanneer volledige request body binnen is
        req.on('end', async () => {

            try {

                // Parse JSON van frontend (message + theme)
                const { message, theme } = JSON.parse(body);

                // Call naar lokale Ollama AI server
                const ollamaResponse = await fetch('http://localhost:11434/api/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: 'gemma3:4b',

                        // System prompt bepaalt gedrag van de AI
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

                        // Geen streaming, direct antwoord terug
                        stream: false,

                        // Lagere temperatuur zodat de LLM consistentere antwoorden teruggeeft
                        temperature: 0.3
                    })
                });

                // Response van Ollama omzetten naar JSON
                const data = await ollamaResponse.json();

                // Antwoord terugsturen naar frontend
                res.writeHead(200, {
                    'Content-Type': 'application/json'
                });

                res.end(JSON.stringify({
                    reply: data.message.content.trim()
                }));

            } catch (error) {

                // Foutafhandeling bij AI call of parsing
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
    // STATIC FILE SERVER
    // =========================

    // Pad bepalen naar gevraagde file
    let filePath = req.url === '/'
        ? path.join(__dirname, 'public', 'index.html')
        : path.join(__dirname, 'public', req.url);

    // File extensie bepalen (.html, .css, .js)
    const ext = path.extname(filePath);

    // Content-type mapping voor browser
    const contentTypes = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'text/javascript'
    };

    const contentType = contentTypes[ext] || 'text/plain';

    // Bestand uitlezen van disk
    fs.readFile(filePath, (err, content) => {

        // Als bestand niet bestaat → 404
        if (err) {
            res.writeHead(404, {
                'Content-Type': 'text/plain'
            });

            res.end('Bestand niet gevonden');
            return;
        }

        // Bestand succesvol gevonden → terugsturen naar browser
        res.writeHead(200, {
            'Content-Type': contentType
        });

        res.end(content);
    });
});

// =========================
// SERVER START
// =========================

// Server draait op poort 3000
server.listen(3000, () => {
    console.log('Server draait op http://localhost:3000');
});