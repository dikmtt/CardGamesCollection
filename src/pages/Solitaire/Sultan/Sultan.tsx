import { IonAlert, IonCol, IonContent, IonGrid, IonIcon, IonPage, IonRow } from "@ionic/react";
import React, { useContext, useEffect, useState } from "react";
import { DeckContext } from "../../../components/Context/DeckContext";
import { useHistory } from "react-router";
import { sultanDeal } from "../../../components/CardLogic/deck";
import "./Sultan.css";
import { reload } from "ionicons/icons";
import { getRank, getSuit } from "../../../components/SpeedPoker/hands";

const Sultan: React.FC = () => {
    const deckCtx = useContext(DeckContext);
    deckCtx?.change4CSupportOps(true);
    const history = useHistory();
        
    const [deck, setDeck] = useState<string[]>([]);
    const [found, setFound] = useState<string[][]>([["K-S"], ["A-H"], ["K-S"], ["K-D"], ["K-H"], ["K-D"], ["K-C"], ["K-H"], ["K-C"]]);
    const [tableau, setTableau] = useState<string[]>(["", "", "", "", "", "", "", ""]);
    const [stockIdx, setStockIdx] = useState<number>(-1);
    const [selectedCard, setSelectedCard] = useState<string>("");
    //source 0-7: respective position in the tableau, source 8: top of waste, source -1: no card selected
    const [selectedCardSource, setSelectedCardSource] = useState<number>(-1);

    const cardOrder = ["K", "A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q"];
    const [isCleared, setIsCleared] = useState([0, 0, 0, 0, 1, 0, 0, 0, 0]);
    const [timesRedealt, setTimesRedealt] = useState(0);
    const [gameOverOpen, setGameOverOpen] = useState(false);
    const [gameOverType, setGameOverType] = useState(0);

    const newHand = () => {
        var sultanDeck = sultanDeal();

        var tab = Array();
        for(var i = 0; i < tableau.length; i++) {
            var sdc = sultanDeck.pop();
            tab.push(sdc)
        }

        setDeck(sultanDeck);
        setTableau(tab);
        console.log(sultanDeck);
    }

    useEffect(() => {
        newHand();
    }, []);

    const dealFromStock = () => {
        if(stockIdx >= deck.length - 1) {
            if(timesRedealt >= 2) {
                setGameOverType(2);
                setGameOverOpen(true);
                return;
            }
            console.log("reached the end!");
            setStockIdx(-1);
            setTimesRedealt(prev => prev + 1);
        } else {
            setStockIdx(prev => prev + 1);
        }
    }

    const selectCard = (card: string, source: number) => {
        //console.log("source: ", source, ". selectedSource: ",selectedCardSource);
        if(selectedCard === "" || ((selectedCard !== "") && (card !== selectedCard) && (selectedCardSource !== source))) {
            setSelectedCard(card);
            setSelectedCardSource(source);
        } else {
            setSelectedCard("");
            setSelectedCardSource(-1);
        }
    }

    const checkRank = (foundCard: string, playedCard: string) => {
        const rankOfLFC = getRank(foundCard);
        const rankOfSC = getRank(playedCard);
        const foundRankIdx = cardOrder.indexOf(rankOfLFC);
        const playedRankIdx = cardOrder.indexOf(rankOfSC);
        if((playedRankIdx - foundRankIdx === 1) && (getSuit(foundCard) === getSuit(playedCard))) {
            return true;
        } else {
            return false;
        }
    }

    const playToFoundation = (foundNo: number) => {
        //no playing on the sultan
        if(foundNo === 4) {
            console.log("No playing on the sultan");
            return;
        }

        const foundCards = found[foundNo];
        const latestFC = foundCards[foundCards.length - 1];

        const isValidPlay = checkRank(latestFC, selectedCard);
        if(isValidPlay) {
            //update the foundation
            //console.log("valid play");
            updateFoundation(foundNo);
            if(getRank(foundCards[foundCards.length - 1]) === "Q") {
                //foundation position is cleared when the top card of the pile is a queen
                setIsCleared(prev => 
                    prev.map((num, i) => {
                        if(i === foundNo) {
                            console.log("foundation ", i, " clear!");
                            return 1;
                        }
                        return num;
                    })
                );
            }
            //update the tableau or waste
        } else {
            console.log("invalid play");
        }

        setSelectedCard("");
        setSelectedCardSource(-1);
    }

    const updateFoundation = (foundPos: number) => {
        const foundPosCards = found[foundPos];
        //console.log(foundPosCards);
        foundPosCards.push(selectedCard);

        setFound(prev =>
            prev.map((found, foundId) => {
                if(foundId === foundPos) {
                    return foundPosCards;
                }
                return found;
            })
        );

        //console.log("card source: ", selectedCardSource);
        //if the source is the waste: remove the card on that position, then subtract iterator by 1
        if(selectedCardSource >= 8) {
            const currIterator = stockIdx;
            setDeck(prev => {
                return prev.filter((c, i) => i !== currIterator);
            });
            setStockIdx(prev => prev - 1);
            //console.log("deck length: ", deck.length);
        //a tableau source indicates the tableau position the card was in
        } else {
            var replaceCard = "";
            if(deck.length === 0) {
                replaceCard = "";
            } else if (stockIdx === -1) {
                //remove the top card of the stock (deck at pos. 0)
                const topCardOfStock = deck[0];
                const newDeck = deck.filter((c, i) => i !== 0);
                setDeck(prev => {
                    return newDeck;
                });
                replaceCard = topCardOfStock;
            } else {
                //remove the top card of the waste (deck at stockIdx)
                const currIterator = stockIdx;
                const topCardOfWaste = deck[currIterator];
                const newDeck = deck.filter((c, i) => i !== currIterator);
                setDeck(prev => {
                    return newDeck;
                });
                setStockIdx(prev => {
                    return prev - 1;
                });
                replaceCard = topCardOfWaste;
            }
            setTableau(prev =>
                prev.map((tc, tci) => {
                    if(tci === selectedCardSource) {
                        return replaceCard;
                    }
                    return tc;
                })
            );
        }
    }

    useEffect(() => {
        if(isCleared.every(ic => ic === 1)) {
            setGameOverType(1);
            setGameOverOpen(true);
        }
    }, [isCleared]);

    return(
        <IonPage>
            <IonContent>
                <IonGrid>
                    <IonRow>
                        <IonCol>
                            <IonGrid>
                            {found.map((foundPos, idx) => {
                                if(idx % 3 === 0) {
                                    return(
                                        <IonRow key={idx}>
                                            {[0, 1, 2].map((offset) => {
                                                const trueIdx = idx + offset;
                                                const fnPosIdx = found[trueIdx];
                                                const topOfFoundSpace = fnPosIdx[fnPosIdx.length - 1];
                                                return(
                                                    <IonCol key={trueIdx} className="sultan-tableauPosition">
                                                        <img
                                                            src={deckCtx?.declareFace(topOfFoundSpace)} 
                                                            style={{
                                                                height: "150px"
                                                            }}
                                                            onClick={() => playToFoundation(trueIdx)}
                                                        />
                                                    </IonCol>
                                                );
                                            })}
                                        </IonRow>
                                    );
                                }
                            })}
                            </IonGrid>
                        </IonCol>
                        <IonCol>
                            <IonRow>
                                <IonGrid>
                                    {tableau.map((tabPos, idx) => {
                                        if(idx % 4 === 0) {
                                            return(
                                                <IonRow key={idx}>
                                                    {[0, 1, 2, 3].map((offset) => {
                                                        const trueIdx = idx + offset;
                                                        const tbPosCard = tableau[trueIdx];
                                                        //const topOfTabSpace = tbPosIdx[tbPosIdx.length - 1];
                                                        return(
                                                            <IonCol key={trueIdx} className="sultan-tableauPosition">
                                                                <div
                                                                    style={{
                                                                        border: tbPosCard !== "" ? 
                                                                        "none" : 
                                                                        "1px solid white"
                                                                    }}
                                                                >
                                                                <img
                                                                    src={
                                                                        tbPosCard === "" ?
                                                                        deckCtx?.declareBack() :
                                                                        deckCtx?.declareFace(tbPosCard)
                                                                    } 
                                                                    style={{
                                                                        height: "150px",
                                                                        opacity: tbPosCard === "" ? "0%" : "100%",
                                                                        filter: 
                                                                        tbPosCard === selectedCard &&
                                                                        selectedCardSource === trueIdx ? 
                                                                        "brightness(50%)" 
                                                                        : "brightness(100%)"
                                                                    }}
                                                                    onClick={() => selectCard(tbPosCard, trueIdx)}
                                                                />
                                                                </div>
                                                            </IonCol>
                                                        );
                                                    })}
                                                </IonRow>
                                            );
                                        }
                                    })}
                                </IonGrid>
                            </IonRow>
                            <IonRow>
                                <IonCol className="sultan-stock">
                                    <div
                                        style={{
                                            border: stockIdx >= deck.length - 1 ? 
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
                                                visibility: stockIdx >= deck.length - 1 ? "visible" : "hidden"
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
                                                height: "150px",
                                                opacity: stockIdx >= deck.length - 1 ? "0%" : "100%"
                                            }}
                                            onClick={() => dealFromStock()}
                                        />
                                    </div>
                                </IonCol>
                                <IonCol className="sultan-waste">
                                    <div
                                        style={{
                                            border: stockIdx < 0 ? 
                                                "1px solid white" : 
                                                "none"
                                        }}
                                    >
                                        <img 
                                            src={
                                                stockIdx >= 0 ?
                                                deckCtx?.declareFace(deck[stockIdx]) :
                                                deckCtx?.declareBack()
                                            }
                                            style={{
                                                height: "150px",
                                                opacity: stockIdx < 0 ? "0%" : "100%",
                                                filter: deck[stockIdx] === selectedCard && selectedCardSource === 8 ? 
                                                        "brightness(50%)" 
                                                        : "brightness(100%)"
                                            }}
                                            onClick={() => selectCard(deck[stockIdx], 8)}
                                        />
                                    </div>
                                </IonCol>
                            </IonRow>
                        </IonCol>
                    </IonRow>
                </IonGrid>
                <IonAlert 
                    isOpen={gameOverOpen}
                    header="Game Over"
                    message={gameOverType === 1 ? "You Win!" : "You Ran Out of Redeals and Lost!"}
                    buttons={['Finish']}
                    onDidDismiss={() => {
                        setGameOverOpen(false);
                        history.goBack();
                    }}
                />
            </IonContent>
        </IonPage>
    );
}

export default Sultan;