const http = require("node:https");
const tls = require("node:tls");
const net = require("node:net");
const { randomBytes } = require('crypto');
const { token } = require("./token");
const EventEmitter = require("node:events");
let url = new URL("wss://gateway.discord.gg/?v=10&encoding=json");

function creat(data) {
    const payload = Buffer.from(data).map(e => e ^ 196);
	const length = payload.length;

    let start = 2;
	const meta = Buffer.alloc(6 + (length < 126 ? 0 : 2));

	meta[0] = 129;
    meta[1] = 128;

    if (length >= 126) {
        meta[1] += 126;
        meta.writeUInt16BE(length, 2);
        start = 4;
    } else {
        meta[1] += length;
    }
    meta.fill(196, start, start + 4);
	return Buffer.concat([meta, payload], meta.length + payload.length);
}

function extract(buffer) {
	let opcode = buffer[0] % 16
    let thing = buffer[1] % 128;
    let length = thing == 126 ? buffer.readUInt16BE(2) : thing;
    let start = thing == 126 ? 4 : 2;

	let payload = buffer.slice(start, start + length);
    let error;
    if (opcode == 8) {
        error = payload.readUInt16BE(0);
		payload = payload.slice(2);
    }

	return { opcode, message: payload.toString(), ...(error && { error }) };
}

let hello_payload = JSON.stringify({
    op: 2,
    d: {
        token: token,
        intents: 33280,
        properties: {},
        presence: {
            status: "online",
            since: null,
            activities: [],
            afk: false
        },
        compress: false,
        client_state: {
            guild_versions: {},
            highest_last_message_id: "0",
            read_state_version: 0,
            user_guild_settings_version: -1,
            user_settings_version: -1,
            private_channels_version: "0",
            api_code_version: 0
        }
    }
});

function tlsConnect(options) {
    options.path = undefined;
  
    if (!options.servername && options.servername !== '') {
      options.servername = net.isIP(options.host) ? '' : options.host;
    }
  
    return tls.connect(options);
  }
const key = randomBytes(16).toString('base64');

let req = http.request({ 
    createConnection: tlsConnect,
    host: url.hostname,
    port: url.port,
    defaultPort: 443,
    protocolVersion: 8,
    headers: {
        'Sec-WebSocket-Version': 8,
        'Sec-WebSocket-Key': key,
        Connection: 'Upgrade',
        Upgrade: 'websocket'
    }
}, () => {
    console.log("cb")
});

req.on('timeout', () => {
   console.log("timeout");
});

req.on('error', (err) => {
    console.log(err);
    console.log("error");
});

req.on('response', (res) => {
    console.log("response");
});

async function sendMessage(channelId, data) {
    return await fetch(`https://discord.com/api/v9/channels/${channelId}/messages`, {
        headers: { 
            authorization: `Bot ${token}`, 
            "content-type": "application/json"
        }, 
        body: JSON.stringify(data),
        method: "POST"
    }).then(e=>e.json());
}

const bot = new EventEmitter();
req.on('upgrade', (res, socket, head) => {
    console.log("upgrade");
    socket.on("ready", d => {
        console.log("ready", d);
    });
    bot.on("send", payload => {
        console.log("payload", payload.replaceAll(token, "TOKEN"));
        socket.write(creat(payload));
    });
    socket.on("data", data => {
        let info = extract(data);
        console.log(info);
        if (info.opcode == 1) {
            let stuff = JSON.parse(info.message);
            bot.emit("receive", stuff);
        }
    });
});
req.end();
let pronoun = "nya";
function onReceive({data, event}) {
    switch (event) {
        case "READY":
            console.log("Bot is ready!")
            sendMessage("1131618506824241295", { content: "Bot is ready!" });
            break;
        case "MESSAGE_CREATE":
            if (data.content?.startsWith?.(pronoun + " ")) {
                let [cmd, ...args] = data.content.slice((pronoun + " ").length).split(" ");
                if (cmd == "eval") {
                    sendMessage(data.channel_id, { content: eval(args.join(" ")) });
                }
            }
            break;
    }
}

bot.on("receive", data => {
    switch (data.op) {
        case 10:
            bot.emit("send", hello_payload);
        case 0:
            onReceive({ event: data.t, data: data.d});
    }
});