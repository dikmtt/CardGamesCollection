import { IonAlert, IonButton, IonCol, IonGrid, IonPage, IonRow, useIonViewWillLeave } from "@ionic/react";
import React, { useContext, useEffect, useRef, useState } from "react";
import { DeckContext } from "../../../components/Context/DeckContext";
import { shuffle } from "../../../components/CardLogic/deck";
import "./Pyramid.css";
import { getStraightVal } from "../../../components/SpeedPoker/hands";
import { useHistory, useLocation } from "react-router";
import { pyrbgm } from "../../../App";

const Pyramid: React.FC = () => {
    const deckCtx = useContext(DeckContext);
    deckCtx?.change4CSupportOps(true);
    const history = useHistory();

    const [deck, setDeck] = useState<string[]>();
    const [pyramidCards, setPyramidCards] = useState<string[]>([]);
    const [remainingDeck, setRemainingDeck] = useState<string[]>([]);
    //0 = unclickable. 1 = clickable. 2 = cleared.
    const [cardIsOpen, setCardIsOpen] = useState<number[]>([]);
    const [startGame, setStartGame] = useState(false);
    const [currDeckCardId, setCurrDeckCardId] = useState(-1);
    const [selectedCard, setSelectedCard] = useState("");
    const [cardsChosen, setCardsChosen] = useState(0);
    const [clearedCards, setClearedCards] = useState<number[]>([]);
    const deckPasses = useRef(0);
    const [endGameOpen, setEndGameOpen] = useState(false);
    const enter = useRef(true);

    //const bgm = new Audio("/assets/sounds/scratch/pyramid-match.mp3");
    const bgm = new Audio("/assets/sounds/33 max verstappen.mp3");
    const sfxMatch = new Audio("/assets/sounds/scratch/pyramid-match.mp3");
    const sfxWrongMatch = new Audio("/assets/sounds/scratch/pyramid-wrongmatch.mp3");
    const sfxDeal = new Audio("/assets/sounds/scratch/pyramid-deal.mp3");
    const sfxRedeal = new Audio("/assets/sounds/scratch/pyramid-redeal.mp3");
    const sfxClear = new Audio("/assets/sounds/scratch/pyramid-clear.mp3");
    const sfxLose = new Audio("/assets/sounds/scratch/lose.mp3");
    const bgm2 = useRef<HTMLAudioElement | null>(null);
    //bgm.loop = true;

    const location = useLocation();

    const newHand = () => {
        var deck = shuffle();
        setDeck(deck);
        var pyramid = Array();
        var cardsOpen = Array();
        for(var i = 0; i < 28; i++) {
            var c = deck.pop();
            pyramid.push(c);

            cardsOpen.push(i < 21 ? 0 : 1);
        }
        setPyramidCards(pyramid);
        setCardIsOpen(cardsOpen);
        setRemainingDeck(deck);
        deckPasses.current = 0;
        setCurrDeckCardId(-1);
        //var cardsOpen = Array()
    }
    
    useEffect(() => {
        newHand();
    }, []);

    //testing will implement animation soon
    const [showTestCard, setShowTestCard] = useState(false);
    const [movedCards, setMovedCards] = useState<number[]>([]);
    const [startDeal, setStartDeal] = useState(false);

    //build the pyramid
    const rows = [];
    let index = 0;
    for (let row = 1; index < pyramidCards?.length; row++) {
        rows.push(pyramidCards?.slice(index, index + row));
        index += row;
    }

    //sometimes the music may cause lag
    const handleShowCard = () => {
        //bgm.play();
        if(!bgm2.current) {
            bgm2.current = bgm;
            bgm2.current.loop = true;
            bgm2.current.play();
        }
        setStartGame(true);
    }

    useIonViewWillLeave(() => bgm2.current?.pause());

    /*useEffect(() => {
        if(startDeal) {
            pyramidCards?.forEach((card, idx) => {
                setTimeout(() => {
                    setMovedCards((prev) => [...prev, idx]);
                }, idx * 600);
            });
        }
    }, [startDeal]);*/

    const dealCard = () => {
        if(currDeckCardId >= remainingDeck?.length - 1) {
            //setCurrDeckCardId((prev) => prev + 1);
            if(deckPasses.current < 2) {
                sfxRedeal.play();
                setCurrDeckCardId(-1);
                deckPasses.current = deckPasses.current + 1;
            } else {
                setEndGameOpen(true);
            }
        } else {
            //setCurrDeckCardId(-1);
            sfxDeal.play();
            setCurrDeckCardId((prev) => prev + 1);
        }
    }

    const getCardValue = (card: string) => {
        var value = getStraightVal(card);
        if(value === 14) {
            return 1;
        } else {
            return value;
        }
    }

    const chooseCard = (card: string) => {
        //console.log(cardIsOpen);
        //choose 1 card
        if(cardsChosen === 0) {
            if(getCardValue(card) === 13) {
                sfxMatch.play();
                const cardId = pyramidCards?.indexOf(card);
                if(pyramidCards?.includes(card)) {
                    //const newPyrCards = cardIsOpen?.map((c, i) => i === cardId ? "" : c);
                    setCardIsOpen((prev) => {
                        return prev?.map((c, i) => i === cardId ? 2 : c);
                    });
                    setPyramidCards((prev) => {
                        return prev?.map((c, i) => i === cardId ? "" : c);
                    });
                    //setTimeout(() => 
                    unlockCard();
                } else if(remainingDeck?.includes(card)) {
                    setCurrDeckCardId((prev) => prev - 1);
                    setRemainingDeck((prev) => {
                        //return prev?.map((c, i) => card === c ? "" : c);
                        return prev?.filter((c, i) => c !== card);
                    });
                }
            } else {
                setCardsChosen((prev) => prev + 1);
                setSelectedCard(card);
            }
        //choose 2 cards
        } else {
            setCardsChosen(0);
            const savedCardVal = getCardValue(selectedCard);
            const selectedCardVal = getCardValue(card);
            if(savedCardVal + selectedCardVal === 13) {
                sfxMatch.play();
                if(pyramidCards?.includes(selectedCard) && pyramidCards?.includes(card)) {
                    const card1Id = pyramidCards?.indexOf(selectedCard);
                    const card2Id = pyramidCards?.indexOf(card);
                    match(card1Id!, card2Id!);
                } else {
                    const pyramidCard = pyramidCards?.includes(selectedCard) ? selectedCard : card;
                    const wasteCard = pyramidCards?.includes(selectedCard) ? card : selectedCard;
                    const pyramidCardId = pyramidCards?.indexOf(pyramidCard);
                    matchWaste(pyramidCardId, currDeckCardId);
                }
                unlockCard();
            } else {
                sfxWrongMatch.play();
                setSelectedCard("");
                //console.log("oops");
            }
        }
    }

    //match, for when both cards are in the pyramid
    const match = (card1: number, card2: number) => {
        //const newPyrCards = cardIsOpen?.map((c, i) => (i === card1 || i === card2) ? "" : c);
        //console.log(rows);
        setClearedCards(prev =>
            [...prev, card1, card2]
        );
        setCardIsOpen((prev) => {
            return prev?.map((c, i) => (i === card1 || i === card2) ? 2 : c);
        });
        setPyramidCards((prev) => {
            return prev?.map((c, i) => (i === card1 || i === card2) ? "" : c);
        });
        //return newPyrCards;
    }

    //match, for when one card is in the pyramid and the other is in the waste pile
    const matchWaste = (pyramidCard: number, wasteCard: number) => {
        setClearedCards(prev =>
            [...prev, pyramidCard]
        );
        setCardIsOpen((prev) => {
            return prev?.map((c, i) => i === pyramidCard ? 2 : c);
        });
        setPyramidCards((prev) => {
            return prev?.map((c, i) => i === pyramidCard ? "" : c);
        });
        setCurrDeckCardId((prev) => prev - 1);
        setRemainingDeck((prev) => {
            return prev?.filter((c, i) => i !== wasteCard);
        });
    }

    const checkIfClickable = (card: string) => {
        const index = pyramidCards?.indexOf(card);
        return cardIsOpen?.[index!];
    }

    const unlockCard = () => {
        //console.log("cio: ", cardIsOpen);
        //console.log("cleared cards:", clearedCards);
        var cio = [...(cardIsOpen ?? [])];
        var totalIndex = 0;
        var unlockedIndexArr = Array();
        for(var i = 1; i <= 6; i++) {
            for(var j = 1; j <= i; j++) {
                //totalIndex += (j + 1);
                totalIndex++;
                //console.log("rowIdx ", i, ": ", totalIndex);
                const nextNumber = totalIndex + i;
                //console.log("nextNumbers: ", nextNumber, " and ", nextNumber + 1);
                //console.log("next number and before: ", cardIsOpen?.[nextNumber], cardIsOpen?.[nextNumber - 1])
                if(cardIsOpen?.[nextNumber] === 2 && 
                    cardIsOpen?.[nextNumber - 1] === 2) {
                    unlockedIndexArr.push(totalIndex - 1);
                    //console.log("Index ", totalIndex - 1, " is free");
                    /*setClearedCards(prev =>
                        [...prev, nextNumber, nextNumber - 1]
                    );*/
                }
            }
        }
        /*setCardIsOpen((prev) => {
            return prev?.map((c, i) => unlockedIndexArr.includes(i) ? 1 : c);
        });*/
        //problem: some cards already cleared will have their index updated to 1
        cio = cio.map((c, i) => (unlockedIndexArr.includes(i) && c === 0) ? 1 : c);
        /*if(JSON.stringify(cio) !== JSON.stringify(cardIsOpen)) {
            setCardIsOpen(cio);
        } else return;*/
        //console.log("cio: ", cio);
        setCardIsOpen(prev => {
            return JSON.stringify(cio) !== JSON.stringify(cardIsOpen) ? cio : prev
        });
    }

    useEffect(() => unlockCard(), [cardIsOpen]);
    useEffect(() => {
        if(cardIsOpen.length > 0 && cardIsOpen.every(v => v === 2)) {
            sfxClear.play();
            newHand();
        }
    }, [cardIsOpen]);
    return(
        <IonPage>
            <IonGrid>
                <IonCol>
                    <IonRow class="pyramid-container">
                        {startGame && 
                            rows.map((pyr, idx) => (
                                <div
                                    key={idx}
                                    className="row-container"
                                    style={{top: `${10 + idx * 25}px`, zIndex: idx}}
                                >
                                    {pyr.map((cd, idx2) => (
                                        <div 
                                            key={idx2} 
                                            style={{
                                                width: "100px",
                                                height: cd === "" ? "auto" : "1px",
                                                display: "inline-block",
                                                pointerEvents: cd === "" ? "none" : "auto"
                                            }}
                                            className="card"
                                            onClick={
                                                () => cd !== "" && checkIfClickable(cd) === 1 ?
                                                    chooseCard(cd) : undefined
                                            } 
                                             >
                                                {cd !== "" && (<img 
                                                    src={deckCtx?.declareFace(cd)} 
                                                    
                                                    className="card"
                                                    style={{
                                                        filter: cd === selectedCard ? "brightness(50%)" : "brightness(100%)"
                                                    }}
                                                />)}
                                            </div>
                                    ))}
                                </div>
                            ))
                        }
                    </IonRow>
                    <IonRow>
                        <IonCol>
                            <img 
                                src={deckCtx?.declareBack()}
                                className="card"
                                onClick={() => dealCard()}
                            />
                            {/*pyramidCards?.map((card, id) => (
                            <img
                                key={id}
                                src={deckCtx?.declareFace(card)}
                                className={`card ${movedCards.includes(id) ? "move-in" : "spawn-move"}`}
                            />
                            ))*/}
                        </IonCol>
                        <IonCol>
                            <img 
                                src={currDeckCardId !== -1 && currDeckCardId < remainingDeck?.length ?
                                    deckCtx?.declareFace(remainingDeck?.[currDeckCardId]) :
                                    deckCtx?.declareBack()
                                }
                                className="card"
                                onClick={() => chooseCard(remainingDeck?.[currDeckCardId])}
                                style={{
                                    visibility: currDeckCardId === -1 ? 'hidden' : 'visible',
                                    filter: remainingDeck?.[currDeckCardId] === selectedCard ? "brightness(50%)" : "brightness(100%)"
                                }}
                            />
                        </IonCol>
                    </IonRow>
                    <IonRow className="pyr-button-container">
                        <IonButton onClick={handleShowCard} disabled={startGame ? true : false}>
                            Start Game
                        </IonButton>
                    </IonRow>
                </IonCol>
            </IonGrid>
            <IonAlert
                isOpen={endGameOpen}
                header="Game Over!"
                message={"You passed through the deck 3 times and didn't clear the pyramid"}
                buttons={['Finish']}
                onDidDismiss={() => {
                    setEndGameOpen(false);
                    history.goBack();
                }}
                onIonAlertWillPresent={() => {
                        bgm2.current?.pause();
                        sfxLose.play();
                    }}
            ></IonAlert>
        </IonPage>
    );
}

export default Pyramid;