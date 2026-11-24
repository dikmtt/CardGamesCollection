import { makeDeck } from "../CardLogic/deckOOP";

export const freeCellDeal = (seedNo: number) => {
    //the microsoft style deal for freecell
    let ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
    let suits = ["C", "D", "H", "S"];
    var startDeck = [];

    for(let i = 0; i < ranks.length; i++) {
        for(let j = 0; j < suits.length; j++) {
            startDeck.push(ranks[i] + "-" + suits[j]);
        }
    }
    //var deckCopy = [...startDeck];

    var deckCopy = makeDeck();
    var state = seedNo;

    const fcRandom = () => {
        state = (state * 214013 + 2531011) % Math.pow(2, 31); //&& integer max;
        //console.log(state);
        //return state >> 16;
        return Math.floor(state / Math.pow(2, 16));
    }

    var shuffled = Array();
    //shuffle the cards from the last index
    //random index is determined by a formula
    for(var i = deckCopy.length - 1; i >= 0; i--) {
        var randNo = fcRandom() % (i + 1);
        //console.log(randNo);
        var cardTemp = deckCopy[randNo];
        //console.log(cardTemp);
        deckCopy[randNo] = deckCopy[i];
        shuffled.push(cardTemp);
        //console.log(shuffled);
        deckCopy = deckCopy.filter((cd, id) => id !== i);
        //deckCopy[i] = cardTemp;
    }

    //console.log("shuffled: ", shuffled);
    return shuffled;
}