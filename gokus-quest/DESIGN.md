# Goku's Quest — Ontwerp & verhaal

**Visie:** een top-down open-world roguelike met een verhaal. Een warm katten-dorp dat groeit naarmate je
verder komt, een eigen huis dat je inricht, gevaarlijke gebieden eromheen, en een verhaal dat je
vooruit trekt. Na de redding van Chi Chi speel je samen (co-op).

**Kernlus:** op pad gaan (vechten, verkennen, puzzels) → munten en materialen verdienen → terug naar het
dorp → huis en dorp uitbouwen → sterker opnieuw op pad. Doodgaan stuurt je naar huis en de vijanden
komen terug (roguelike), maar je huis en dorp blijven: dat is je blijvende vooruitgang.

---

## Het verhaal tot nu toe (hoofdstuk I & II)

1. **Ochtend in het dorp.** Chi Chi komt niet opdagen bij het ontbijt. Ze mist nóóit visdag.
2. **Whiskers** (marktkoopman) hoorde vannacht lawaai bij Chi Chi's huisje, geeft Goku treats en opent zijn kraam.
3. **Het huisje is overhoop gehaald.** Aanwijzingen: twee theekopjes met een zware **lavendelgeur**
   (bezoek, en wel een chique), een omgevallen stoel, krabsporen, Chi Chi's rode **lintje**, en een raam dat van
   buitenaf is ingeslagen met zwart-witte plukjes vacht → **Tuxedo Tom**.
4. **Whiskerwood.** Goku duwt de omgevallen boomstam opzij en vecht zich door Tom's bende. Tom wacht in zijn
   open plek, met Chi Chi in een kooi naast zich.
5. **Twist.** Verslagen zegt Tom dat hij alleen maar "haalt" voor zijn meesteres. **Madame Vesper** verdwijnt met
   Chi Chi in de schaduw. Er gaat een donkere poort naar haar landhuis open.
6. **Hoofdstuk II: Vesper's landhuis.** Goku herinnert zich het spelletje van vroeger (rondtollen en de deur
   dichtsmijten) → **180 Door Slam**. Hij bevrijdt de gekooide kittens en vindt Vesper (de lavendelgeur!) op
   haar troon.
7. **Finale.** Vesper valt, alle sloten springen open, Chi Chi rent naar Goku, hij geeft haar het lintje terug,
   de kittens komen erbij en samen lopen ze bij zonsopgang naar huis.

### Plotholes die zijn opgelost
| Probleem | Oplossing |
|---|---|
| "Chi Chi kwam vannacht niet thuis", maar het huisje is háár huis | Ze kwam niet ontbijten; Goku gaat bij haar kijken |
| De boomstam "rolde vanzelf weg" na een aanwijzing binnenshuis | Goku besluit hem zelf opzij te duwen |
| De theekopjes (bezoek) leidden nergens heen | Lavendelgeur → terug te zien bij Vesper |
| Het lintje had geen functie | Goku geeft het terug in de finale |
| Tom en Vesper renden op je af zodra je hun gebied in kwam | Ze wachten tot je hun arena betreedt, met eerst een confrontatie |
| Einde: "alle kooien gaan open", maar de tekst telde alleen jouw bevrijde kittens | Alle vijf gaan mee naar huis; de tekst zegt hoeveel jij zelf bevrijdde |
| Je kreeg Chi Chi nooit echt te zien na de eindbaas | Herenigingsscène + bewegend eindscherm |
| Handlangers vochten door tijdens de hereniging | Ze vluchten zodra Vesper valt |
| "180 Door Slam": "he KNOWS this one" zonder uitleg | Een spelletje dat ze als kittens speelden |

### Nog open (keuzes voor jou)
- ~~Waar woont Goku?~~ In zijn eigen hutje (fase 2).
- **Wie is Vesper eigenlijk, en waarom "verzamelt" ze katten?** Er ligt ruimte voor een groter mysterie in hoofdstuk III.
- **Waar komen de vijf kittens vandaan?** Ze zouden uit andere dorpen/gebieden kunnen komen → de wereld wordt groter.
- **Namen:** "Goku" en "Chi Chi" zijn Dragon Ball-namen. Voor een publieke release moet dat anders (zie README).

---

## Routekaart (één fase tegelijk, elke fase speelbaar)

### Fase 1: Opschonen ✅ (nu gedaan)
Bugs, botsingen, eindbazen die wachten, plotholes, herenigingsscène, eindscherm, opslaan, en een
automatische speltest (`npm test`).

### Fase 1b: Baas-cutscenes ✅
- **Tom's entree:** camera schuift naar zijn open plek, Chi Chi rammelt aan haar kooi, Tom draait zich om en komt op je af.
- **Na Tom:** Tom blijft verslagen liggen, Vesper verschijnt met een paarse flits, glijdt naar de kooi en verdwijnt
  met Chi Chi in rook; Tom sluipt achter haar aan; de camera toont hoe de poort naar het landhuis opengaat.
- **Vesper's entree:** de fakkels doven, het donker trekt samen rond de troon, Vesper staat op en al haar
  handlangers draaien zich naar je om.
- Een herkansing na doodgaan geeft alleen een korte zin, geen hele scène.

### Fase 2: Goku's eigen huis ✅ (eerste versie)
- Een kaal **hutje** met rieten dak en plankmuren rechtsboven in het dorp, met alleen een strozak.
  Een nieuw spel begint hier, en na doodgaan word je hier wakker.
- **Rusten** op de strozak herstelt je HP; met een bed ook je CHI.
- **Meubels** koop je bij Whiskers ("Home Goods") en ze verschijnen meteen op hun vaste plek:
  | Meubel | Prijs | Voordeel |
  |---|---|---|
  | Bed | 40 | Rusten vult ook CHI, +6 max HP |
  | Krabpaal | 50 | +1 aanval |
  | Visbak | 35 | Gratis treat na elke tocht (bos of landhuis) |
  | Kussen bij het raam | 40 | +2 max CHI |
  | Trofeeënplank | 25 | Toont verslagen eindbazen |
  | Geweven kleed | 15 | Gezellig |
  | Kattenkruid-plant | 12 | Gezellig |
- Een lege plek in de hut vertelt je welk meubel daar past en wat het kost.
- **Nog te doen:** uitbreiding met een extra kamer, meubels zelf verplaatsen, en Chi Chi die na de redding bij je intrekt.

### Fase 3: Het dorp groeit
- Bevrijde kittens en geredde katten **verhuizen naar het dorp**, elk met een eigen huisje en functie:
  smid (gear verbeteren), bakker (treats), kaartenmaker (wereldkaart), tuin (kruiden).
- Bouwplekken in het dorp die je met munten/materialen vrijspeelt.
- Het dorp verandert zichtbaar per hoofdstuk: meer huizen, licht 's avonds, kittens die rondlopen.

### Fase 4: Chi Chi als maatje (co-op)
- Na de redding loopt Chi Chi met je mee: eerst als **computergestuurde bondgenoot**.
- Daarna een **tweede speler op hetzelfde toetsenbord/controller** (lokale co-op).
- Samen-aanvallen en puzzels die je alleen met z'n tweeën kunt oplossen.

### Fase 5: Een grotere wereld (hoofdstuk III+)
- Nieuwe gebieden rond het dorp: rivier & haven, bergen, grotten, een stad met katten-adel.
- **Puzzels:** drukplaten, blokken schuiven, sleutels, lichtpuzzels in de grotten.
- **Roguelike-kerkers:** steeds anders opgebouwde lagen met een eindbaas, beloningen voor het dorp.
- Verhaal: Vesper was niet de enige "verzamelaar". De vijf kittens komen uit verschillende gebieden en
  Goku & Chi Chi brengen ze terug naar hun families.

### Later (techniek & release)
Touch/controller-besturing, geluid & muziek, pauze/instellingen-menu, fonts lokaal, namen wijzigen,
builds voor desktop/mobiel.
