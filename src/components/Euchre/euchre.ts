import { shuffle } from "../CardLogic/deck";
import { getStraightVal } from "../SpeedPoker/hands";

const suits = ["S", "H", "C", "D"];
//in the trump suit, the higher the index is the better the card is
const ranksForTrump = ["9", "10", "Q", "K", "A"];

export const buildEuchreDeck = () => {
    let ranks = [...ranksForTrump, "J"];
    var deck = [];

    for(let i = 0; i < suits.length; i++) {
        for(let j = 0; j < ranks.length; j++) {
            deck.push(ranks[j] + "-" + suits[i]);
        }
    }

    for (let i = 0; i < deck.length; i++) {
        let j = Math.floor(Math.random() * deck.length);
        let temp = deck[i];
        deck[i] = deck[j];
        deck[j] = temp;
    }
    //var deck = shuffle();
    //var euchreDeck = deck.filter(c => getStraightVal(c) >= 9);

    return deck;
}

export const setTrump = (suit: string) => {
    const trumps = Array();
    ranksForTrump.forEach(c => {
        trumps.push(c + "-" + suit);
    });

    //left bower
    const otherColIdx = (suits.indexOf(suit) + 2) % 4;
    trumps.push("J-" + suits[otherColIdx]);
    
    //right bower
    trumps.push("J-" + suit);

    return trumps;
}