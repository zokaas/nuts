# Matka Pallakselle – projektimuistio

Päivitetty 19.11.2026. Tämä on kehityksen muisti: mitä on päätetty, miksi, ja mikä on kesken.
Lue tämä ennen muutoksia. Päivitä se, kun jokin päätös muuttuu.

## Tavoite ja urheilija
- Aloittaa nollakunnosta. Ohjelma alkaa **ma 23.11.2026** (ensimmäinen treeni; 17.–22.11. piilotettu ja niiden kirjaukset tyhjennetty käyttäjän pyynnöstä 22.11., migraatio habMig 7 – verikoetehtävän kuittaus säilytetään). Kehonhoitotavat (kasvot illalla, rullaus ti/to, jalkahoito su; `HABIT_V6`, habMig 6) alkavat myös 23.11. Tavat alkoivat 19.11. Lähtötaso: juoksee noin kerran viikossa, 7 km noin tunnissa muutamalla kävelytauolla, joten joulukuun ohjelma on noin 2 viikkoa alkuperäistä edellä (pidemmät juoksuosuudet, pitkä lenkki 50 → 85 min, viikkokm 0/12/12/20/22/23/27). Tammikuusta eteenpäin ennallaan.
- **Belgradin maraton** su 18.4.2027 klo 8.00 (välietappi).
- **Nuts Ylläs–Pallas 66 km** (Hetta → Pallas) pe 23.7.2027 klo 15.00 (päätavoite).
- Tukee myös yleistä terveellistä liikkumista: lajia voi vaihtaa (esim. uinti), ja Nutsin jälkeen on ylläpitotila.
- Käyttäjä haluaa lyhyet, selkeät vastaukset ja vaihtoehtoja. Kieli: suomi.

## Tekniikka lyhyesti
- PWA GitHub Pagesissa: https://zokaas.github.io/nuts/ (repo zokaas/nuts, haara main = tuotanto).
- Yksi tiedosto `index.html` rakennetaan `src/`-kansiosta: `python3 build.py`. **Muokkaa aina `src/`-tiedostoja, älä `index.html`:ää.**
  - `src/js/*.js` ja `src/css/*.css` liitetään aakkosjärjestyksessä. Numero kertoo paikan (00 perusta … 99 käynnistys).
  - `build.py` laskee sisällön tiivisteen → `version.json`, `BUILD`-vakio ja `sw.js`:n välimuistin nimi. Ei käsin kasvatettavaa versiota.
- Cloudflare Worker `strava-worker/worker.js` (nuts.bozic-zorana.workers.dev), julkaistaan automaattisesti GitHubista (Workers Builds): Strava-OAuth, pilvivarmuuskopio KV:hen, Web Push, iltamuistutus (cron, kerran päivässä, sunnuntaina viikkokatsaus), Intervals.icu-välitys `/icu/wellness`.
- Tallennus puhelimen localStorageen: `pallas.logs.v1`, `pallas.meta.v1`, `pallas.edits.v1`, `pallas.weekscale.v1`, `pallas.adjoff.v1`, `pallas.shoes.v1`, `pallas.gear.v1`.
- Testit: `CHROME=/usr/bin/google-chrome node --test tests/*.test.*` – laskenta (logic.js), Worker ja käyttöliittymä (Playwright, 390×844). GitHub Actions (`.github/workflows/testit.yml`) ajaa samat ja tarkistaa, että index.html on rakennettu.
- Juureen ei laiteta package.jsonia (Workers Builds voisi alkaa asentaa sitä). CI asentaa Playwrightin erilliseen kansioon.

## Tärkeät päätökset (älä riko vahingossa)
- **Päiväindeksi 0 = ti 17.11.2026.** `plan.json`:n rivi 0 on 17.11. Viikkokaavat (`weekOf`, `dow`) olettavat tämän. 17.–22.11. on piilotettu vakiolla `FIRST` (= 23.11.), viikko 1 kokonaan (`FIRST_W` = 2) – älä numeroi ohjelmaa uudelleen.
- **Verenluovutus siirretty myöhemmäksi** (päätös 19.11.2026: käyttäjä on sairastanut kolmesti kesän jälkeen). Ohjelma on alkuperäinen, Tarkistuspiste 1 pe 4.12. Kun luovutus ajoitetaan: päivä lepoa, seuraava kävely, 2 vk ei testejä, lisää päivä `DONATIONS`-listaan (40-terveys-tavat.js), jolloin ferritiinin lasku näytetään tietona eikä hälytyksenä. Ei 8 viikkoon ennen kisoja; rautatabletit suositeltavia.
- **Nutsin tavoiteaika alle 9 h** (päätös 19.11.2026; käyttäjä halusi ensin 8,5 h, joka on naisten kärkikymmenikön aika). Varatavoite alle 10 h. `NUTS_GOAL=540` (90-kisat-saa.js). Ultrajakso (27.4.–20.6.) sisältää torstain kynnystreenit, tiistain ylämäki- ja alamäkivedot, tavoitetehon osuudet pitkillä lenkeillä ja kolme kaksoispäivää. Mittari: Pirkan Taipaleen 30 km testi 26.6. alle 3:25 → alle 9 h realistinen; 3:25–3:50 → 9–10 h; yli → 10–11 h. Tavoite tarkistetaan päätöspisteessä 13.3. ja testissä 26.6. Käyttäjän sijoitustavoite: naisten top 30. Vuonna 2025 (hidas keli) 30. nainen 10:09:45 ja 9 h olisi ollut 12.–13. sija; 2026 (nopea keli, samat juoksijat noin 12–17 % nopeammin) 30. sija arviolta 8:45–9:00. 9 h on siis top 30 myös nopeana vuonna.
- **Kisasimulaatio pe 11.6.2027:** Nuuksio Classic -reitti 42 km (+820 m), lähtö klo 15 kuten Nutsissa, kisapäivän ateriat ja tankkaus. La 12.6. 1–1,5 h kaksoispäivä aamulla (illalla Foo Fighters -keikka Helsingissä), su 13.6. lepo. To 10.6. kevyt (kynnys pois tältä viikolta).
- **Sairastila** käynnistyy vain Vointi → 🤒 Sairas (tälle päivälle tai eiliselle). Erillinen "Olen kipeä" -nappi poistettiin (käyttäjä piti turhana). Peru-nappi ilmoituksessa; "Olen terve" samana päivänä perii kokonaan. Paluu: 2 pv / sairaspäivä, nuha 3–10 pv, kuume 7–14 pv (`sickRec`).
- **Teemat:** Vuodenaika (oletus: kaamos marras–tammi, ruska syys–loka, muuten tunturi), Tunturi, Ruska, Kaamos; vaalea/tumma/auto. Ei terrakotta-aksenttia, otsikot pienaakkosin.
- **Tavoiterenkaat poistettu** (turhat). Kuukautiskierto näkyy vain kierron alun tienoilla, ei joka päivä.
- **Kuukausikatsaus** vain sovelluksessa – käyttäjä ei halua jakaa eikä tallentaa kuvia.
- **Askeleita ei seurata.**

## Tietoturva
- Strava Client Secret vain Cloudflare Secretinä, ei koskaan repoon tai keskusteluun.
- Strava-yhdistämiskoodi sisältää tunnuksen – ei jaeta.
- Intervals.icu-API-avain pysyy vain puhelimessa (ei pilvivarmuuskopioon), ei liitetä keskusteluun.
- Käyttäjän sähköposti on yksityinen.

## Terveys
- Repo on julkinen: käyttäjän terveystiedot (verikoetulokset ym.) eivät kuulu tänne. Ne ovat vain puhelimessa ja yksityisessä SPORTTI-projektimuistiossa claude.ai:ssa.
- Verikoetehtävät sovelluksessa: veri1 (19.11.–31.12.2026), veri2 (1.2.–15.3.2027).

## Kesken
- ~~Hiustenpesu vk 5→~~ tehty 20.11.2026 (`PESU_V5`, migraatio habMig 5): ma öljy + ketokonatsoli, pe methi-naamio + mieto shampoo, joka toinen pe riisivesihuuhtelu.
- Käyttäjä päätti 19.11.2026 jättää pois: pimeysvaroitus, juoksu–kävely-ajastin, kipukartta, tankkausharjoittelu, varustelista, kisapäivän aikataulu, LDL/apoB-kentät, touko–kesäkuun verikoetehtävä, vastustuskyky-kortti, push-testi, pukeutumisopas, kalenteri-integraatio, Siri-pikakomento, "miksi tämä treeni" -selitykset, vastustuskykytavat. Käyttäjä ei halua nyt uusia ominaisuuksia: odota hänen omia havaintojaan käytöstä. Älä tarjoa niitä uudelleen ilman syytä.
- Ei testattu oikealla laitteella: iPhonen push-ilmoitukset, Intervals.icu oikeilla tunnuksilla.

## Työtapa
1. Muokkaa `src/`, aja `python3 build.py`.
2. Aja testit. Lisää testi `tests/ui.test.mjs`:ään, kun lisäät näkymän tai toiminnon.
3. Commit ja push mainiin → Pages päivittyy, sovellus näyttää "Uusi versio on valmis" -palkin.
