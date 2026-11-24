import { IonAlert, IonButton, IonCol, IonContent, IonGrid, IonLabel, IonPage, IonRow, IonText } from "@ionic/react";
import React, { useContext, useEffect, useRef, useState } from "react";
import { DeckContext } from "../../../components/Context/DeckContext";
import { buildEuchreDeck, setTrump } from "../../../components/Euchre/euchre";
import { getRank, getStraightVal, getSuit } from "../../../components/SpeedPoker/hands";
import "./EuchreSol.css";
import { useHistory } from "react-router";

const EuchreSol: React.FC = () => {
    const deckCtx = useContext(DeckContext);
    deckCtx?.change4CSupportOps(false);
    const history = useHistory();

    const [deck, setDeck] = useState<string[]>([]);
    const [hand, setHand] = useState<string[]>([]);
    const [trumps, setTrumps] = useState<string[]>([]);
    const [candidateTrump, setCandidateTrump] = useState("");
    const [currDiscard, setCurrDiscard] = useState<string>("");
    const [playedCard, setPlayedCard] = useState<string>("");
    const [ledSuit, setLedSuit] = useState<string>("");
    const [scores, setScores] = useState<number[]>([0, 0]);
    const [tricksTaken, setTricksTaken] = useState<number[]>([0, 0]);
    const [message, setMessage] = useState<string>("");
    const trickRef = useRef([playedCard, currDiscard]);
    const trickWinner = useRef(-1);
    const ledSuit2 = useRef("");
    const maker = useRef(-1);

    const [gameStart, setGameStart] = useState(false);
    const [isDetermineTrumpPhase, setIsDetermineTrumpPhase] = useState(false);
    const [dealerRejects, setDealerRejects] = useState(false);
    const [canPlay, setCanPlay] = useState(false);
    const [bothCardsPlayed, setBothCardsPlayed] = useState(false);
    const [firstDetermined, setFirstDetermined] = useState(false);
    const [scoresOpen, setScoresOpen] = useState(false);
    const [gameOverOpen, setGameOverOpen] = useState(false);

    const sfxWin = new Audio("/assets/sounds/memes/win.mp3");
    const sfxLose = new Audio("/assets/sounds/memes/lose.mp3");

    const suits = ["S", "H", "C", "D"];
    const suitsFull = ["Spades", "Hearts", "Clubs", "Diamonds"];

    //honestly after coding this game i find it really unfun lol,
    //it's primarily luck based too
    //so much that i'm actually looking forward to make the actual euchre game
    //or maybe i should revise the shuffling algorithm

    const newHand = () => {
        var eDeck = buildEuchreDeck();

        var eHand = Array();
        for(var i = 0; i < 5; i++) {
            var card = eDeck.pop();
            eHand.push(card);
        }
        setDeck(eDeck);
        setHand(eHand);
        console.log("deck: ", eDeck);
        console.log("hand: ", eHand);
    }

    useEffect(() => {
        newHand();
    }, []);

    useEffect(() => {
        trickRef.current = [playedCard, currDiscard];
        //trickRef.current[1] = playedCard;
    }, [currDiscard, playedCard]);

    const startGame = () => {
        setGameStart(true);
        setIsDetermineTrumpPhase(true);
        const firstcard = deck.pop();
        setCurrDiscard(firstcard);

        const candidate = getSuit(firstcard);
        setCandidateTrump(candidate);
        var suitIdx = suits.indexOf(candidate);
        setMessage(`The candidate for trump is ${suitsFull[suitIdx]}, do you accept it?`);
    }

    const acceptTrump = () => {
        const trumpOrder = setTrump(candidateTrump);
        setTrumps(trumpOrder);
        //setLedSuit(candidateTrump);
        //ledSuit2.current = candidateTrump;
        setCandidateTrump("");
        console.log(trumpOrder);
        setIsDetermineTrumpPhase(false);
        setCanPlay(true);
        maker.current = 0;
        setFirstDetermined(true);
        setHand(prev => [...prev, currDiscard]);
        setCurrDiscard("");
        setMessage("Choose a card to discard");
    }

    const discardIfFirstDetermined = (card: string) => {
        const handAfterPlay = hand.filter(c => c !== card);
        setHand(handAfterPlay);
        setFirstDetermined(false);
        setMessage("Now play a card");
    }

    const rejectTrump = () => {
        //dealer determines trump by looking at the top card of the stock
        var topCard = deck[deck.length - 1];
        console.log(topCard);
        console.log(candidateTrump);
        var topCardColIdx = suits.indexOf(getSuit(topCard));
        var candidateTrumpIdx = suits.indexOf(candidateTrump);

        //same color
        if(topCardColIdx % 2 === candidateTrumpIdx % 2) {
            setMessage(`Dealer accepts ${suitsFull[candidateTrumpIdx]} as trump, play a card`);
            const trumpOrder = setTrump(candidateTrump);
            setTrumps(trumpOrder);
            setCanPlay(true);
            //setLedSuit(candidateTrump);
            ledSuit2.current = candidateTrump;
            maker.current = 1;
        } else {
            setMessage(`Dealer rejects ${suitsFull[candidateTrumpIdx]} as trump, pick the trump yourself!`);
            setDealerRejects(true);
            setCurrDiscard("");
        }
        setIsDetermineTrumpPhase(false);
    }

    const setTrumpWhenReject = (suit: string) => {
        const trumpOrder = setTrump(suit);
        setTrumps(trumpOrder);
        setCandidateTrump("");
        console.log(trumpOrder);
        setIsDetermineTrumpPhase(false);
        setDealerRejects(false);
        setCanPlay(true);
        maker.current = 0;
        setMessage("Now play any card as you wish");
    }

    const playCard = (card: string) => {
        //console.log(card);
        const isLegalPlay = checkIfValidPlay(card);
        if(!isLegalPlay) {
            console.log("illegal play");
            return;
        }
        setPlayedCard(card);
        setCanPlay(false);
        if(ledSuit2.current === "") {
            //setLedSuit(getSuit(card));
            ledSuit2.current = getSuit(card);
        }
        //console.log("ledSuit: ", ledSuit2.current);
        const handAfterPlay = hand.filter(c => c !== card);
        setHand(handAfterPlay);
        //if(currDiscard !== "") {
        //    setLedFirst(true);
        //}
        if(currDiscard === "") {
            function dealerKeepsPlaying() {
                dealerPlays();
                setTimeout(() => {
                if((trumps.includes(trickRef.current[1]) || 
                    (getSuit(trickRef.current[1]) === ledSuit2.current) 
                    && trickRef.current[0] !== leftBower()) || deck.length === 0) {
                    //console.log("yee");
                    compareCards();
                } else {
                    dealerKeepsPlaying();
                }
                }, 1000);
            }
            dealerKeepsPlaying();
        } else {
            setTimeout(() => {
                compareCards();
            }, 100);
        }
    }

    const checkIfValidPlay = (card: string) => {
        var handOnlyLead;
        //if this is your turn to lead
        if(currDiscard === "") {
            return true;
        } else {
            //the hand with only the cards of the lead suit, or the trump suit if it's the left bower
            if(currDiscard === leftBower()) {
                handOnlyLead = hand.filter(c => trumps.includes(c));
            } else {
                handOnlyLead = extractLeadSuitCards(card);
            }
            console.log(handOnlyLead);
            //if there are still cards of the lead suit, valid plays are cards of the lead suit
            if(handOnlyLead.length > 0) {
                if(getSuit(card) === ledSuit2.current || 
                    (getSuit(currDiscard) === getSuit(trumps[0]) && card === leftBower()) ||
                    (currDiscard === leftBower() && getSuit(card) === getSuit(trumps[0]))) {
                    return true;
                } else {
                    return false;
                }
            //if there are no cards of the lead suit, any card may be played
            } else {
                return true;
            }
        }
    }

    const leftBower = () => {
        const trumpSuit = getSuit(trumps[0]);
        const trumpIdx = suits.indexOf(trumpSuit);
        const bowerSuit = (trumpIdx + 2) % 4;
        return "J-" + suits[bowerSuit];
    }

    const extractLeadSuitCards = (card: string) => {
        //the trump suit index
        const trumpSuit = getSuit(trumps[0]);
        const trumpIdx = suits.indexOf(trumpSuit);
        //the lead suit index
        const leadIdx = suits.indexOf(ledSuit2.current);

        //if the index mod 2 is the same (meaning the suits are the same color)
        //filter out the bowers if the lead isn't trump, and include bowers if the lead is trump
        if(trumpIdx % 2 === leadIdx % 2) {
            //if the led suit is trump: all legal plays should be trump cards, including bowers
            if(ledSuit2.current === trumpSuit || card === leftBower()) {
                return hand.filter(c => trumps.includes(c));
            } else {
                return hand.filter(c => getSuit(c) === ledSuit2.current && getRank(c) !== "J");
            }
        //else, filter out as normally (no bowers in action)
        } else {
            return hand.filter(c => getSuit(c) === ledSuit2.current);
            //return filteredHand;
        }
    }

    const dealerPlays = () => {
        const leadCard = deck.pop();
        setCurrDiscard(leadCard);
    }

    const compareCards = () => {
        setBothCardsPlayed(true);
        //if both players played trump: the higher trump wins
        console.log(trickRef.current);
        if(trickRef.current[1] === "" && deck.length === 0) {
            trickWinner.current = 0;
        }
        else if(trumps.includes(trickRef.current[0]) && trumps.includes(trickRef.current[1])) {
            console.log(trumps.indexOf(trickRef.current[1]), trumps.indexOf(trickRef.current[0]))
            if(trumps.indexOf(trickRef.current[1]) > trumps.indexOf(trickRef.current[0])) {
                trickWinner.current = 1;
            } else {
                trickWinner.current = 0;
            }
        //if only one player played trump: the player who played trump wins
        //little bug: once the dealer played the left bower and lost (JS vs AS, club trump)
        } else if(trumps.includes(trickRef.current[1]) || trumps.includes(trickRef.current[0])) {
            console.log("someone played a trump");
            if(trumps.includes(trickRef.current[1])) {
                trickWinner.current = 1;
            } else {
                trickWinner.current = 0;
            }
        }
        //if both players played the same suit: the player who played the higher card wins
        else if(getSuit(trickRef.current[0]) === getSuit(trickRef.current[1])) {
                if(getStraightVal(trickRef.current[1]) > getStraightVal(trickRef.current[0])) {
                    trickWinner.current = 1;
                } else {
                    trickWinner.current = 0;
                }
        //if both players played different suits: the player who played the led suit wins
        } else {
                if(getSuit(trickRef.current[1]) === ledSuit2.current) {
                    trickWinner.current = 1;
                } else {
                    trickWinner.current = 0;
                }
        }
        setTrickWinnerMessage();
    }

    const noBowers = () => {
        const trumpIdx = suits.indexOf(ledSuit2.current);
        const offColorIdx = (trumpIdx + 2) % 4;
        const left = "J-" + suits[offColorIdx];
        const right = "J-" + ledSuit2.current;
    }

    const setTrickWinnerMessage = () => {
        if(trickWinner.current === 1) {
            setMessage("Dealer wins this trick");
        } else if(trickWinner.current === 0) {
            setMessage("You win this trick");
        }
        setTricksTaken(prev => 
            prev.map((val, idx) => {
                if(idx === trickWinner.current) {
                    return val + 1;
                }
                return val;
            })
        );
    }

    const nextTrick = () => {
        setCurrDiscard("");
        setPlayedCard("");
        setMessage("");
        ledSuit2.current = "";
        setBothCardsPlayed(false);
        if(hand.length > 0) {
            if(trickWinner.current === 1) {
                const dealerCard = deck.pop();
                setCurrDiscard(dealerCard);
                //setLedSuit(getSuit(dealerCard));
                ledSuit2.current = getSuit(dealerCard);
            }
            trickWinner.current = -1;
            setCanPlay(true);
        } else {
            console.log("over");
            setScores(prev => 
                prev.map((val, idx) => {
                    //maker or defender collects 5 tricks = +2 points
                    if(tricksTaken[idx] === 5) {
                        return val + 2;
                    //maker collects 3 or 4 tricks = +1 point
                    } else if(tricksTaken[idx] >= 3 && maker.current === idx) {
                        return val + 1;
                    //defender collects 3 or more tricks = +2 points for an euchre
                    } else if(tricksTaken[idx] >= 3 && maker.current !== idx) {
                        return val + 2;
                    }
                    return val;
                })
            );
            setTimeout(() => {
                setScoresOpen(true);
            }, 100);
        }
    }

    const newRound = () => {
        setScoresOpen(false);
        setTrumps([]);
        setGameStart(false);
        setTricksTaken([0, 0]);
        maker.current = -1;
        if(scores.some(c => c >= 10)) {
            setGameOverOpen(true);
        } else {
            newHand();
        }
    }

    return(
        <IonPage>
            <IonContent>
                <IonGrid>
                    <IonRow>
                        <IonCol size="2">
                            {/* Stock Pile */}
                            <div
                                style={{
                                    padding: 0,
                                    border: deck.length > 0 ? "none" : "1px solid white",
                                }}
                            >
                                <img 
                                    src={deckCtx?.declareBack()}
                                    style={{
                                        width: "150px",
                                        opacity: deck.length > 0 ? "100%" : "0%"
                                    }}
                                />
                            </div>
                        </IonCol>
                        <IonCol size="2">
                            {/* Waste Pile (Dealer's card) */}
                            <div
                                style={{
                                    padding: 0,
                                    border: currDiscard !== "" ? "none" : "1px solid white",
                                }}
                            >
                                <img 
                                    src={currDiscard !== "" ?
                                        deckCtx?.declareFace(currDiscard) :
                                        deckCtx?.declareBack()
                                    }
                                    style={{width: "150px",
                                        opacity: currDiscard !== "" ? "100%" : "0%"
                                    }}
                                />
                            </div>
                        </IonCol>
                        <IonCol size="2">
                            {/* Player's played card */}
                            <div
                                style={{
                                    padding: 0,
                                    border: playedCard !== "" ? "none" : "1px solid white",
                                }}
                            >
                                <img 
                                    src={playedCard !== "" ?
                                        deckCtx?.declareFace(playedCard) :
                                        deckCtx?.declareBack()
                                    }
                                    style={{width: "150px",
                                        opacity: playedCard !== "" ? "100%" : "0%"
                                    }}
                                />
                            </div>
                        </IonCol>
                        <IonCol>
                            <IonRow>
                                <IonText>{message}</IonText>
                            </IonRow>
                            {isDetermineTrumpPhase && 
                                <IonRow>
                                    <IonButton 
                                        onClick={acceptTrump}
                                        color={"success"}
                                    >
                                        <IonLabel>Yes</IonLabel>
                                    </IonButton>
                                    <IonButton 
                                        onClick={rejectTrump}
                                        color={"danger"}
                                    >
                                        <IonLabel>No</IonLabel>
                                    </IonButton>
                                </IonRow>
                            }
                            {dealerRejects && 
                                <IonRow>
                                    {suits.map((s, idx) => (
                                        s !== candidateTrump && 
                                            <IonButton 
                                                onClick={() => setTrumpWhenReject(s)}
                                            >
                                                <IonLabel>{suitsFull[idx]}</IonLabel>
                                            </IonButton>
                                        
                                    ))}
                                </IonRow>
                            }
                            {bothCardsPlayed &&
                                <IonRow>
                                    <IonButton onClick={nextTrick}>
                                        <IonLabel>Continue</IonLabel>
                                    </IonButton>
                                </IonRow>
                            }
                        </IonCol>
                    </IonRow>
                    <IonRow>
                        {hand.map((card, idx) => (
                            <img 
                                src={deckCtx?.declareFace(card)}
                                style={{width: "150px"}}
                                onClick={() => 
                                    firstDetermined ? discardIfFirstDetermined(card) :
                                    canPlay ? playCard(card) : undefined}
                            />
                        ))}
                    </IonRow>
                    <IonRow>
                        <IonButton 
                            disabled={gameStart ? true : false}
                            onClick={startGame}
                        >
                            <IonLabel>Start</IonLabel>
                        </IonButton>
                    </IonRow>
                </IonGrid>
                <IonAlert
                    isOpen={scoresOpen}
                    header={tricksTaken[maker.current] < 3 ? "That's a Euchre!" : "The Round is Over"}
                    subHeader={
                        `${tricksTaken[0] > tricksTaken[1] ? "You" : "Dealer"} 
                        won the round with ${Math.max(...tricksTaken)} tricks`
                    }
                    message={`Current Standings: \n Player: ${scores[0]} \n Dealer: ${scores[1]}`}
                    buttons={['Continue']}
                    onDidDismiss={() => newRound()}
                    cssClass="euchresol-scores"
                />
                <IonAlert
                    isOpen={gameOverOpen}
                    header="Game Over!"
                    message={
                        scores[0] > scores[1] ?
                        "You win the game!" :
                        `Dealer won the game.`
                    }
                    buttons={['Finish']}
                    onDidDismiss={() => {
                        setGameOverOpen(false);
                        history.goBack();
                    }}
                    onIonAlertWillPresent={() => (
                        scores[0] > scores[1] ?
                        sfxWin.play() :
                        sfxLose.play())
                    }
                />
            </IonContent>
        </IonPage>
    );
}

export default EuchreSol;