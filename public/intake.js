let chatHistory = '';

async function sendInput() {
    const input = document.getElementById('userInput');
    const questionLabel = document.getElementById('questionLabel');

    const userAnswer = input.value.trim();
    if (!userAnswer) {
        alert('Vul een antwoord in.');
        return;
    }

    // ===== HANDMATIGE FASE 1 =====
    if (questionLabel.innerText === 'Wat is je voor- en achternaam?') {
        chatHistory += `Vraag: Wat is je voor- en achternaam?\nAntwoord: ${userAnswer}\n`;
        questionLabel.innerText = 'Wat is de naam van je bedrijf?';
        input.value = '';
        return;
    }

    if (questionLabel.innerText === 'Wat is de naam van je bedrijf?') {
        chatHistory += `Vraag: Wat is de naam van je bedrijf?\nAntwoord: ${userAnswer}\n`;

        // eerste AI vraag starten
        questionLabel.innerText = 'Geef een korte beschrijving van je bedrijf en wat je doet.';
        input.value = '';
        return;
    }

    // ===== AI FASE =====
    const currentQuestion = questionLabel.innerText;

    chatHistory += `Vraag: ${currentQuestion}\nAntwoord: ${userAnswer}\n`;

    const response = await fetch('/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: chatHistory })
    });

    const data = await response.json();

    if (data.reply.toLowerCase().includes('klaar')) {
        alert('Bedankt voor het invullen! Je mag nu een afspraak inplannen.');
        console.log('Final chat history:\n', chatHistory);
        await fetch('https://lcs4.app.n8n.cloud/webhook-test/formulier-data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                sessionId: crypto.randomUUID(),
                chatHistory: chatHistory,
                finishedAt: new Date().toISOString()
            })
        });
        showCalendar();
        return;
    }

    questionLabel.innerText = data.reply;
    input.value = '';
}

function showCalendar() {
  const box = document.getElementById('rightBox');

  box.innerHTML = `
    <div class="calendly-inline-widget"
      data-url="https://calendly.com/swijnand0906/30min?hide_event_type_details=1"
      style="min-width:320px;height:700px;">
    </div>
  `;

  const script = document.createElement('script');
  script.src = "https://assets.calendly.com/assets/external/widget.js";
  document.body.appendChild(script);
}
