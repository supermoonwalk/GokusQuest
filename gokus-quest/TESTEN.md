# Goku's Quest zelf testen

## ⚡ Snel starten (als je het al eens geïnstalleerd hebt)

Open **PowerShell** via het startmenu en typ, regel voor regel (Enter na elke regel):

```powershell
cd ~\GokusQuest\gokus-quest
npm run dev
```

Open daarna **http://localhost:5173** in je browser. Laat PowerShell openstaan zolang je speelt; stoppen met **Ctrl + C**.

**Nieuwste versie ophalen** (als er iets nieuws gemaakt is), vóór `npm run dev`:

```powershell
cd ~\GokusQuest
git pull
cd gokus-quest
npm install
npm run dev
```

### Waar ben ik in PowerShell?
Wat vóór het `>`-teken staat, is de map waarin je zit. Bijvoorbeeld `PS C:\Users\jouwnaam\GokusQuest\gokus-quest>`.
- `cd ~` brengt je altijd terug naar je eigen map.
- `cd ..` gaat één map omhoog.
- Kwijt? Sluit PowerShell en open hem opnieuw.
- Staat er `C:\WINDOWS\system32`? Typ eerst `cd ~`.

---

Er zijn **twee verschillende plekken** waar je iets typt:

| Waar | Wat je daar typt | Hoe open je het |
|---|---|---|
| **PowerShell** (of Terminal) | De installatie- en startcommando's (`git`, `npm`) | Startmenu → "PowerShell" |
| **Browserconsole** | De cheats (`cheat.…`) | In de browser met het spel open: **F12** → tabblad **Console** |

De cheats werken dus **niet** in PowerShell, alleen in de browser terwijl het spel draait.

---

## 1. Eenmalig: programma's installeren

- **Git**: https://git-scm.com/download/win
- **Node.js** (de LTS-versie): https://nodejs.org

Sluit PowerShell daarna en open hem opnieuw, zodat hij de nieuwe programma's kent.

## 2. Eenmalig: het spel ophalen

Open PowerShell via het startmenu (**niet** "als administrator"). Typ regel voor regel:

```powershell
cd ~
git clone https://github.com/supermoonwalk/GokusQuest.git
cd GokusQuest
git checkout claude/happy-tesla-76yyv2
cd gokus-quest
npm install
```

## 3. Spelen

```powershell
cd ~\GokusQuest\gokus-quest
npm run dev
```

Open **http://localhost:5173** in je browser. Laat het PowerShell-venster open zolang je speelt; stoppen doe je met **Ctrl + C**.

## 4. De nieuwste versie ophalen

Als er iets nieuws gemaakt is:

```powershell
cd ~\GokusQuest
git checkout claude/happy-tesla-76yyv2
git pull
cd gokus-quest
npm install
npm run dev
```

> Werk je liever vanaf `main`? Dan moet de pull request eerst samengevoegd zijn. Tot die tijd staat het nieuwste werk op de branch `claude/happy-tesla-76yyv2`.

### Foutmelding "Permission denied" of `EPERM ... C:\WINDOWS\system32`?
PowerShell staat dan in de Windows-systeemmap (dat gebeurt als je hem als administrator opent). Typ eerst
`cd ~` om naar je eigen map te gaan, en doe de stappen daarna opnieuw.

### Foutmelding "running scripts is disabled on this system"?
Dan blokkeert Windows het `npm`-script. Eenmalig oplossen in PowerShell:
```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```
(Typ `J` of `Y` als hij om bevestiging vraagt.)

---

## Besturing

| Toets | Actie |
|---|---|
| WASD / pijltjes | Lopen |
| Spatie | Klauwen (aanvallen, lantaarns, runen, klokken, schelpen) |
| E | Praten / openen / gebruiken |
| J / K | Speciale aanvallen |
| T | Treat eten |
| Q / I / M | Quest / tas / kaart |
| Esc | Menu: opslaan, savebestanden, instellingen (en terug/sluiten) |

---

## Cheats (browserconsole, F12 → Console)

De cheats werken alleen in de testversie (`npm run dev`), niet in een uitgebrachte versie.
Typ in de console:

```js
cheat.help()
```

| Commando | Wat het doet |
|---|---|
| `cheat.sterk()` | Alle upgrades op max, volle HP, 999 munten, 9 treats |
| `cheat.geld(500)` | Munten erbij |
| `cheat.heel()` | HP en CHI vol |
| `cheat.onkwetsbaar()` | Aan/uit: je verliest geen HP |
| `cheat.winkels()` | Alle dorpelingen gered: alle winkels open |
| `cheat.meubels()` | Alle meubels + de extra kamer |
| `cheat.naar("plek")` | Spring naar een plek in het verhaal (zie hieronder) |
| `cheat.eb()` / `cheat.vloed()` | Getij forceren (in Zeeland) |
| `cheat.waar()` | Waar ben je: kaart, tegel en quest |
| `cheat.wis()` | Save wissen en opnieuw beginnen |

### Springen met `cheat.naar(...)`

Een sprong zet ook alle verhaalstappen tot dat punt goed (verslagen bazen, open poorten, quest), zodat het
spel daarna gewoon klopt.

| Plek | Waar je terechtkomt |
|---|---|
| `"dorp"` | Het dorp (begin van het spel) |
| `"hut"` | Goku's hut |
| `"markt"` | De Marktstraat (huizen van de dorpelingen; met `cheat.winkels()` staan ze er allemaal) |
| `"bos"` | Whiskerwood, net na de aanwijzingen in Chi Chi's huisje |
| `"tom"` | Vlak voor Tom's open plek |
| `"kasteel"` | Vesper's kasteelterrein (na Tom) |
| `"vesper"` | De troonzaal, vlak voor Vesper |
| `"elderwood"` | Begin van hoofdstuk III (na Vesper) |
| `"thornmane"` | Voor de lair van Thornmane (Elderwood klaar op hem na) |
| `"zeeland"` | De kustweg naar Zeeland (na Thornmane) |
| `"koningin"` | Voor de troonzaal van de Getijdenkoningin |

Handige combinatie om een eindbaas te testen:
```js
cheat.sterk(); cheat.naar("koningin")
```

### Iets raar door een oude save?
```js
cheat.wis()
```

---

## Automatische test

Wil je controleren dat alles nog werkt zonder zelf te spelen? Dan speelt de computer het hele spel na:

```powershell
npx playwright install chromium    # eenmalig
npm test
```

Elke regel met `ok` is een geslaagde controle. Onderaan staat `all checks passed` als alles goed is.
