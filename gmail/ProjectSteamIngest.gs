/**
 * Project STEAM — Gmail → draft ingest (Apps Script)
 *
 * Extracts text from:
 *  - PDF attachments (via Drive → Google Doc conversion)
 *  - PPTX / PPT attachments (via Drive → Google Slides conversion)
 *  - Google Slides / Docs / Drive links in the email body
 *
 * SETUP (one-time):
 * 1. Open https://script.google.com as projectsteamcollective@gmail.com
 * 2. New project → paste this entire file
 * 3. Services (+) → enable "Drive API" (Advanced Google service)
 * 4. Project Settings → Script properties:
 *      WEBHOOK_URL  = https://YOUR-SITE.vercel.app/api/ingest/email
 *      INGEST_SECRET = (same as Vercel INGEST_SECRET)
 * 5. Run removeLegacyLabels() once (deletes old ProjectSTEAM Ingested/Failed/Skipped labels)
 *    or run setup() once to approve Gmail, Drive, Slides, Docs, UrlFetch
 * 6. Run processInbox() once to test
 * 7. Triggers → processInbox every 5–10 minutes
 *
 * SAFETY: website creates DRAFTS only — never auto-publishes.
 */

var MAX_THREADS = 10;
var MAX_ATTACHMENTS = 5;
var MAX_ATTACHMENT_CHARS = 40000;
var MAX_TOTAL_CHARS = 80000;

/**
 * Submission rules. Only real student submissions should become drafts —
 * conversation replies on an existing thread are noise.
 */
// Require a file attachment or a Google Slides/Docs link. Plain text emails
// are ignored instead of creating a draft.
var REQUIRE_MATERIAL = true;
// "Re:" style replies never create drafts.
var SKIP_REPLIES = true;
// Forwards usually carry a student's original file, so they are allowed.
var SKIP_FORWARDS = false;

/** One-time: approve permissions. Does not create Gmail labels. */
function setup() {
  Logger.log("Permissions OK. Confirm Drive API is enabled under Services.");
}

/** Kept so older docs still work — now only removes the old Project STEAM labels. */
function setupLabels() {
  removeLegacyLabels();
}

/**
 * Deletes Ingested / Failed / Skipped (and the parent ProjectSTEAM label if empty).
 * Your own Gmail labels are left untouched.
 */
function removeLegacyLabels() {
  var names = [
    "ProjectSTEAM/Ingested",
    "ProjectSTEAM/Failed",
    "ProjectSTEAM/Skipped",
    "ProjectSTEAM",
  ];
  for (var i = 0; i < names.length; i++) {
    var label = GmailApp.getUserLabelByName(names[i]);
    if (!label) {
      Logger.log("Already gone: " + names[i]);
      continue;
    }
    label.deleteLabel();
    Logger.log("Deleted label: " + names[i]);
  }
}

function processInbox() {
  var props = PropertiesService.getScriptProperties();
  var webhookUrl = props.getProperty("WEBHOOK_URL");
  var secret = props.getProperty("INGEST_SECRET");

  if (!webhookUrl || !secret) {
    throw new Error("Set Script properties WEBHOOK_URL and INGEST_SECRET first.");
  }

  var query = "in:inbox is:unread -from:me";

  var threads = GmailApp.search(query, 0, MAX_THREADS);
  Logger.log("Found " + threads.length + " thread(s)");

  for (var i = 0; i < threads.length; i++) {
    var messages = threads[i].getMessages();
    for (var j = 0; j < messages.length; j++) {
      processMessage_(messages[j], webhookUrl, secret);
    }
  }
}

/** True for "Re:" replies and messages threaded onto an earlier email. */
function isReply_(message) {
  var subject = message.getSubject() || "";
  if (/^\s*(re|aw|sv|vs|antw)\s*:/i.test(subject)) return true;

  try {
    if (message.getHeader("In-Reply-To")) return true;
    if (message.getHeader("References")) return true;
  } catch (err) {
    // Header lookup is unavailable in some contexts — fall back to subject.
  }
  return false;
}

function isForward_(message) {
  var subject = message.getSubject() || "";
  return /^\s*(fw|fwd)\s*:/i.test(subject);
}

/** True when the account is looking at its own outgoing mail. */
function isFromSelf_(from) {
  var self = Session.getActiveUser().getEmail();
  if (!self) return false;
  return String(from).toLowerCase().indexOf(self.toLowerCase()) !== -1;
}

function skipMessage_(message, messageId, reason) {
  message.markRead();
  Logger.log("Skipped " + messageId + ": " + reason);
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

  if (isFromSelf_(from)) {
    skipMessage_(message, messageId, "sent by this account");
    return;
  }

  if (SKIP_REPLIES && isReply_(message)) {
    skipMessage_(message, messageId, "reply on an existing thread");
    return;
  }

  if (SKIP_FORWARDS && isForward_(message)) {
    skipMessage_(message, messageId, "forwarded message");
    return;
  }

  var attachments = extractAttachments_(message);
  var linkedDocs = extractLinkedDocs_(body);
  var allExtracted = attachments.concat(linkedDocs);

  var attachmentTextLen = 0;
  for (var a = 0; a < allExtracted.length; a++) {
    attachmentTextLen += (allExtracted[a].text || "").length;
  }

  // A submission must carry study material — a PDF/PPTX/DOCX attachment or a
  // Google Slides/Docs link. Plain conversation never becomes a draft.
  if (REQUIRE_MATERIAL && allExtracted.length === 0) {
    skipMessage_(
      message,
      messageId,
      "no attachment or Google Slides/Docs link with readable text",
    );
    return;
  }

  // Skip only if both body and attachments are empty/noise
  if (
    body.replace(/\s+/g, "").length < 30 &&
    attachmentTextLen < 40 &&
    subject.length < 8
  ) {
    skipMessage_(message, messageId, "no extractable text");
    return;
  }

  var payload = {
    messageId: messageId,
    subject: subject,
    from: from,
    fromName: fromName,
    body: body.slice(0, 20000),
    receivedAt: receivedAt,
    attachments: allExtracted,
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
      message.markRead();

      // Upload original PDF/PPTX for login-only download (≤ ~3.5MB each)
      try {
        var parsed = JSON.parse(text);
        if (parsed && parsed.postId) {
          uploadOriginalFiles_(message, webhookUrl, secret, parsed.postId, messageId);
        }
      } catch (parseErr) {
        Logger.log("Could not parse ingest response for uploads: " + parseErr);
      }
    } else {
      // The server also enforces the "must have material" rule.
      var serverSkipped = false;
      try {
        var errBody = JSON.parse(text);
        serverSkipped = Boolean(errBody && errBody.skipped);
      } catch (e) {}

      if (serverSkipped) {
        skipMessage_(message, messageId, "server rejected as non-submission");
      } else {
        Logger.log("Ingest failed for " + messageId + " (left unread so it can retry)");
      }
    }
  } catch (err) {
    Logger.log("Error for " + messageId + ": " + err);
  }
}

function endsWithAny_(name, extensions) {
  for (var i = 0; i < extensions.length; i++) {
    if (name.endsWith(extensions[i])) return true;
  }
  return false;
}

function isImageAttachment_(name, mime) {
  return (
    mime.indexOf("image/") === 0 ||
    endsWithAny_(name, [
      ".png",
      ".jpg",
      ".jpeg",
      ".gif",
      ".webp",
      ".bmp",
      ".tif",
      ".tiff",
      ".heic",
      ".heif",
      ".img",
    ])
  );
}

function isSheetAttachment_(name, mime) {
  return (
    mime.indexOf("spreadsheet") !== -1 ||
    mime.indexOf("excel") !== -1 ||
    endsWithAny_(name, [".xls", ".xlsx", ".csv", ".ods"])
  );
}

function isAllowedMaterial_(name, mime) {
  if (isImageAttachment_(name, mime) || isSheetAttachment_(name, mime)) {
    return true;
  }
  return (
    mime.indexOf("pdf") !== -1 ||
    mime.indexOf("presentation") !== -1 ||
    mime.indexOf("powerpoint") !== -1 ||
    mime.indexOf("msword") !== -1 ||
    mime.indexOf("wordprocessingml") !== -1 ||
    mime.indexOf("opendocument") !== -1 ||
    mime.indexOf("rtf") !== -1 ||
    mime.indexOf("text/") === 0 ||
    endsWithAny_(name, [
      ".pdf",
      ".ppt",
      ".pptx",
      ".odp",
      ".doc",
      ".docx",
      ".odt",
      ".rtf",
      ".txt",
    ])
  );
}

/**
 * Pull text from PDF / PPTX / Word / images / sheets.
 * Images and files with little text still count as submissions so the
 * original can be stored for download.
 */
function extractAttachments_(message) {
  var results = [];
  var blobs = message.getAttachments({
    includeInlineImages: false,
    includeAttachments: true,
  });

  for (var i = 0; i < blobs.length && results.length < MAX_ATTACHMENTS; i++) {
    var blob = blobs[i];
    var name = blob.getName() || "attachment";
    var mime = (blob.getContentType() || "").toLowerCase();
    var lower = name.toLowerCase();

    if (!isAllowedMaterial_(lower, mime)) {
      Logger.log("Skipping unsupported attachment: " + name + " (" + mime + ")");
      continue;
    }

    var text = "";
    var kind = "file";

    try {
      if (mime.indexOf("pdf") !== -1 || lower.endsWith(".pdf")) {
        kind = "pdf";
        text = extractPdfText_(blob);
      } else if (
        mime.indexOf("presentation") !== -1 ||
        mime.indexOf("powerpoint") !== -1 ||
        endsWithAny_(lower, [".pptx", ".ppt", ".odp"])
      ) {
        kind = "pptx";
        text = extractPptxText_(blob);
      } else if (
        mime.indexOf("msword") !== -1 ||
        mime.indexOf("wordprocessingml") !== -1 ||
        mime.indexOf("opendocument.text") !== -1 ||
        mime.indexOf("rtf") !== -1 ||
        endsWithAny_(lower, [".docx", ".doc", ".odt", ".rtf"])
      ) {
        kind = "docx";
        text = extractDocText_(blob);
      } else if (isSheetAttachment_(lower, mime)) {
        kind = "spreadsheet";
        text = extractSheetText_(blob);
      } else if (isImageAttachment_(lower, mime)) {
        kind = "image";
        text = extractImageText_(blob);
      } else if (mime.indexOf("text/") === 0 || lower.endsWith(".txt")) {
        kind = "text";
        text = blob.getDataAsString();
      }
    } catch (err) {
      Logger.log("Failed to extract " + name + ": " + err);
    }

    text = cleanText_(text).slice(0, MAX_ATTACHMENT_CHARS);
    if (text.length < 20) {
      text =
        'Student submitted file "' +
        name +
        '". Little or no extractable text (photo or scanned page). Original is stored for download.';
    }

    results.push({
      name: name,
      type: kind,
      mimeType: mime,
      text: text,
    });
  }

  return results;
}

/**
 * Find Google Slides / Docs / Drive file links in the email body and pull text.
 * The Gmail account must have access (students should share with
 * projectsteamcollective@gmail.com or set link to "Anyone with the link").
 */
function extractLinkedDocs_(body) {
  var results = [];
  if (!body) return results;

  var slideIds = uniqueMatches_(
    body,
    /https:\/\/docs\.google\.com\/presentation\/d\/([a-zA-Z0-9_-]+)/g,
  );
  var docIds = uniqueMatches_(
    body,
    /https:\/\/docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/g,
  );

  for (var i = 0; i < slideIds.length && results.length < MAX_ATTACHMENTS; i++) {
    try {
      var slideText = extractGoogleSlidesTextById_(slideIds[i]);
      slideText = cleanText_(slideText).slice(0, MAX_ATTACHMENT_CHARS);
      if (slideText.length >= 20) {
        results.push({
          name: "Google Slides " + slideIds[i],
          type: "google-slides",
          mimeType: "application/vnd.google-apps.presentation",
          text: slideText,
          sourceUrl:
            "https://docs.google.com/presentation/d/" + slideIds[i],
        });
      }
    } catch (err) {
      Logger.log("Could not read Slides " + slideIds[i] + ": " + err);
    }
  }

  for (var d = 0; d < docIds.length && results.length < MAX_ATTACHMENTS; d++) {
    try {
      var docText = DocumentApp.openById(docIds[d]).getBody().getText();
      docText = cleanText_(docText).slice(0, MAX_ATTACHMENT_CHARS);
      if (docText.length >= 20) {
        results.push({
          name: "Google Doc " + docIds[d],
          type: "google-doc",
          mimeType: "application/vnd.google-apps.document",
          text: docText,
          sourceUrl: "https://docs.google.com/document/d/" + docIds[d],
        });
      }
    } catch (err) {
      Logger.log("Could not read Doc " + docIds[d] + ": " + err);
    }
  }

  return results;
}

/** PDF → temporary Google Doc → text → delete temp file */
function extractPdfText_(blob) {
  assertDrive_();
  var resource = {
    title: "steam-temp-pdf-" + Date.now(),
    mimeType: MimeType.GOOGLE_DOCS,
  };
  var file = Drive.Files.insert(resource, blob, { convert: true });
  try {
    return DocumentApp.openById(file.id).getBody().getText();
  } finally {
    try {
      Drive.Files.remove(file.id);
    } catch (e) {}
  }
}

/** PPTX/PPT → temporary Google Slides → text → delete temp file */
function extractPptxText_(blob) {
  assertDrive_();
  var resource = {
    title: "steam-temp-ppt-" + Date.now(),
    mimeType: MimeType.GOOGLE_SLIDES,
  };
  var file = Drive.Files.insert(resource, blob, { convert: true });
  try {
    return extractGoogleSlidesTextById_(file.id);
  } finally {
    try {
      Drive.Files.remove(file.id);
    } catch (e) {}
  }
}

/** DOCX/DOC/ODT/RTF → temporary Google Doc → text */
function extractDocText_(blob) {
  assertDrive_();
  var resource = {
    title: "steam-temp-doc-" + Date.now(),
    mimeType: MimeType.GOOGLE_DOCS,
  };
  var file = Drive.Files.insert(resource, blob, { convert: true });
  try {
    return DocumentApp.openById(file.id).getBody().getText();
  } finally {
    try {
      Drive.Files.remove(file.id);
    } catch (e) {}
  }
}

/** PNG/JPG and similar — OCR via Drive when possible */
function extractImageText_(blob) {
  assertDrive_();
  var resource = {
    title: "steam-temp-img-" + Date.now(),
    mimeType: MimeType.GOOGLE_DOCS,
  };
  var file = Drive.Files.insert(resource, blob, {
    convert: true,
    ocr: true,
    ocrLanguage: "en",
  });
  try {
    return DocumentApp.openById(file.id).getBody().getText();
  } finally {
    try {
      Drive.Files.remove(file.id);
    } catch (e) {}
  }
}

/** XLS/XLSX/CSV → temporary Google Sheet → cell text */
function extractSheetText_(blob) {
  assertDrive_();
  var resource = {
    title: "steam-temp-sheet-" + Date.now(),
    mimeType: MimeType.GOOGLE_SHEETS,
  };
  var file = Drive.Files.insert(resource, blob, { convert: true });
  try {
    var sheet = SpreadsheetApp.openById(file.id);
    var tabs = sheet.getSheets();
    var parts = [];
    for (var i = 0; i < tabs.length && i < 8; i++) {
      parts.push("--- Sheet: " + tabs[i].getName() + " ---");
      var values = tabs[i].getDataRange().getDisplayValues();
      var rows = Math.min(values.length, 80);
      for (var r = 0; r < rows; r++) {
        var line = values[r]
          .slice(0, 12)
          .join(" | ")
          .replace(/\s+/g, " ")
          .trim();
        if (line) parts.push(line);
      }
    }
    return parts.join("\n");
  } finally {
    try {
      Drive.Files.remove(file.id);
    } catch (e) {}
  }
}

function extractGoogleSlidesTextById_(presentationId) {
  var presentation = SlidesApp.openById(presentationId);
  var slides = presentation.getSlides();
  var parts = [];

  for (var i = 0; i < slides.length; i++) {
    parts.push("--- Slide " + (i + 1) + " ---");
    var shapes = slides[i].getShapes();
    for (var s = 0; s < shapes.length; s++) {
      try {
        var t = shapes[s].getText();
        if (t) {
          var str = t.asString();
          if (str && str.replace(/\s+/g, "").length > 0) parts.push(str);
        }
      } catch (e) {
        // tables / images without text
      }
    }

    // Speaker notes
    try {
      var notes = slides[i].getNotesPage();
      if (notes) {
        var noteShapes = notes.getShapes();
        for (var n = 0; n < noteShapes.length; n++) {
          try {
            var nt = noteShapes[n].getText();
            if (nt) {
              var ns = nt.asString();
              if (ns && ns.replace(/\s+/g, "").length > 0) {
                parts.push("[Notes] " + ns);
              }
            }
          } catch (e2) {}
        }
      }
    } catch (e3) {}
  }

  return parts.join("\n");
}

function assertDrive_() {
  if (typeof Drive === "undefined" || !Drive.Files) {
    throw new Error(
      "Enable Drive API: Apps Script → Services (+) → Drive API",
    );
  }
}

function uniqueMatches_(text, regex) {
  var ids = [];
  var seen = {};
  var m;
  while ((m = regex.exec(text)) !== null) {
    if (!seen[m[1]]) {
      seen[m[1]] = true;
      ids.push(m[1]);
    }
  }
  return ids;
}

function cleanText_(text) {
  return String(text || "")
    .replace(/\u0000/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Upload original binaries to /api/ingest/upload so students can
 * download them only after social login.
 */
function uploadOriginalFiles_(message, webhookUrl, secret, postId, messageId) {
  var uploadUrl = String(webhookUrl).replace(/\/api\/ingest\/email\/?$/, "/api/ingest/upload");
  var blobs = message.getAttachments({
    includeInlineImages: false,
    includeAttachments: true,
  });
  var maxBytes = 3.5 * 1024 * 1024;

  for (var i = 0; i < blobs.length; i++) {
    var blob = blobs[i];
    var name = blob.getName() || "attachment";
    var lower = name.toLowerCase();
    var mime = (blob.getContentType() || "").toLowerCase();
    if (!isAllowedMaterial_(lower, mime)) continue;

    if (blob.getBytes().length > maxBytes) {
      Logger.log("Skip upload (too large >3.5MB): " + name);
      continue;
    }

    try {
      var form = {
        messageId: messageId,
        postId: postId,
        file: blob,
      };
      var res = UrlFetchApp.fetch(uploadUrl, {
        method: "post",
        headers: { Authorization: "Bearer " + secret },
        payload: form,
        muteHttpExceptions: true,
      });
      Logger.log("Upload " + name + " → " + res.getResponseCode() + " " + res.getContentText());
    } catch (err) {
      Logger.log("Upload failed for " + name + ": " + err);
    }
  }
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

/** Manual test helper — fake payload with attachment text */
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
      subject: "Test: Photosynthesis slides",
      from: "Student Contributor <student@example.com>",
      fromName: "Student Contributor",
      body: "Please find my slides attached.",
      receivedAt: new Date().toISOString(),
      attachments: [
        {
          name: "photosynthesis.pptx",
          type: "pptx",
          text:
            "--- Slide 1 ---\nPhotosynthesis\n--- Slide 2 ---\n6CO2 + 6H2O + light → C6H12O6 + 6O2\n--- Slide 3 ---\nChlorophyll absorbs light energy.",
        },
      ],
    }),
    muteHttpExceptions: true,
  });
  Logger.log(response.getResponseCode() + " " + response.getContentText());
}
