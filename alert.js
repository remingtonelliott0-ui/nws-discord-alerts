import fs from "fs";

const WEBHOOK = process.env.DISCORD_WEBHOOK;
const SEEN_FILE = "seen.json";
const HEADERS = {
    "User-Agent": "GitHub-NWS-Discord (you@example.com)",
    "Accept": "application/geo+json"
};

let seen = new Set();
if (fs.existsSync(SEEN_FILE)) {
    try {
        seen = new Set(JSON.parse(fs.readFileSync(SEEN_FILE)));
    } catch (e) {
        seen = new Set();
    }
}

async function send(payload) {
    await fetch(WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });
}

async function checkWeather() {
    try {
        // Fetches ALL active Tornado Warnings across the entire US
        const response = await fetch("https://weather.gov", { headers: HEADERS });
        const data = await response.json();
        
        if (!data.features) return;

        for (const feature of data.features) {
            const id = feature.properties.id;
            if (seen.has(id)) continue;

            const properties = feature.properties;
            
            // Your custom role mention format
            const mention = "<@&1509044540613460019>"; 

            const embed = {
                title: `🚨 NATIONWIDE TORNADO WARNING 🚨`,
                description: properties.description || properties.headline,
                color: 16711680, // Solid Red
                fields: [
                    { name: "Area Affected", value: properties.areaDesc || "Unknown" },
                    { name: "Expires", value: new Date(properties.expires).toLocaleString() }
                ],
                url: properties.affectedZones?[0] || "https://weather.gov"
            };
          
          // Sends both the custom role ping and the red layout box
            await send({ content: mention, embeds: [embed] });
            seen.add(id);
        }

        fs.writeFileSync(SEEN_FILE, JSON.stringify([...seen]));
    } catch (error) {
        console.error("Error checking weather:", error);
    }
}

checkWeather();
