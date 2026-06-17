# README

## Vereisten

Zorg ervoor dat de volgende software is geïnstalleerd voordat je het project start:

- Node.js  
  https://nodejs.org/

- Ollama  
  https://ollama.com/

- Visual Studio Code  
  https://code.visualstudio.com/

---

## Project starten

### 1. Open het project in Visual Studio Code

Open de projectmap in VS Code.

---

### 2. Start de Node.js server

Open een terminal in VS Code en run:

```bash
node server.js
```

---

### 3. Start Ollama

Open een **tweede terminal** in VS Code en run:

```bash
ollama run gemma3:4b
```

---

## Applicatie openen

Wanneer beide terminals draaien, open je in je browser:

```text
http://localhost:3000
```

---

## Overzicht

| Terminal | Command |
|---|---|
| Terminal 1 | `node server.js` |
| Terminal 2 | `ollama run llama3.1` |

---

## Opmerking

Zorg ervoor dat Ollama volledig draait voordat je de applicatie gebruikt.
