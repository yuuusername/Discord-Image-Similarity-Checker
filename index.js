require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();
const axios = require('axios');
const Jimp = require('jimp');
const imghash = require('imghash');



const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent, // Include if you need message content
  ],
});

const CHANNEL_ID = process.env.CHANNEL_ID;

const db = new sqlite3.Database('./image_hashes.db');

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hash TEXT NOT NULL,
      message_id TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.channel.id !== CHANNEL_ID) return;
  if (message.author.bot) return;
  if (message.attachments.size === 0) return;

  for (const attachment of message.attachments.values()) {
    if (attachment.contentType && attachment.contentType.startsWith('image/')) {
      try {
        const rawBuffer = await downloadImage(attachment.url);
        const processedBuffer = await preprocessImage(rawBuffer);
        const hash = await generateHash(processedBuffer);

        db.all(`SELECT * FROM images`, [], (err, rows) => {
          if (err) {
            console.error(err);
            return;
          }

          let duplicateFound = false;

          for (const row of rows) {
            const distance = hammingDistance(hash, row.hash);
            const threshold = 40;

            if (distance <= threshold) {
              duplicateFound = true;
              const originalMessageUrl = `https://discord.com/channels/${message.guild.id}/${message.channel.id}/${row.message_id}`;
              message.channel.send(`Similar image detected! Original post: ${originalMessageUrl}`);
              break;
            }
          }

          if (!duplicateFound) {
            db.run(`INSERT INTO images (hash, message_id) VALUES (?, ?)`, [hash, message.id], (err) => {
              if (err) console.error(err);
            });
          }
        });
      } catch (error) {
        console.error('Error processing image:', error);
      }
    }
  }
});

client.login(process.env.DISCORD_TOKEN);

async function downloadImage(url) {
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  return Buffer.from(response.data, 'binary');
}

async function preprocessImage(buffer) {
  const image = await Jimp.read(buffer);
  image.resize(256, 256).quality(80).greyscale();
  return await image.getBufferAsync(Jimp.MIME_JPEG);
}

async function generateHash(buffer) {
    try {
      // Generate pHash with 16 bits hash length
      const hash = await imghash.hash(buffer, 16, 'hex', 'phash');
      return hash;
    } catch (error) {
      throw error;
    }
  }
  

function hammingDistance(hash1, hash2) {
  let distance = 0;
  const length = Math.min(hash1.length, hash2.length);

  for (let i = 0; i < length; i++) {
    if (hash1[i] !== hash2[i]) {
      distance++;
    }
  }

  return distance;
}
