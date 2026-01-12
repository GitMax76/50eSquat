// --- CONFIGURAZIONE ---
// Sostituisci questi valori con i tuoi
const BOT_TOKEN = "IL_TUO_BOT_TOKEN";
const CHAT_ID = "IL_TUO_CHAT_ID"; // O Group ID

// --- GESTIONE DOPOST (RICEZIONE DATI) ---
function doPost(e) {
    try {
        const data = JSON.parse(e.postData.contents);

        // --- CASO 1: NUOVO REGALO (BONUS STAGE) ---
        if (data.action === "gift") {
            const name = data.name || "Anonimo";
            const gift = data.gift || "Regalo Generico";
            const amount = data.amount || "?";

            const msg = `🎁 *NUOVO CONTRIBUTO REGALO!* 🎁\n\n👤 *Chi:* ${name}\n🕹️ *Cosa:* ${gift}\n💰 *Importo:* €${amount}\n\n_Controlla PayPal per conferma!_`;

            sendTelegram(msg);

            // (Opzionale) Salva su foglio 'Regali' se vuoi
            // saveGiftToSheet(name, gift, amount);

            return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Gift notificato" }))
                .setMimeType(ContentService.MimeType.JSON);
        }

        // --- CASO 2: RSVP CLASSICO (PRENOTAZIONE EVENTO) ---
        // (Questa è la logica che avevi già, adattata)
        if (data.name) { // Se c'è un nome ma non action='gift'
            const name = data.name;
            const events = data.events || "";

            // Logica salvataggio su foglio PRANZO / CENA...
            // handleRSVP(data); 

            const msg = `🎟️ *NUOVA PRENOTAZIONE!* 🎟️\n\n👤 *Chi:* ${name}\n📅 *Eventi:* ${events}`;
            sendTelegram(msg);

            return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
                .setMimeType(ContentService.MimeType.JSON);
        }

        return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Dati non validi" }))
            .setMimeType(ContentService.MimeType.JSON);

    } catch (error) {
        return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
            .setMimeType(ContentService.MimeType.JSON);
    }
}

// --- FUNZIONE INVIO TELEGRAM ---
function sendTelegram(text) {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    const payload = {
        chat_id: CHAT_ID,
        text: text,
        parse_mode: "Markdown"
    };

    UrlFetchApp.fetch(url, {
        method: "post",
        contentType: "application/json",
        payload: JSON.stringify(payload)
    });
}

// --- FUNZIONE GET (PER I CONTATORI) ---
function doGet(e) {
    // Qui dovresti lasciare la tua logica esistente che restituisce i conteggi
    // ...
    return ContentService.createTextOutput(JSON.stringify({ status: "success", needsUpdate: false })) // Placeholder
        .setMimeType(ContentService.MimeType.JSON);
}
