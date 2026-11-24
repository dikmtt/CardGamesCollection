import { sortHand } from "../CardLogic/4-player-setup";
import { Card } from "../CardLogic/deckOOP";
import { copySuits, getSuit } from "../SpeedPoker/hands";

export const eightsDeal = (deck: Card[], handSize: number, mode: string) => {
    var playerHands = Array();
        for(var i = 0; i < 4; i++) {
            var hand = Array();
            for(var j = 0; j < handSize; j++) {
                var card = deck.pop();
                hand.push(card);
            }
            var sortedHand = sortHand(hand, mode);
            playerHands.push(sortedHand);
        }
        //console.log(playerHands);
        return playerHands;
}

export const findBestSuit = (hand: Card[]) => {
    var suitsCopy = copySuits();
    hand.forEach(card => {
        var currCardSuit = card.suit;
        if(suitsCopy[currCardSuit] !== undefined) {
            suitsCopy[currCardSuit]++;
        }
    });

    console.log(suitsCopy);

    var bestSuit = "";
    var suitNo = 0;
    for(let key in suitsCopy) {
        if(suitsCopy[key] > suitNo) {
            bestSuit = key;
            suitNo = suitsCopy[key];
        }
    }
    return bestSuit;
}

export const reshuffleWasteToStock = (waste: Card[]) => {
    const waste2 = [...waste];
    console.log("waste before shuffle: ", waste);
    for(var i = 0; i < waste2.length; i++) {
        let j = Math.floor(Math.random() * waste2.length);
        let temp = waste2[i];
        waste2[i] = waste2[j];
        waste2[j] = temp;
    }
    console.log("waste after shuffle: ", waste2);
    return waste2;
}