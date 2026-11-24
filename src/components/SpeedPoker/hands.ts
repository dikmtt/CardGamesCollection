const numOfCards: Record<string, number> = {
    "2": 0,
    "3": 0,
    "4": 0,
    "5": 0,
    "6": 0,
    "7": 0,
    "8": 0,
    "9": 0,
    "10": 0,
    "J": 0,
    "Q": 0,
    "K": 0,
    "A": 0
};

const numOfSuits: Record<string, number> = {
    "S": 0,
    "H": 0,
    "C": 0,
    "D": 0
};

export function copyNums() {
    return {...numOfCards};
}

export function copySuits() {
    return {...numOfSuits};
}

//get the rank of a card
export const getRank = (card: string) => {
    let cd = card.split("-");
    return cd[0].toString();
}
//get the suit of a card
export const getSuit = (card: string) => {
    let cd = card.split("-");
    return cd[1];
}
//get the value of a card. j = 11, q = 12, k = 13, a = 1 or 14
export const getStraightVal = (card) => {
    let cd = card.split("-");
    let value = cd[0];

    if(isNaN(value)) {
        if(value == "J") {
            return 11;
        } else if (value == "Q") {
            return 12;
        } else if(value == "K") {
            return 13;
        //by default, ace is 14. later check if there's no face cards then ace will be 1
        } else if(value == "A") {
            return 14;
        }
    }
    return parseInt(value);
}

export const determineHand = (hand: string[]) => {
    //priority in determining hand: flush, straight, then pairs/triplets/quads
    var pokerHand;
    const isFlush = findFlush(hand);
    const isStraight = findStraight(hand);
    if(isFlush && isStraight) {
        pokerHand = "Straight Flush";
    } else if (isFlush && !isStraight) {
        pokerHand = "Flush";
    } else if(!isFlush && isStraight) {
        pokerHand = "Straight";
    } else {
        pokerHand = findPairsOrMore(hand);
    }
    return pokerHand;
}

const findFlush = (hand: string[]) => {
    var suitsCopy = copySuits();
    hand.forEach(card => {
        var currCardSuit = getSuit(card);
        if(suitsCopy[currCardSuit] !== undefined) {
            suitsCopy[currCardSuit]++;
        }
    });

    for(let key in suitsCopy) {
        if(suitsCopy[key] === 5) {
            return true;
        }
    }
    return false;
}

const findStraight = (hand: string[]) => {
    var straightCards = Array();
    hand.forEach(card => {
        var straightCardRank = getStraightVal(card);
        straightCards.push(straightCardRank);
    });
    //console.log(straightCards);

    //this is to change the ace value to 1 if there are no face cards
    var aceIsFourteen = 0;
    for(const v of straightCards) {
        if(v > 10 && v < 14) {
            aceIsFourteen = 1;
            break;
        }
    }
    //note that this only replaces the first 14 of the array
    if(aceIsFourteen === 0 && straightCards.includes(14)) {
        var aceIdx = straightCards.indexOf(14);
        straightCards[aceIdx] = 1;
    }

    //sort the array
    straightCards.sort(function(a, b) {return a - b});
    //console.log(straightCards);

    //check for straight in the sorted array, by comparing each value and its predecessor
    //and whether the difference is one
    var straight = true;
    for(var i = 0; i < straightCards.length - 1; i++) {
        if(straightCards[i + 1] - straightCards[i] !== 1) {
            straight = false;
            break;
        }
    }
    return straight;
}

const findPairsOrMore = (hand: string[]) => {
    var numsCopy = copyNums();

    //count the occurences of each card in a hand
    hand.forEach(card => {
        var currCardValue = getRank(card);
        if(numsCopy[currCardValue] !== undefined) {
            numsCopy[currCardValue]++;
        }
    });

    var triplets = 0, pairs = 0;
    for(let key in numsCopy) {
        //if any value has four cards in it return a four of a kind
        if (numsCopy[key] === 4) {
            return "Four of a Kind";
        }
        if (numsCopy[key] === 3) {
            triplets++;
        }
        if(numsCopy[key] === 2) {
            pairs++;
        }
    }
    if(triplets >= 1 && pairs === 1) {
        return "Full House";
    } else if(triplets >= 1 && pairs < 1) {
        return "Three of a Kind";
    } else if(pairs === 2) {
        return "Two Pair";
    } else if(triplets < 1 && pairs === 1) {
        return "Pair";
    } else {
        return "High Card";
    }
}