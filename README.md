# Matka Pallakselle

Oma treenisovellus Belgradin maratoniin (18.4.2027) ja Nuts Ylläs–Pallas 66 km -kisaan (23.7.2027).

Sovellus: https://zokaas.github.io/nuts/

## Asennus iPhoneen
1. Avaa osoite Safarissa.
2. Jaa → Lisää Koti-valikkoon → Lisää.
3. Käytä sovellusta kotinäytön kuvakkeesta.

## Tiedot
- Kirjaukset tallentuvat vain puhelimeen (ei palvelinta, ei tiliä).
- Historia → Tallenna varmuuskopio → tallenna iCloud Driveen. Uudessa puhelimessa: Palauta varmuuskopiosta.

## Tiedostot
- `index.html` – koko sovellus (ohjelma, logiikka, ulkoasu)
- `sw.js` – offline-toiminta
- `manifest.webmanifest`, `icons/` – kotinäytön kuvake

## Strava-yhteys (Suunto → Strava → sovellus)

Sovellus hakee treenit Stravasta automaattisesti. Stravan salainen avain ei voi olla julkisella sivulla, joten väliin tarvitaan pieni ilmainen Cloudflare Worker (`strava-worker/worker.js`).

### 1. Cloudflare Worker (n. 5 min)
1. Luo ilmainen tili: https://dash.cloudflare.com/sign-up
2. **Workers & Pages → Create → Create Worker**. Anna nimeksi esim. `pallakselle` → **Deploy**.
3. **Edit code**: korvaa koodi tiedoston `strava-worker/worker.js` sisällöllä → **Deploy**.
4. Kirjoita muistiin Workerin osoite, esim. `https://pallakselle.<tunnus>.workers.dev`.

### 2. Strava API -sovellus (n. 3 min)
1. Avaa https://www.strava.com/settings/api
2. Täytä: Application Name `Matka Pallakselle`, Category `Training`, Website `https://zokaas.github.io/nuts/`
3. **Authorization Callback Domain**: Workerin osoite ilman https://, esim. `pallakselle.<tunnus>.workers.dev`
4. Tallenna ja kopioi **Client ID** ja **Client Secret**.

### 3. Avaimet Workeriin
Workerin **Settings → Variables and Secrets → Add**:
- `STRAVA_CLIENT_ID` (Text): Client ID
- `STRAVA_CLIENT_SECRET` (**Secret**): Client Secret
- `APP_URL` (Text): `https://zokaas.github.io/nuts/`

→ **Deploy**.

### 4. Sovelluksessa
Historia → Strava → liitä Workerin osoite → **Yhdistä Strava** → hyväksy Stravassa. Valmis.

Suunto-sovelluksessa: Profiili → Yhteydet → Strava päälle, niin treenit kulkevat Suunnosta Stravaan automaattisesti.
