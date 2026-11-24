import { getValAceLow } from "../Rummy/rummy";
import { getStraightVal, getSuit } from "../SpeedPoker/hands";
import { Card } from "./deckOOP";

export const dealTo4Players = (deck: Card[]) => {
    //console.log("dealto4players");
    var playerHands = Array();
    for(var i = 0; i < 4; i++) {
        var hand = Array();
        for(var j = 0; j < 13; j++) {
            var card = deck.pop();
            hand.push(card);
        }
        var sortedHand = sortHand(hand, "acehigh");
        playerHands.push(sortedHand);
    }
    //console.log(playerHands);
    return playerHands;
}

export const sortHand = (hand: Card[], mode: string) => {
    //console.log("sortHand");
    var suits = Array();
    ["S", "H", "C", "D"].map((c, i) => {
        var suit = Array();
        hand.forEach(cd => {
            if(cd.suit === c) {
                suit.push(cd);
            }
        });
        /*if(aceLow) {
            suit.sort(function(a, b) {return getValAceLow(a)! - getValAceLow(b)!;});
        } else {
            suit.sort(function(a, b) {return getStraightVal(a)! - getStraightVal(b)!;});
        }*/
        suit.sort(function(a, b) { return a.getValue(mode) - b.getValue(mode)})
        //console.log("suit sorted hopefully: ", suit);
        //suits.push(suit);
        suit.forEach(cs => {
            suits.push(cs);
        });
    });
    //console.log("suits: ", suits);
    return suits;
}