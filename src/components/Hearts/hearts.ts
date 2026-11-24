import { Card, defaultCard } from "../CardLogic/deckOOP";
import { copySuits, getRank, getStraightVal, getSuit } from "../SpeedPoker/hands"

const suitGroup: Record<string, Card[]> = {
    "S": [],
    "H": [],
    "C": [],
    "D": []
};

function copySuitGroup() {
    return {...suitGroup};
}

export const hasLedSuit = (hand: Card[], ledSuit: string) => {
    var followSuit = hand.filter(c =>
        c.suit === ledSuit
    );
    //console.log("followSuit: ", followSuit);
    if(followSuit.length > 0) {
        return followSuit;
    } else {
        return undefined;
    }
}

//old, unused function to play cards (randomization)
export const getBestCard = (hand: Card[], ledSuit: string, trickNo: number) => {
    const followSuit = hasLedSuit(hand, ledSuit);
    //in the first trick, penalty cards may not be played
    //at first, randomize.
    if(followSuit !== undefined) {
        return followSuit[Math.floor(Math.random()*followSuit.length)];
    } else {
        if(trickNo === 1) {
            const noHearts = handNoHearts(hand);
            const noPenalties = noHearts.filter(c => c.getName() !== "Q-S");
            return noPenalties[Math.floor(Math.random()*noPenalties.length)];
        } else {
            return hand[Math.floor(Math.random()*hand.length)];
        }
    }
}

export const getTrickWinner = (trick: Card[], ledSuit: string) => {
    //extract only the cards in trick that are of the lead suit
    var suitedTricks = hasLedSuit(trick, ledSuit);

    //take the highest card of the led suit then return the id of the card holder from the hand
    var bestCard = suitedTricks?.[0];
    for(var i = 0; i < (suitedTricks?.length ?? 0) - 1; i++) {
        if(suitedTricks?.[i + 1].getValue("acehigh") > bestCard?.getValue("acehigh")) {
            bestCard = suitedTricks?.[i + 1];
        }
    }
    const winner = trick.indexOf(bestCard);
    return winner;
}

export const scorePoints = (trick: Card[]) => {
    var score = 0;
    trick.forEach(card => {
        if(card.suit === "H") {
            score++;
        }
        if(card.getName() === "Q-S") {
            score += 13;
        }
    });
    //console.log("score for this trick: ", score);
    return score;
}

export const handNoHearts = (hand: Card[]) => {
    return hand.filter(c => c.suit !== "H");
}

export const leadCard = (hand: Card[], heartsBroken: boolean, cardsInTrick: number, trickNo: number, QSplayed: boolean) => {
    var card = defaultCard();
    const handWithoutHearts = handNoHearts(hand);

    //a player may not lead with hearts until hearts have been broken
    if(!heartsBroken && handWithoutHearts.length !== 0 && cardsInTrick === 0) {
        //card = handWithoutHearts[Math.floor(Math.random()*handNoHearts.length)];
        card = chooseCardLead(handWithoutHearts, trickNo, heartsBroken, QSplayed);
    //if a player only has hearts in their hand and hearts haven't been broken,
    //then hearts are forced to be broken by that player
    } else {
        //card = hand[Math.floor(Math.random()*hand.length)];
        card = chooseCardLead(hand, trickNo, heartsBroken, QSplayed);
    }
    //console.log("Led card: ", card);
    return card;
}

//card playing strategy (from hearts card classic)
/*When playing first, chooses the lowest card in hand.  When 
playing 2nd or 3rd, plays the highest card that will not take the trick,
otherwise, plays the lowest card of suit.  When playing last, if there 
are points in the trick, plays the highest card that will not take the 
trick or if it must take the trick, plays the highest card of suit 
(avoiding the Queen of Spades).  If playing last and there are no points
in the trick, plays the highest card in hand.  When the player is void 
in the lead suit, it will play its highest valued cards starting with 
QS, AS, AH, AD, AC, KS, KH, KD, KC, QH, QD, QC, etc...*/

const chooseCardLead = (hand: Card[], trickNo: number, heartsBroken: boolean, QSplayed: boolean) => {
    //for the first five tricks, the computer players will play their high cards
    //if hearts have been broken, they will focus more in leading low

    //first, get a random suit
    //extract the unique suits available in the hand

    //hand to debug, since once i got an error about card being undefined, apparently
    //it got the spades suit despite having no more spades in hand.
    //console.log(hand);

    //hearts filtering is done in another function
    //so this checks if the only non-heart cards (if hearts haven't been broken) are the Q, K, or A-S
    var onlyHighSpades = false;

    //only lead the queen of spades on the last trick
    if(hand.every(c => c.suit === "S" && c.getValue("acehigh") >= 12)) {
        //if the only cards 
        onlyHighSpades = true;
    } else {
        if(hand.some((c) => c.getName() === "Q-S")) {
            if(trickNo < 13) hand = hand.filter(c => c.getName() != "Q-S");
        }
        if((hand.some((c) => c.getName() === "K-S" || c.getName() === "A-S"))) {
            if(trickNo < 12) hand = hand.filter(c => c.suit !== "S" || c.getValue("acehigh") < 12);
        }
    }

    var suits = Array();
    hand.forEach(handCard => {
        if(!suits.includes(handCard.suit)) {
            suits.push(handCard.suit);
        }
    });
    //console.log("suits: ", suits);
    var suitToPlay = suits[Math.floor(Math.random()*suits.length)];
    //console.log("suitToPlay: ", suitToPlay);
    var cardsInSuit = getSortedCardsBySuit(hand, suitToPlay);

    //sorted hand
    //var yeeyee = getSortedHand(hand);
    //console.log(yeeyee);

    if(!heartsBroken) {
        //hearts not broken: brfore QS or for first 5: play highest, then choose suit and play lowest
        if(trickNo <= 5 && !QSplayed) {
            //get the highest card in the suit, unless it's spades, then highest BELOW QUEEN
            //there should be an act to make sure that if a spade comes out and the player only has
            //cards queen or higher, then change to a different suit
            if(suitToPlay === "S") {
                var cardsInSuitTemp = cardsInSuit.filter(c => c.getValue("acehigh") < 12);
                /*if(cardsInSuitTemp.length > 0) {
                    cardsInSuit = cardsInSuitTemp;
                }*/
                cardsInSuit = cardsInSuitTemp.length > 0 ? cardsInSuitTemp : cardsInSuit;
            }
            //console.log("cardsInSuit: ", cardsInSuit);

            var card = cardsInSuit[cardsInSuit.length - 1];
        } else {
            //play the lowest card in suit (if hearts not yet broken)
            //console.log("cardsInSuit: ", cardsInSuit);
            if(onlyHighSpades) {
                var card = cardsInSuit[cardsInSuit.length - 1];
            } else {
                var card = cardsInSuit[0];
            }
        }
    } else { 
        //after hearts broken, find the lowest card in hand and play it
        var sortedHand = getSortedHand(hand);
        var card = sortedHand[0];
    }
    return card;
}

const getHighestTrickCard = (trick: Card[], ledSuit: string) => {
    //extract only the cards in trick that are of the lead suit
    var suitedTricks = hasLedSuit(trick, ledSuit);

    //take the highest card of the led suit then return the value of the card
    var bestCard = suitedTricks?.[0];

    for(var i = 0; i < (suitedTricks?.length ?? 0) - 1; i++) {
        if(suitedTricks?.[i + 1].getValue("acehigh")! > bestCard?.getValue("acehigh")!) {
            bestCard = suitedTricks?.[i + 1];
        }
    }

    return bestCard?.getValue("acehigh");
}

const pickHighestThatWontWin = (trick: Card[], ledSuit: string, hand: Card[]) => {
    var highestTrickCard = getHighestTrickCard(trick, ledSuit);
    const lowerThanHighest = hand.filter(e => e.getValue("acehigh") < highestTrickCard);
    if(lowerThanHighest.length > 0) {
        //if there are cards lower than the highest cards in the trick
        lowerThanHighest.sort(function(a, b) {return a.getValue("acehigh") - b.getValue("acehigh");}).reverse();
        //console.log("lowerThanHighest: ", lowerThanHighest);
        var highestThatWontWin = lowerThanHighest[0];
        return highestThatWontWin;
    } else {
        //if the lead suit is spades and the hand contains both the queen and either ace or king of spades
        //then play the ace or king instead
        //this is reserved only if the hand only contains those cards
        if(ledSuit === "S" && 
            hand.filter(e => e.getValue("acehigh") < 12).length === 0) {
            return hand[hand.length - 1];
        } else if(ledSuit === "H" && trick.filter(tc => tc.getName() === defaultCard().getName()).length === 1) {
            //if the lead suit is hearts and it's the fourth card in the trick, return the highest
            return hand[hand.length - 1];
        } else {
            //otherwise, return the lowest available card of the lead suit
            return hand[0];
        }
    }
}

const pickCardToPlay = (hand: Card[]) => {
    //for void suit
    //get the highest valued card in hand to determine shedding order
    var highestVal = hand[0].getValue("acehigh");
    for(var i = 1; i < hand.length; i++) {
        if(hand[i].getValue("acehigh") > highestVal) {
            highestVal = hand[i].getValue("acehigh");
        }
    }
    var cardsOfVal = hand.filter(hc => hc.getValue("acehigh") === highestVal);
    if(highestVal > 12) {
        //king or ace
        var playSuitOrder = ["S", "H", "C", "D"];
    } else {
        //jack or lower
        var playSuitOrder = ["H", "S", "C", "D"];
    }
    const cardsValOrdered = cardsOfVal.sort((a, b) => {
        return(playSuitOrder.indexOf(a.suit) - playSuitOrder.indexOf(b.suit))
    });
    //console.log(cardsValOrdered);
    return cardsValOrdered[0];
}

export const chooseCardFollow = (hand: Card[], trick: Card[], ledSuit: string, trickNo: number) => {
    //analyze the trick, then count the number of cards in the trick.
    //if there's 1 or 2 cards in the trick, play either the highest cards that
    //will not win the trick, or if unavailable their lowest card in the lead suit
    //if there's 3 cards and there are no point cards, play the highest card
    //if there are point cards play the highest that won't win the trick, if possible.
    //if unavailable, play their highest card
    //if void, prioritize dumping queen of spades, 
    //then aces and kings down with priorities: spade, heart, club, diamond
    //then the rest with priorities: heart, spade, club, diamond
    var cardsInTrick = 0;
    trick.forEach(trickCard => {
        if(trickCard.getName() !== defaultCard().getName()) { cardsInTrick++; }
    });
    
    var following = hasLedSuit(hand, ledSuit);
    
    //if the player can follow suit
    if(following !== undefined) {
        //if there are cards in the lead suit
        following.sort(function(a, b) {return a.getValue("acehigh") - b.getValue("acehigh");});
        //for the second or third play of the trick
        if(cardsInTrick < 3) {
            //in the first trick, try playing higher valued cards if available
            if(trickNo === 1) {
                const highestCard = following[following.length - 1];
                return highestCard;
            //else, it's not the first trick. play the highest card that won't win the trick
            //unless the lead is spades, and the king/ace is played and the player has the queen
            } else {
                if(ledSuit == "S" && following.some(c => c.getName() === "Q-S") &&
                    (trick.some(c => c.getName() === "K-S" || c.getName() === "A-S"))) {
                    return following.filter(c => c.getName() === "Q-S")[0];
                } else {
                    const httw = pickHighestThatWontWin(trick, ledSuit, following);
                    return httw;
                }
            }
        //for the fourth card of the trick
        } else {
            //if there are penalty cards in the trick
            if(trick.some(trickCard => trickCard.suit === "H") || trick.some(c => c.getName() === "Q-S")) {
                //if the lead is hearts, play the highest heart card
                //only if there are no more cards lower than the highest card in the trick
                //if(ledSuit === "H") {
                //    const highestCard = following[following.length - 1];
                //    return highestCard;
                //} //else, play the highest card of the lead that won't win the trick
                //else {
                    const httw = pickHighestThatWontWin(trick, ledSuit, following);
                    return httw;
                //}
            } else {
                //avoid taking the trick with the queen of spades if it's not the only spade
                if(ledSuit == "S" && following.some(c => c.getName() === "Q-S") && following.length > 1) {
                    //unless, the king or ace of spades have been played
                    if(trick.some(c => c.getName() === "K-S" || c.getName() === "A-S")) {
                        return following.filter(c => c.getName() === "Q-S")[0];
                    } else {
                        following = following.filter(c => c.getName() !== "Q-S");
                    }
                    //const highestCard = following[following.length - 2];
                    //return highestCard;
                //play highest card
                } //else {
                    const highestCard = following[following.length - 1];
                    return highestCard;
                //}
            }
        }
    } else {
        //if the player is void of the lead suit
        //in the first trick, penalty cards may not be played
        if(trickNo === 1) {
            const noHearts = handNoHearts(hand);
            const noPenalties = noHearts.filter(c => c.getName() !== "Q-S");
            const cardToPlay = pickCardToPlay(noPenalties)
            return cardToPlay;
        } else {
            //if the player has the queen of spades, play it
            if(hand.some(c => c.getName() === "Q-S")) {
                return hand.filter(c => c.getName() === "Q-S")[0];
            } else {
                const cardToPlay = pickCardToPlay(hand);
                return cardToPlay;
            }
        }
    }
}

const getSortedCardsBySuit = (hand: Card[], suit: string) => {
    var suitedCards = Array();
    hand.forEach(cd => {
        if(cd.suit === suit) {
            suitedCards.push(cd);
        }
    });
    suitedCards.sort(function(a, b) {return a.getValue("acehigh") - b.getValue("acehigh");});
    return suitedCards;
}

const getSortedHand = (hand: Card[]) => {
    var sorted = [...hand];
    sorted.sort(function(a, b) {return a.getValue("acehigh") - b.getValue("acehigh");});
    //console.log(getSortedHand);
    return sorted;
}

const getCardsToPass = (hand: Card[]): Card[] => {
    //remove spades lower than queen (however, ignore this if moon shot is considered)
    const noLowSpades = hand.filter(c => c.suit !== "S" || c.getValue("acehigh") >= 12);
    //console.log(noLowSpades);

    var finalPass = Array();

    //group cards by suit
    var groupedBySuit = copySuitGroup();
    Object.keys(groupedBySuit).forEach(function(suit, idx) {
        const suitMatch = hand.filter(c => c.suit === suit);
        groupedBySuit[suit] = suitMatch;
    });
    //console.log(groupedBySuit);

    if(groupedBySuit["S"].length <= 3 && groupedBySuit["S"].some(c => c.getValue("acehigh") >= 12)) {
        //add any spades queen or higher to the pool.
        //if all 3 spades are this, for now pass them all and return
        const highSpades = noLowSpades.filter(c => c.suit === "S");
        finalPass.push(highSpades);
        if(finalPass.length === 3) return finalPass;
    }

    //sorry about this
    if(groupedBySuit["C"].length === 1) finalPass.push(groupedBySuit["C"]);
    if(groupedBySuit["D"].length === 1) finalPass.push(groupedBySuit["D"]);

    if(groupedBySuit["C"].length === 2 && groupedBySuit["D"].length !== 2) {
        const bonusC = passCDFor2(groupedBySuit["C"]);
        finalPass.push(bonusC);
    }
    if(groupedBySuit["D"].length === 2 && groupedBySuit["C"].length !== 2) {
        const bonusD = passCDFor2(groupedBySuit["D"]);
        finalPass.push(bonusD);
    }
    if(groupedBySuit["C"].length === 2 && groupedBySuit["D"].length === 2) {
        const lowestClub = groupedBySuit["C"][0];
        const lowestDiamond = groupedBySuit["D"][0];

        if(lowestClub.getValue("acehigh") < lowestDiamond.getValue("acehigh")) {
            const bonusD = passCDFor2(groupedBySuit["C"]);
            finalPass.push(bonusD);
        } else if(lowestDiamond.getValue("acehigh") < lowestClub.getValue("acehigh")) {
            const bonusD = passCDFor2(groupedBySuit["D"]);
            finalPass.push(bonusD);
        }
    }

    const finalPassFlat = finalPass.flat();
    const ffpNoDupes = finalPassFlat.reduce(function(a,b){if(a.indexOf(b)<0)a.push(b);return a;},[]);

    var handNoAlreadyPassed = hand.filter(c => !ffpNoDupes.includes(c));
    var highToLow = getSortedHand(handNoAlreadyPassed).reverse();
    while(ffpNoDupes.length < 3) {
        ffpNoDupes.push(highToLow.shift());
    }

    if(ffpNoDupes.length > 3) {
        var ffpNoDupesSorted = getSortedHand(ffpNoDupes).reverse();
        console.log("more than 3: ", ffpNoDupesSorted);
        return ffpNoDupesSorted.slice(0, 3);
    }
    console.log("normal: ", ffpNoDupes);

    return ffpNoDupes;
}

const passCDFor2 = (cards: Card[]) => {
    if(cards.some(c => c.getValue("acehigh") >= 8)) {
        return cards.filter(c => c.getValue("acehigh") >= 8);
    }
    return [];
}

export const computerPassLogic = (hand: Card[], previouslyPassed: Card[]): Card[] => {
    //the hand might have cards passed by another player, remove them
    //var passedCards = Array();
    var handNoPrevPassed = hand.filter(c => !previouslyPassed.some(c2 => c2.getName() === c.getName()));
    //console.log(handNoPrevPassed);

    //initially, the logic will be random, logic will be explained later
    //Pass logic:
    //1. Never pass low spades (2 to jack)
    //2. Pass high spades only if there are 3 or less spades in hand
    //3. If Clubs or Diamonds has only 1 card, pass that card to void it
    //4. If either Clubs or Diamonds has 2 cards, both of which are 8 or higher, pass both of them
    //   however, if both suits have 2 cards, pick the one with the higher low card value
    //5. Otherwise, (so far) fill the rest with high Hearts, Clubs, and Diamonds
    //6. If an opponent has 10 or more cards valued 9 or higher, pass lowest cards instead
    //   (an attempt to shoot the moon)

    const passedCards = getCardsToPass(handNoPrevPassed);
    //console.log("here, the passed cards are: ", passedCards);

    //old passing logic (random)
    /*while(passedCards.length < 3) {
        var card = handNoPrevPassed[Math.floor(Math.random() * hand.length)];
        if(!passedCards.includes(card)) {
            passedCards.push(card);
        }
    }*/
    
    return passedCards;
}