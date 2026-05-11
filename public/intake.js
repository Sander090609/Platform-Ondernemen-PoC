let chatHistory = '';
let step = 0;

// =========================
// THEMA HISTORIES
// =========================

let themeHistories = {};

// =========================
// FLOW
// =========================

const flow = [
    { type: 'manual', question: 'Wat is je voor- en achternaam?' },
    { type: 'manual', question: 'Wat is de naam van je bedrijf?' },
    { type: 'manual', question: 'Wat doet je bedrijf precies?' },

    { type: 'ai', theme: 'Huidige situatie van het bedrijf' },
    { type: 'ai', theme: 'Huidige situatie van het bedrijf' },
    { type: 'ai', theme: 'Huidige situatie van het bedrijf' },

    { type: 'ai', theme: 'Tijdsbesteding en prioriteiten' },
    { type: 'ai', theme: 'Tijdsbesteding en prioriteiten' },
    { type: 'ai', theme: 'Tijdsbesteding en prioriteiten' },

    { type: 'ai', theme: 'Organisatie en samenwerking' },
    { type: 'ai', theme: 'Organisatie en samenwerking' },
    { type: 'ai', theme: 'Organisatie en samenwerking' },

    { type: 'ai', theme: 'Uitdagingen en ontwikkelpunten' },
    { type: 'ai', theme: 'Uitdagingen en ontwikkelpunten' },
    { type: 'ai', theme: 'Uitdagingen en ontwikkelpunten' },

    { type: 'ai', theme: 'Toekomst en groeikansen' },
    { type: 'ai', theme: 'Toekomst en groeikansen' },
    { type: 'ai', theme: 'Toekomst en groeikansen' },

    { type: 'ai', theme: 'Verwachting van het gesprek' },
    { type: 'ai', theme: 'Verwachting van het gesprek' },
    { type: 'ai', theme: 'Verwachting van het gesprek' }
];

// =========================
// PROGRESS BAR INIT
// =========================

window.onload = () => {

    const questionLabel = document.getElementById('questionLabel');

    questionLabel.innerText = flow[0].question;

    createProgressBar();
    updateProgress();
};

// =========================
// PROGRESS BAR
// =========================

function createProgressBar() {

    const container = document.getElementById('rightBox');

    const bar = document.createElement('div');
    bar.id = 'progressBar';

    const fill = document.createElement('div');
    fill.id = 'progressFill';

    bar.appendChild(fill);

    container.prepend(bar);
}

function updateProgress() {

    const fill = document.getElementById('progressFill');

    const percent = Math.round((step / flow.length) * 100);

    if (fill) {
        fill.style.width = percent + '%';
    }
}

// =========================
// THEMA HISTORY
// =========================

function addToThemeHistory(theme, question, answer) {

    if (!themeHistories[theme]) {
        themeHistories[theme] = '';
    }

    themeHistories[theme] += `Vraag: ${question}\n`;
    themeHistories[theme] += `Antwoord: ${answer}\n\n`;
}

// =========================
// INPUT
// =========================

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
        addToThemeHistory(currentStep.theme, currentQuestion, userAnswer);
    }

    input.value = '';
    step++;

    updateProgress();

    if (step >= flow.length) {

        alert('Bedankt voor het invullen!');

        console.log(chatHistory);
        console.log(themeHistories);

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
                message: themeHistories[nextStep.theme] || '',
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

// =========================
// CALENDLY
// =========================

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