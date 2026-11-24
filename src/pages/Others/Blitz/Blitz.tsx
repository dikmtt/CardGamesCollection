import { IonAlert, IonButton, IonCol, IonContent, IonGrid, IonLabel, IonPage, IonRow, IonText } from "@ionic/react";
import React, { useContext, useEffect, useRef, useState } from "react";
import { useHistory } from "react-router";
import { DeckContext } from "../../../components/Context/DeckContext";
import { Card, defaultCard, shuffleNew } from "../../../components/CardLogic/deckOOP";
import { eightsDeal } from "../../../components/MiscGames/crazyeights";
import { analyzeTopDiscard, calculateHandScore, findDiscard, getScores } from "../../../components/MiscGames/blitz";
import { sortHand } from "../../../components/CardLogic/4-player-setup";

const Blitz: React.FC = () => {
    const deckCtx = useContext(DeckContext);
    const history = useHistory();

    const players = ["You", "West", "North", "East"];

    const [deck, setDeck] = useState<Card[]>([]);
    const [hands, setHands] = useState<Card[][]>([[], [], [], []]);
    const handRef = useRef(hands);
    const [discards, setDiscards] = useState<Card[]>([]);
    const discardRef = useRef(discards);
    const [message, setMessage] = useState<string>("");

    const [gameStart, setGameStart] = useState(false);
    const [endGame, setEndGame] = useState(false);
    const endGameRef = useRef(endGame);
    const [scores, setScores] = useState<number[]>([0, 0, 0, 0]);
    const yourTurn = useRef(false);
    //phase 0 = opp turn, phase 1 = take stock/discard pile, phase 2 = discard from hand
    const phase = useRef(0);
    const winner = useRef(-1);
    const loser = useRef(-1);
    //whether game ended by a player knocking or not
    const [playerKnocked, setPlayerKnocked] = useState(false);

    const initDeal = () => {
        var deck = shuffleNew();
        setDeck(deck);
        var playerHands = eightsDeal(deck, 4, "acehigh");
        setHands(playerHands);
        //initialize discard pile
        var firstDiscard = Array(1).fill(deck.pop());
        setDiscards(firstDiscard);
    }

    const newRound = () => {
        initDeal();
        setGameStart(false);
        setEndGame(false);
        setScores([0, 0, 0, 0]);
        winner.current = -1;
        loser.current = -1;
        setPlayerKnocked(false);
    }

    const startGame = () => {
        setGameStart(true);

        const score = getScores(hands);

        var randomFirstPlayer = Math.floor(Math.random() * 4);
        setMessage(players[randomFirstPlayer] + 
                (randomFirstPlayer === 0 ? " are the first player" : " is the first player"));
        setTimeout(() => {
            if(randomFirstPlayer === 0) {
                yourTurn.current = true;
                phase.current = 1;
            } else {
                opponentTurn(randomFirstPlayer);
            }
        }, 1500);
    }

    useEffect(() => {
        newRound();
    }, []);

    const opponentTurn = (playerId: number) => {
        yourTurn.current = false;
        var messageTemp = players[playerId] + "'s turn";
        //setMessage(players[playerId] + "'s turn");
        var handTemp = [...hands[playerId]];

        //temporary discard variable
        var discardTemp = [...discardRef.current];
        //analyze the top card of the discard pile and decide whether
        //the ai player wants the discard or not
        const takeFromDiscard = analyzeTopDiscard(handTemp, discardRef.current[0]);

        if(takeFromDiscard) {
            //take from the top discard pile
            handTemp.push(discardRef.current[0]);
            discardTemp = removeTakenDiscardCard();
            messageTemp += " (took from discard)";
        } else {
            //take the top card of the stock
            const newCard = deck.pop()!;
            handTemp.push(newCard);
            messageTemp += " (took from stock)";
        }
        setMessage(messageTemp);

        //analyze the hand once more to find the card to be discarded
        const discardedCard = findDiscard(handTemp);
        //console.log(handTemp, discardedCard);

        //get the hand without the discarded card
        const finalHand = handTemp.filter(c => c.getName() !== discardedCard.getName());
        //const sortedFinHand = sortHand(finalHand, "acehigh");
        //console.log(sortedFinHand);
        //update the discard pile
        discardTemp.unshift(discardedCard);
        //console.log("new discard after opp discards:",discardTemp);
        /*setHands((prev) => {
                return prev.map((hand, handIdx) => {
                    if(handIdx === playerId) {
                        return sortedFinHand;
                    }
                    return hand;
                });
            });*/
        updateHand(playerId, finalHand);
        setDiscards(discardTemp);

        //logic to determine if the player will knock or not
        //usually when i play 41 players can only knock if hand score is at least 39
        //a more popular variant allows anyone to knock as long as all hand suits are the same
        willKnock(finalHand);

        
            setTimeout(() => {
                if(!endGameRef.current) {
                nextTurn(playerId);
                }
            }, 1500);
        
    }

    const nextTurn = (prevPlayer: number) => {
        if(deck.length === 0) {
            setEndGame(true);
        } else {
            const newPlayer = (prevPlayer + 1) % 4;
            if(newPlayer === 0) {
                yourTurn.current = true;
                phase.current = 1;
                setMessage("Your turn");
            } else {
                phase.current = 0;
                opponentTurn(newPlayer);
            }
        }
    }

    const updateHand = (playerId: number, newHand: Card[]) => {
        //sort hand before updating state
        const sortedFinHand = sortHand(newHand, "acehigh");
        //console.log(sortedFinHand);

        setHands((prev) => {
            return prev.map((hand, handIdx) => {
                if(handIdx === playerId) {
                    return sortedFinHand;
                }
                return hand;
            });
        });
    }

    const removeTakenDiscardCard = () => {
        const newDiscard = discardRef.current.filter((_, i) => i > 0);
        //console.log("new discard:",newDiscard);
        //setDiscards(newDiscard);
        return newDiscard;
    }

    const willKnock = (hand: Card[]) => {
        const handScore = calculateHandScore(hand);
        if(handScore >= 39) {
            setPlayerKnocked(true);
            setEndGame(true);
        }
    }

    useEffect(() => {
        discardRef.current = discards;
    }, [discards]);

    useEffect(() => {
        handRef.current = hands;
    }, [hands]);

    useEffect(() => {
        endGameRef.current = endGame;
    }, [endGame]);

    //player's functions
    const addCardToHand = (source: string) => {
        var handTemp = [...hands[0]];
        if(source === "stock") {
            var topStock = deck.pop()!;
            handTemp.push(topStock);
        } else {
            var topDiscard = discardRef.current[0];
            handTemp.push(topDiscard);
            const newDisc = removeTakenDiscardCard();
            setDiscards(newDisc);
        }
        updateHand(0, handTemp);
        phase.current = 2;
    }

    const discardCardFromHand = (card: Card) => {
        var handTemp = [...hands[0]];
        var newHand = handTemp.filter(c => c.getName() !== card.getName());
        updateHand(0, newHand);

        var discardTemp = [...discardRef.current];
        discardTemp.unshift(card);
        setDiscards(discardTemp);

        willKnock(newHand);

        //next player (clockwise order, so it's west)
        
            setTimeout(() => {
                if(!endGameRef.current) {
                phase.current = 0;
                nextTurn(0);
                }
            }, 1500);
        
    }

    useEffect(() => {
        if(endGame) {
            const scores = getScores(handRef.current);
            winner.current = scores.findIndex(v => v === Math.max(...scores));
            loser.current = scores.findIndex(v => v === Math.min(...scores));
            setScores(scores);
        }
    }, [endGame]);

    return(
        <IonPage>
            <IonContent>
                <IonGrid>
                    <IonRow>
                        <IonCol className="west-cards">
                            <IonRow className="ht-playername">
                                <IonText>west</IonText>
                            </IonRow>
                            {/* West's cards */}
                            {hands?.[1]?.map((cd, idx) => (
                                <IonRow 
                                    className="ht-west-cards"
                                    style={{
                                        position: "relative",
                                        height: `${50}px`
                                    }}
                                >
                                    <img 
                                        className="ht-west-card ht-cardsize"
                                        src={!endGame ? 
                                            deckCtx?.declareBack() :
                                            deckCtx?.declareFace(cd.getName())
                                        }
                                        style={{marginBottom: -120}}
                                    />
                                </IonRow>
                            ))}
                        </IonCol>
                        <IonCol size={deckCtx?.screenWidth === "large" ? "9" : "6"}>
                            <IonRow className="ht-playername">
                                <IonText>north</IonText>
                            </IonRow>
                            {/* North's cards */}
                            <IonRow className="north-cards">
                                {hands?.[2]?.map((cd, idx) => (
                                    <IonCol 
                                        className="ht-north-cards" 
                                        style={{left: `${idx * (deckCtx?.screenWidth === "large" ? 100 : deckCtx?.screenWidth === "medium" ? 20 : 10)}px`}}
                                    >
                                        <img 
                                            className="ht-north-card ht-cardsize"
                                            src={!endGame ? 
                                                deckCtx?.declareBack() :
                                                deckCtx?.declareFace(cd.getName())
                                            }
                                        />
                                    </IonCol>
                                ))}
                            </IonRow>
                            <IonRow>
                                <IonCol>
                                    <div className="eights-stock">
                                        <img 
                                            className="ht-played-card"
                                            src={deckCtx?.declareBack()}
                                            style={{width: "110px",
                                                visibility: deck.length === 0 ? 'hidden' : 'visible',
                                            }}
                                            onClick={
                                                () => gameStart && yourTurn.current && phase.current === 1 ?
                                                addCardToHand("stock") : undefined
                                            }
                                        />
                                    </div>
                                </IonCol>
                                <IonCol>
                                    <div className="eights-discard">
                                        <img 
                                            className="ht-played-card"
                                            //the length check is a foolproof so the program does not crash when loaded
                                            src={discards.length === 0 || !gameStart ?
                                                deckCtx?.declareBack() :
                                                deckCtx?.declareFace(discards[0].getName())}
                                            style={{width: "110px",
                                                visibility: discards.length === 0 || !gameStart ? 'hidden' : 'visible',
                                            }}
                                            onClick={
                                                () => gameStart && yourTurn.current && phase.current === 1 ?
                                                addCardToHand("discard") : undefined
                                            }
                                        />
                                    </div>
                                </IonCol>
                            </IonRow>
                            <IonRow className="ht-trick-winner">
                                <IonLabel>{message}</IonLabel>
                                {!gameStart &&
                                <IonButton onClick={startGame}>Start Game</IonButton>}
                            </IonRow>
                        </IonCol>
                        <IonCol className="east-cards">
                            <IonRow className="ht-playername">
                                <IonText>east</IonText>
                            </IonRow>
                            {/* East's cards */}
                            {hands?.[3]?.map((cd, idx) => (
                                <IonRow 
                                    className="ht-east-cards"
                                    style={{ height: `${50}px` }}
                                >
                                    <img 
                                        className="ht-east-card ht-cardsize"
                                        src={!endGame ? 
                                            deckCtx?.declareBack() :
                                            deckCtx?.declareFace(cd.getName())
                                        }
                                        style={{marginBottom: -120}}
                                    />
                                </IonRow>
                            ))}
                        </IonCol>
                    </IonRow>
                    <IonRow className="your-cards">
                        {hands[0].map((cd, idx) => (
                            <IonCol
                                className="ht-your-cards ht-infocol" 
                                style={{left: `${idx * (deckCtx?.screenWidth === "large" ? 125 : deckCtx?.screenWidth === "medium" ? 48 : 25)}px`}}
                            >
                                <img 
                                    className="ht-your-card ht-cardsize"
                                    src={deckCtx?.declareFace(cd.getName())}
                                    onClick={
                                        () => gameStart && yourTurn.current && phase.current === 2 ?
                                        discardCardFromHand(cd) : undefined
                                    }
                                />
                            </IonCol>
                        ))}
                    </IonRow>
                </IonGrid>
                <IonAlert 
                    isOpen={endGame}
                    header="The Game is Finished"
                    subHeader={
                        `${playerKnocked ? players[winner.current] : "Nobody"} knocked. ${players[loser.current]} lost the game!`
                    }
                    message={
                        scores.map((sc, i) => (
                            `${players[i]}: ${sc} ${i < 3 ? "\n" : ""}`
                        )).join("\n")
                    }
                    buttons={['Exit']}
                    onDidDismiss={() => history.goBack()}
                    cssClass="ht-scores"
                />
            </IonContent>
        </IonPage>
    );
}

export default Blitz;