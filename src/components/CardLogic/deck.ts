import { getRank } from "../SpeedPoker/hands";

const buildDeck = () => {
    let ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
    let suits = ["C", "D", "H", "S"];
    var deck = [];

    for(let i = 0; i < suits.length; i++) {
        for(let j = 0; j < ranks.length; j++) {
            deck.push(ranks[j] + "-" + suits[i]);
        }
    }
    return deck;
}

export const shuffle = () => {
    var deck = buildDeck();
    for (let i = 0; i < deck.length; i++) {
        let j = Math.floor(Math.random() * deck.length);
        let temp = deck[i];
        deck[i] = deck[j];
        deck[j] = temp;
    }
    //console.log(deck);
    return deck;
}

export const isNumber = (card) => {
    let cd = card.split("-");
    let value = cd[0];

    if(isNaN(value)) {
        return false;
    }
    else return true;
}

/* may be different depending on the game
function getValue(card) {
    let cd = card.split("-");
    let value = cd[0];

    if(isNaN(value)) {
        if(value == "A") {
            return 11;
        }
        else return 10;
    }
    else return parseInt(value);
}*/

export const sultanDeal = () => {
    var deck1 = buildDeck();
    var deck2 = buildDeck();
    var sultanDeck = deck1.concat(deck2);

    const firstAH = sultanDeck.indexOf("A-H");
    sultanDeck = sultanDeck.filter((c, i) => getRank(c) != "K" && i !== firstAH);
    //console.log(sultanDeck);

    for (let i = 0; i < sultanDeck.length; i++) {
        let j = Math.floor(Math.random() * sultanDeck.length);
        let temp = sultanDeck[i];
        sultanDeck[i] = sultanDeck[j];
        sultanDeck[j] = temp;
    }

    //console.log("After shuffle: ", sultanDeck);

    return sultanDeck;
}