import { IonAlert, IonButton, IonCol, IonContent, IonGrid, IonIcon, IonPage, IonRow, IonText } from "@ionic/react";
import React, { useContext, useEffect, useRef, useState } from "react";
import { DeckContext } from "../../../components/Context/DeckContext";
import { useHistory } from "react-router";
import { shuffle } from "../../../components/CardLogic/deck";
import "./Beehive.css";
import { getRank } from "../../../components/SpeedPoker/hands";
import {reload} from "ionicons/icons";

const Beehive: React.FC = () => {
    const deckCtx = useContext(DeckContext);
    deckCtx?.change4CSupportOps(true);
    const history = useHistory();
    
    const [deck, setDeck] = useState<string[]>([]);
    const [tableau, setTableau] = useState<string[][]>([[], [], [], [], [], []]);
    const [sideCards, setSideCards] = useState<string[]>([]);
    const [top3WasteCards, setTop3WasteCards] = useState<string[]>([]);
    const [latestIdx, setLatestIdx] = useState<number>(-1);
    const [selectedCard, setSelectedCard] = useState<string>("");

    const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
    const [rankIsCleared, setRankIsCleared] = useState([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

    //const sfxWin = new Audio("/assets/sounds/memes/win.mp3");
    const [winOpen, setWinOpen] = useState(false);

    const newHand = () => {
        var startDeck = shuffle();
        var startSC = Array();
        for(var i = 0; i < 10; i++) {
            var scCard = startDeck.pop();
            startSC.push(scCard);
        }
        var startTab = Array();
        for(var i = 0; i < 6; i++) {
            var tabSpace = Array();
            var tabCard = startDeck.pop();
            tabSpace.push(tabCard);
            startTab.push(tabSpace);
        }
        //console.log("deck length: ", startDeck.length);

        setDeck(startDeck);
        setSideCards(startSC);
        setTableau(startTab);
    }

    useEffect(() => {
        newHand();
    }, []);

    const dealFromStock = () => {
        if(latestIdx >= (deck.length - 1)) {
            setLatestIdx(-1);
            return;
        }
        const plusThree = latestIdx + 3;
        //console.log("plusThree: ", plusThree);
        if(deck[plusThree]) {
            setLatestIdx(plusThree);
        } else {
            const difference = deck.length - plusThree;
            //console.log("deck length: ", deck.length);
            //console.log("the difference: ", deck.length - plusThree);
            if(difference === 0) {
                //signifies that there are two more cards in the stock
                setLatestIdx(prev => {return prev + 2});
            } else if(difference === -1) {
                //signifies that there is one more card in the stock
                setLatestIdx(prev => {return prev + 1});
            }
        }
        //console.log(latestIdx);
    }

    const updateWaste = () => {
        //console.log(latestIdx);
        if(latestIdx === -1) {
            setTop3WasteCards([]);
        } else if((latestIdx === 0) || latestIdx === 1) {
            var wasteCards = Array();
            for(var i = 0; i <= latestIdx; i++) {
                var card = deck[i];
                wasteCards.push(card);
            }
            setTop3WasteCards(wasteCards);
        } else {
            var iterator = latestIdx - 2;
            var wasteCards = Array();
            for(var i = 0; i < 3; i++) {
                var card = deck[iterator];
                wasteCards.push(card);
                iterator++;
            }
            setTop3WasteCards(wasteCards);
        }
    }

    useEffect(() => {
        updateWaste();
    }, [latestIdx]);

    const selectCard = (card: string) => {
        if(selectedCard === "") {
            setSelectedCard(card);
        } else {
            setSelectedCard("");
        }
    }

    const playCard = (target: string[]) => {
        if(selectedCard === target[target.length - 1]) {
            setSelectedCard("");
            return;
        }
        if((target.length > 0 && getRank(selectedCard) === getRank(target[0])) || target.length === 0) {
            const origin = checkCardOrigin();
            if(origin === "deck") {
                setDeck(prev => {
                    return prev.filter((c, i) => c !== selectedCard);
                });
                setLatestIdx(prev => { return prev - 1});
            } else if(origin === "sidecards") {
                setSideCards(prev => {
                    return prev.filter((c, i) => c !== selectedCard);
                });
            } else if(origin === "tableau") {
                var tabIdxOfSelectedCard = -1;
                tableau.map((tp, tpI) => {
                    if(tp.includes(selectedCard)) {
                        tabIdxOfSelectedCard = tpI;
                    }
                });
                setTableau(prev => {
                    return prev.map((tp, tpI) => tpI === tabIdxOfSelectedCard ? [] : tp);
                });
            }

            target.push(selectedCard);
            if(tableau.some(tp => tp.length >= 4)) {
                clearRank();
            }
            setSelectedCard("");
        } else {
            console.log("illegal move!");
            setSelectedCard("");
        }
    }

    const checkCardOrigin = () => {
        if(deck.includes(selectedCard)) {
            return "deck";
        } else if(sideCards.includes(selectedCard)) {
            return "sidecards";
        } else {
            return "tableau";
        }
    }

    const clearRank = () => {
        var clearedRank = "yee";
        tableau.map((tp, i) => {
            if(tp.length >= 4) clearedRank = getRank(tp[0]);
        });
        //console.log("cleared rank: ", clearedRank);
        const rankIdx = ranks.indexOf(clearedRank);
        setRankIsCleared(prev => {
            return prev.map((cr, cri) => cri === rankIdx ? 1 : cr);
        });
        setTableau(prev => {
            return prev.map((tp, tpI) => tp.length >= 4 ? [] : tp);
        });
    }

    useEffect(() => {
        if(rankIsCleared.every(tp => tp === 1)) {
            setWinOpen(true);
        }
    }, [rankIsCleared]);

    return(
        <IonPage>
            <IonContent>
                <IonGrid>
                    <IonRow>
                        <IonCol>
                            {/* Side Cards */}
                            <div className="sideCards">
                                {sideCards.length > 0 && sideCards.map((sc, scIdx) => (
                                    <img 
                                        key={scIdx}
                                        src={
                                            scIdx === sideCards.length - 1 ?
                                            deckCtx?.declareFace(sc) :
                                            deckCtx?.declareBack()
                                        }
                                        style={{
                                            width: "120px",
                                            position: "absolute",
                                            top: `${scIdx * 15}px`,
                                            filter: sc === selectedCard ? "brightness(50%)" 
                                                        : "brightness(100%)"
                                        }}
                                        onClick={() => {
                                                if(scIdx === sideCards.length - 1) {
                                                    selectCard(sc)
                                                }
                                            }
                                        }
                                    />
                                ))}
                            </div>
                        </IonCol>
                        <IonCol size="6">
                            {/* Tableau */}
                            <IonRow>
                                <IonGrid>
                                {tableau.map((tabPos, tIdx) => {
                                    if(tIdx % 3 === 0) {
                                        return(
                                            <IonRow key={tIdx}>
                                                {[0, 1, 2].map((offset) => {
                                                    const trueIdx = tIdx + offset;
                                                    const tbPosIdx = tableau[trueIdx];
                                                    const topOfTabSpace = tbPosIdx[tbPosIdx.length - 1];
                                                    return(
                                                        <IonCol key={trueIdx} className="tableauPosition">
                                                            <div
                                                                style={{
                                                                    border: tbPosIdx.length > 0 ? 
                                                                    "none" : 
                                                                    "1px solid white"
                                                                }}
                                                            >
                                                                <img 
                                                                    src={
                                                                        tbPosIdx.length !== 0 ?
                                                                        deckCtx?.declareFace(topOfTabSpace) :
                                                                        deckCtx?.declareBack()
                                                                    }
                                                                    style={{
                                                                        width: "120px",
                                                                        filter: topOfTabSpace === selectedCard ? 
                                                                            "brightness(50%)" 
                                                                            : "brightness(100%)",
                                                                        opacity: tbPosIdx.length > 0 ? "100%" : "0%"
                                                                    }}
                                                                    onClick={() => {
                                                                        if(selectedCard === "") {
                                                                            setSelectedCard(topOfTabSpace);
                                                                        } else {
                                                                            playCard(tbPosIdx);
                                                                        }
                                                                    }}
                                                                />
                                                            </div>
                                                            <p>{tbPosIdx.length}</p>
                                                        </IonCol>
                                                    );
                                                })}
                                            </IonRow>
                                        );
                                    }
                                })}
                                </IonGrid>
                            </IonRow>
                            <IonRow className="rankButtons">
                                {ranks.map((rank, idx) => (
                                    <IonButton
                                        disabled
                                        color={rankIsCleared[idx] === 1 ? "success" : "danger"}
                                    >{rank}</IonButton>
                                ))}
                            </IonRow>
                        </IonCol>
                        <IonCol>
                            {/* Stock and Waste */}
                            <IonRow className="tableauPosition">
                                <div
                                    style={{
                                        border: latestIdx >= deck.length - 1 ? 
                                            "1px solid white" : 
                                            "none",
                                        position: "relative"
                                    }}
                                >
                                    <div
                                        style={{
                                            position: "absolute",
                                            top: "25%",
                                            left: "10%",
                                            textAlign: "center",
                                            visibility: latestIdx >= deck.length - 1 ? "visible" : "hidden"
                                        }} 
                                    >
                                        <IonIcon 
                                            icon={reload} 
                                            style={{
                                                fontSize: "100px"
                                            }}
                                        />
                                    </div>
                                    <img 
                                        src={deckCtx?.declareBack()}
                                        style={{
                                            width: "120px",
                                            opacity: latestIdx >= deck.length - 1 ? "0%" : "100%"
                                        }}
                                        onClick={() => dealFromStock()}
                                    />
                                </div>
                                <p>Waste</p>
                            </IonRow>
                            <IonRow className="tableauPosition">
                                <IonCol>
                                {latestIdx >= 0 && (
                                    <div className="sideCards">
                                        {top3WasteCards.map((wasteCard, wcIdx) => (
                                            <img 
                                                src={deckCtx?.declareFace(wasteCard)}
                                                style={{
                                                    width: "120px",
                                                    position: "absolute",
                                                    top: `${wcIdx * 40}px`,
                                                    filter: wasteCard === selectedCard ? "brightness(50%)" 
                                                        : "brightness(100%)"
                                                }}
                                                onClick={() => {
                                                    if(latestIdx < 2) {
                                                        wcIdx === latestIdx ?
                                                        selectCard(wasteCard) : undefined
                                                    } else {
                                                        wcIdx === 2 ?
                                                        selectCard(wasteCard) : undefined
                                                    }
                                                }}
                                            />
                                        ))}
                                    </div>
                                )}
                                </IonCol>
                            </IonRow>
                        </IonCol>
                    </IonRow>
                </IonGrid>
                <IonAlert 
                    isOpen={winOpen}
                    header="You Win!"
                    message="All cards cleared!"
                    buttons={['Finish']}
                    onDidDismiss={() => {
                        setWinOpen(false);
                        history.goBack();
                    }}
                    //onIonAlertWillPresent={() => sfxWin.play()}
                />
            </IonContent>
        </IonPage>
    );
}

export default Beehive;