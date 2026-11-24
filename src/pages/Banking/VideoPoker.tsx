import { IonButton, IonCol, IonContent, IonGrid, IonLabel, IonPage, IonRow, IonTitle } from "@ionic/react";
import React, { useContext, useEffect, useRef, useState } from "react";
import { shuffle, isNumber } from "../../components/CardLogic/deck";
import { determineHand } from "../../components/SpeedPoker/hands";
import "./VideoPoker.css";
import { DeckContext } from "../../components/Context/DeckContext";

const VideoPoker: React.FC = () => {
    const [deck, setDeck] = useState<string[]>();
    const [hand, setHand] = useState<string[]>([]);
    const [pokerHand, setPokerHand] = useState("");
    //a state to check the discarded state of each card in the hand
    const [discarded, setDiscarded] = useState([0, 0, 0, 0, 0]);
    const [discardDisabled, setDiscardDisabled] = useState(true);
    const [submitted, setSubmitted] = useState(0);
    const [cardflip2, setCardflip2] = useState([false, false, false, false, false]);
    //a state to check if the card will be flipped or not
    const flipIndividual = useRef([]);
    //const [cardFlipArr, setCardFlipArr] = useState([false, false, false, false, false]);
    const [gameBegins, setGameBegins] = useState(false);

    const deckCtx = useContext(DeckContext);

    const beginGame = () => {
        var yee = shuffle();
        setDeck(yee);
        var hand = yee.slice(0, 5);
        setHand(hand);
        setDiscarded([0, 0, 0, 0, 0]);
        setSubmitted(0);
    }

    const makeDeck = () => {
        setGameBegins(true);
        setCardflip2([false, false, false, false, false]);
        setTimeout(() => {
            var yee = shuffle();
            setDeck(yee);
            var hand = yee.slice(0, 5);
            setHand(hand);
            var currHand = determineHand(hand);
            setPokerHand(currHand);
            setDiscarded([0, 0, 0, 0, 0]);
            setSubmitted(0);
            setDiscardDisabled(false);
            //setCardflip(!cardflip);
            setTimeout(() => {
                //setCardflip(true);
                setCardflip2([true, true, true, true, true]);
            }, 100);
        }, 100);
    }
    useEffect(() => {
        setGameBegins(false);
        beginGame();
        setDiscardDisabled(true);
        //setCardflip(false);
        setCardflip2([false, false, false, false, false]);
    }, []);
    const imgBase = "/assets/cards/";

    const changeDiscardValue = (index: number) => {
        setDiscarded((prev) =>
            prev.map((val, idx) =>
                idx === index ? (val === 0 ? 1 : 0) : val
            )
        );
        //console.log(discarded);
    }

    const flipCertainCards = (flipValue: boolean) => {
        discarded.map((val, idx) => {
            if(val === 1) {
                setCardflip2((prev) =>
                    prev.map((value, index) =>
                        index === idx ? flipValue : value
                    )
                );
            }
        });
    }

    const submit = () => {
        flipCertainCards(false);
        setTimeout(() => {
            const handTest = hand.map((val, idx) =>
                discarded[idx] === 1 ? deck?.pop() : val
            );
            setHand(handTest);
            setDiscardDisabled(true);

            setTimeout(() => {
                setSubmitted(1);
                flipCertainCards(true);
            }, 100);
        }, 100);
    }
    useEffect(() => {
        var currHand = determineHand(hand);
        setPokerHand(currHand);
    }, [hand]);

        return(
            <IonPage>
                <IonContent>
                    <IonGrid>
                        <IonRow className="sp-titlearea">
                            <IonTitle className="sp-title">Video Poker</IonTitle>
                        </IonRow>
                        <IonRow className="sp-cardsarea">
                            {hand?.map((card, idx) => (
                                <IonCol key={idx}>
                                    <IonRow className="vp-rowitem">
                                        <div className="vp-cardflipout">
                                            <div 
                                                className={`vp-cardflipin ${cardflip2[idx] ? "is-flipped" : ""}`}
                                            >
                                                <div className="sp-card vp-cardflipback">
                                                    <img
                                                        src={deckCtx?.declareBack()}
                                                        
                                                    />
                                                </div>
                                                <div className="sp-card vp-cardflipface">
                                                    <img
                                                        src={deckCtx?.declareFace(card)
                                                        }
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        
                                    </IonRow>
                                    <IonRow className="vp-rowitem">
                                        <IonButton 
                                            onClick={() => changeDiscardValue(idx)} 
                                            color={discarded[idx] === 0 ? "success" : "danger"}
                                            disabled={discardDisabled === true ? true : false}
                                        >
                                            <IonLabel>
                                                {discarded[idx] === 0 ? "Hold" : "Discard"}
                                            </IonLabel>
                                        </IonButton>
                                    </IonRow>
                                </IonCol>
                            ))}
                        </IonRow>
                        <IonRow className="sp-titlearea">
                            { submitted === 1 &&
                                <IonTitle className="sp-handname">This hand is a {pokerHand}</IonTitle>
                            }
                        </IonRow>
                        <IonRow className="sp-titlearea">
                            <IonButton onClick={submit} disabled={submitted === 1 ? true : false}>
                                <IonLabel>Submit</IonLabel>
                            </IonButton>
                            <IonButton onClick={makeDeck}>
                                <IonLabel>New Hand</IonLabel>
                            </IonButton>
                        </IonRow>
                    </IonGrid>
                </IonContent>
            </IonPage>
        );
}

export default VideoPoker;