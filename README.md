# Bharat: Rooted in Heritage, Inspired for the Future

A free, volunteer-run community gurukul: twelve Sunday-morning gatherings in 2027, from the Vedas to the Buddha, with the Ramayana and Mahabharata at the heart of the year. No fees, no sponsors, only seva.

This repository is the programme's website. People can:

- read every month's teaching, verses, stories and circle activities;
- **register** their family;
- **RSVP** for each gathering with a headcount;
- **sign up for seva** roles each month and see which roles still need people;
- track the month's 30-day **sankalp** on their phone;
- send a **question for the Acharya**, a suggestion, or an offer to perform or lend something;
- **share** any page on WhatsApp and download the print materials.

It works like the Durga Puja site: a single page on GitHub Pages, with a Google Sheet (through Google Apps Script) collecting registrations.

## What is where

| Path | What it is | Who edits it |
| --- | --- | --- |
| `programme.json` | All content: dates, venue, contacts, the 12 months, seva roles, life questions, and the `scriptUrl` for registrations | Organisers, on GitHub |
| `index.html` | The website (mobile-first book you swipe through) | Rarely |
| `backend/Code.gs` | Apps Script that receives registrations, RSVPs, seva sign-ups and questions | Once, at set-up |
| `backend/Workbook.gs` | Apps Script that builds the organisers' dashboards in the sheet | Once, at set-up |
| `docs/` | Print materials (handbook, brochure, year poster, launch poster) and the research report | When reprinted |
| `assets/` | App icons | Rarely |

## Updating the programme (no coding needed)

1. On GitHub, open `programme.json` and click the pencil icon.
2. Change what you need, for example the venue, a contact number, a month's Acharya notes or a seva role's `need`.
3. Click **Commit changes**. The website updates within a minute or two.

Before launch, replace every placeholder in `programme.json`: `[LOCALITY]`, `[VENUE NAME]`, `[ADDRESS]`, `[NAME]`, `[PHONE]`.

## Turning on registrations (about 10 minutes, once)

Until this is done, the site still works, and people's choices are saved on their own phone only.

1. Create a new Google Sheet, for example **Bharat Gurukul 2027**.
2. In the sheet: **Extensions → Apps Script**. Replace the code in `Code.gs` with `backend/Code.gs` from this repository and save.
3. Add a second file (**+ → Script**), name it `Workbook`, and paste `backend/Workbook.gs`. Save.
4. In the function list choose **setOrganiserKey** and press **Run**. Approve the permissions.
5. Open **Project Settings → Script properties** and change `ORG_KEY` to a secret phrase that only organisers know.
6. **Deploy → New deployment → Web app**. Set *Execute as*: **Me**, *Who has access*: **Anyone**. Click **Deploy** and copy the `/exec` address.
7. Paste that address into `programme.json` as `"scriptUrl"` and commit.
8. Reload the sheet. A **Gurukul** menu appears. Choose **Gurukul → Rebuild reports** whenever you want fresh dashboards.

When you change `Code.gs` later: **Deploy → Manage deployments → pencil → Version: New version → Deploy**. The address stays the same.

### What the sheet contains

- **Written by the website:** `Families`, `RSVPs`, `Seva`, `Questions`. Do not rename these tabs.
- **Reports (rebuilt from the menu):** `Dashboard`, `By Month` (families and people coming, food for 75%, sevaks filled), `Seva Roster` (month × role grid, gaps highlighted).
- **Working tabs (created once, then yours):** `Tasks` (set-up checklist), `Acharyas`, `Materials`, `Seva Kosh` (open accounts), `Core Team`.

## Organiser tools on the website

Open the site address with `#organiser` at the end (for example `https://<user>.github.io/bharat-gurukul/#organiser`). Enter the organiser key to see every month's RSVPs and seva names and remove wrong entries. The key is checked by the Google Sheet and is never stored in this repository.

## Privacy and safeguarding

- The website only ever shows family names and headcounts. Phone numbers, areas and questions stay in the Google Sheet, visible to organisers.
- Photo consent is recorded at registration; children are never named or tagged online.
- Every volunteer signs a code of conduct, and no volunteer is ever alone with a child.

## Accuracy of verses and stories

Ramayana references follow Valmiki (Gita Press sarga numbers). Mahabharata references follow the BORI critical edition (CE chapter.verse). Later or regional stories are labelled as such. See `docs/research-making-it-attractive.md` for the sources, and have an Acharya review the verses before printing.

## Running the site on your computer

```bash
python3 -m http.server 8765
```

Then open http://localhost:8765.
