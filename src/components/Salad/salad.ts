import { Card } from "../CardLogic/deckOOP";
import { hasLedSuit } from "../Hearts/hearts";
import { getRank, getSuit } from "../SpeedPoker/hands";

//play random card
export const playRandomCard = (hand: Card[], ledSuit: string) => {
    const followSuit = hasLedSuit(hand, ledSuit);
    //in the first trick, penalty cards may not be played
    //at first, randomize.
    if(followSuit !== undefined) {
        return followSuit[Math.floor(Math.random()*followSuit.length)];
    } else {
        return hand[Math.floor(Math.random()*hand.length)];
    }
}

//lead random card
export const leadRandom = (hand: Card[]) => {
    return hand[Math.floor(Math.random()*hand.length)];
}

//score points (salad)
export const scorePoints = (trick: Card[], roundNo: number, trickNo: number) => {
    var score = 0;
    trick.forEach(card => {
        if((roundNo === 2 || roundNo === 6) && card.suit === "H") {
            score += 10;
        }
        if((roundNo === 3 || roundNo === 6) && card.rank === "Q") {
            score += 25;
        }
        if((roundNo === 4 || roundNo === 6) && card.getName() === "K-S") {
            score += 100;
        }
    });
    if((roundNo === 1 || roundNo === 6)) {
        score += 10;
    }
    if((roundNo >= 5) && trickNo >= 13) {
        score += 100;
    }
    //console.log("score for this trick: ", score);
    return score;
}