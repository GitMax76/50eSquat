/* 
  Back-end 50eSquat - Versione Finale (Con distinzione PayPal/Amazon)
*/

// --- CONFIGURAZIONE ---
const SHEET_ID = "1O1UKq1QueCgszSxVXkQrKO6YNRH0B-YSrfZSLKlos0g"; 
const RESPONSE_SHEET_NAME = "Risposte del modulo 1";

// Limiti
const LIMIT_EVENT_1 = 30; // Fitness (Colonna C)
const LIMIT_EVENT_2 = 40; // Games (Colonna D)

// Telegram
const TELEGRAM_BOT_TOKEN = "8554700820:AAEVHaNBbUheuV0C2MYLwsebGtZPDKCn0aE";
const TELEGRAM_CHAT_ID = "76989453"; 
// --- FINE CONFIGURAZIONE ---

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000); 
    
    // Parse
    let data = {};
    if (e.postData && e.postData.contents) {
      try { data = JSON.parse(e.postData.contents); } catch (ex) { Logger.log("Error JSON: " + ex); }
    } else if (e.parameter) {
      data = e.parameter;
    }
    
    const action = data.action || e.parameter.action;
    
    // --- CASO A: NUOVO REGALO (BONUS STAGE) ---
    if (action === 'gift') {
      const name = data.name || "Anonimo";
      const gift = data.gift || "Regalo ???";
      const amount = data.amount || "?";
      const method = data.method || "paypal"; // Default paypal se manca
      
      // Icona e Testo diverso in base al metodo
      let methodText = "💳 Paga con PayPal";
      let footerText = "_Verifica su PayPal!_";
      
      if (method === 'amazon') {
         methodText = "📦 Buono Amazon";
         footerText = "_Attendi email del Buono Amazon!_";
      }
      
      const msg = `🎁 *NUOVO CONTRIBUTO!* 🎁\n\n` +
                  `👤 *Player:* ${name}\n` +
                  `🕹️ *Loot:* ${gift}\n` +
                  `💰 *Credits:* €${amount}\n` +
                  `------------------------------\n` +
                  `👉 *Metodo:* ${methodText}\n\n` +
                  `${footerText}`;
      
      sendTelegram(msg);
      
      return sendJSON({ status: "success", message: "Gift notificato" });
    }
    
    // --- CASO B: CHECK DISPONIBILITÀ ---
    if (action === 'check') {
      return handleCheckAvailability();
    }
    
    // --- CASO C: REGISTRAZIONE EVENTO (RSVP) ---
    const name = data.name;
    const selectedEvents = data.events || ""; 
    
    if (!name) throw new Error("Nome mancante");
    
    const spreadSheet = SpreadsheetApp.openById(SHEET_ID);
    const sheet = spreadSheet.getSheetByName(RESPONSE_SHEET_NAME);
    
    const currentCounts = countParticipants(sheet);
    const wantsEvent1 = selectedEvents.includes("event1");
    const wantsEvent2 = selectedEvents.includes("event2");
    
    if (wantsEvent1 && currentCounts.event1 >= LIMIT_EVENT_1) throw new Error("Fitness Class piena!");
    if (wantsEvent2 && currentCounts.event2 >= LIMIT_EVENT_2) throw new Error("Serata Giochi piena!");

    const val1 = wantsEvent1 ? "X" : "";
    const val2 = wantsEvent2 ? "X" : "";
    sheet.appendRow([new Date(), name, val1, val2]);
    
    // NOTIFICA TELEGRAM RSVP
    try {
       var sheetData = sheet.getDataRange().getValues();
       var c1 = 0; var c2 = 0;
       for (var i = 1; i < sheetData.length; i++) {
         if (sheetData[i][2] == "X") c1++;
         if (sheetData[i][3] == "X") c2++;
       }

      var msg = "🚨 *NUOVA PRENOTAZIONE* 🚨\n\n" +
                    "👤 *Chi:* " + name + "\n" +
                    "🏋️ *Fitness:* " + (wantsEvent1 ? "✅ SI" : "❌ NO") + "\n" +
                    "🎲 *Games:* " + (wantsEvent2 ? "✅ SI" : "❌ NO") + "\n\n" +
                    "📈 *STATUS*\n" + 
                    "Fit: " + c1 + "/" + LIMIT_EVENT_1 + "\n" + 
                    "Game: " + c2 + "/" + LIMIT_EVENT_2;
      
      sendTelegram(msg);
    } catch (e) {
      Logger.log(e);
    }
    
    return sendJSON({
      status: "success",
      message: "Registrazione confermata!",
      details: { wantsEvent1, wantsEvent2 }
    });
    
  } catch (error) {
    return sendJSON({ status: "error", message: error.message });
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) { return handleCheckAvailability(); }

function handleCheckAvailability() {
  try {
    const spreadSheet = SpreadsheetApp.openById(SHEET_ID);
    let sheet = spreadSheet.getSheetByName(RESPONSE_SHEET_NAME);
    if (!sheet) return sendJSON({status: "error", message: "Foglio non trovato"});

    const counts = countParticipants(sheet);
    return sendJSON({
      status: "success",
      counts: counts,
      limits: { event1: LIMIT_EVENT_1, event2: LIMIT_EVENT_2 },
      availability: {
        event1: counts.event1 < LIMIT_EVENT_1 ? "open" : "full",
        event2: counts.event2 < LIMIT_EVENT_2 ? "open" : "full"
      }
    });
  } catch(e) { return sendJSON({ status: "error", message: e.message }); }
}

function countParticipants(sheet) {
  const data = sheet.getDataRange().getValues();
  let count1 = 0; let count2 = 0;
  for (let i = 1; i < data.length; i++) {
    const val1 = data[i][2]; const val2 = data[i][3];
    if (val1 && val1.toString().trim() !== "") count1++;
    if (val2 && val2.toString().trim() !== "") count2++;
  }
  return { event1: count1, event2: count2 };
}

function sendTelegram(text) {
  var url = "https://api.telegram.org/bot" + TELEGRAM_BOT_TOKEN + "/sendMessage";
  UrlFetchApp.fetch(url, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: text, parse_mode: "Markdown" })
  });
}

function sendJSON(content) {
  return ContentService.createTextOutput(JSON.stringify(content)).setMimeType(ContentService.MimeType.JSON);
}
