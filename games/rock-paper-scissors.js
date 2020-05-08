export default function (msg) {
    if (msg.bot || msg.content[0] !== '/') return;

    if (msg.content.includes('/rps')) {
        new RockPaperScissors(msg);
    }
}

class RockPaperScissors {

    constructor(msg) {
        this.msg = msg;
        this.channel = msg.channel;
        this.playerOne = msg.author;
        this.playerTwo = msg.mentions.users.first();

        this.playerOneDMChannel = null;
        this.playerTwoDMChannel = null;

        this.playerOneResponse = null;
        this.playerTwoResponse = null;

        this.initGame().then();
    }

    async initGame() {
        if (!this.playerTwo) this.channel.send(`Tu n'a identifié personne.`);
        else if (this.playerOne.id === this.playerTwo.id) this.channel.send(`Tu compte vraiment jouer seul ?`);
        else {
            this.playerOneDMChannel = await this.playerOne.createDM();
            this.playerTwoDMChannel = await this.playerTwo.createDM();

            this.sendPlayerStartValidation();
        }
    }

    sendPlayerStartValidation() {
        const filter = (reaction, u) => ['✅', '⛔'].includes(reaction.emoji.name) && u.id === this.playerTwo.id;
        this.playerTwoDMChannel.send(`<@${this.playerOne.id}> invite you to play Rock Paper Scissors.\nDo you want to play ?`)
            .then(validationMessage => {
                validationMessage.react('✅').then();
                validationMessage.react('⛔').then();
                validationMessage.awaitReactions(filter, {time: 15000, max: 1})
                    .then(res => this.receivePlayerStartValidation(res, validationMessage))
                    .catch(console.error);
            })
            .catch(_ => {
                this.channel.send(`This user refuses DMs, can't create a game.`);
            });
    }

    receivePlayerStartValidation(collection, validationMessage) {
        if (collection.size === 0) {
            validationMessage.channel.send('Demand timed out.');
            this.channel.send(`The user didn't responded to your demand.`);
        } else if (collection.first().emoji.name === '⛔') this.channel.send('The user refused your demand.');
        else if (collection.first().emoji.name === '✅') {
            this.startGame();
        }
    }

    startGame() {
        this.playerOneResponse = null;
        this.playerTwoResponse = null;

        // Promises to check if Player One accepts DMs
        this.sendPlayerRPS(this.playerOneDMChannel, this.playerOne)
            .then(_ => {
                this.sendPlayerRPS(this.playerTwoDMChannel, this.playerTwo);
            });
    }

    sendPlayerRPS(playerChannel, player) {
        return new Promise((resolve, reject) => {
            playerChannel.send('Choose, Rock / Paper / Scissors.')
                .then(gameMessage => {
                    this.playerAwaitGameAnswer(gameMessage, player);
                    resolve();
                })
                .catch(_ => {
                    if (player === this.playerOne) this.channel.send(`The owner don't even accept DMs 🤦 that's sad.`);
                    reject();
                });
        });
    }

    playerAwaitGameAnswer(gameMessage, player) {
        const filter = (reaction, u) => ['✊', '✋', '✌'].includes(reaction.emoji.name) && u.id === player.id;
        gameMessage.react('✊').then();
        gameMessage.react('✋').then();
        gameMessage.react('✌').then();
        gameMessage.awaitReactions(filter, {time: 60000, max: 1})
            .then(res => this.playerAnswer(res, player))
            .catch(console.error);
    }

    playerAnswer(collection, player) {
        if (collection.size === 0) this.channel.send(`<@${player.id}> forgot to response... Party stopped.`);
        const isPlayerOne = player.id === this.playerOne.id;
        const response = collection.first().emoji.name;

        if (isPlayerOne) this.playerOneResponse = response;
        else this.playerTwoResponse = response;

        this.checkWinner();
    }

    checkWinner() {
        if (this.playerOneResponse && this.playerTwoResponse) {
            if (this.playerOneResponse === this.playerTwoResponse) this.channel.send('Game result: Equality');
            else {
                const winner = this.whoWin();
                this.channel.send(`<@${winner.winner.id}> wins with: ${winner.emoji}`);
            }
        }
    }

    whoWin() {
        if (this.playerOneResponse === '✋' && this.playerTwoResponse === '✊')
            return new WinningResult(this.playerOne, '✋');
        else if (this.playerOneResponse === '✊' && this.playerTwoResponse === '✋')
            return new WinningResult(this.playerTwo, '✋');
        else if (this.playerOneResponse === '✌' && this.playerTwoResponse === '✋')
            return new WinningResult(this.playerOne, '✌');
        else if (this.playerOneResponse === '✋' && this.playerTwoResponse === '✌')
            return new WinningResult(this.playerTwo, '✌');
        else if (this.playerOneResponse === '✊' && this.playerTwoResponse === '✌')
            return new WinningResult(this.playerOne, '✊');
        else if (this.playerOneResponse === '✌' && this.playerTwoResponse === '✊')
            return new WinningResult(this.playerTwo, '✊');
    }
}

class WinningResult {
    constructor(winner, emoji) {
        this.winner = winner;
        this.emoji = emoji;
    }
}
