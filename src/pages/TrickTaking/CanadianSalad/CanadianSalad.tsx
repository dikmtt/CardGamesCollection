import { IonAlert, IonButton, IonCol, IonContent, IonGrid, IonLabel, IonPage, IonRow, IonText, IonToast } from "@ionic/react";
import React, { useContext, useEffect, useRef, useState } from "react";
import { useHistory } from "react-router";
import { DeckContext } from "../../../components/Context/DeckContext";
import { dealTo4Players } from "../../../components/CardLogic/4-player-setup";
import { shuffle } from "../../../components/CardLogic/deck";
import { getTrickWinner, hasLedSuit } from "../../../components/Hearts/hearts";
import { getSuit } from "../../../components/SpeedPoker/hands";
import { leadRandom, playRandomCard, scorePoints } from "../../../components/Salad/salad";
import { Card, defaultCard, isIncluded, shuffleNew } from "../../../components/CardLogic/deckOOP";

const CanadianSalad: React.FC = () => {
    const deckCtx = useContext(DeckContext);
    deckCtx?.change4CSupportOps(true);
    const history = useHistory();
        
    const players = ["You", "West", "North", "East"];
    const [deck, setDeck] = useState<Card[]>([]);
    //array of arrays. index 0 is player, index 1 is west, etc
    const [hands, setHands] = useState<Card[][]>([]);
    const [score, setScore] = useState<number[]>([0, 0, 0, 0]);
    const [scoreTemp, setScoreTemp] = useState<number[]>([0, 0, 0, 0]);
    const scoreTemp2 = useRef([0, 0, 0, 0]);
    
    const [trick, setTrick] = useState<Card[]>([defaultCard(), defaultCard(), defaultCard(), defaultCard()]);
    const [gameStart, setGameStart] = useState(false);
    const cardsInTrick3 = useRef(0);
    const trickNo2 = useRef(1);
    const ledSuit2 = useRef("");
    const trickRef = useRef(trick);
    const mustPlay2 = useRef(false);

    const [winnerState, setWinnerState] = useState(-1);
    const trickWinner = useRef(-1);
    const dealer = useRef(-1);
    
    const [scoresOpen, setScoresOpen] = useState(false);
    const [toastOpen, setToastOpen] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [gameEndOpen, setGameEndOpen] = useState(false);
    const roundNo = useRef(1);

    const sfxWin = new Audio("/assets/sounds/memes/win.mp3");
    const sfxLose = new Audio("/assets/sounds/memes/lose.mp3");

    const descriptions = ["",
        "Tricks (10 points each)",
        "Hearts (10 points each)",
        "Queens (25 points each)",
        "King of Spades (100 points)",
        "Last trick (100 points)",
        "All categories!"
    ]

    //setup a new hand
    const newHand = () => {
        var deck = shuffleNew();
        setDeck(deck);
        var playerHands = dealTo4Players(deck);
        setHands(playerHands);
        trickNo2.current = 1;
        scoreTemp2.current = [0, 0, 0, 0];
        const round = roundNo.current
        //console.log("round: ", round);
    }

    //start the game
    const beginGame = () => {
        newHand();
        setScore([0, 0, 0, 0]);
        setGameStart(false);
        dealer.current = Math.floor(Math.random() * 4);
        //console.log(dealer);
    }

    //start a new hand's game process
    const actuallystartgame = () => {
        //console.log(hands);
        setGameStart(true);
        const firstPlayer = (dealer.current + 1) % 4;
        console.log("The first player is ", players[firstPlayer]);
        if(firstPlayer === 0) {
            mustPlay2.current = true;
        } else {
            playCard(leadRandom(hands[firstPlayer]), firstPlayer);
        }
    }
    
    useEffect(() => {
        beginGame();
    }, []);

    //update trickRef every time trick updates
    useEffect(() => {
        trickRef.current = trick;
    }, [trick]);

    const playCard = (cardPlayed: Card, playerId: number) => {
            //reset winner
            setWinnerState(-1);
            //if the playerId is not 0 setMustPlay as false
            if(playerId !== 0) { mustPlay2.current = false }
    
            //set the lead suit.
            if(emptyTrick() || cardsInTrick3.current === 0) {
                ledSuit2.current = cardPlayed.suit;
            }
    
            //follow suit restrictions
            if(mustPlay2.current && cardPlayed.suit !== ledSuit2.current && 
                hasLedSuit(hands?.[0], ledSuit2.current)) {
                    setToastOpen(true);
                    setToastMessage("You must follow suit!");
                    return;
            }
    
            //update the trick array
            setTrick((prev) => prev.map((cd, idx) => (idx === playerId ? cardPlayed : cd)));
            
            //update the amounts of cards in a trick
            cardsInTrick3.current += 1;
            //console.log("cards in trick after ", players[playerId], "played: ", cardsInTrick3.current);
    
            //set the new player hand
            var newPlayerHand = hands?.[playerId].filter(cd => cd !== cardPlayed);
            setHands((prev) => {
                return prev.map((hand, handIdx) => {
                    if(handIdx === playerId) {
                        return newPlayerHand;
                    }
                    return hand;
                });
            })
            //determine next player (clockwise)
            var nextPlayer = (playerId + 1) % 4;
    
            //if the trick is full, determine the winner
            if(cardsInTrick3.current >= 4) {
                setTimeout(() => {
                    const winner = getTrickWinner(trickRef.current, ledSuit2.current);
                    setWinnerState(winner);
                    trickWinner.current = winner;
                }, 1000);
                return;
            } else {
                //if it's an ai player
                if(nextPlayer !== 0) {
                    mustPlay2.current = false;
                    if(isIncluded(trick, defaultCard()) || cardsInTrick3.current <=4 ) {
                        setTimeout(() => {
                            playCardComp(nextPlayer);
                        }, 1000);
                    }
                //else, it's you
                } else {
                    mustPlay2.current = true;
                }
            }
        }
    
        //ai player plays cards
        const playCardComp = (playerId: number) => {
            //const bestCard = getBestCard(hands?.[playerId], ledSuit2.current, trickNo2.current);
            const bestCard = playRandomCard(hands?.[playerId], ledSuit2.current);
            if(cardsInTrick3.current <= 4) {
                playCard(bestCard, playerId);
            }
        }
    
        //ai player leads cards
        const leadCardComp = (playerId: number) => {
            const ledCard = leadRandom(hands?.[playerId]);
            playCard(ledCard, playerId);
        }
    
        const emptyTrick = () => trickRef.current.every((c) => c.isEmpty());

    const nextTrick = () => {
            //calculate the trick's score, and the winner takes all of them
            var trickScore = scorePoints(trick, roundNo.current, trickNo2.current);
            if(trickScore > 0) {
                scoreTemp2.current = scoreTemp2.current.map((sc, idx) => 
                    (idx === winnerState) ? sc + trickScore : sc
                );
            }
            cardsInTrick3.current = 0;
            setTrick([defaultCard(), defaultCard(), defaultCard(), defaultCard()]);
            //increment the trick number
            trickNo2.current += 1;
    
            //the last trick winner leads the new trick
            if(trickNo2.current <= 13) {
                if(winnerState === 0) {
                    mustPlay2.current = true;
                } else {
                    leadCardComp(winnerState);
                }
            } else {
                //end the hand
                setTimeout(() => {
                    showScores();
                }, 200);
            }
        }

    const showScores = () => {
        console.log("Hand is finished.");
        setScore((prev) => {
            return prev.map((sc, idx) => (sc + scoreTemp2.current[idx]));
        });
        setScoresOpen(true);
    }

    const nextHand = () => {
        if(roundNo.current >= 6) {
            setGameEndOpen(true);
        } else {
            setScoresOpen(false);
            roundNo.current = roundNo.current + 1;
            //console.log("the new roundNo: ", roundNo.current);
            dealer.current = dealer.current + 1;
            newHand();
            setGameStart(false);
        }
    }

    return(
        <IonPage>
            <IonContent>
                            <IonGrid>
                                <IonRow>
                                    <IonCol className="west-cards">
                                        <IonRow className="ht-playername">
                                            <IonText>{players[1]}</IonText>
                                        </IonRow>
                                        {/* West's cards */}
                                        {hands?.[1]?.map((cd, idx) => (
                                            <IonRow 
                                                className="ht-west-cards"
                                                style={{
                                                    position: "relative",
                                                    height: `${15}px`
                                                }}
                                            >
                                                <img 
                                                    className="ht-west-card ht-cardsize"
                                                    src={deckCtx?.declareBack()}
                                                    style={{marginBottom: -120}}
                                                />
                                            </IonRow>
                                        ))}
                                    </IonCol>
                                    <IonCol size={deckCtx?.screenWidth === "large" ? "9" : "6"}>
                                        <IonRow className="ht-playername">
                                            <IonText>{players[2]}</IonText>
                                        </IonRow>
                                         {/* North's cards */}
                                        <IonRow className="north-cards">
                                            {hands?.[2]?.map((cd, idx) => (
                                                <IonCol 
                                                    className="ht-north-cards" 
                                                    style={{left: `${idx * (deckCtx?.screenWidth === "large" ? 70 : deckCtx?.screenWidth === "medium" ? 20 : 10)}px`}}
                                                >
                                                <img 
                                                    className="ht-north-card ht-cardsize"
                                                    src={deckCtx?.declareBack()}
                                                />
                                                </IonCol>
                                            ))}
                                        </IonRow>
                                        <IonRow className="ht-trickbox">
                                            <IonText className="ht-tricktext">The Trick</IonText>
                                        </IonRow>
                                         {/* Trick area */}
                                        {deckCtx?.screenWidth !== "small" &&
                                        <IonRow>
                                            {trick.map((trickCard, playerId) => (
                                                <IonCol>
                                                    <IonRow 
                                                        className="ht-trick-row" 
                                                        style={{
                                                            border: trickCard.isEmpty() ? '1px solid white' : 'none',
                                                        }}
                                                    >
                                                        <img 
                                                            className="ht-played-card ht-cardsize"
                                                            src={trickCard.isEmpty() ? deckCtx?.declareBack() : deckCtx?.declareFace(trickCard.getName())}
                                                            style={{
                                                                visibility: trickCard.isEmpty() ? 'hidden' : 'visible',
                                                            }}
                                                        />
                                                    </IonRow>
                                                    <IonRow className="ht-trick-row">
                                                        <IonText>{players[playerId]}</IonText>
                                                    </IonRow>
                                                </IonCol>
                                            ))}
                                            
                                        </IonRow>}
                                        {deckCtx?.screenWidth === "small" &&
                                        <IonRow>
                                            {[[1], [2, 0], [3]].map((pos, posId) => 
                                                <IonCol className={pos.length === 1 ? "ht-smallewtrick" : ""}>
                                                    {pos.map((exactPos, exactPosId) => {
                                                        const trickCard = trick[exactPos];
                                                        return (
                                                            <IonRow
                                                                style={{
                                                                    border: trickCard.isEmpty() ? '1px solid white' : 'none',
                                                                }}
                                                            >
                                                                <img 
                                                                    className="ht-played-card ht-cardsize"
                                                                    src={trickCard.isEmpty() ? deckCtx?.declareBack() : deckCtx?.declareFace(trickCard.getName())}
                                                                    style={{
                                                                        visibility: trickCard.isEmpty() ? 'hidden' : 'visible',
                                                                    }}
                                                                />
                                                            </IonRow>
                                                        );
                                                    })}
                                                </IonCol>
                                            )}
                                            
                                        </IonRow>
                                        }
                                        {!gameStart && <IonRow className="ht-trick-winner">
                                            <IonCol className="ht-infocol ht-trick-winner2">
                                                <IonLabel>
                                                    Round {roundNo.current}: {descriptions[roundNo.current]}
                                                </IonLabel>
                                            </IonCol>
                                            <IonCol className="ht-infocol ht-button" style={{paddingTop: "0"}}>
                                                <IonButton onClick={() => actuallystartgame()}>Start</IonButton>
                                            </IonCol>
                                        </IonRow>}
                                        {gameStart && <IonRow 
                                            className="ht-trick-winner"
                                            //style={{visibility: winnerState > -1 ? "visible" : "hidden"}}
                                        >
                                            <IonCol className="ht-infocol ht-trick-winner2">
                                                <IonLabel>
                                                    {winnerState > -1 && `${players[winnerState]} took the trick.`}
                                                </IonLabel>
                                            </IonCol>
                                            <IonCol className="ht-infocol ht-button">
                                                <IonButton 
                                                    disabled={winnerState <= -1 ? true : false} 
                                                    onClick={() => {
                                                        nextTrick();
                                                        setWinnerState(-1);
                                                    }}
                                                >
                                                    Continue
                                                </IonButton>
                                            </IonCol>
                                        </IonRow>}
                                    </IonCol>
                                    <IonCol className="east-cards">
                                        <IonRow className="ht-playername">
                                            <IonText>{players[3]}</IonText>
                                        </IonRow>
                                         {/* East's cards */}
                                            {hands?.[3]?.map((cd, idx) => (
                                                <IonRow 
                                                    className="ht-east-cards"
                                                    style={{ height: `${15}px` }}
                                                >
                                                <img 
                                                    className="ht-east-card ht-cardsize"
                                                    src={deckCtx?.declareBack()}
                                                    style={{marginBottom: -120}}
                                                />
                                                </IonRow>
                                            ))}
                                    </IonCol>
                                </IonRow>
                                <IonRow className="your-cards">
                                     {/* Your cards */}
                                    {hands?.[0]?.map((cd, idx) => (
                                        <IonCol 
                                            className="ht-your-cards ht-infocol" 
                                            style={{left: `${idx * (deckCtx?.screenWidth === "large" ? 95 : deckCtx?.screenWidth === "medium" ? 48 : 25)}px`}}
                                        >
                                            <img 
                                                className="ht-your-card ht-cardsize"
                                                src={deckCtx?.declareFace(cd.getName())}
                                                onClick={
                                                    mustPlay2.current ? () => playCard(cd, 0) : undefined}
                                            />
                                        </IonCol>
                                    ))}
                                </IonRow>
                            </IonGrid>
                            <IonAlert
                                isOpen={scoresOpen}
                                header="Current Scores"
                                message={
                                    score.map((sc, i) => (
                                        `${players[i]}: ${sc} (+${scoreTemp2.current[i]}) ${i < 3 ? "\n" : ""}`
                                    )).join("\n")
                                }
                                buttons={['Next Hand']}
                                onDidDismiss={() => nextHand()}
                                cssClass="ht-scores"
                            ></IonAlert>
                            <IonAlert
                                isOpen={gameEndOpen}
                                header="Game Over!"
                                subHeader={
                                    score.indexOf(Math.max(...score)) === 0 ? "You Lose!!!!!" : ""
                                }
                                message={
                                    score.indexOf(Math.min(...score)) === 0 ?
                                    "You win the game!" :
                                    `${players[score.indexOf(Math.min(...score))]} won the game.`
                                }
                                buttons={['Finish']}
                                onDidDismiss={() => {
                                    setGameEndOpen(false);
                                    history.goBack();
                                }}
                                onIonAlertWillPresent={() => (
                                    score.indexOf(Math.min(...score)) === 0 ?
                                    sfxWin.play() :
                                    sfxLose.play())
                                }
                            ></IonAlert>
                            <IonToast
                                isOpen={toastOpen}
                                message={toastMessage}
                                duration={1500}
                                onDidDismiss={() => setToastOpen(false)}
                            ></IonToast>
                        </IonContent>
        </IonPage>
    );
}

export default CanadianSalad;