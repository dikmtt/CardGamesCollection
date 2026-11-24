import { Card, findIndexOfCard, isIncluded } from "../CardLogic/deckOOP";
import { copyNums, getRank, getStraightVal, getSuit } from "../SpeedPoker/hands";

export const getValAceLow = (card: string) => {
    const val = getStraightVal(card);
    if(val === 14) return 1;
    else return val;
}

export const findMelds = (hand: Card[]) => {
    //console.log("find melds then print here");
    const sets = findSets(hand);
    const runs = findRuns(hand);
    //console.log("sets: ", sets, ". runs: ", runs);
    return [sets, runs];
}

const findSets = (hand: Card[]) => {
    var numsCopy = copyNums();
    //console.log(numsCopy);
    hand.forEach(card => {
        var currCardValue = card.rank;
        if(numsCopy[currCardValue] !== undefined) {
            numsCopy[currCardValue]++;
        }
    });
    //console.log(numsCopy);

    var sets = Array();

    for(let key in numsCopy) {
        //if any value has four cards in it return a four of a kind
        if (numsCopy[key] >= 3) {
            sets.push(key);
        }
    }
    //console.log("ranks with sets: ", sets);

    var setCards = Array();
    if(sets.length > 0) {
        sets.forEach(set => {
            var rankSet = hand.filter(c => c.rank === set);
            setCards.push(rankSet);
        });
    }
    return setCards;
}

const findRuns = (hand: Card[]) => {
    var runs = Array();

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

    //console.log(suits);

    suits.map((suited, suitedIdx) => {
        //console.log(suited);
        //if more than one cards of rank in suit
        if(suited.length > 1) {
            var firstCard = "";
            var runStreak = 0;

            for(var i = 0; i < suited.length - 1; i++) {
                var valueNow = suited[i].getValue();
                var valueLater = suited[i + 1].getValue();
                //console.log("Now: ", valueNow, ". Later: ", valueLater);
                if((valueLater - valueNow) === 1) {
                    runStreak++;
                    //console.log("run streak: ", runStreak);
                    //stop this if the current card is the second to last card of the suit
                    if(i === suited.length - 2 && runStreak > 1) {
                        var endRank = suited[i + 1].getName();
                        //console.log("run ends at: ", endRank);
                        const cardRun = makeCardRuns(suited, endRank, runStreak);
                        runs.push(cardRun);
                    }
                    //if out of order
                } else {
                    //if any runs are found
                    if(runStreak > 1) {
                        var endRank = suited[i].getName();
                        //console.log("run ends at: ", endRank);
                        const cardRun = makeCardRuns(suited, endRank, runStreak);
                        runs.push(cardRun);
                    }
                    runStreak = 0;
                }
            }
            /*suited.map((card, cardIdx) => {
                var value = getValAceLow(card);
                //if(value === 14) value = 1;
                console.log("value: ", value);
            })*/
        }
    });

    //console.log("runs: ", runs);
    return runs;
}

const makeCardRuns = (suited: Card[], endCard: string, runStreak: number) => {
    var indexOfEndCard = suited.indexOf(suited.filter(c => c.getName() === endCard)[0]);
    var cardRun = Array();
    for(var i = 0; i < runStreak + 1; i++) {
        //add an element to start of an array
        cardRun.unshift(suited[indexOfEndCard]);
        indexOfEndCard--;
    }
    //console.log("cardRun: ", cardRun);
    return cardRun;
}

//might be used for other games
export const getValueFaces10 = (card) => {
    let cd = card.split("-");
    let value = cd[0];

    if(isNaN(value)) {
        if(value == "A") {
            return 14;
        } else return 10;
    }
    else return parseInt(value);
}

//rummy scoring
export const getValueFaces10WithAceCheck = (card: Card, ace: boolean) => {
    /*var value = getValueFaces10(card);
    if(value === 14 && aceLow) return 1;
    else return value;*/
    if(card.rank === "A") return 1;
    return card.getValue("blackjack");
}

export const calculateDeadwood = (hand: Card[], sets: Card[][], runs: Card[][]) => {
    //check if any card appears in both a set and a run. if so, then calculate the minimized deadwood
    //place all cards in sets and runs in single arrays
    var setsFlattened = flattenMelds(sets);
    var runsFlattened = flattenMelds(runs);

    var dupes = Array();
    //loop through setsFlattened array, if card also appears in runsFlattened add the card to dupes
    setsFlattened.forEach(sfc => {
        if(isIncluded(runsFlattened, sfc)) dupes.push(sfc);
    });

    //if there are no dupes
    if(dupes.length === 0) {
        //instantly filter all cards that are not in a set or run
        var deadwoodCards = hand.filter(c => 
            !isIncluded(setsFlattened, c) && 
            !isIncluded(runsFlattened, c));
        //console.log(deadwoodCards);
        var deadwoodScore = 0;
        deadwoodCards.forEach(c => {
            deadwoodScore += getValueFaces10WithAceCheck(c, true);
        });
        return [deadwoodCards, deadwoodScore];
    } else {
        var [dupesDWCards, dupesDW] = compareDeadwoodWithDupes(hand, sets, runs, dupes);
        return [dupesDWCards, dupesDW];
    }
}

const compareDeadwoodWithDupes = (hand: Card[], sets: Card[][], runs: Card[][], dupes: Card[]) => {
    //error checking: if a run is long enough (min. 4 cards) and one of the edge cards is part of a set
    //then remove that card from the run
    var [setsWithDupes, setsWithoutDupes, runsWithDupes, runsWithoutDupes] = splitDupe(sets, runs, dupes, false);

    //console.log("runsWithoutDupes: ", runsWithoutDupes);

    var setsWithDupesFlat = flattenMelds(setsWithDupes);
    var runsWithDupesFlat = flattenMelds(runsWithDupes);

    var setsNoDupesFlat = flattenMelds(setsWithoutDupes);
    var runsNoDupesFlat = flattenMelds(runsWithoutDupes);

    var handFlat = flattenHand(hand);

    //the hand without sets and runs with duplicate cards
    //var handTemp1 = hand.filter(c => !setsNoDupesFlat.includes(c) && !runsNoDupesFlat.includes(c));
    var handTemp1 = hand.filter(c =>
        !isIncluded(setsNoDupesFlat, c) && 
        !isIncluded(runsNoDupesFlat, c));

    //console.log("handTemp1: ", handTemp1);

    //compare deadwood
    //remove runs
    var [sdc, setDeadwood] = calculateDeadwood2(handTemp1, runsWithDupesFlat);
    //remove sets
    var [rdc, runDeadwood] = calculateDeadwood2(handTemp1, setsWithDupesFlat);

    if(setDeadwood <= runDeadwood) return [sdc, setDeadwood];
    else return [rdc, runDeadwood];
}

//lazy
const flattenHand = (hand: Card[]) => {
    var handFlattened = Array();
    hand.map((h, hI) => (
        handFlattened.push(h.getName()))
    );
    return handFlattened;
}

const flattenMelds = (meldList: Card[][]) => {
    var meldsFlattened = Array();
    meldList.map((m, mI) => (
        m.map((c, i) => meldsFlattened.push(c))
    ));
    return meldsFlattened;
}

const calculateDeadwood2 = (hand: Card[], meldType: Card[]) => {
    //remove all cards from hand that contains the cards in the stated meld type
    var deadwoodCards = hand.filter(c => !meldType.includes(c));
    //console.log(deadwoodCards);
    var deadwoodScore = 0;
    deadwoodCards.forEach(c => {
        deadwoodScore += getValueFaces10WithAceCheck(c, true);
    });
    return [deadwoodCards, deadwoodScore];
}

const splitDupe = (sets: Card[][], runs: Card[][], dupes: Card[], forFinal: boolean) => {
    var setsWithDupes = Array();
    var runsWithDupes = Array();
    //take the sets and runs with duplicate cards
    dupes.forEach(dupe => {
        sets.forEach(set => {
            if(isIncluded(set, dupe)) setsWithDupes.push(set);
        })
        runs.forEach(run => {
            if(isIncluded(run, dupe)) runsWithDupes.push(run);
        })
    });

    //console.log("setsWithDupes: ", setsWithDupes);
    //console.log("runsWithDupes: ", runsWithDupes);

    //get the sets and runs without duplicate cards
    var setsWithoutDupes = sets.filter(set => !setsWithDupes.some(sd => sd === set));
    var runsWithoutDupes = runs.filter(run => !runsWithDupes.some(rd => rd === run));

    //console.log("setsWithoutDupes: ", setsWithoutDupes);
    //console.log("runsWithoutDupes: ", runsWithoutDupes);

    var has4Run = false;
    dupes.forEach(dupe => {
        runsWithDupes.forEach(runWD => {
            if(isIncluded(runWD, dupe) && 
                (findIndexOfCard(runWD, dupe) === 0 || findIndexOfCard(runWD, dupe) === runWD.length - 1) &&
                runWD.length >= 4) {
                has4Run = true;
                var runTemp = runWD.filter(c => c.getName() !== dupe.getName());
                runWD = runTemp;
                runsWithoutDupes.push(runTemp);
            }
        });
        //if there is no run with a length of at least 4, then try checking for quartets
        //if there's a 3 run that can be made with one of the quartet cards move it
        setsWithDupes.forEach(setWD => {
            if(isIncluded(setWD, dupe) && !has4Run && setWD.length === 4) {
                var setTemp = setWD.filter(c => c.getName() !== dupe.getName());
                setWD = setTemp;
                setsWithoutDupes.push(setTemp);
            }
        });
    });

    if(forFinal) {
        if(has4Run) {
            setsWithDupes.forEach(set => setsWithoutDupes.push(set));
        } else {
            runsWithDupes.forEach(run => runsWithoutDupes.push(run));
        }
        return [setsWithoutDupes, runsWithoutDupes];
    } else {
        return [setsWithDupes, setsWithoutDupes, runsWithDupes, runsWithoutDupes];
    }

    //console.log("setsWithoutDupes: ", setsWithoutDupes);
    //console.log("runsWithoutDupes: ", runsWithoutDupes);

    //return [setsWithoutDupes, runsWithoutDupes];
}

export const getFinalSetsAndRuns = (hand: Card[], deadwoodCards: Card[]) => {
    //while the calculating process is able to eliminate duplicate cards
    //make it so the final sets and runs also remove duplicate cards
    var handNoDW = hand.filter(c => !isIncluded(deadwoodCards, c));
    const [finSets, finRuns] = findMelds(handNoDW);
    //console.log("finSets: ", finSets, ". finRuns: ", finRuns);

    var finSetsFlat = flattenMelds(finSets);
    var finRunsFlat = flattenMelds(finRuns);

    var dupes = Array();
    finSetsFlat.forEach(sfc => {
        if(isIncluded(finRunsFlat, sfc)) dupes.push(sfc);
    });

    if(dupes.length === 0 ) {
        return [finSets, finRuns];
    } else {
        var [finSetsSplit, finRunsSplit] = splitDupe(finSets, finRuns, dupes, true);
        return [finSetsSplit, finRunsSplit];
    }
}