import { getStraightVal, getSuit } from "../../../components/SpeedPoker/hands";

//Functions for Spider and Simple Simon

const getSpiderCardValue = (card: string) => {
    var value = getStraightVal(card);
    if(value === 14) {
        //ace is low
        return 1;
    } else {
        return value;
    }
}

//in Spider and Simple Simon, you can place any card that is 1 value lower on another card
//but to be able to move a run all cards must in addition be of the same suit
//this function is to check card placement
const isValidBuildDownSpd = (targetCard: string, topRunCard: string) => {
    const topSelectedValue = getSpiderCardValue(topRunCard);
    const targetCardValue = getSpiderCardValue(targetCard);
    //the difference between the target card and top run card must be 1
    if(targetCardValue - topSelectedValue === 1) {
        return true;
    } else {
        return false;
    }
}

//this function is to check valid run to move
const isValidRunToMoveSp = (run: string[]) => {
    var flag = false;
    //IMPORTANT THAT this flag is to check whether the loop below should be exited
    //if an invalid run is found, change flag to true to end run
    for(let i = 0; i <= run.length - 2; i++) {
        const beforeCard = run[i];
        const afterCard = run[i + 1];

        const bcv = getSpiderCardValue(beforeCard);
        const acv = getSpiderCardValue(afterCard);

        const bcs = getSuit(beforeCard);
        const acs = getSuit(afterCard);

        if(bcv - acv !== 1 || bcs !== acs) {
            flag = true;
            break;
        }
    }
    if(flag) return false;
    else return true;
}