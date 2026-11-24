import { Card } from "../CardLogic/deckOOP";
import { getRank, getStraightVal, getSuit } from "../SpeedPoker/hands";

export const buildSpiderDeck = (difficulty: string) => {
    let ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
    let suits = ["S", "H", "C", "D"];

    //determine the suits
    const [suitsUsed, iters] = pickSuits(difficulty, suits);
    console.log(suitsUsed, iters);

    //make the deck
    var startDeck:Card[] = [];

    /*for(let i = 0; i < ranks.length; i++) {
        for(let j = 0; j < suitsUsed.length; j++) {
            startDeck.push(ranks[i] + "-" + suitsUsed[j]);
        }
    }*/
    ranks.forEach((r) => {
        suitsUsed.forEach((s) => {
            var newCard = new Card(r, s);
            startDeck.push(newCard);
        })
    })
    //console.log(startDeck);

    var spiderDeck = [];
    for(let i = 0; i < iters; i++) {
        var deckCopy = [...startDeck];
        spiderDeck.push(deckCopy);
    }
    var spiderDeckFlat = spiderDeck.flat();
    //console.log(spiderDeckFlat);
    //var deckCopy = [...startDeck];

    //shuffle the deck
    var spiderDeckShuffled = spiderShuffle(spiderDeckFlat);
    console.log(spiderDeckShuffled);

    return spiderDeckShuffled;
}

const pickSuits = (difficulty: string, suits: string[]): [string[], number] => {
    if(difficulty === "easy") {
        const randomSuit = suits[Math.floor(Math.random() * suits.length)];
        return [[randomSuit], 8];
    } else if (difficulty === "medium") {
        const black = suits.filter((c, i) => i % 2 === 0);
        const red = suits.filter((c, i) => i % 2 === 1);
        const randomSuit1 = black[Math.floor(Math.random() * black.length)];
        const randomSuit2 = red[Math.floor(Math.random() * red.length)];
        return [[randomSuit1, randomSuit2], 4];
    } else if (difficulty === "hard") {
        return [suits, 2];
    } else {
        //false
        return [[], 0];
    }
}

//GAMEPLAY FUNCTIONS (Spider + Simple Simon)

const spiderShuffle = (deck: Card[]) => {
    for (let i = 0; i < deck.length; i++) {
        let j = Math.floor(Math.random() * deck.length);
        let temp = deck[i];
        deck[i] = deck[j];
        deck[j] = temp;
    }
    //console.log(deck);
    return deck;
}

//can use getValue from the deckOOP, just don't pass anything
export const getSpiderCardValue = (card: Card) => {
    /*var value = getStraightVal(card);
    if(value === 14) {
        //ace is low
        return 1;
    } else {
        return value;
    }*/
   return card.getValue();
}

//in Spider and Simple Simon, you can place any card that is 1 value lower on another card
//but to be able to move a run all cards must in addition be of the same suit
//this function is to check card placement
export const isValidBuildDownSpd = (targetCard: Card, topRunCard: Card) => {
    const topSelectedValue = getSpiderCardValue(topRunCard);
    const targetCardValue = getSpiderCardValue(targetCard);
    //the difference between the target card and top run card must be 1
    if(targetCard.getValue() - topRunCard.getValue() === 1) {
        return true;
    } else {
        return false;
    }
}

//this function is to check valid run to move
export const isValidRunToMoveSp = (run: Card[]) => {
    var flag = false;
    //IMPORTANT THAT this flag is to check whether the loop below should be exited
    //if an invalid run is found, change flag to true to end run
    for(let i = 0; i <= run.length - 2; i++) {
        const beforeCard = run[i];
        const afterCard = run[i + 1];

        const bcv = beforeCard.getValue();
        const acv = afterCard.getValue();

        const bcs = beforeCard.suit;
        const acs = afterCard.suit;

        if(bcv - acv !== 1 || bcs !== acs) {
            flag = true;
            break;
        }
    }
    if(flag) return false;
    else return true;
}

//function to check a complete stack, which is a run from ace to king
export const checkForCompleteStackSpd = (run: Card[]) => {
        //flag functions like the function above
        var flag = false;
        var foundComplete = false;
        for(let i = run.length - 1; i > 0; i--) {
            //represents the last card of the run
            //in a complete run, the first iteration represents the ace
            const beforeCard = run[i];
            const afterCard = run[i - 1];

            //extract card values
            const bcv = beforeCard.getValue();
            const acv = afterCard.getValue();

            //extract card suit
            const bcs = beforeCard.suit;
            const acs = afterCard.suit;

            //if any out of order cards or different suit card then,
            if(acv - bcv !== 1 || bcs !== acs) {
                flag = true;
                break;
            }
            //if until then, there are no invalid combinations,
            //and the "after card" is the king
            //a complete run is found
            if(flag === false && afterCard.rank === "K") {
                foundComplete = true;
                break;
            }
        }
        //return if: exit flag is false, foundComplete true, and last card of run is ace
        if(foundComplete && !flag && run[run.length - 1].rank === "A") {
            console.log("complete run found");
            return true;
        } else return false;
    }