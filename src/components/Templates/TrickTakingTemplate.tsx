import { IonButton, IonCol, IonContent, IonGrid, IonItem, IonLabel, IonPage, IonRow, IonText } from "@ionic/react";
import React, { useContext, useEffect, useState } from "react";
import { isNumber, shuffle } from "../../components/CardLogic/deck";
import { DeckContext } from "../../components/Context/DeckContext";
import { dealTo4Players } from "../../components/CardLogic/4-player-setup";
import "./Hearts.css";

const TrickTakingTemplate: React.FC = () => {
    const deckCtx = useContext(DeckContext);
    const imgBase = "/assets/cards/";
    
    const players = ["You", "West", "North", "East"];
    const [deck, setDeck] = useState<string[]>();
    //array of arrays. index 0 is player, index 1 is west, etc
    const [hands, setHands] = useState<string[][]>();
    const [score, setScore] = useState<number[]>([0, 0, 0, 0]);

    const [trick, setTrick] = useState<string[]>(["", "", "", ""]);

    const newHand = () => {
        var deck = shuffle();
        setDeck(deck);
        //console.log("hearts deck: ", deck);
        var playerHands = dealTo4Players(deck);
        setHands(playerHands);
        //console.log("player hands: ", playerHands);
    }

    const beginGame = () => {
        newHand();
        setScore([0, 0, 0, 0]);
    }

    useEffect(() => {
        beginGame();
    }, []);

    const playCard = (cardPlayed: string, playerId: number) => {
        setTrick((prev) => {
            return prev.map((cd, idx) => {
                if(idx === playerId) {
                    return cardPlayed;
                }
                return cd;
            });
        });
        //console.log(trick[0]);
        var newPlayerHand = hands?.[playerId].filter(cd => cd !== cardPlayed);
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
        })
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
                                        style={{width: "100px", marginBottom: -120}}
                                    />
                                </IonRow>
                            ))}
                        </IonCol>
                        <IonCol size="9">
                            <IonRow className="north-cards" style={{height: 140}}>
                                {hands?.[2]?.map((cd, idx) => (
                                    <IonCol className="ht-north-cards" style={{marginRight: -40}}>
                                    <img 
                                        className="ht-north-card"
                                        src={deckCtx?.declareBack()}
                                        style={{width: "100px"}}
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
                                {trick.map((trickCard, playerId) => (
                                    <IonCol>
                                        <IonRow 
                                            className="ht-trick-row" 
                                            style={{
                                                border: trickCard === "" ? '1px solid white' : 'none',
                                            }}
                                        >
                                            <img 
                                                className="ht-played-card"
                                                src={trickCard === "" ? deckCtx?.declareBack() : deckCtx?.declareFace(trickCard)}
                                                style={{width: "100px",
                                                    visibility: trickCard === "" ? 'hidden' : 'visible',
                                                }}
                                            />
                                        </IonRow>
                                        <IonRow className="ht-trick-row">
                                            <IonText>{players[playerId]}</IonText>
                                        </IonRow>
                                    </IonCol>
                                ))}
                                
                            </IonRow>
                            <IonRow className="ht-trick-winner">
                                <IonLabel>Playername took the trick.</IonLabel>
                                <IonButton>Continue</IonButton>
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
                                        style={{width: "100px", marginBottom: -120}}
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
                                    src={deckCtx?.declareFace(cd)}
                                    style={{width: "100px"}}
                                    onClick={() => playCard(cd, 0)}
                                />
                            </IonCol>
                        ))}
                    </IonRow>
                </IonGrid>
            </IonContent>
        </IonPage>
    );
}

export default TrickTakingTemplate;