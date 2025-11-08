const { Client, GatewayIntentBits, EmbedBuilder, InteractionType, Options } = require('discord.js');
const playwright = require('playwright');
require('dotenv').config();
const http = require('http');

// A szövegek, amiket keresünk
const BASE_URL = "https://battleye.dudx.info/n/";
const BANNED_TEXT = "Battleye banned.";
const NOT_BANNED_TEXT = "Not banned.";

// ===============================================
//  MÓDOSÍTOTT RÉSZ: Memória-takarékos kliens
// ===============================================

// Bot kliens létrehozása MINIMÁLIS cache-sel (RAM spórolás)
const client = new Client({
    intents: [GatewayIntentBits.Guilds], // Csak a minimális "szándék"
    makeCache: Options.cacheWithLimits(Options.DefaultCacheSettings) // <-- EZ VOLT A HIBA, MOST JAVÍTVA
    // Ez azt mondja a botnak, hogy ne cache-eljen (jegyezzen meg)
    // feleslegesen üzeneteket, felhasználókat, csatornákat stb.
});

// ===============================================
// VÉGE A MÓDOSÍTOTT RÉSZNEK
// ===============================================


// Bot indításának jelzése
client.once('ready', () => {
    console.log(`Bejelentkezve mint ${client.user.tag}!`);
    console.log('A bot készen áll.');
});

// Parancsok kezelése
client.on('interactionCreate', async interaction => {
    if (interaction.type !== InteractionType.ApplicationCommand) return;

    const { commandName } = interaction;

    if (commandName === 'bancheck') {
        // "Gondolkodik..." válasz, mert a Playwright lassú
        await interaction.deferReply();

        const username = interaction.options.getString('username');
        const url_to_check = `${BASE_URL}${username}`;
        let browser;

        try {
            console.log(`Böngésző indítása a célhoz: ${url_to_check}`);
            
            // A Docker-dobozon belüli böngésző indítása
            // Fontos: A '--no-sandbox' kell a Render környezetében
            browser = await playwright.chromium.launch({
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            const page = await browser.newPage();
            
            // Megpróbáljuk betölteni az oldalt
            try {
                // A 'networkidle' megvárja, míg az oldal "lenyugszik" (anti-bot betölt)
                await page.goto(url_to_check, { waitUntil: 'networkidle', timeout: 15000 });
            } catch (error) {
                // Ha 15mp alatt nem tölt be (az anti-bot oldal miatt),
                // adunk neki még pár másodpercet és folytatjuk
                console.log("Időtúllépés... valószínűleg a védelem miatt, de folytatjuk.");
                await page.waitForTimeout(3000); // 3 másodperc várakozás
            }

            // Kiolvassuk az oldal tartalmát
            const content = await page.content();
            await browser.close();
            
            console.log("Oldal tartalmának elemzése...");

            // 1. Ellenőrizzük, hogy TILTVA van-e
            if (content.includes(BANNED_TEXT)) {
                const embed = new EmbedBuilder()
                    .setTitle("Ban Ellenőrzés: Eredmény")
                    .setDescription(`A(z) **${username}** nevű felhasználó **TILTVA VAN**.`)
                    .setColor(0xFF0000) // Piros
                    .setURL(url_to_check)
                    .setThumbnail("https://i.imgur.com/O30mP2H.png"); // Piros X
                
                await interaction.editReply({ embeds: [embed] });

            // 2. Ellenőrizzük, hogy NINCS TILTVA-e
            } else if (content.includes(NOT_BANNED_TEXT)) {
                const embed = new EmbedBuilder()
                    .setTitle("Ban Ellenőrzés: Eredmény")
                    .setDescription(`A(z) **${username}** nevű felhasználó **NINCS TILTVA**.`)
                    .setColor(0x00FF00) // Zöld
                    .setURL(url_to_check)
                    .setThumbnail("https://i.imgur.com/QJdJdCj.png"); // Zöld pipa

                await interaction.editReply({ embeds: [embed] });

            // 3. Ha egyik sem (pl. nem létező user)
            } else {
                const embed = new EmbedBuilder()
                    .setTitle("Ban Ellenőrzés: Ismeretlen Eredmény")
                    .setDescription(`Nem sikerült egyértelműen megállapítani a(z) **${username}** nevű felhasználó státuszát.\nLehetséges okok:\n- A felhasználó nem létezik.\n- Az anti-bot oldal nem engedett át.\n- A weboldal megváltozott.`)
                    .setColor(0xFFA500) // Narancs
                    .setURL(url_to_check);
                
                await interaction.editReply({ embeds: [embed] });
            }

        } catch (error) { (error);
            if (browser) await browser.close(); // Hiba esetén is zárjuk be a böngészőt
            await interaction.editReply(`Kritikus hiba történt a lekérdezés közben: ${error.message}`);
        }
    }
});

// ===============================================
//  RENDER "WEBSZERVER" TRÜKK
// ===============================================

// Hozzunk létre egy egyszerű webszervert, ami válaszol a Render-nek
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('A ban-check bot fut. Ez az oldal tartja ébren a botot.');
});

// A Render a PORT környezeti változóban mondja meg, hol figyeljünk
const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`Webszerver elindítva a ${port} porton, hogy a bot ébren maradjon.`);
});

// ===============================================
// VÉGE A TRÜKKNEK
// ===============================================

// Bot bejelentkeztetése
client.login(process.env.TOKEN);
