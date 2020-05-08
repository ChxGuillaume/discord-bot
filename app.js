import Discord from 'discord.js';
import dotenv from 'dotenv';
import RPS from './games/rock-paper-scissors.js';

const client = new Discord.Client();
dotenv.config();

client.on('ready', () => {
    client.user.setPresence({
        activity: {
            name: 'nobody play',
            type: 'WATCHING',
        },
    }).then();

    console.log('My body is ready!');
});

client.on('message', msg => {
    RPS(msg);
});

client.login(process.env.BOT_TOKEN).then();
