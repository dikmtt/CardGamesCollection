import { copyNums, getRank } from "../SpeedPoker/hands";

export const dealForOM = (deck: string[], firstPlayer: number) => {
    //console.log(deck);
    //console.log(firstPlayer);
    var hands = Array();
    for(var i = 0; i < 4; i++) {
        hands.push(Array());
    }

    var player = (firstPlayer + 1) % 4;
    while(deck.length > 0) {
        var c = deck.pop();
        //console.log(c);
        hands[player].push(c);
        player = (player + 1) % 4;
    }

    //console.log(hands);
    return hands;
}

const getRanksWithPairs = (hand: string[]) => {
    var numsCopy = copyNums();
    hand.forEach(card => {
        var currCardValue = getRank(card);
        if(numsCopy[currCardValue] !== undefined) {
            numsCopy[currCardValue]++;
        }
    });

    var pairs = Array();

    for(let key in numsCopy) {
        //if any value has four cards in it return a four of a kind
        if (numsCopy[key] >= 2) {
            pairs.push(key);
        }
    }
    return pairs;
}

export const checkForPairs = (hand: string[]) => {
    var pairs = getRanksWithPairs(hand);
    if(pairs.length > 0) return true;
    else return false;
}

export const getRandomPair = (hand: string[]) => {
    var pairs = getRanksWithPairs(hand);
    var randomRank = pairs[Math.floor(Math.random() * pairs.length)];

    var paired = hand.filter(c => getRank(c) === randomRank);
    //if(paired.length >= 2) {
        var returnArr = Array();
        for(var i = 0; i < 2; i++) {
            returnArr.push(paired[i]);
        }
        return returnArr;
    //}
}