/**
 * Project STEAM — Gmail → draft ingest (Apps Script)
 *
 * SETUP (one-time):
 * 1. Open https://script.google.com while signed into
 *    projectsteamcollective@gmail.com
 * 2. New project → paste this entire file
 * 3. Project Settings → Script properties → Add:
 *      WEBHOOK_URL  = https://YOUR-SITE.vercel.app/api/ingest/email
 *      INGEST_SECRET = (same value as Vercel env INGEST_SECRET)
 * 4. Run setupLabels() once (authorize Gmail + UrlFetch)
 * 5. Run processInbox() once to test
 * 6. Triggers → Add trigger:
 *      Function: processInbox
 *      Event source: Time-driven
 *      Type: Minutes timer → Every 5 or 10 minutes
 *
 * SAFETY:
 * - Creates DRAFTS only on the website (never publishes)
 * - Skips already-labeled messages
 * - Labels mail so it is not processed twice
 */

var LABEL_INGESTED = "ProjectSTEAM/Ingested";
var LABEL_FAILED = "ProjectSTEAM/Failed";
var LABEL_SKIPPED = "ProjectSTEAM/Skipped";
var MAX_THREADS = 15;

function setupLabels() {
  ensureLabel_(LABEL_INGESTED);
  ensureLabel_(LABEL_FAILED);
  ensureLabel_(LABEL_SKIPPED);
  Logger.log("Labels ready.");
}

/**
 * Main entry — call from a time-driven trigger.
 * Searches unread inbox mail that has not been ingested yet.
 */
function processInbox() {
  var props = PropertiesService.getScriptProperties();
  var webhookUrl = props.getProperty("WEBHOOK_URL");
  var secret = props.getProperty("INGEST_SECRET");

  if (!webhookUrl || !secret) {
    throw new Error("Set Script properties WEBHOOK_URL and INGEST_SECRET first.");
  }

  ensureLabel_(LABEL_INGESTED);
  ensureLabel_(LABEL_FAILED);
  ensureLabel_(LABEL_SKIPPED);

  // Unread, in inbox, not already processed
  var query =
    "in:inbox is:unread -label:" +
    LABEL_INGESTED +
    " -label:" +
    LABEL_FAILED +
    " -label:" +
    LABEL_SKIPPED;

  var threads = GmailApp.search(query, 0, MAX_THREADS);
  Logger.log("Found " + threads.length + " thread(s)");

  for (var i = 0; i < threads.length; i++) {
    var thread = threads[i];
    var messages = thread.getMessages();
    for (var j = 0; j < messages.length; j++) {
      processMessage_(messages[j], webhookUrl, secret);
    }
  }
}

function processMessage_(message, webhookUrl, secret) {
  var messageId = message.getId();
  var subject = message.getSubject() || "";
  var from = message.getFrom() || "";
  var fromName = extractName_(from);
  var body = message.getPlainBody() || stripHtml_(message.getBody() || "");
  var receivedAt = message.getDate()
    ? message.getDate().toISOString()
    : new Date().toISOString();

  // Skip empty / bounce noise
  if (body.replace(/\s+/g, "").length < 30 && subject.length < 8) {
    message.getThread().addLabel(ensureLabel_(LABEL_SKIPPED));
    Logger.log("Skipped short message: " + messageId);
    return;
  }

  var payload = {
    messageId: messageId,
    subject: subject,
    from: from,
    fromName: fromName,
    body: body.slice(0, 50000),
    receivedAt: receivedAt,
  };

  try {
    var response = UrlFetchApp.fetch(webhookUrl, {
      method: "post",
      contentType: "application/json",
      headers: {
        Authorization: "Bearer " + secret,
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
    });

    var code = response.getResponseCode();
    var text = response.getContentText();
    Logger.log("Ingest " + messageId + " → " + code + " " + text);

    if (code >= 200 && code < 300) {
      message.getThread().addLabel(ensureLabel_(LABEL_INGESTED));
      message.markRead();
    } else {
      message.getThread().addLabel(ensureLabel_(LABEL_FAILED));
    }
  } catch (err) {
    Logger.log("Error for " + messageId + ": " + err);
    message.getThread().addLabel(ensureLabel_(LABEL_FAILED));
  }
}

function ensureLabel_(name) {
  var label = GmailApp.getUserLabelByName(name);
  if (!label) label = GmailApp.createLabel(name);
  return label;
}

function extractName_(fromHeader) {
  var match = fromHeader.match(/^"?([^"<]+)"?\s*</);
  if (match && match[1]) return match[1].trim();
  return fromHeader.replace(/<.*>/, "").trim();
}

function stripHtml_(html) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

/** Manual test helper — sends a fake payload (does not read Gmail). */
function testWebhookOnly() {
  var props = PropertiesService.getScriptProperties();
  var webhookUrl = props.getProperty("WEBHOOK_URL");
  var secret = props.getProperty("INGEST_SECRET");
  var response = UrlFetchApp.fetch(webhookUrl, {
    method: "post",
    contentType: "application/json",
    headers: { Authorization: "Bearer " + secret },
    payload: JSON.stringify({
      messageId: "test-" + Date.now(),
      subject: "Test: Photosynthesis notes",
      from: "Student Contributor <student@example.com>",
      fromName: "Student Contributor",
      body:
        "Photosynthesis converts light into chemical energy.\n\n6CO2 + 6H2O + light → C6H12O6 + 6O2\n\nThis is a test submission for Project STEAM.",
      receivedAt: new Date().toISOString(),
    }),
    muteHttpExceptions: true,
  });
  Logger.log(response.getResponseCode() + " " + response.getContentText());
}
