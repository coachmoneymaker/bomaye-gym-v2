#!/usr/bin/env node
/**
 * BESTANDSMITGLIEDER EINMALIG IN DIE MERKLISTE EINLESEN
 * ─────────────────────────────────────────────────────
 *
 * WOZU
 * api/bsport-webhook.js unterscheidet eine Neuanmeldung von einer
 * Verlaengerung an einer Liste in Vercel KV: steht ein Kunde schon darin, ist
 * seine Zahlung wiederkehrend. Bestandsmitglieder stehen dort naturgemaess
 * nicht - bei ihrer ersten Abbuchung nach dem Deployment sehen sie aus wie
 * Neuanmeldungen. Genau das ist am 24.09.2026 passiert.
 *
 * Dieses Skript schliesst die Luecke von vorn: es liest die vorhandenen
 * Mitglieder aus einer Backoffice-Liste und legt sie in dieselbe Ablage.
 * Danach ist die Unterscheidung ab der ersten Abbuchung richtig.
 *
 * Es laeuft EINMAL, von Hand, lokal. Es gibt dafuer bewusst keinen Endpunkt
 * in der Website: ein Zugang, der in die Ablage schreiben darf, waere dauerhaft
 * offen fuer eine Aufgabe, die genau einmal anfaellt.
 *
 *
 * SCHRITT 1 — LISTE AUS BSPORT HOLEN
 *
 * ── DAS WICHTIGSTE AN DIESEM SKRIPT ──────────────────────────────────────
 * In die Liste gehoeren AUSSCHLIESSLICH Leute, die schon einmal BEZAHLT
 * haben - Mitglieder mit Vertrag, Abo oder gekauftem Paket.
 *
 * Keine Probetrainings-Leads. Keine Newsletter-Kontakte. Nicht "alle
 * Kontakte".
 *
 * Grund: wer hier drinsteht, gilt fuer immer als Bestandsmitglied. Ein
 * Probetrainings-Gast, der spaeter wirklich Mitglied wird, wuerde dann als
 * "wiederkehrende Zahlung" gemeldet statt als neue Mitgliedschaft - und das
 * ist die eine Mail, die du am wenigsten verpassen willst.
 *
 * Im Zweifel also die kleinere Liste nehmen. Wer fehlt, wird hoechstens
 * einmal falsch als neu gemeldet; wer zu Unrecht drinsteht, bleibt dauerhaft
 * falsch.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Im Backoffice (backoffice.bsport.io), in dieser Reihenfolge der Eignung:
 *   1. Exports -> Abonnements ("subscriptions"). Enthaelt per Definition nur
 *      Leute mit Vertrag - der sauberste Weg.
 *   2. Reporting -> Bericht "Kaeufe der Mitglieder" -> exportieren.
 *   3. Smartlist mit Filter auf eine aktive Mitgliedschaft -> "Export list".
 *      Nur mit Filter; eine Smartlist ohne Filter enthaelt auch die Leads.
 *
 * Wichtig ist nur, dass die Datei eine Spalte mit der MAILADRESSE enthaelt.
 * Eine Kundennummer wird mitgenommen, wenn sie dabei ist, ist aber nicht
 * noetig - siehe unten.
 *
 * Kommt die Datei als .xlsx: in Excel/Numbers oeffnen und als CSV speichern.
 * Semikolon oder Komma als Trennzeichen sind beide in Ordnung.
 *
 *
 * SCHRITT 2 — ZUGANGSDATEN DER ABLAGE
 * Vercel -> Projekt -> Settings -> Environment Variables. Kopiere die Werte
 * von KV_REST_API_URL und KV_REST_API_TOKEN.
 *
 *
 * SCHRITT 3 — ERST ANSCHAUEN, DANN SCHREIBEN
 *   export KV_REST_API_URL='...'
 *   export KV_REST_API_TOKEN='...'
 *
 *   node scripts/bestand-einlesen.mjs mitglieder.csv
 *       Liest nur. Zeigt, welche Spalten erkannt wurden, wie viele Zeilen
 *       brauchbar sind und welche Schluessel entstehen wuerden. Schreibt
 *       nichts.
 *
 *   node scripts/bestand-einlesen.mjs mitglieder.csv --schreiben
 *       Schreibt.
 *
 * Mehrmals ausfuehren ist harmlos: geschrieben wird mit NX, ein vorhandener
 * Eintrag wird also nie ueberschrieben.
 *
 *
 * WARUM MAILADRESSE UND KUNDENNUMMER
 * Ob die Nummer in der Backoffice-Liste dieselbe ist wie die Kundennummer im
 * Rechnungs-Webhook (obj.customer.id), ist nicht bestaetigt - Backoffice-
 * Listen fuehren gern eine eigene Mitgliedsnummer. Die Mailadresse steht
 * dagegen in beiden Quellen sicher. Deshalb werden beide Wege angelegt und
 * der Webhook fragt beide ab (siehe erstmalsGesehen() dort). Ist die Nummer
 * die falsche, traegt die Mailadresse; ist sie die richtige, traegt sie mit.
 *
 * Mailadressen werden NICHT im Klartext abgelegt, sondern als
 * bsport:mitglied:mail:<sha256(kleingeschriebene adresse)> - dieselbe
 * Schluesselform, die der Webhook bildet.
 *
 * Die Mailschluessel werden vom Webhook ausschliesslich GELESEN, nie
 * geschrieben: sie beantworten nur "war vor dem Einlesen schon Mitglied?".
 * Laufend zaehlt allein die Kundennummer. Sonst waeren zwei Mitglieder unter
 * einer Adresse - Eltern und Kind etwa - dasselbe Mitglied.
 *
 *
 * WENN ETWAS FALSCH DRIN LANDET
 * Ein einzelner Eintrag laesst sich in der Vercel-Oberflaeche loeschen
 * (Storage -> die KV-Datenbank -> Data Browser, nach "bsport:mitglied:"
 * suchen). Das Skript loescht bewusst nichts.
 */

import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const argv = process.argv.slice(2);
const datei = argv.find((a) => !a.startsWith('-'));
const schreiben = argv.includes('--schreiben');

if (!datei) {
  console.error('Aufruf: node scripts/bestand-einlesen.mjs <datei.csv> [--schreiben]');
  process.exit(2);
}

const kvUrl   = process.env.KV_REST_API_URL || '';
const kvToken = process.env.KV_REST_API_TOKEN || '';
if (schreiben && (!kvUrl || !kvToken)) {
  console.error('KV_REST_API_URL und KV_REST_API_TOKEN fehlen - ohne sie kann nicht geschrieben werden.');
  process.exit(2);
}

/* ── CSV lesen ───────────────────────────────────────────────────────────
   Absichtlich ohne Bibliothek, aber mit den drei Faellen, die an einem
   Excel-Export wirklich vorkommen: BOM am Dateianfang, Semikolon statt
   Komma, und Werte in Anfuehrungszeichen (mit "" als eingebettetes
   Anfuehrungszeichen und Zeilenumbruechen innerhalb des Feldes). */
function csvLesen(text) {
  const t = text.replace(/^﻿/, '');
  const kopfzeile = t.slice(0, t.search(/\r?\n/) === -1 ? t.length : t.search(/\r?\n/));
  const trenner = (kopfzeile.match(/;/g) || []).length > (kopfzeile.match(/,/g) || []).length ? ';' : ',';

  const zeilen = [];
  let feld = '', zeile = [], inAnf = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (inAnf) {
      if (c === '"') {
        if (t[i + 1] === '"') { feld += '"'; i++; } else { inAnf = false; }
      } else feld += c;
      continue;
    }
    if (c === '"') { inAnf = true; continue; }
    if (c === trenner) { zeile.push(feld); feld = ''; continue; }
    if (c === '\n' || c === '\r') {
      if (c === '\r' && t[i + 1] === '\n') i++;
      zeile.push(feld); feld = '';
      if (zeile.some((f) => f.trim() !== '')) zeilen.push(zeile);
      zeile = [];
      continue;
    }
    feld += c;
  }
  zeile.push(feld);
  if (zeile.some((f) => f.trim() !== '')) zeilen.push(zeile);
  return { zeilen, trenner };
}

/* ── Spalten erkennen ────────────────────────────────────────────────────
   Bsports Backoffice gibt es auf Deutsch, Englisch und Franzoesisch aus, und
   die Spaltennamen unterscheiden sich je Exportweg. Deshalb wird nach Mustern
   gesucht statt nach festen Namen - und bei der Kundennummer bewusst streng:
   eine falsche Spalte (Rechnungsnummer, Vertragsnummer) wuerde Schluessel
   anlegen, die nie ein Ereignis trifft. */
const MAIL_MUSTER = /(e-?mail|mail|courriel)/i;
const ID_MUSTER   = /^(customer[ _-]?id|client[ _-]?id|member[ _-]?id|mitglied(s)?[ _-]?(id|nummer|nr\.?)|kunden[ _-]?(id|nummer|nr\.?)|user[ _-]?id|id)$/i;

function spalteFinden(kopf, muster) {
  for (let i = 0; i < kopf.length; i++) {
    if (muster.test(String(kopf[i] || '').trim())) return i;
  }
  return -1;
}

const roh = readFileSync(datei, 'utf8');
const { zeilen, trenner } = csvLesen(roh);
if (zeilen.length < 2) {
  console.error(`${datei}: keine Datenzeilen gefunden.`);
  process.exit(1);
}
const kopf = zeilen[0].map((h) => String(h || '').trim());
const iMail = spalteFinden(kopf, MAIL_MUSTER);
const iId   = spalteFinden(kopf, ID_MUSTER);

console.log(`Datei     ${datei}`);
console.log(`Trenner   "${trenner}"`);
console.log(`Spalten   ${kopf.join(' | ')}`);
console.log(`Mail      ${iMail === -1 ? 'NICHT GEFUNDEN' : `Spalte ${iMail + 1} ("${kopf[iMail]}")`}`);
console.log(`Nummer    ${iId   === -1 ? 'nicht gefunden (nur Mailadressen werden angelegt)' : `Spalte ${iId + 1} ("${kopf[iId]}")`}`);
console.log('');

if (iMail === -1 && iId === -1) {
  console.error('Weder eine Mail- noch eine Nummernspalte erkannt. Bitte die Kopfzeile');
  console.error('der Datei zeigen - dann ergaenze ich das Muster.');
  process.exit(1);
}

/* ── Schluessel bilden ───────────────────────────────────────────────── */
const mailKey = (e) => `bsport:mitglied:mail:${createHash('sha256').update(String(e).trim().toLowerCase()).digest('hex')}`;
const idKey   = (i) => `bsport:mitglied:${String(i).trim()}`;

const schluessel = new Set();
/* Zum Anschauen: was wurde je Zeile wirklich gelesen. Ein Hash allein zeigt
   nicht, ob die richtige Spalte erwischt wurde. */
const gelesen = [];
let zeilenGelesen = 0, mails = 0, ids = 0, ohneAlles = 0;

for (const z of zeilen.slice(1)) {
  zeilenGelesen++;
  const mail = iMail === -1 ? '' : String(z[iMail] || '').trim();
  const id   = iId   === -1 ? '' : String(z[iId]   || '').trim();
  if (gelesen.length < 5) gelesen.push({ mail, id });
  let etwas = false;
  /* Nur was wie eine Adresse aussieht - eine Kopfzeile in der Mitte des
     Exports oder ein Platzhalter wie "-" soll keinen Schluessel erzeugen. */
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) { schluessel.add(mailKey(mail)); mails++; etwas = true; }
  /* Und nur reine Zahlen - "ABC-123" ist keine Bsport-Kundennummer. */
  if (/^\d+$/.test(id)) { schluessel.add(idKey(id)); ids++; etwas = true; }
  if (!etwas) ohneAlles++;
}

console.log(`Datenzeilen        ${zeilenGelesen}`);
console.log(`brauchbare Mails   ${mails}`);
console.log(`brauchbare Nummern ${ids}`);
console.log(`Zeilen ohne beides ${ohneAlles}`);
console.log(`Schluessel gesamt  ${schluessel.size}`);
console.log('');

const liste = [...schluessel];
console.log('So wurden die ersten Zeilen gelesen - bitte kurz vergleichen:');
for (const g of gelesen) {
  console.log(`  Mail "${g.mail}"   Nummer "${g.id}"`);
}
console.log('');

/* Der Hinweis steht nicht nur im Dateikopf, sondern vor jedem Lauf - er ist
   die einzige Annahme, die dieses Skript nicht selbst pruefen kann. */
console.log('ACHTUNG: In dieser Liste duerfen nur Leute stehen, die schon einmal BEZAHLT');
console.log('haben. Probetrainings-Leads gehoeren NICHT hinein - sie wuerden bei ihrer');
console.log('spaeteren echten Anmeldung als "wiederkehrende Zahlung" gemeldet.');
console.log('');

if (!schreiben) {
  console.log('Nur angeschaut - nichts geschrieben.');
  console.log('Wenn die Spalten stimmen: denselben Aufruf mit --schreiben wiederholen.');
  process.exit(0);
}

/* ── Schreiben ───────────────────────────────────────────────────────────
   Upstash nimmt mehrere Befehle je Anfrage ueber /pipeline. In Haeppchen,
   damit auch eine Liste mit einigen Tausend Mitgliedern durchgeht. NX, damit
   ein zweiter Lauf vorhandene Eintraege nicht zurueckdatiert. */
const JETZT = Date.now();
const HAEPPCHEN = 200;
let gesetzt = 0, schonDa = 0;

for (let i = 0; i < liste.length; i += HAEPPCHEN) {
  const teil = liste.slice(i, i + HAEPPCHEN);
  const res = await fetch(`${kvUrl.replace(/\/$/, '')}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${kvToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(teil.map((k) => ['set', k, JETZT, 'nx'])),
  });
  const text = await res.text();
  if (!res.ok) {
    console.error(`\nAbbruch bei Schluessel ${i + 1}: HTTP ${res.status} ${text.slice(0, 300)}`);
    console.error(`${gesetzt} Schluessel waren bis dahin neu geschrieben - ein erneuter Lauf`);
    console.error('macht dort weiter, ohne Schaden (NX).');
    process.exit(1);
  }
  let antwort;
  try { antwort = JSON.parse(text); } catch { antwort = []; }
  for (const e of (Array.isArray(antwort) ? antwort : [antwort])) {
    if (e && e.result) gesetzt++; else schonDa++;
  }
  process.stdout.write(`\r${Math.min(i + HAEPPCHEN, liste.length)} / ${liste.length}`);
}

console.log('');
console.log('');
console.log(`neu geschrieben    ${gesetzt}`);
console.log(`war schon da       ${schonDa}`);
console.log('');
console.log('Fertig. Ab jetzt gelten diese Mitglieder als bekannt: ihre naechste');
console.log('Abbuchung wird als "Zahlung erhalten … wiederkehrend" gemeldet, nicht');
console.log('als neue Mitgliedschaft.');
