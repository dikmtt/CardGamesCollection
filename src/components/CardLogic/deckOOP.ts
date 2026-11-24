export class Card {
    _rank: string;
    _suit: string;
    
    constructor(rank: string, suit: string) {
        this._rank = rank;
        this._suit = suit;
    }
    
    get rank(): string {
        return this._rank;
    }
    
    get suit(): string {
        return this._suit;
    }
    
    //return the name of the card (used to make the card images)
    getName() {
        return this._rank + "-" + this._suit;
    }
    
    //return the color of the card (useful in games like freecell and euchre)
    getColor() {
        if(this._suit === "S" || this._suit === "C") return "black";
        return "red";
    }
    
    //return the value of the card (the mode is defined per game type)
    //normal mode does not require the parameter to be passed
    getValue(mode?: string) {
        //ace
        if(this._rank === "A") {
            if(mode === "acehigh") return 14;
            else if(mode === "blackjack") return 11;
            else return 1;
        //face card
        } else if(isNaN(Number(this._rank))) {
            if(mode === "blackjack") return 10;
            else {
                if(this._rank === "J") return 11;
                else if(this._rank === "Q") return 12;
                else return 13;
            }
        //numbered card
        } else return parseInt(this._rank);
    }

    isEmpty() {
        return this._rank === "0" && this._suit === "X";
    }
}

//these are now global variables
const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const suits = ["C", "D", "H", "S"];

export const makeDeck = () => {
    var deck = Array();
    ranks.forEach((r) => {
        suits.forEach((s) => {
            var newCard = new Card(r, s);
            deck.push(newCard);
        })
    })
    //console.log(deck.length);
    //console.log(deck[43].getValue());
    return deck;
}

export const shuffleNew = () => {
    var deck = makeDeck();
    //for (let i = 0; i < deck.length; i++) {
    //updated with accurate fisher yates method
    for(let i = deck.length - 1; i >= 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        let temp = deck[i];
        deck[i] = deck[j];
        deck[j] = temp;
    }
    //console.log(deck);
    return deck;
}

//illegal card rank and suit
export const defaultCard = () => {
    return new Card("0", "X");
}

export const isIncluded = (cardArray: Card[], cardName: Card) => {
    return cardArray.some(c => c.getName() === cardName.getName());
}

export const findIndexOfCard = (cardArray: Card[], cd: Card) => {
    return cardArray.findIndex(c => c.rank === cd.rank && c.suit === cd.suit);
}

export const checkIfDefault = (card: Card) => {
    return card.rank === '0' && card.suit === 'X';
}

/*var deck = makeDeck();
deck.forEach((c) => {
    console.log(c.getName() + " is a " + c.getColor() + " card with the value of " + c.getValue("blackjack"))
})*/