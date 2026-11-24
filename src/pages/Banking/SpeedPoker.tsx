import { IonButton, IonContent, IonGrid, IonLabel, IonPage, IonRow, IonTitle } from "@ionic/react";
import React, { useEffect, useState } from "react";
import { isNumber, shuffle } from "../../components/CardLogic/deck";
import { determineHand } from "../../components/SpeedPoker/hands";
import "./SpeedPoker.css";

const SpeedPoker: React.FC = () => {
    const [deck, setDeck] = useState<string[]>();
    const [hand, setHand] = useState<string[]>();
    const [pokerHand, setPokerHand] = useState("");
    const makeDeck = () => {
        var yee = shuffle();
        setDeck(yee);
        var hand = yee.slice(0, 5);
        setHand(hand);
        var currHand = determineHand(hand);
        setPokerHand(currHand);
    }
    useEffect(() => {
        makeDeck();
    }, []);
    const imgBase = "/assets/cards/";
    return(
        <IonPage>
            <IonContent>
                <IonGrid>
                    <IonRow className="sp-titlearea">
                        <IonTitle className="sp-title">Speed Poker!</IonTitle>
                    </IonRow>
                    <IonRow className="sp-cardsarea">
                        {hand?.map((card, idx) => (
                            <img
                                key={idx}
                                src={isNumber(card) ? 
                                    `${imgBase}${card}.png` :
                                    `${imgBase}set-doa/${card}.png`
                                }
                                style={{width: "10%"}}
                                className="sp-card"
                            />
                        ))}
                    </IonRow>
                    <IonRow className="sp-titlearea">
                        <IonTitle className="sp-handname">This hand is a {pokerHand}</IonTitle>
                    </IonRow>
                    <IonRow className="sp-titlearea">
                        <IonButton onClick={makeDeck}>
                            <IonLabel>New Hand</IonLabel>
                        </IonButton>
                    </IonRow>
                </IonGrid>
            </IonContent>
        </IonPage>
    );
}

export default SpeedPoker;