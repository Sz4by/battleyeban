# 1. lépés: Induljunk ki a Playwright hivatalos "dobozából".
# Ebben már benne van:
# - A legújabb Ubuntu (Operációs rendszer)
# - A legújabb Node.js
# - Az ÖSSZES rendszerkönyvtár (`libnss3` és a többi)
# - A Playwright és a böngészők (Chromium)
FROM mcr.microsoft.com/playwright/javascript:jammy
# 2. lépés: Állítsunk be egy munkamappát a "dobozon" belül
WORKDIR /app

# 3. lépés: Másoljuk be a package.json-t, ami leírja, mik kellenek
COPY package*.json ./

# 4. lépés: Telepítsük a botunk függőségeit (pl. discord.js)
# (A Playwright-ot is telepíti, de ez nem baj)
RUN npm install

# 5. lépés: Másoljuk be a botunk többi kódját (index.js, deploy-commands.js)
COPY . .

# 6. lépés: Ez a parancs fog elindulni, amikor a Render elindítja a "dobozt"
CMD ["npm", "start"]
