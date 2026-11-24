import { sortHand } from "../CardLogic/4-player-setup";
import { Card } from "../CardLogic/deckOOP";

//a function to split the hand based on the card suits
//each suit will have its own array
const splitHand = (hand: Card[]) => {
    var suits = Array();
    ["S", "H", "C", "D"].map((c, i) => {
        var suit = Array();
        hand.forEach(cd => {
            if(cd.suit === c) {
                suit.push(cd);
            }
        });
        suit.sort(function(a, b) {return a.getValue() - b.getValue();});
        suits.push(suit);
    });
    return suits;
}

//a function to determine the value for each suit in a player's hand
export const calculateHandValue = (hand: Card[]) => {
    //split hand by suits (taken from gin rummy code)
    var suits = splitHand(hand);
    //console.log(suits);

    //loop through each suit index
    var suitScores = Array();
    suits.forEach(cds => {
        if(cds.length === 0) {
            suitScores.push(0);
        } else {
            var suitScore = 0;
            cds.forEach(cd => {
                suitScore += cd.getValue("blackjack");
            })
            suitScores.push(suitScore);
        }
    })
    //the suit scores go in the same defined order of: Spades (0), Hearts (1), Clubs (2), Diamonds (3)
    //console.log(suitScores);
    return suitScores;
}

//function to find the suit index with the highest value
const findBestSuit = (handValue: number[]) => {
    const highestValuedSuit = Math.max(...handValue);
    const bestSuitIdx = handValue.findIndex((yee) => yee === highestValuedSuit);
    return bestSuitIdx;
}

const findLowestCardInSuit = (splitSuit: Card[]) => {
    //var handOfSuit = splitSuit;
        //find lowest card of the "worst suit"
        var lowestCardValue = 50;
        var lowestCardIdx = 100;
        splitSuit.forEach((card, idx) => {
            if(card.getValue("blackjack") < lowestCardValue) {
                lowestCardValue = card.getValue("blackjack");
                lowestCardIdx = idx;
            }
        })
    //}
    return splitSuit[lowestCardIdx];
}

//function to find the hand score (best suit value - all other suit values)
export const calculateHandScore = (hand: Card[]) => {
    const handValue = calculateHandValue(hand);
    //const highestValuedSuit = Math.max(...handValue);
    //const bestSuitIdx = handValue.findIndex((yee) => yee === highestValuedSuit);
    const bestSuitIdx = findBestSuit(handValue);
    var endScore = 0;
    handValue.forEach((ss, i) => {
        if(i === bestSuitIdx) endScore += ss;
        else endScore -= ss;
    })
    return endScore;
}

//the scores for all 4 players (displayed at end game)
export const getScores = (hands: Card[][]) => {
    var score = Array();
    hands.forEach(hand => {
        //const handValue = calculateHandValue(hand);
        //score.push(handScore);
        const handScore = calculateHandScore(hand);
        score.push(handScore);
    })
    //console.log(score);
    return score;
}

//function to determine whether an ai player will take the top card of the discard
export const analyzeTopDiscard = (hand: Card[], topDiscard: Card) => {
    //get the hand values and best suit of the old hand
    const handValues1 = calculateHandValue(hand);
    const bestSuit1 = findBestSuit(handValues1);
    const scoreOfBestSuit1 = handValues1[bestSuit1];
    //console.log("initial values:", handValues1, bestSuit1);

    //add the top card of the discard to the hand
    var handTemp = [...hand];
    handTemp.push(topDiscard);

    //get the hand values and best suit of the new hand
    const handValues2 = calculateHandValue(handTemp);
    const bestSuit2 = findBestSuit(handValues2);
    //console.log("new values:", handValues2, bestSuit2);
    const scoreOfBestSuit2 = handValues2[bestSuit2];

    //another foolproof check is to make sure that a card taken from the discard
    //should not be discarded again
    //to do this, a function from findDiscard() will be reused
    const split = splitHand(handTemp);
    const suitExtract = split[bestSuit2];
    const lowestInbestSuit2 = findLowestCardInSuit(suitExtract);
    //console.log(suitExtract);

    //compare score of the best suits, if it makes the best suit larger return true
    //else return false (does not have to be of the same suit)
    //put the result in a variable called "takeFromDiscard"
    if(scoreOfBestSuit2 > scoreOfBestSuit1 && lowestInbestSuit2.getName() !== topDiscard.getName()) {
        return true;
    } else {
        return false;
    }
}

//function to find a card to be discarded
export const findDiscard = (hand: Card[]) => {
    var suits = splitHand(hand);
    //get the value of the cards
    const values = calculateHandValue(hand);
    const bestSuit = findBestSuit(values);

    //checking if the hand is all the same suit
    //if true, return lowest card in hand
    //if false, check for the suit with the lowest value and lowest amount of cards
    
    //never mind. this can also check if all cards are the same suit
    //how? if handNoZero's length is exactly 1
    const handNoZero = values.filter(v => v !== 0);
    //console.log(handNoZero);
    const worstSuitVal = Math.min(...handNoZero);
    const worstSuitIdx = values.findIndex((yee) => yee === worstSuitVal);
    //console.log(worstSuitIdx);
    //if(handNoZero.length === 1) {
        //return lowest card
    //} else {
        var handOfSuit = suits[worstSuitIdx];
        //find lowest card of the "worst suit"
        const toDiscard = findLowestCardInSuit(handOfSuit);
        //var lowestCardValue = 50;
        //var lowestCardIdx = 100;
        /*handOfSuit.forEach((card, idx) => {
            if(card.getValue("blackjack") < lowestCardValue) {
                lowestCardValue = card.getValue("blackjack");
                lowestCardIdx = idx;
            }
        })*/
    //}
    //return handOfSuit[lowestCardIdx];
    return toDiscard;
}