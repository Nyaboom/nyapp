const { token } = require("./config")
const application_id = Buffer.from(token.split(".")[0], "base64").toString();
// https://discord.com/api/v10/applications/<my_application_id>/commands

async function registerGlobalCommand(command) {
    return await fetch(`https://discord.com/api/v10/applications/${application_id}/commands`, {
        method: "POST",
        body: JSON.stringify(command),
        headers: { Authorization: `Bot ${token}`, "Content-Type": "application/json" }
    }).then(r => r.json());
}

async function sendInteractionResponse(interaction, response) {
    return await fetch(`https://discord.com/api/v10/interactions/${interaction.id}/${interaction.token}/callback`, {
        method: "POST",
        body: JSON.stringify(response),
        headers: { Authorization: `Bot ${token}`, "Content-Type": "application/json" }
    }).then(async r => { let res = await r.text(); try { return JSON.parse(res) } catch { return res } });
}

module.exports = { registerGlobalCommand, sendInteractionResponse };