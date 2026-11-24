import { IonButton, IonCol, IonContent, IonGrid, IonLabel, IonPage, IonRow, IonText } from "@ionic/react";
import React, { useContext, useEffect, useRef, useState } from "react";
import { dealTo4Players } from "../../../components/CardLogic/4-player-setup";
import { shuffle } from "../../../components/CardLogic/deck";
import { DeckContext } from "../../../components/Context/DeckContext";
import { getRank } from "../../../components/SpeedPoker/hands";
import { checkForPairs, dealForOM, getRandomPair } from "../../../components/MiscGames/oldmaid";

const OldMaid: React.FC = () => {
    const deckCtx = useContext(DeckContext);
        const players = ["You", "West", "North", "East"];
        const [deck, setDeck] = useState<string[]>([]);
        //array of arrays. index 0 is player, index 1 is west, etc
        const [hands, setHands] = useState<string[][]>([[], [], [], []]);
        const currPlayer = useRef(-1);
        const turnNo = useRef(0);
        const [playedPair, setPlayedPair] = useState<string[]>(["", ""]);
        const yourTurn = useRef(false);
        const [justDiscarded, setJustDiscarded] = useState(false);
    
        const newHand = () => {
            var deck = shuffle();
            setDeck(deck);
            var modDeck = removeOneCard(deck, "Q");
            currPlayer.current = Math.floor(Math.random() * 4);
            var playerHands2 = dealForOM(modDeck, currPlayer.current);
            //console.log(playerHands2);
            setHands(playerHands2);
        }

        const removeOneCard = (deck: string[], rank: string) => {
            var cardToRemove = deck.find((c) => getRank(c) === rank);
            return deck.filter(c => c !== cardToRemove);
        }
    
        const beginGame = () => {
            newHand();
            //setScore([0, 0, 0, 0]);

            //at the moment the game is still a WIP as there are still some errors
            //most importantly, when a player takes a card that's already discarded
            //another recently found error is when a player discards a pair,
            //but isn't in the same card as the one that's most recently been taken
        }
    
        useEffect(() => {
            beginGame();
        }, []);

        useEffect(() => {
            if(justDiscarded) {
            const stillHasPairs = checkForPairs(hands[0]);
                console.log(stillHasPairs);
                if(!stillHasPairs) {
                    setTimeout(() => {
                        nextTurn();
                    }, 2000);
                }
            setJustDiscarded(false);
            }
        }, [hands, justDiscarded]);

        const start = () => {
            currPlayer.current = (currPlayer.current + 1) % 4;
            turnNo.current = turnNo.current + 1;

            console.log("Turn: ", currPlayer.current);
            if(currPlayer.current === 0) {
                yourTurn.current = true;
            } else {
                turn(currPlayer.current);
            }
        }

        async function turn(playerId: number){
            console.log("Turn: ", playerId);
            //take a card from the previous player
            if(playerId === 0) {
                return
            }
                console.log("e");
                if(turnNo.current > 4) {
                    //define previous player as
                    //((currPlayer.current - 1) + 4) % 4
                    var prevPlayer = ((currPlayer.current - 1) + 4) % 4;
                    for(var i = 0; i < 3; i++) {
                        if(hands[prevPlayer].length > 0) {
                            console.log(players[prevPlayer], "'s hand is ", hands[prevPlayer]);
                            break;
                        } else {
                            prevPlayer = ((prevPlayer - 1) + 4) % 4;
                        }
                    }
                    var prevPlayerHand = hands[prevPlayer];
                    var randCard = prevPlayerHand[Math.floor(Math.random() * prevPlayerHand.length)];
                    //setTimeout(() => {
                    takeCard(randCard, prevPlayer, playerId);
                    //}, 2000);
                }

                //check for pairs
                //var hasPair = true;
                var hand = [...hands[playerId]];
                while(checkForPairs(hand)) {
                    //hasPair = checkForPairs(hands[playerId]);
                    //console.log(hasPair);
                    //if(hasPair) {
                        //discard pair
                        var pairCards = getRandomPair(hand);
                        console.log("pairCards: ", pairCards);
                        setPlayedPair(pairCards);
                        await new Promise<void>((resolve) => {
                            setTimeout(async () => {
                                await playCards(pairCards, playerId);
                                resolve();
                            }, 1000);
                        });

                        await new Promise(resolve => setTimeout(resolve, 500));
                        hand = hand.filter(c => !pairCards.includes(c));
                    } //else {
                        //break;
                    //}
                //}
            //} else {
                //return;
            //}
            //next turn
            setTimeout(() => {
            nextTurn();
            }, 1000);
        }

        const nextTurn = () => {
            console.log("hands: ", hands);
            currPlayer.current = ((currPlayer.current) + 1) % 4;
            console.log("currPlayer.current: ", currPlayer.current);
            turnNo.current = turnNo.current + 1;
            if(currPlayer.current === 0 && hands[0].length > 0) {
                yourTurn.current = true;
            } else {
                yourTurn.current = false;
                if(hands[currPlayer.current].length === 0) {
                    nextTurn();
                } else {
                    turn(currPlayer.current);
                }
            }
        }

        //handle taking cards from East player
        const takeCard = (card: string, originalCardOwner: number, cardTaker: number) => {
            console.log("entering takeCard function");

            console.log(players[cardTaker], " took the ", card, " from ", players[originalCardOwner]);
            setHands((prev) => {
                return prev.map((hand, handIdx) => {
                    if(handIdx === cardTaker) {
                        if(!hand.includes(card)) {
                        return [...hand, card];
                        }
                    }
                    if(handIdx === originalCardOwner) {
                        return hand.filter(cd => cd !== card);
                    }
                    return hand;
                });
            });

            if(currPlayer.current === 0) {
                setJustDiscarded(true);
            }
        }

        const checkIfLegalCard = (card: string) => {
            var handWithOnlyCardRank = hands[0].filter(c => getRank(card) === getRank(c));
            if(handWithOnlyCardRank.length > 1) return true;
            else return false;
        }

        const selectCard = (card: string) => {
            const isEmpty = playedPair.every(c => c === "");
            if(isEmpty) {
                var index = 0;
            } else {
                var index = 1;
            }
            var playedPairNew = playedPair.map((c, i) => {
                if(i === index) return card;
                return c;
            })
            setPlayedPair(playedPairNew);

            const bothCardsIn = playedPairNew.every(c => c !== "");
            if(bothCardsIn) {
                playCards(playedPairNew, 0);
                setJustDiscarded(true);
                //check for when there are no more pairs in player's hand
                /*const stillHasPairs = checkForPairs(hands[0]);
                console.log(stillHasPairs);
                if(!stillHasPairs) {
                    setTimeout(() => {
                        nextTurn();
                    }, 2000);
                }*/
            }
        }
    
        const playCards = (cardsPlayed: string[], playerId: number) => {
            return new Promise<void>((resolve) => {
            console.log("entering playCards function");
            var newPlayerHand = hands?.[playerId].filter(cd => !cardsPlayed.includes(cd));
            setHands((prev) => {
                return prev.map((hand, handIdx) => {
                    if(handIdx === playerId) {
                        /*hand.map((handCard, handCardIdx) => {
                            return handCard !== cardPlayed;
                        });*/
                        return hand.filter(cd => !cardsPlayed.includes(cd));
                        //return newPlayerHand;
                    }
                    return hand;
                });
            })
            setTimeout(() => {
                setPlayedPair(["", ""]);
                resolve();
            }, 200);
        });
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
                                {Array.isArray(hands?.[1]) && hands?.[1]?.map((cd, idx) => (
                                    <IonRow className="ht-west-cards">
                                        <img 
                                            className="ht-west-card"
                                            src={deckCtx?.declareBack()}
                                            style={{width: "100px", marginBottom: -120}}
                                            onClick={() => {
                                                yourTurn.current && 
                                                hands[3].length === 0 && 
                                                hands[2].length === 0 &&
                                                takeCard(cd, 1, 0);
                                            }}
                                        />
                                    </IonRow>
                                ))}
                            </IonCol>
                            <IonCol size="9">
                                <IonRow className="north-cards" style={{height: 140}}>
                                    {Array.isArray(hands?.[2]) && hands?.[2]?.map((cd, idx) => (
                                        <IonCol className="ht-north-cards" style={{marginRight: -40}}>
                                        <img 
                                            className="ht-north-card"
                                            src={deckCtx?.declareBack()}
                                            style={{width: "100px"}}
                                            onClick={() => {
                                                yourTurn.current && hands[3].length === 0 && takeCard(cd, 2, 0);
                                            }}
                                        />
                                        </IonCol>
                                    ))}
                                </IonRow>
                                <IonRow className="ht-playername">
                                    <IonText>North</IonText>
                                </IonRow>
                                <IonRow className="ht-trickbox">
                                    <IonText className="ht-tricktext">The Trick</IonText>
                                </IonRow>
                                <IonRow>
                                    {playedPair.map((pairCard, pairId) => (
                                        <IonCol>
                                            <IonRow 
                                                className="ht-trick-row" 
                                                style={{
                                                    border: pairCard === "" ? '1px solid white' : 'none',
                                                }}
                                            >
                                                <img 
                                                    className="ht-played-card"
                                                    src={pairCard === "" ? deckCtx?.declareBack() : deckCtx?.declareFace(pairCard)}
                                                    style={{width: "100px",
                                                        visibility: pairCard === "" ? 'hidden' : 'visible',
                                                    }}
                                                />
                                            </IonRow>
                                        </IonCol>
                                    ))}
                                    
                                </IonRow>
                                <IonRow className="ht-trick-winner">
                                    <IonButton onClick={() => start()}>Start</IonButton>
                                </IonRow>
                            </IonCol>
                            <IonCol className="east-cards">
                                <IonRow className="ht-playername">
                                    <IonText>East</IonText>
                                </IonRow>
                                    {Array.isArray(hands?.[3]) && hands?.[3]?.map((cd, idx) => (
                                        <IonRow className="ht-east-cards">
                                        <img 
                                            className="ht-east-card"
                                            src={deckCtx?.declareBack()}
                                            style={{width: "100px", marginBottom: -120}}
                                            onClick={() => {
                                                yourTurn.current && takeCard(cd, 3, 0);
                                            }}
                                        />
                                        </IonRow>
                                    ))}
                            </IonCol>
                        </IonRow>
                        <IonRow className="your-cards">
                            {Array.isArray(hands?.[0]) && hands?.[0]?.map((cd, idx) => (
                                <IonCol className="ht-your-cards">
                                    <img 
                                        className="ht-your-card"
                                        src={deckCtx?.declareFace(cd)}
                                        style={{width: "100px"}}
                                        onClick={() => {
                                            yourTurn.current &&
                                            checkIfLegalCard(cd) &&
                                            selectCard(cd);
                                        }}
                                    />
                                </IonCol>
                            ))}
                        </IonRow>
                    </IonGrid>
                </IonContent>
            </IonPage>
        );
}

export default OldMaid;