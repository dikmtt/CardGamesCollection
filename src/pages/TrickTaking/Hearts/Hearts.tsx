import { IonAlert, IonButton, IonCol, IonContent, IonGrid, IonItem, IonLabel, IonPage, IonRow, IonText, IonToast } from "@ionic/react";
import React, { useContext, useEffect, useRef, useState } from "react";
import { isNumber, shuffle } from "../../../components/CardLogic/deck";
import { DeckContext } from "../../../components/Context/DeckContext";
import { dealTo4Players, sortHand } from "../../../components/CardLogic/4-player-setup";
import "./Hearts.css";
import { getSuit } from "../../../components/SpeedPoker/hands";
import { chooseCardFollow, computerPassLogic, getBestCard, getTrickWinner, handNoHearts, hasLedSuit, leadCard, scorePoints } from "../../../components/Hearts/hearts";
import { useHistory } from "react-router";
import { Card, defaultCard, shuffleNew } from "../../../components/CardLogic/deckOOP";

const Hearts: React.FC = () => {
    const deckCtx = useContext(DeckContext);
    deckCtx?.change4CSupportOps(true);
    const imgBase = "/assets/cards/";
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

    const heartsBroken = useRef(false);
    const QSplayed = useRef(false);
    const [winnerState, setWinnerState] = useState(-1);
    const trickWinner = useRef(-1);
    const moonPlayer = useRef(-1);

    const [scoresOpen, setScoresOpen] = useState(false);
    const [toastOpen, setToastOpen] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [gameEndOpen, setGameEndOpen] = useState(false);
    const [hasShotMoon, setHasShotMoon] = useState(false);
    const newMoonPicked = useRef(false);
    const gameEndScore = 50;

    //used for logic of passing cards
    const roundNo = useRef(1);
    const isHandPassPhase = useRef(false);
    //const [isHandPassPhase2, setIsHandPassPhase2] = useState(false);
    const [yourPassedCards, setYourPassedCards] = useState<Card[]>([]);

    const sfxBroken = new Audio("/assets/sounds/memes/hearts-broken.mp3");
    const sfxQueen = new Audio("/assets/sounds/memes/hearts-queenofspades.mp3");
    const sfxMoonShot = new Audio("/assets/sounds/memes/hearts-moonshot.mp3");
    const sfxWin = new Audio("/assets/sounds/memes/win.mp3");
    const sfxLose = new Audio("/assets/sounds/memes/lose.mp3");

    //setup a new hand
    const newHand = () => {
        var deck = shuffleNew();
        setDeck(deck);
        var playerHands = dealTo4Players(deck);
        setHands(playerHands);
        trickNo2.current = 1;
        heartsBroken.current = false;
        scoreTemp2.current = [0, 0, 0, 0];
        moonPlayer.current = -1;
        const round = roundNo.current
        //console.log("round: ", round);
        if(round % 4 !== 0) {
            isHandPassPhase.current = true;
        }
    }

    //start the game
    const beginGame = () => {
        newHand();
        setScore([0, 0, 0, 0]);
        setGameStart(false);
    }

    //start a new hand's game process
    const actuallystartgame = () => {
        //console.log(hands);
        setGameStart(true);
        const firstPlayer = chooseFirstPlayer();
        if(firstPlayer !== 0) {
            play2OfC(firstPlayer);
        }
    }

    const chooseFirstPlayer = () => {
        var twoClubPlayer = -1;
        //search everyone's hands for the two of clubs
        hands?.map((hand, handIdx) => {
            if(hand.some(c => c.suit === "C" && c.rank === "2")) {
                console.log("found 2 of clubs in: ", players[handIdx]);
                twoClubPlayer = handIdx;
            }
        });
        //if it's you, set the mustPlay to true
        if(twoClubPlayer === 0) { mustPlay2.current = true; }
        return twoClubPlayer;
    }

    useEffect(() => {
        beginGame();
    }, []);

    //update trickRef every time trick updates
    useEffect(() => {
        trickRef.current = trick;
    }, [trick]);

    const play2OfC = (playerId: number) => {
        const twoClubs = hands[playerId].filter(c => c.getName() === "2-C")[0];
        playCard(twoClubs, playerId);
    }

    const playCard = (cardPlayed: Card, playerId: number) => {
        //reset winner
        setWinnerState(-1);
        //if the playerId is not 0 setMustPlay as false
        if(playerId !== 0) { mustPlay2.current = false }

        //if it's the first trick, your turn to lead and you don't play 2C return
        if(trickNo2.current === 1 && cardPlayed.getName() !== "2-C" && emptyTrick() && mustPlay2.current) {
            setToastOpen(true);
            setToastMessage("You have the 2 of clubs and you must play it!");
            return;
        }
        //if it's the first trick, you are not allowed to play penalty cards
        if(mustPlay2.current && trickNo2.current === 1 && (cardPlayed.suit === "H" || cardPlayed.getName() === "Q-S")) {
            setToastOpen(true);
            setToastMessage("This is the first trick, you're not allowed to play penalty cards");
            return;
        }

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

        //Leading hearts restriction
        if(mustPlay2.current && cardPlayed.suit === "H" && cardsInTrick3.current === 0 &&
            !heartsBroken.current && handNoHearts(hands?.[playerId]).length !== 0) {
                setToastOpen(true);
                setToastMessage("You're not allowed to play hearts yet!");
                return;
        }

        //Break hearts: If a player cannot follow suit.
        if(cardPlayed.suit === "H" && !heartsBroken.current && 
            (hasLedSuit(hands?.[playerId], ledSuit2.current) === undefined ||
                handNoHearts(hands?.[playerId]).length === 0)) {
                heartsBroken.current = true;
                sfxBroken.play();
                console.log("Hearts have been broken!");
        }

        if(cardPlayed.getName() === "Q-S") {
            sfxQueen.play();
            QSplayed.current = true;
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
                if(trick.includes(defaultCard()) || cardsInTrick3.current <=4 ) {
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
        const bestCard = chooseCardFollow(hands?.[playerId], trickRef.current, ledSuit2.current, trickNo2.current);
        if(cardsInTrick3.current <= 4) {
            playCard(bestCard, playerId);
        }
    }

    //ai player leads cards
    const leadCardComp = (playerId: number) => {
        const ledCard = leadCard(hands?.[playerId], heartsBroken.current,  cardsInTrick3.current, trickNo2.current, QSplayed.current);
        playCard(ledCard, playerId);
    }

    const emptyTrick = () => trickRef.current.every((c) => c.isEmpty());

    const nextTrick = () => {
        //calculate the trick's score, and the winner takes all of them
        var trickScore = scorePoints(trick);
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
            const moonShotDone = checkMoonShot();
            if(!moonShotDone) {
                setScore((prev) => {
                    return prev.map((sc, idx) => (sc + scoreTemp2.current[idx]));
                });
                setTimeout(() => {
                    showScores();
                }, 200);
            }
        }
    }

    const checkMoonShot = () => {
        //console.log(scoreTemp2.current);
        if(scoreTemp2.current.includes(26)) {
            sfxMoonShot.play();
            var mooner = scoreTemp2.current.indexOf(26);
            /*scoreTemp2.current = Array(4).fill(26);
            scoreTemp2.current[mooner] = 0;*/
            moonPlayer.current = mooner;

            //if the player who shot the moon was you, open the toast
            if(mooner === 0) {
                setHasShotMoon(true);
            } else {
                if(score[mooner] >= Math.floor(gameEndScore * 0.7)) {
                    newMoonPicked.current = true;
                }
                applyMoonShotScore(mooner);
            }
            return true;
        } else {
            return false;
        }
            /*setScore((prev) => {
                return prev.map((sc, idx) => (sc + scoreTemp2.current[idx]));
            });*/
    }

    const applyMoonShotScore = (moonPlayer: number) => {
        if(!newMoonPicked.current) {
            scoreTemp2.current = Array(4).fill(26);
            scoreTemp2.current[moonPlayer] = 0;
            //moonPlayer.current = mooner;
            setScore((prev) => {
                return prev.map((sc, idx) => (sc + scoreTemp2.current[idx]));
            });
        } else {
            scoreTemp2.current = Array(4).fill(0);
            scoreTemp2.current[moonPlayer] = 26;
            setScore((prev) => {
                return prev.map((sc, idx) => (sc - scoreTemp2.current[idx]));
            });
        }

        setTimeout(() => {
            showScores();
        }, 200);
    }

    const showScores = () => {
        console.log("Hand is finished.");
        setScoresOpen(true);
        /*console.log("scores:");
        score.map((sc, id) => {
            console.log(`${players[id]}: ${sc}`);
        });*/
    }

    const nextHand = () => {
        if(score.some(sc => sc >= gameEndScore)) {
            setGameEndOpen(true);
        } else {
            setScoresOpen(false);
            roundNo.current = roundNo.current + 1;
            //console.log("the new roundNo: ", roundNo.current);
            newHand();
            setGameStart(false);
            heartsBroken.current = false;
            QSplayed.current = false;
            newMoonPicked.current = false;
        }
    }

    const determineHandPassTarget = (playerId: number): number => {
        switch(roundNo.current % 4) {
            //mod 1: pass to left
            case 1: return (playerId + 1) % 4; break;
            //mod 2: pass to the right
            case 2: return (playerId + 3) % 4; break;
            //mod 3: pass to the player across
            case 3: return (playerId + 2) % 4;
            default: return -1;
        }
    }

    const confirmHandPass = () => {
        //this triggers after the button to confirm hand pass has been pressed
        const newHands = [...hands];
        var previouslyPassed = [defaultCard(), defaultCard(), defaultCard()];
        for(let pId = 0; pId < 4; pId++) {
            //console.log("Current pId: ", pId);
            if(pId === 0) {
                //logic for player's card pass
                //set a variable cardsToPass as the yourPassedCards
                var cardsToPass = [...yourPassedCards];
            } else {
                //logic for computer's card pass
                //set a variable cardsToPass by passing the hand and picking 3 cards
                var cardsToPass = computerPassLogic(hands[pId], previouslyPassed);
            }
            //then, execute the hand pass
            var target = determineHandPassTarget(pId);
            //console.log(players[pId], " will pass ", cardsToPass, " to ", players[target]);

            //giver
            newHands[pId] = newHands[pId].filter(cd => !cardsToPass.includes(cd));

            //taker
            newHands[target] = sortHand([...newHands[target], ...cardsToPass], "acehigh");

            //set the previously passed cards
            previouslyPassed = cardsToPass;

            //console.log("After ", players[pId], " passed");
            //console.log(players[target], "'s new hand: ", newHands[target]);
            /*setHands((prev) => {
                return prev.map((hand, handIdx) => {
                    if(handIdx === pId) {
                        //giver
                        return hand.filter(cd => !cardsToPass.includes(cd));
                    }
                    if(handIdx === target) {
                        //taker
                        const newHand = [...hand, ...cardsToPass];
                        console.log("After ", players[pId], " passed");
                        console.log(players[target], "'s new hand: ", newHand);
                        return sortHand(newHand, false);
                    }
                    return hand;
                });
            });*/
        }
        setHands(newHands);
        isHandPassPhase.current = false;
        setYourPassedCards([]);
        //console.log(isHandPassPhase.current);
    }

    const selectCardToPass = (card: Card) => {
        if(!yourPassedCards.includes(card) && yourPassedCards.length < 3) {
            setYourPassedCards(prev => [...prev, card]);
        } else {
            setYourPassedCards(prev => prev.filter(c => c !== card));
        }
    }

    /*useEffect(() => {
        if(score.some(sc => sc > 50)) {
            if(score.indexOf(Math.min(...score)) === 0) {
                new Audio("/assets/sounds/memes/win.mp3").play();
            } else {
                new Audio("/assets/sounds/memes/lose.mp3").play();
            }
        }
    }, [setGameEndOpen]);*/

    //large screen detector?
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
                            {isHandPassPhase.current && <IonRow className="ht-trick-winner">
                                <IonCol className="ht-infocol ht-trick-winner2">
                                    <IonLabel>
                                        Select 3 cards to pass to {players[determineHandPassTarget(0)]}
                                    </IonLabel>
                                </IonCol>
                                <IonCol className="ht-infocol ht-button" style={{paddingTop: "0"}}>
                                    <IonButton
                                        disabled={yourPassedCards.length === 3 ? false : true}
                                        onClick={() => confirmHandPass()}
                                    >
                                        Confirm
                                    </IonButton>
                                </IonCol>
                            </IonRow>}
                            {!isHandPassPhase.current && !gameStart && <IonRow className="ht-trick-winner">
                                <IonButton onClick={() => actuallystartgame()}>Start</IonButton>
                            </IonRow>}
                            {!isHandPassPhase.current && gameStart && <IonRow 
                                className="ht-trick-winner"
                                //style={{visibility: winnerState > -1 ? "visible" : "hidden"}}
                            >
                                <IonCol className="ht-infocol ht-trick-winner2">
                                    <IonLabel>
                                        {winnerState > -1 && `${players[winnerState]} took the trick.`}
                                        {hands[0].some(c => c.getName() ==="2-C") && "The 2 of clubs begins!"}
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
                                    style={{
                                        filter: isHandPassPhase.current && yourPassedCards.includes(cd) ? 
                                                "brightness(50%)" : "brightness(100%)"
                                    }}
                                    onClick={
                                        isHandPassPhase.current ? () => selectCardToPass(cd) :
                                        mustPlay2.current ? () => playCard(cd, 0) : undefined}
                                />
                            </IonCol>
                        ))}
                    </IonRow>
                </IonGrid>
                <IonAlert
                    isOpen={scoresOpen}
                    header="Current Scores"
                    subHeader={
                        moonPlayer.current > -1 ? `Impeccable! ${players[moonPlayer.current]} just shot the moon!` : ""
                    }
                    message={
                        score.map((sc, i) => (
                            `${players[i]}: ${sc} (${moonPlayer.current === i && newMoonPicked.current ? "-" : "+"}${scoreTemp2.current[i]}) ${i < 3 ? "\n" : ""}`
                        )).join("\n")
                    }
                    buttons={['Next Hand']}
                    onDidDismiss={() => nextHand()}
                    cssClass="ht-scores"
                ></IonAlert>
                <IonAlert
                    isOpen={hasShotMoon}
                    header="You have shot the moon!"
                    subHeader={
                        "Pick a benefit"
                    }
                    buttons={[
                        {
                            text: '+26 (to others)',
                            role: 'oldmoon',
                            handler: () => {
                                newMoonPicked.current = false;
                                setHasShotMoon(false);
                                applyMoonShotScore(0);
                            }
                        },
                        {
                            text: '-26 (to self)',
                            role: 'newmoon',
                            handler: () => {
                                newMoonPicked.current = true;
                                setHasShotMoon(false);
                                applyMoonShotScore(0);
                            },
                            cssClass: score[0] < 26 ? "ht-disabled-alert" : ""
                        }
                    ]}
                    backdropDismiss={false}
                    onDidDismiss={() => setHasShotMoon(false)}
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

export default Hearts;