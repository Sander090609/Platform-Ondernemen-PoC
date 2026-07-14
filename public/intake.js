// Definieer globale variabelen voor het bijhouden van de chatgeschiedenis, huidige stap en thema-geschiedenissen
let chatHistory = '';
let step = 0;
let themeHistories = {};
let manualHistory = '';

// Definieer de flow van vragen en thema's, kan makkelijk aangepast worden indien gewenst.
const flow = [
    // Handmatige vragen die sws gesteld moeten worden
    { type: 'manual', question: 'Wat is je voor- en achternaam?' },
    { type: 'manual', question: 'Wat is de naam van je bedrijf?' },
    { type: 'manual', question: 'Wat doet je bedrijf precies?' },

    // Thema 1: Huidige situatie van het bedrijf
    { type: 'ai', theme: 'Huidige situatie van het bedrijf' },
    { type: 'ai', theme: 'Huidige situatie van het bedrijf' },

    // Thema 2: Tijdsbesteding en prioriteiten
    { type: 'ai', theme: 'Tijdsbesteding en prioriteiten' },
    { type: 'ai', theme: 'Tijdsbesteding en prioriteiten' },

    // Thema 3: Organisatie en samenwerking
    { type: 'ai', theme: 'Organisatie en samenwerking' },
    { type: 'ai', theme: 'Organisatie en samenwerking' },

    // Thema 4: Uitdagingen en ontwikkelpunten
    { type: 'ai', theme: 'Uitdagingen en ontwikkelpunten' },
    { type: 'ai', theme: 'Uitdagingen en ontwikkelpunten' },

    // Thema 5: Toekomst en groeikansen
    { type: 'ai', theme: 'Toekomst en groeikansen' },
    { type: 'ai', theme: 'Toekomst en groeikansen' },

    // Thema 6: Verwachting van het gesprek
    { type: 'ai', theme: 'Verwachting van het gesprek' },
    { type: 'ai', theme: 'Verwachting van het gesprek' }
];


// Functie om de progress bar te maken bij het laden van de pagina en de eerste vraag te tonen
window.onload = () => {

    const questionLabel = document.getElementById('questionLabel');

    questionLabel.innerText = flow[0].question;

    createProgressBar();
    updateProgress();
};


// Functie om de progress bar te creëren en toe te voegen aan de pagina
function createProgressBar() {

    const container = document.getElementById('rightBox');

    const bar = document.createElement('div');
    bar.id = 'progressBar';

    const fill = document.createElement('div');
    fill.id = 'progressFill';

    bar.appendChild(fill);

    container.prepend(bar);
}


// Functie om de progress bar bij te werken op basis van de huidige stap in de flow
function updateProgress() {

    const fill = document.getElementById('progressFill');

    const percent = Math.round((step / flow.length) * 100);

    if (fill) {
        fill.style.width = percent + '%';
    }
}


// Functie om de vraag en het antwoord toe te voegen aan de thema-geschiedenis
function addToThemeHistory(theme, question, answer) {

    if (!themeHistories[theme]) {
        themeHistories[theme] = '';
    }

    themeHistories[theme] += `Vraag: ${question}\n`;
    themeHistories[theme] += `Antwoord: ${answer}\n\n`;
}


// Functie voor het versturen van de input van de gebruiker
async function sendInput() {

    const input = document.getElementById('userInput');
    const questionLabel = document.getElementById('questionLabel');

    const userAnswer = input.value.trim();

    if (!userAnswer) {
        alert('Vul een antwoord in.');
        return;
    }

    const currentStep = flow[step];

    const currentQuestion = currentStep.question || currentStep.theme;

    chatHistory += `Vraag: ${currentQuestion}\n`;
    chatHistory += `Antwoord: ${userAnswer}\n\n`;

    if (currentStep.type === 'ai') {

        addToThemeHistory(
            currentStep.theme,
            currentQuestion,
            userAnswer
        );

    } else {

        manualHistory += `Vraag: ${currentQuestion}\n`;
        manualHistory += `Antwoord: ${userAnswer}\n\n`;
    }

    input.value = '';
    step++;

    updateProgress();

    if (step >= flow.length) {

        alert('Bedankt voor het invullen!');

        console.log(chatHistory);
        console.log(themeHistories);

        // Eén gezamenlijke payload voor beide bestemmingen
        const payload = {
            sessionId: crypto.randomUUID(),
            chatHistory,
            themeHistories,
            manualHistory,
            finishedAt: new Date().toISOString()
        };

        // --- PAD 1: n8n -> Teams-kanaal aanmaken ---
        // LET OP: gebruik de PRODUCTION webhook-URL (/webhook/...), niet /webhook-test/...
        // en zet de workflow op "Active" in n8n. Anders vuurt dit alleen als je
        // net op "Listen for test event" hebt geklikt in de editor.
        const n8nCall = fetch(
            'https://lcs4.app.n8n.cloud/webhook/formulier-data',
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }
        ).then(response => {
            if (!response.ok) {
                throw new Error(`n8n webhook gaf status ${response.status}`);
            }
            console.log('✅ n8n (Teams-kanaal) succesvol aangeroepen');
        }).catch(error => {
            console.error('❌ Fout bij versturen naar n8n:', error);
        });

        // --- PAD 2: Monday-agent -> CRM item/subitem aanmaken ---
        const mondayCall = fetch(
            'http://localhost:3001/intake',
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }
        ).then(response => {
            if (!response.ok) {
                throw new Error(`Monday-agent gaf status ${response.status}`);
            }
            console.log('✅ Monday-agent (CRM) succesvol aangeroepen');
        }).catch(error => {
            console.error('❌ Fout bij versturen naar Monday-agent:', error);
        });

        // Beide onafhankelijk laten lopen — één mislukking blokkeert de ander niet,
        // en de kalender wordt sowieso getoond zodra beide klaar zijn (gelukt of niet).
        await Promise.allSettled([n8nCall, mondayCall]);

        showCalendar();

        return;
    }

    const nextStep = flow[step];

    if (nextStep.type === 'manual') {
        questionLabel.innerText = nextStep.question;
        return;
    }

    try {

        const response = await fetch('/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message:
                    `${manualHistory}\n\n${themeHistories[nextStep.theme] || ''}`,
                theme: nextStep.theme
            })
        });

        const data = await response.json();

        questionLabel.innerText = data.reply;

    } catch (error) {

        console.error(error);
        alert('Er ging iets fout bij het ophalen van een vraag.');
    }
}


// Functie om de kalender te tonen om een afspraak in te plannen
function showCalendar() {

    const box = document.getElementById('rightBox');

    box.innerHTML = `
        <div
            class="calendly-inline-widget"
            data-url="https://calendly.com/swijnand0906/30min?hide_event_type_details=1"
            style="min-width:320px;height:700px;">
        </div>
    `;

    const script = document.createElement('script');

    script.src = 'https://assets.calendly.com/assets/external/widget.js';

    document.body.appendChild(script);
}
