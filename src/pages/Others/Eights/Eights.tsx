import { IonAlert, IonButton, IonCol, IonContent, IonGrid, IonItem, IonLabel, IonPage, IonRow, IonText } from "@ionic/react";
import React, { useContext, useEffect, useRef, useState } from "react";
import { isNumber, shuffle } from "../../../components/CardLogic/deck";
import { DeckContext } from "../../../components/Context/DeckContext";
import { dealTo4Players } from "../../../components/CardLogic/4-player-setup";
import { eightsDeal, findBestSuit, reshuffleWasteToStock } from "../../../components/MiscGames/crazyeights";

import "./Eights.css";
import { getRank, getSuit } from "../../../components/SpeedPoker/hands";
import { useHistory } from "react-router";
import { Card, defaultCard, shuffleNew } from "../../../components/CardLogic/deckOOP";

const Eights: React.FC = () => {
    const deckCtx = useContext(DeckContext);
    const history = useHistory();

    const players = ["You", "West", "North", "East"];
    const suits = ["Spades", "Hearts", "Clubs", "Diamonds"];
    const suitCol = ["primary", "danger", "success", "warning"];

    const [deck, setDeck] = useState<Card[]>([]);
    const deckRef = useRef(deck);
    //array of arrays. index 0 is player, index 1 is west, etc
    const [hands, setHands] = useState<Card[][]>([[], [], [], []]);
    const handRef = useRef(hands);
    const [topCard, setTopCard] = useState<Card>(defaultCard());
    const topCardRef = useRef(topCard);
    const [otherDiscards, setOtherDiscards] = useState<Card[]>([]);
    const otherDiscardsRef = useRef(otherDiscards);
    const [message, setMessage] = useState<string>("");
    const dealAttempts = useRef(0);
    const currEightSuit = useRef("");
    const [winner, setWinner] = useState<string>("");

    //very crazy eights: reverse (k), skip (j), draw two (2)
    const [gameMode, setGameMode] = useState(1);
    const directionOfPlay = useRef(1); //1 = clockwise, 3 = counterclockwise
    const drawTwoStack = useRef(0);
    const [mustForceDraw, setMustForceDraw] = useState(false);

    //ultra crazy eights: swap (7), all swap (a), draw 5/cancel (q)
    const [showSwap, setShowSwap] = useState(false);

    const [gameStart, setGameStart] = useState(false);
    const [yourTurn, setYourTurn] = useState(false);
    const yourTurn2 = useRef(false);
    const [declareEightSuit, setDeclareEightSuit] = useState(false);
    const deckHasReset = useRef(false);
    const [gameEndOpen, setGameEndOpen] = useState(false);
    const [chooseGameMode, setChooseGameMode] = useState(true);

    const newGame = () => {
        setTopCard(defaultCard());
        dealAttempts.current = 0;
        currEightSuit.current = "";
        setWinner("");
        directionOfPlay.current = 1;
        drawTwoStack.current = 0;
        setGameStart(false);
        setMessage("");

        newHand();
    }

    const newHand = () => {
        var deck = shuffleNew();
        setDeck(deck);
        //console.log("hearts deck: ", deck);
        var playerHands = eightsDeal(deck, 5, "normal");
        setHands(playerHands);
        avoidEightOnTop(deck);
        //console.log("player hands: ", playerHands);
    }

    const avoidEightOnTop = (deck: Card[]) => {
        console.log("run avoid eight function");
        if(deck[deck.length - 1].rank === "8") {
            var newCard = defaultCard();
            var randomCardIdx = 0;
            do {
                //if the top card is an 8 trade it with a random card in the deck
                randomCardIdx = Math.floor(Math.random() * (deck.length - 1));
                newCard = deck[randomCardIdx];
                console.log(newCard);
            } while(newCard.rank === "8");
            console.log("safe exit!");
            const deckCopy = [...deck];
            let temp = deckCopy[deck.length - 1];
            deckCopy[deck.length - 1] = deckCopy[randomCardIdx];
            deckCopy[randomCardIdx] = temp;
            setDeck(deckCopy);
        }
    }

    const beginGame = () => {
        newHand();
    }

    useEffect(() => {
        beginGame();
    }, []);

    const startGame = () => {
        setGameStart(true);
        var randomFirstPlayer = Math.floor(Math.random() * 4);
        setMessage(players[randomFirstPlayer] + 
                (randomFirstPlayer === 0 ? " are the first player" : " is the first player"));
        const firstCard = deck.pop();
        setTopCard(firstCard);
        setTimeout(() => {
            if(randomFirstPlayer === 0) {
                yourTurn2.current = true;
            } else {
                opponentTurn(randomFirstPlayer);
            }
        }, 1500);
    }

    useEffect(() => {
        topCardRef.current = topCard;
    }, [topCard]);

    useEffect(() => {
        handRef.current = hands;
    }, [hands]);

    useEffect(() => {
        otherDiscardsRef.current = otherDiscards;
    }, [otherDiscards]);

    useEffect(() => {
        /*if(deck.length === 0 && gameStart === true) {
            console.log("resetting");
            resetDeck();
        }*/
        deckRef.current = deck;
    }, [deck]);

    useEffect(() => {
        if(yourTurn2.current && 
            topCardRef.current.rank === "2" && 
            JSON.stringify(hasTwo(0)) === JSON.stringify(defaultCard()) &&
            drawTwoStack.current > 0 &&
            gameMode >= 1) {
            setMustForceDraw(true);
            setMessage("You do not have a two, please draw " + drawTwoStack.current + " cards");
        }
        if(yourTurn2.current && 
            topCardRef.current.rank === "Q" &&
            topCardRef.current.getColor() === "black" && 
            JSON.stringify(hasRedQueen(0)) === JSON.stringify(defaultCard()) &&
            drawTwoStack.current > 0 &&
            gameMode === 2) {
            setMustForceDraw(true);
            setMessage("You do not have a red queen, please draw " + drawTwoStack.current + " cards");
        }
    }, [yourTurn2.current]);

    const cardMatch = (card: Card) => {
        var yee = (card.rank === topCardRef.current.rank || 
        card.suit === topCardRef.current.suit ||
        card.rank === "8");
        //console.log(yee);
        return yee;
    }

    const cardMatchEight = (card: Card) => {
        var yee = (card.suit === currEightSuit.current ||
        card.rank === "8");
        //console.log(yee);
        return yee;
    }

    const opponentTurn = (playerId: number) => {
        setMessage(players[playerId] + "'s turn");
        if(gameMode >= 1 && topCardRef.current.rank === "2" && drawTwoStack.current > 0) {
            var hasATwo = hasTwo(playerId);
            if(JSON.stringify(hasATwo) === JSON.stringify(defaultCard)) {
                setMessage(players[playerId] + " does not have a 2 and is forced to draw " + drawTwoStack.current + " cards");
                forceDraw(drawTwoStack.current, playerId);
            } else {
                playCard(hasATwo, playerId);
            }
            return;
        }
        if(gameMode === 2 && topCardRef.current.rank === "Q" && 
        (topCardRef.current.getColor() === "black") &&
        drawTwoStack.current > 0) {
            var hasRedQueens = hasRedQueen(playerId);
            if(JSON.stringify(hasRedQueens) === JSON.stringify(defaultCard)) {
                setMessage(players[playerId] + " does not have a red queen and is forced to draw " + drawTwoStack.current + " cards");
                forceDraw(drawTwoStack.current, playerId);
            } else {
                playCard(hasRedQueens, playerId);
                drawTwoStack.current = 0;
            }
            return;
        }
        var playedCard = chooseCardToPlay(playerId);
        //console.log(players[playerId] + " is considering playing " + playedCard);
        if(playedCard === "") {
            //draw up to 3 cards, else force pass
            var underThreeCardsDrawn = false;
            var drawnCardThatsPlayed = "";
            var drawnCardList = Array();
            for(var i = 0; i < 3; i++) {
                if(deckHasReset.current) {
                    var drawnCard = deckRef.current.pop();
                    deckHasReset.current = false;
                } else {
                    var drawnCard = deck.pop();
                }
                if(deck.length === 0) {
                    resetDeck();
                }
                //console.log("drawn card: ", drawnCard);
                drawnCardList.push(drawnCard);
                if((topCardRef.current.rank !== "8" && cardMatch(drawnCard)) ||
                    (topCardRef.current.rank === "8" && cardMatchEight(drawnCard))) {
                    underThreeCardsDrawn = true;
                    setMessage(players[playerId] + " got a match after " + (i + 1) + " cards");
                    drawnCardThatsPlayed = drawnCard;
                    break;
                }
            }
            //console.log("drawnCardList: ", drawnCardList);

            setHands((prev) => {
                return prev.map((hand, handIdx) => {
                    if(handIdx === playerId) {
                        /*hand.map((handCard, handCardIdx) => {
                            return handCard !== cardPlayed;
                        });*/
                        return [...hand, ...drawnCardList];
                    }
                    return hand;
                });
            });

            //current bug: if opp draws 2 cards

            if(underThreeCardsDrawn) {
                setTimeout(() => {
                    playCard(drawnCardThatsPlayed, playerId);
                }, 1500);
            } else {
                setMessage(players[playerId] + " must pass after 3 cards");
                nextPlayer(playerId);
            }
        } else {
            playCard(playedCard, playerId);
        }
    }

    const chooseCardToPlay = (playerId: number) => {
        var hand = handRef.current[playerId];
        //console.log(hand);

        if(topCardRef.current.rank === "8") {
            //filter out cards so only cards of the suit called by the player or eights are used
            var possibleCards = hand.filter(c => cardMatchEight(c));
        } else {
            var possibleCards = hand.filter(c => cardMatch(c));
        }
        //console.log(possibleCards);

        if(possibleCards.length > 0) {
            //consider playing an eight if there are no more matching cards
            var noEights = possibleCards.filter(c => c.rank !== "8");
            if(noEights.length > 0) {
                return noEights[Math.floor(Math.random() * noEights.length)];
            } else {
                return possibleCards[Math.floor(Math.random() * possibleCards.length)];
            }
        } else {
            return "";
        }
    }

    const hasTwo = (playerId: number) => {
        var hand = hands[playerId];
        var twos = hand.filter(c => c.rank === "2");
        if(twos.length > 0) {
            return twos[Math.floor(Math.random() * twos.length)];
        } else {
            return defaultCard();
        }
    }

    const hasRedQueen = (playerId: number) => {
        var hand = hands[playerId];
        var redQueens = hand.filter(c => c.rank === "Q" && (c.getColor() === "red"));
        if(redQueens.length > 0) {
            return redQueens[Math.floor(Math.random() * redQueens.length)];
        } else {
            return defaultCard();
        }
    }

    const playCard = (cardPlayed: Card, playerId: number) => {
        if((!cardMatch(cardPlayed) && cardPlayed.rank !== "8") && 
            topCardRef.current.rank !== "8" && yourTurn2.current) {
            console.log("Illegal play!");
            return;
        }
        if(yourTurn2.current && topCardRef.current.rank === "8" && 
            (cardPlayed.suit !== currEightSuit.current && cardPlayed.rank !== "8")) {
            console.log("Illegal play!");
            return;
        }
        //setMessage("");

        //if(topCardRef.current !== "") {
            setOtherDiscards(prev => {
                const newDiscards = [...prev, topCardRef.current];
                //console.log("newDiscards: ", newDiscards);
                return newDiscards;
            });
        //}

        setTopCard(cardPlayed);
        //console.log(trick[0]);
        //console.log("hands to debug: ", hands?.[playerId]);
        var newPlayerHand = handRef.current?.[playerId].filter(cd => cd !== cardPlayed);
        setHands((prev) => {
            return prev.map((hand, handIdx) => {
                if(handIdx === playerId) {
                    /*hand.map((handCard, handCardIdx) => {
                        return handCard !== cardPlayed;
                    });*/
                    return newPlayerHand;
                }
                return hand;
            });
        });
        if(newPlayerHand.length === 0) {
            setTimeout(() => {
                setWinner(players[playerId]);
                setGameEndOpen(true);
            }, 1500);
            return;
        }

        if(deck.length === 0) {
            resetDeck();
        }

        if(yourTurn2.current && cardPlayed.rank === "8") {
            setMessage("");
            setDeclareEightSuit(true);
            return;
        }
        if(yourTurn2.current && cardPlayed.rank === "7" && gameMode === 2) {
            setMessage("");
            setShowSwap(true);
            return;
        }
        if(playerId === 0) {
            yourTurn2.current = false;
        }

        //setTimeout(() => {
        resolveCardPower(cardPlayed, playerId);
        //}, 0);

        if(gameMode >= 1 && cardPlayed.rank === "J") {
            skipNext(playerId);
        } else {
            nextPlayer(playerId);
        }
    }

    //this is to set the eight suit, if you played an eight
    const setEightSuit = (suit: string) => {
        //console.log("The suit has been changed to ", suit);
        setMessage("You changed the suit to " + suit);
        currEightSuit.current = suit.substring(0, 1);
        setDeclareEightSuit(false);
        nextPlayer(0);
    }

    const resolveCardPower = (cardPlayed: Card, playerId: number) => {
        //base game: eights are wild
        if(cardPlayed.rank === "8" && !yourTurn2.current) {
            const bestSuit = findBestSuit(hands[playerId]);
            //console.log("The suit has been changed to ", bestSuit);
            setMessage(players[playerId] + " changed the suit to " + suits.find(c => c.substring(0, 1) === bestSuit));
            currEightSuit.current = bestSuit;
        }
        //very crazy eights
        if(gameMode >= 1) {
            if(cardPlayed.rank === "K") {
                directionOfPlay.current = (directionOfPlay.current + 2) % 4;
                const nextPlay = (playerId + directionOfPlay.current) % 4;
                setMessage("The direction of play has reversed, it's now " + 
                        players[nextPlay] + (nextPlay === 0 ? "r turn" : "'s turn"));
            } else if(cardPlayed.rank === "J") {
                const nextPlay = (playerId + directionOfPlay.current) % 4;
                setMessage(players[nextPlay] + (nextPlay === 0 ? "r" : "'s") + " turn is skipped")
            } else if(cardPlayed.rank === "2") {
                drawTwoStack.current = drawTwoStack.current + 2;
            }
            //ultra crazy eights (currently WIP in hand swap)
            if(gameMode === 2) {
                if(cardPlayed.rank === "7" && !yourTurn2.current) {
                    const chosenSwapTarget = chooseSwapTarget(playerId);
                    swap(playerId, chosenSwapTarget);
                    setMessage(players[playerId] + " chose to swap hands with " + players[chosenSwapTarget]);
                } else if(cardPlayed.rank === "A") {
                    allSwap(playerId);
                    setMessage("All players swap their hands");
                } else if(cardPlayed.rank === "Q" && cardPlayed.getColor() === "black") {
                    drawTwoStack.current = drawTwoStack.current + 5;
                }
            }
        }
    }

    const chooseSwapTarget = (playerId: number) => {
        //const handsNoOwnPlayer = hands.filter((h, i) => i !== playerId);

        var shortestHandLength = 999;
        var bestHand = -1;
        hands.forEach((hand, idx) => {
            if(idx !== playerId) {
                if (hand.length < shortestHandLength) {
                    shortestHandLength = hand.length;
                    bestHand = idx;
                }
            }
        });

        return bestHand;
    }

    const swap = (swapper: number, targetSwap: number) => {
        const swapperHand = hands[swapper];
        const targetHand = hands[targetSwap];
        console.log("Swapper: ", swapperHand);
        console.log("Target: ", targetHand);

        setHands((prev) => {
            return prev.map((hand, idx) => {
                if(idx === swapper) {
                    return targetHand;
                } else if(idx === targetSwap) {
                    return swapperHand;
                }
                return hand;
            })
        });
    }

    const chooseSwap = (playerId: number) => {
        swap(0, playerId);
        setMessage("You chose to swap hands with " + players[playerId]);
        setShowSwap(false);
        nextPlayer(0);
    }

    const allSwap = (playerId: number) => {
        const yourHand = handRef.current[0];
        if(directionOfPlay.current === 1) {
            var lastPlayer = 3;
        } else {
            var lastPlayer = 1;
        }
        //const currPlayerHand = handRef.current[playerId];
        //const playerBeforeInTurn = (playerId + ((directionOfPlay.current + 2) % 4)) % 4;
        setHands((prev) => {
            return prev.map((hand, idx) => {
                if(idx !== lastPlayer) {
                    return handRef.current[(idx + directionOfPlay.current) % 4];
                } else if(idx === lastPlayer) {
                    return yourHand;
                }
                return hand;
            })
        });
        console.log(handRef.current);
    }

    const forceDraw = (amount: number, playerId: number) => {
        const forcedDrawnCards = Array();
        for(var i = 0; i < amount; i++) {
            var card = deck.pop();
            forcedDrawnCards.push(card);
            if(deck.length === 0) {
                resetDeck();
            }
        }
        setHands((prev) => {
            return prev.map((hand, handIdx) => {
                if(handIdx === playerId) {
                    /*hand.map((handCard, handCardIdx) => {
                        return handCard !== cardPlayed;
                    });*/
                    return [...hand, ...forcedDrawnCards];
                }
                return hand;
            });
        });
        drawTwoStack.current = 0;
        nextPlayer(playerId);
    }

    const dealFromTheStock = () => {
        const dealtCard = deck.pop();
        //console.log(dealtCard);
        var newHand = [...hands[0], dealtCard];
        //console.log(newHand);
        setHands((prev) => {
            return prev.map((hand, handIdx) => {
                if(handIdx === 0) {
                    /*hand.map((handCard, handCardIdx) => {
                        return handCard !== cardPlayed;
                    });*/
                    return newHand;
                }
                return hand;
            });
        });
        hasMatchInHand(newHand);
        dealAttempts.current = dealAttempts.current + 1;
        if(dealAttempts.current >= 3 && 
            ((topCardRef.current.rank !== "8" && !cardMatch(dealtCard)) || 
            (topCardRef.current.rank === "8" && !cardMatchEight(dealtCard)))) {
            //console.log("After 3 attempts, you must pass");
            setMessage("You've drawn 3 cards with no match, therefore you must pass");
            dealAttempts.current = 0;
            setTimeout(() => {
                nextPlayer(0);
            }, 1500);
        } else if(cardMatch(dealtCard) || (topCardRef.current.rank === "8" && cardMatchEight(dealtCard))) {
            dealAttempts.current = 0;
        }
        if(deck.length === 0) {
            resetDeck();
        }
    }

    const forceDrawFromTheStock = () => {
        const dealtCard = deck.pop();
        //console.log(dealtCard);
        var newHand = [...hands[0], dealtCard];
        if(deck.length === 0) {
            resetDeck();
        }
        //console.log(newHand);
        setHands((prev) => {
            return prev.map((hand, handIdx) => {
                if(handIdx === 0) {
                    /*hand.map((handCard, handCardIdx) => {
                        return handCard !== cardPlayed;
                    });*/
                    return newHand;
                }
                return hand;
            });
        });
        dealAttempts.current = dealAttempts.current + 1;
        if(dealAttempts.current >= drawTwoStack.current) {
            setMustForceDraw(false);
            setMessage("");
            dealAttempts.current = 0;
            drawTwoStack.current = 0;
            nextPlayer(0);
        }
    }

    const hasMatchInHand = (hand: Card[]) => {
        if(topCardRef.current.rank !== "8") {
            var handMatched = hand.filter(c => cardMatch(c));
        } else {
            var handMatched = hand.filter(c =>
                c.suit === currEightSuit.current || c.rank === "8"
            );
        }
        //console.log("handMatched: ", handMatched);
        if(handMatched.length > 0) {
            //console.log("has match");
            return true;
        }
        else {
            //console.log("no match");
            return false;
        }
    }

    const resetDeck = () => {
        console.log("the deck will be reshuffled: ", otherDiscards);
        var newDeck = reshuffleWasteToStock(otherDiscards);
        setDeck(newDeck);
        setOtherDiscards([]);
        deckHasReset.current = true;
        console.log("new deck: ", newDeck);
        setMessage("The Deck has been reshuffled");
    }

    const nextPlayer = (playerId: number) => {
        var next = (playerId + directionOfPlay.current) % 4;
        if(next === 0) {
            yourTurn2.current = true;
            if(!mustForceDraw) {
                setTimeout(() => {
                    setMessage(`It's now your turn${topCardRef.current.rank === "8" ? ", please play a " + currEightSuit.current : ""}`);
                }, 1000);
            }
        } else {
            //just a foolproof maybe
            yourTurn2.current = false;
            setTimeout(() => {
                opponentTurn(next);
            }, 1500);
        }
    }

    const skipNext = (playerId: number) => {
        var next = (playerId + 2) % 4;
        if(next === 0) {
            yourTurn2.current = true;
            setTimeout(() => {
                setMessage("It's now your turn");
            }, 1000);
        } else {
            //just a foolproof maybe
            yourTurn2.current = false;
            setTimeout(() => {
                opponentTurn(next);
            }, 1500);
        }
    }
    return(
        <IonPage>
            <IonContent>
                <IonGrid>
                    <IonRow>
                        <IonCol className="west-cards">
                            <IonRow className="ht-playername">
                                <IonText>West</IonText>
                            </IonRow>
                            {hands?.[1]?.map((cd, idx) => (
                                <IonRow className="ht-west-cards">
                                    <img 
                                        className="ht-west-card"
                                        src={deckCtx?.declareBack()}
                                        style={{width: "110px", marginBottom: -120}}
                                    />
                                </IonRow>
                            ))}
                        </IonCol>
                        <IonCol size="9">
                            <IonRow className="north-cards" style={{height: 160}}>
                                {hands?.[2]?.map((cd, idx) => (
                                    <IonCol className="ht-north-cards" style={{marginRight: -40}}>
                                    <img 
                                        className="ht-north-card"
                                        src={deckCtx?.declareBack()}
                                        style={{width: "110px"}}
                                    />
                                    </IonCol>
                                ))}
                            </IonRow>
                            <IonRow className="ht-playername">
                                <IonText>North</IonText>
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
                                            onClick={() => mustForceDraw ? forceDrawFromTheStock() :
                                                !hasMatchInHand(hands[0]) ?
                                                dealFromTheStock() : undefined}
                                        />
                                    </div>
                                </IonCol>
                                <IonCol>
                                    <div className="eights-discard">
                                        <img 
                                            className="ht-played-card"
                                            src={deckCtx?.declareFace(topCard.getName())}
                                            style={{width: "110px",
                                                visibility: topCard.isEmpty() ? 'hidden' : 'visible',
                                            }}
                                        />
                                    </div>
                                </IonCol>
                            </IonRow>
                            <IonRow className="ht-trick-winner">
                                <IonLabel>{message}</IonLabel>
                                {!gameStart &&
                                <IonButton onClick={startGame}>Start Game</IonButton>}
                                {declareEightSuit &&
                                    suits.map((suit, idx) => (
                                        <IonButton
                                            color={suitCol[idx]}
                                            onClick={() => setEightSuit(suit)}
                                        >
                                            {suit}
                                        </IonButton>
                                    ))
                                }
                                {showSwap &&
                                    players.map((player, idx) => (
                                        idx !== 0 &&
                                        <IonButton
                                            onClick={() => chooseSwap(idx)}
                                        >
                                            {player}
                                        </IonButton>
                                    ))
                                }
                            </IonRow>
                        </IonCol>
                        <IonCol className="east-cards">
                            <IonRow className="ht-playername">
                                <IonText>East</IonText>
                            </IonRow>
                                {hands?.[3]?.map((cd, idx) => (
                                    <IonRow className="ht-east-cards">
                                    <img 
                                        className="ht-east-card"
                                        src={deckCtx?.declareBack()}
                                        style={{width: "110px", marginBottom: -120}}
                                    />
                                    </IonRow>
                                ))}
                        </IonCol>
                    </IonRow>
                    <IonRow className="your-cards">
                        {hands?.[0]?.map((cd, idx) => (
                            <IonCol className="ht-your-cards">
                                <img 
                                    className="ht-your-card"
                                    src={deckCtx?.declareFace(cd.getName())}
                                    style={{width: "110px"}}
                                    onClick={() => 
                                        gameStart && yourTurn2.current && !mustForceDraw && playCard(cd, 0)
                                    }
                                />
                            </IonCol>
                        ))}
                    </IonRow>
                </IonGrid>
                <IonAlert
                    isOpen={gameEndOpen}
                    header="Game Over!"
                    message={
                        winner === "You" ?
                        "You win the game!" :
                        `${winner} won the game.`
                    }
                    buttons={[
                        {
                            text: 'Play Again',
                            role: 'playagain',
                            handler: () => {
                                setGameEndOpen(false);
                                newGame();
                            }
                        },
                        {
                            text: 'Quit',
                            role: 'quit',
                            handler: () => {
                                history.goBack();
                            }
                        }
                    ]}
                    backdropDismiss={false}
                    onDidDismiss={() => {
                        //console.log(detail.role);
                        setGameEndOpen(false);
                    }}
                />
                <IonAlert
                    isOpen={chooseGameMode}
                    header="Choose Game Mode"
                    message={
                        "Classic: Only Wild (8)\nVery Crazy: Adds Reverse (K), Skip (J), +2 (2)\nUltra Crazy: Adds Swap (7), Swap All (A), Draw 5 (Q)"
                    }
                    buttons={[
                        {
                            text: 'Classic',
                            role: 'classic',
                            handler: () => {
                                setChooseGameMode(false);
                                setGameMode(0);
                            }
                        },
                        {
                            text: 'Very Crazy',
                            role: 'verycrazy',
                            handler: () => {
                                setChooseGameMode(false);
                                setGameMode(1);
                            }
                        },
                        {
                            text: 'Ultra Crazy',
                            role: 'ultracrazy',
                            handler: () => {
                                setChooseGameMode(false);
                                setGameMode(2);
                            }
                        }
                    ]}
                    backdropDismiss={false}
                    onDidDismiss={() => {
                        //console.log(detail.role);
                        setGameEndOpen(false);
                    }}
                    cssClass="euchresol-scores"
                />
            </IonContent>
        </IonPage>
    );
}

export default Eights;