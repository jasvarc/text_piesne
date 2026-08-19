# Nasadenie na Ubuntu server (vedľa Home Assistanta / appky rozpravky)

Appka beží ako samostatný Node.js proces, ktorý počúva **iba na
`127.0.0.1:3001`** (nie je dostupný zvonka). Verejne prístupná appka je iba
cez existujúci Apache na portoch 80/443, na ceste `https://tvoj-server/text_piesne/`,
vďaka reverse proxy. Do `/var/www/html/text_piesne` sa nekopírujú statické
stránky priamo servované Apache-om (Node.js sám servíruje svoj frontend), ale
je to praktické miesto na uloženie appky vedľa `rozpravky` a tvojich
existujúcich stránok.

Appka nemá žiadne perzistentné dáta (nič neukladá na server). Voliteľne
používa `ANTHROPIC_API_KEY` (rovnaký kľúč ako appka rozpravky) na generovanie
slovenských prekladov jednotlivých vynechaných slov v hre - bez neho appka
funguje normálne, len bez týchto hintov.

## 1. Čo doinštalovať na Ubuntu (raz, pred prvým nasadením)

Ak si Node.js, git a Apache proxy moduly už nastavil (napr. pri appke
rozpravky), tento krok preskoč. Inak:

```bash
# Node.js LTS (cez oficiálny NodeSource repozitár)
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# git, ak ešte nemáš
sudo apt-get install -y git

# Apache moduly pre reverse proxy
sudo a2enmod proxy proxy_http
sudo systemctl restart apache2
```

Over si verzie:

```bash
node -v
npm -v
```

## 2. Naklonuj appku z gitu

Zdrojový kód appky je na `https://github.com/jasvarc/text_piesne` (verejné
repo). `node_modules/` nie je v repozitári (balíčky sú čisto JS bez natívnych
binárok), takže po klonovaní treba jednorazovo `npm install`:

```bash
cd /var/www/html
sudo git clone https://github.com/jasvarc/text_piesne.git text_piesne
cd text_piesne
sudo npm install --omit=dev
```

## 3. Spusti inštalačný skript

```bash
sudo bash deploy/install.sh
```

Skript:
- vytvorí `.env` (ak ešte neexistuje),
- nastaví vlastníka súborov na `www-data`,
- zaregistruje a spustí systemd službu `text_piesne` (počúva iba na
  `127.0.0.1:3001`, automaticky sa naštartuje aj po reštarte servera).

## 4. Doplň Anthropic API kľúč (voliteľné, pre slovenské hinty)

```bash
sudo nano /var/www/html/text_piesne/.env
# doplň ANTHROPIC_API_KEY=sk-ant-... (rovnaký kľúč ako v /var/www/html/rozpravky/.env)
sudo systemctl restart text_piesne
```

Bez tohto kroku appka funguje úplne normálne (vyhľadávanie, video, hra na
doplňovanie slov), len sa pri vynechaných slovách nezobrazí malý slovenský
prekladový hint.

## 5. Nastav Apache reverse proxy

Otvor svoje existujúce Apache vhost súbory (typicky
`/etc/apache2/sites-enabled/000-default.conf` pre port 80 a príslušný
`*-le-ssl.conf` pre port 443, prípadne tvoje vlastné - tie isté, do ktorých si
už pridával konfiguráciu pre `rozpravky`) a do **každého** `<VirtualHost>`
bloku, cez ktorý má byť appka dostupná, pred `</VirtualHost>` vlož obsah z
`deploy/apache-text_piesne.conf`:

```apache
ProxyPass /text_piesne/ http://127.0.0.1:3001/
ProxyPassReverse /text_piesne/ http://127.0.0.1:3001/
```

Ak ti port 80 vhost iba presmerováva na https, stačí tieto riadky pridať len
do `:443` vhostu.

Potom:

```bash
sudo apache2ctl configtest
sudo systemctl restart apache2
```

## 6. Over, že appka beží

```bash
sudo systemctl status text_piesne
```

Otvor v prehliadači `https://tvoj-server/text_piesne/` (alebo `http://`, podľa
toho, ktorý vhost si upravil). Priamo `http://tvoj-server:3001` už nebude
z vonku dostupné vôbec — appka počúva iba na loopbacku.

## Riešenie problémov

```bash
sudo journalctl -u text_piesne -f
```

Skontroluj aj Apache error log:

```bash
sudo tail -n 50 /var/log/apache2/error.log
```

## Užitočné príkazy

```bash
# logy appky
sudo journalctl -u text_piesne -f

# reštart appky
sudo systemctl restart text_piesne

# zastavenie appky
sudo systemctl stop text_piesne
```

## Aktualizácia appky v budúcnosti

Keď pribudnú zmeny v git repozitári, stačí:

```bash
cd /var/www/html/text_piesne
bash deploy/update.sh
```

Skript stiahne najnovšiu verziu (`git pull`), obnoví vlastníctvo súborov na
`www-data` a appku reštartuje. Ak appka pribudla node závislosť (zmenil sa
`package.json`), treba po pulli naviac spustiť `sudo npm install --omit=dev`.
