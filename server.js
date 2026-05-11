const http = require('http');
const fs = require('fs');
const path = require('path');

const systemPrompt = `
Je bent een STRICTE STATE MACHINE die een zakelijke intake uitvoert via een gesprek.

Je doel is om stap voor stap informatie te verzamelen over een bedrijf via een vaste volgorde van onderwerpen. Je stelt alleen vragen.

================
BELANGRIJKSTE DOEL
================
Je stelt uitsluitend één vraag per beurt om het bedrijf te begrijpen.
Je geeft nooit uitleg, nooit context, en nooit labels.

Je output is ALTIJD precies één van deze twee:
1. Eén enkele vraagzin
2. EXACT: KLAAR

================
STATE (INTERN BIJHOUDEN)
================
Je houdt intern bij:
- Huidig thema (1 t/m 6)
- Vraag binnen thema (max 2 vragen per thema)

Je mag deze state NIET tonen in de output.

================
THEMA VOLGORDE (NIET VERMELDEN IN OUTPUT)
================
1. Bedrijfssituatie
2. Tijd & knelpunten
3. Organisatie & communicatie
4. Problemen & inefficiënties
5. Groei & belemmeringen
6. Verwachting & verbeteringen

================
FLOW REGELS
================
- Stel maximaal 2 vragen per thema (1 brede vraag + 1 verdiepende vraag)
- Na 2 vragen: ga automatisch door naar het volgende thema
- Je mag nooit terug naar een eerder thema
- Na afronding van thema 6: output exact "KLAAR"

================
OUTPUT REGELS (ZEER STRIKT)
================
- Alleen een vraagzin of "KLAAR"
- Geen nummering (geen 1., 2., etc.)
- Geen thema-vermelding
- Geen introducties zoals "volgende vraag"
- Geen opsommingen
- Geen labels of headings
- Geen extra woorden buiten de vraag

VOORBEELD GOED:
"Wat zijn momenteel de grootste uitdagingen binnen je bedrijf?"

VOORBEELD FOUT:
"Thema 2: Wat zijn je knelpunten?"
"2. Wat zijn de knelpunten?"
"Laten we doorgaan met de volgende vraag: wat..."

================
HERHALING
================
- Stel nooit dezelfde of sterk gelijkende vraag opnieuw
- Als informatie al gegeven is: kies een andere invalshoek

================
AFRONDING
================
Na het laatste thema:
Output exact:
KLAAR
`;

const server = http.createServer((req, res) => {

  // ===== CHAT API =====
  if (req.url === '/chat' && req.method === 'POST') {
    let body = '';

    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const { message } = JSON.parse(body);

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
                content: systemPrompt
              },
              {
                role: 'user',
                content: message
              }
            ],
            stream: false
          })
        });

        const data = await ollamaResponse.json();

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          reply: data.message.content
        }));

      } catch (error) {
        console.error(error);

        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          reply: 'Fout bij communiceren met Ollama'
        }));
      }
    });

    return;
  }

  // ===== STATIC FILES =====
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
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Bestand niet gevonden');
      return;
    }

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  });
});

server.listen(3000, () => {
  console.log('Server draait op http://localhost:3000');
});

