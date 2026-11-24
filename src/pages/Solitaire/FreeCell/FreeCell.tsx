import { IonAlert, IonButton, IonCol, IonContent, IonGrid, IonLabel, IonPage, IonRow, IonText } from "@ionic/react";
import React, { useContext, useEffect, useRef, useState } from "react";
import { useHistory } from "react-router";
import { DeckContext } from "../../../components/Context/DeckContext";
import { shuffle } from "../../../components/CardLogic/deck";
//import useUndo from "../../../components/CardLogic/useUndo";
import { freeCellDeal } from "../../../components/FreeCell/freecell";
import "./FreeCell.css";
import { getRank, getSuit } from "../../../components/SpeedPoker/hands";
import { useUndo } from "../../../components/CardLogic/useUndo";
import { Card, checkIfDefault, defaultCard, shuffleNew } from "../../../components/CardLogic/deckOOP";

type FreecellState = {
    tableau: Card[][];
    foundations: Card[][];
    freecells: Card[];
}

var initialFreecellState: FreecellState = {
    tableau: [[], [], [], [], [], [], [], []],
    foundations: [[], [], [], []],
    freecells: [defaultCard(), defaultCard(), defaultCard(), defaultCard()],
}

const FreeCell: React.FC = () => {
    const deckCtx = useContext(DeckContext);
    deckCtx?.change4CSupportOps(false);
    const history = useHistory();
    const {currState, set, undo, canUndo} = useUndo<FreecellState>(initialFreecellState);
    //const [histVal, setHistVal, undo] = useUndo(-1, 50);

    const [deck, setDeck] = useState<Card[]>([]);
    const [tableau, setTableau] = useState<Card[][]>([[], [], [], [], [], [], [], []]);
    //only used to restart the game
    const [tableau2, setTableau2] = useState<Card[][]>([[], [], [], [], [], [], [], []]);
    const [freecells, setFreecells] = useState<Card[]>([defaultCard(), defaultCard(), defaultCard(), defaultCard()]);
    const [foundations, setFoundations] = useState<Card[][]>([[], [], [], []]);

    //const [selectedCard, setSelectedCard] = useState<string>("");
    const [selectCardSource, setSelectedCardSource] = useState<string>("");
    const [selectedCardRun, setSelectedCardRun] = useState<Card[]>([]);

    //const [isSeededDeal, setIsSeededDeal] = useState(false);
    //const [seed, setSeed] = useState<number>(0);
    const isSeededDeal = useRef(false);
    const seed = useRef(0);
    const [startGameOpen, setStartGameOpen] = useState(true);
    const [selectSeedOpen, setSelectSeedOpen] = useState(false);

    const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
    const suits = ["S", "H", "C", "D"];
    const [isClear, setIsClear] = useState([0, 0, 0, 0]);
    const [canAutoMoveCard, setCanAutoMoveCard] = useState(false);
    const [gameOverOpen, setGameOverOpen] = useState(false);

    const newGame = () => {
        var startDeck;
        //console.log("seeded: ", isSeededDeal.current);
        //console.log("seed: ", seed.current);
        if(!isSeededDeal.current) {
            startDeck = shuffleNew();
        } else {
            startDeck = freeCellDeal(seed.current);
        }
        console.log([...startDeck]);
        var cols = Array();
        for(var i = 0; i < 8; i++) {
            var col = Array();
            cols.push(col);
            /*var col = Array();
            var cardsInCol = 0;
            if(i < 4) {
                cardsInCol = 7;
            } else {
                cardsInCol = 6;
            }
            for(var j = 0; j < cardsInCol; j++) {
                var card = startDeck.pop();
                col.push(card);
            }
            cols.push(col);*/
        }
        for(var i = 0; i < startDeck.length; i++) {
            var colIdx = i % 8;
            cols[colIdx].push(startDeck[i]);
        }
        console.log(cols);
        setTableau(cols);
        setTableau2(cols);

        const startGameState: FreecellState = {
            tableau: cols,
            foundations: [[], [], [], []],
            freecells: [defaultCard(), defaultCard(), defaultCard(), defaultCard()],
        };
        set(startGameState);
    }

    /*useEffect(() => {
        newGame();
    }, []);*/

    const clickOnCard = (card: Card, clickedArea: string, destIdx: number) => {
        if(canAutoMoveCard) {
            if(clickedArea === "tableau") {
                const tabCol = currState.tableau[destIdx];
                if(tabCol[tabCol.length - 1] !== card) return;
            }

            autoMoveToFoundation(card, clickedArea);
        } else {
            if(selectedCardRun.length === 0) {
                //selectCards(card, clickedArea);
                selectCardRun(card, destIdx, clickedArea);
            } else {
                playCard(clickedArea, destIdx);
            }
        }
    }

    const selectCards = (card: Card, cardSource: string) => {
        if(card !== defaultCard()) {
            //setSelectedCard(card);
            setSelectedCardRun([card]);
            setSelectedCardSource(cardSource);
        }
    }

    const selectCardRun = (card: Card, tableauNo: number, cardSource: string) => {
        if(cardSource === "tableau") {
            //a card from the tableau can be a single card or multiple cards
            const column = currState.tableau[tableauNo];
            const cardIdx = column.indexOf(card);
            if(isValidRun(column, cardIdx)) {
                const run = column.slice(cardIdx);
                setSelectedCardRun(run);
            }
        } else if(cardSource === "freecells") {
            //but a card from the freecells only consist of one card
            setSelectedCardRun([card]);
        }

        setSelectedCardSource(cardSource);
    }

    //the destination can either be the tableau, foundation, or freecells
    const playCard = (destination: string, destIdx: number) => {
        var finalTab, finalFC, finalFound;
        if(destination === "tableau") {
            //playing a card to the tableau
            var targetCol = currState.tableau[destIdx];
            if(targetCol[targetCol.length - 1] === selectedCardRun[selectedCardRun.length - 1]) {
                //if the same tableau column is the target reset
                //reset();
                //return;
            } else {
                const isValid = isValidTableauBuild(targetCol);
                if(isValid) {
                    if(selectCardSource === "tableau") {
                        //moveFromTableau();
                        finalTab = swapTableauPos(destIdx);
                    } else if (selectCardSource === "freecells" && selectedCardRun.length === 1) {
                        const fcIdx = currState.freecells.indexOf(selectedCardRun[0]);
                        finalFC = moveFromFreecells(fcIdx);
                        finalTab = moveToTableau(destIdx);
                    }
                    //moveToTableau(destIdx);
                    //reset();
                } else {
                    //reset();
                    console.log("invalid build");
                }
            }
        } else if(destination === "freecells") {
            if(checkIfDefault(currState.freecells[destIdx])) {
                //foolproof pt 1
                var cardInFc = -1;
                //in order to move a card to the freecells the run must consist of only 1 card
                if(selectedCardRun.length === 1) {
                    if(currState.freecells.includes(selectedCardRun[0])) 
                        cardInFc = currState.freecells.indexOf(selectedCardRun[0]);
                    //move the card to the freecells
                    const tempFC = moveToFreecells(destIdx);
                    if(selectCardSource === "tableau") {
                        finalTab = moveFromTableau();
                        finalFC = tempFC;
                    //foolproof for swapping a card's freecell position
                    } else if(selectCardSource === "freecells") {
                        finalFC = moveFromFreecells(cardInFc, tempFC);
                    }
                }
                //reset();
            } else {
                //freecells may only hold one card at a time
                console.log("one card per freecell, please");
                //reset();
                //return;
            }
        } else if(destination === "foundations") {
            var targetCol = currState.foundations[destIdx];
            if(selectedCardRun.length === 1) {
                const isValid = isValidFoundationBuild(targetCol, selectedCardRun[0]);
                //similarly, only single cards can be moved to the foundations
                if(isValid) {
                    if(selectCardSource === "tableau") {
                        finalTab = moveFromTableau();
                    } else if (selectCardSource === "freecells") {
                        const fcIdx = currState.freecells.indexOf(selectedCardRun[0]);
                        finalFC = moveFromFreecells(fcIdx);
                    }
                    finalFound = moveToFoundations(destIdx, selectedCardRun[0]);
                    //reset();
                    if(selectedCardRun[0].rank === "K") {
                        setIsClear(prev =>
                            prev.map((num, i) => {
                                if(i === destIdx) {
                                    console.log("foundation ", i, " clear!");
                                    return 1;
                                }
                                return num;
                            })
                        );
                    }
                } else {
                    //reset();
                    console.log("invalid play");
                }
            }
        }
        //console.log("finalTab: ", finalTab, ", finalFC: ", finalFC, ", finalFound: ", finalFound);
        updateState(finalTab, finalFC, finalFound);
        checkForAutoMove();
        reset();
    }

    const reset = () => {
        //setSelectedCard("");
        setSelectedCardSource("");
        setSelectedCardRun([]);
    }

    const moveToTableau = (idx: number) => {
        const newTableau = currState.tableau.map((tb, tbi) => {
                    if(tbi === idx) return [...tb, ...selectedCardRun];
                    return tb;
                }
            );
        return newTableau;
        //setTableau(newTableau);
        /*setTableau(prev => 
            prev.map((tb, tbi) => {
                    if(tbi === idx) return [...tb, ...selectedCardRun];
                    return tb;
                }
            )
        );*/
    }

    const moveFromTableau = () => {
        const newTableau = currState.tableau.map((tb, tbi) => {
                    if(selectedCardRun.every(sc => tb.includes(sc))) 
                        return tb.filter(c => !selectedCardRun.includes(c));
                    return tb;
                }
            );
        return newTableau;
        //setTableau(newTableau);
        /*setTableau(prev => 
            prev.map((tb, tbi) => {
                    if(selectedCardRun.every(sc => tb.includes(sc))) 
                        return tb.filter(c => !selectedCardRun.includes(c));
                    return tb;
                }
            )
        );*/
    }

    //this is just a combination of the two tableau update functions above
    //maybe with some modifications and optional params it can be a single function
    const swapTableauPos = (toIdx: number) => {
        const newTableau = currState.tableau.map((tb, tbi) => {
                    if(tbi === toIdx) return [...tb, ...selectedCardRun];
                    if(selectedCardRun.every(sc => tb.includes(sc))) 
                        return tb.filter(c => !selectedCardRun.includes(c));
                    return tb;
                }
            );
        return newTableau;
    }

    //autoplay
    const moveFromTableauAP = (card: Card) => {
        const newTableau = currState.tableau.map((tb, tbi) => {
                    if(tb.includes(card)) 
                        return tb.filter(c => c !== card);
                    return tb;
                }
            );
        //setTableau(newTableau);
        return newTableau;
        /*setTableau(prev => 
            prev.map((tb, tbi) => {
                    if(tb.includes(card)) 
                        return tb.filter(c => c !== card);
                    return tb;
                }
            )
        );*/
    }

    const moveToFreecells = (idx: number) => {
        if(selectedCardRun.length === 1) {
            const newFC = currState.freecells.map((fc, fci) => {
                        if(fci === idx) return selectedCardRun[0];
                        return fc;
                    }
                );
            return newFC;
            //setFreecells(newFC);
            /*setFreecells(prev => 
                prev.map((fc, fci) => {
                        if(fci === idx) return selectedCardRun[0];
                        return fc;
                    }
                )
            );*/
        }
    }

    const moveFromFreecells = (idx: number, oldFCState?: Card[]) => {
        var stateToMod;
        if(oldFCState !== undefined) stateToMod = oldFCState;
        else stateToMod = currState.freecells;
        const newFC = stateToMod.map((fc, fci) => {
                    if(fci === idx) return defaultCard();
                    return fc;
                }
            );
        return newFC;
        //setFreecells(newFC);
        /*setFreecells(prev => 
            prev.map((fc, fci) => {
                    if(fci === idx) return "";
                    return fc;
                }
            )
        );*/
    }

    const moveToFoundations = (idx: number, card: Card) => {
        //if(selectedCardRun.length === 1) {
        const newFound = currState.foundations.map((fnd, fndi) => {
                        if(fndi === idx) return [...fnd, card];
                        return fnd;
                    }
                );
        return newFound;
        //setFoundations(newFound);
            /*setFoundations(prev => 
                prev.map((fnd, fndi) => {
                        if(fndi === idx) return [...fnd, card];
                        return fnd;
                    }
                )
            );*/
        //}
    }

    const updateState = (tableau: any, freecells: any, foundations: any) => {
        if(tableau !== undefined || freecells !== undefined || foundations !== undefined) {
            set({
                ...currState,
                tableau: tableau !== undefined ? tableau : currState.tableau,
                freecells: freecells !== undefined ? freecells : currState.freecells,
                foundations: foundations !== undefined ? foundations : currState.foundations,
            });
        }
    }

    const isValidTableauBuild = (targetCol: Card[]) => {
        if(targetCol.length > 0) {
            const lastCard = targetCol[targetCol.length - 1];
            const isValid = validBuildCheck(lastCard, selectedCardRun[0]);

            //valid if the cards are different color
            /*const selectedCardSuitIdx = suits.indexOf(getSuit(selectedCard));
            const lastCardSuitIdx = suits.indexOf(getSuit(lastCard));
            const isOppositeCol = selectedCardSuitIdx % 2 !== lastCardSuitIdx % 2;

            //valid if the selectedCard rank is one lower than the lastCard rank
            const selectedCardRankIdx = ranks.indexOf(getRank(selectedCard));
            const lastCardRankIdx = ranks.indexOf(getRank(lastCard));
            const buildDownDiff = lastCardRankIdx - selectedCardRankIdx;

            if(isOppositeCol && buildDownDiff === 1) {*/
            if(isValid) {
                return true;
            } else {
                return false;
            }
        } else {
            return true;
        }
    }

    const validBuildCheck = (beforeCard: Card, afterCard: Card) => {
        //valid if the cards are different color
        //const afterCardSuitIdx = suits.indexOf(getSuit(afterCard));
        //const beforeCardSuitIdx = suits.indexOf(getSuit(beforeCard));
        //const isOppositeCol = afterCardSuitIdx % 2 !== beforeCardSuitIdx % 2;
        const isOppositeCol = beforeCard.getColor() !== afterCard.getColor();

        //valid if the selectedCard rank is one lower than the lastCard rank
        const afterCardRankIdx = ranks.indexOf(afterCard.rank);
        const beforeCardRankIdx = ranks.indexOf(beforeCard.rank);
        const buildDownDiff = beforeCardRankIdx - afterCardRankIdx;

        return isOppositeCol && buildDownDiff === 1;
    }

    const isValidFoundationBuild = (targetCol: Card[], card: Card) => {
        if(targetCol.length === 0) {
            if(card.rank === "A") {
                return true;
            } else {
                return false;
            }
        } else {
            const lastCard = targetCol[targetCol.length - 1];

            //valid if the selectedCard rank is one higher than the lastCard rank
            const selectedCardRankIdx = ranks.indexOf(card.rank);
            const lastCardRankIdx = ranks.indexOf(lastCard.rank);
            const buildDownDiff = selectedCardRankIdx - lastCardRankIdx;

            //valid if both cards are the same suit
            const isSameSuit = lastCard.suit === card.suit;

            if(isSameSuit && buildDownDiff === 1) {
                return true;
            } else {
                return false;
            }
        }
    }

    const isValidRun = (fullColumn: Card[], startingCardIdx: number) => {
        if(startingCardIdx === fullColumn.length - 1) {
            return true;
        } else {
            var validFlag = true;
            var cardsToMove = 1;
            for(var i = startingCardIdx; i <= fullColumn.length - 2; i++) {
                //console.log(fullColumn[i], fullColumn[i + 1]);
                var validRun = validBuildCheck(fullColumn[i], fullColumn[i + 1]);
                if(!validRun) {
                    validFlag = false;
                    break;
                } else {
                    cardsToMove++;
                }
            }
            //console.log("cards to move: ", cardsToMove);
            if(validFlag && cardsToMove <= maxCardsToMove()) {
                //console.log("valid run");
                return true;
            }
            else {
                //console.log("invalid run");
                return false;
            }
        }
    }

    const maxCardsToMove = () => {
        const emptyFreecells = currState.freecells.filter(c => checkIfDefault(c)).length;
        //const emptyColumns = tableau.filter(c => c.length === 0).length;
        return emptyFreecells + 1;
    }

    const checkForAutoMove = () => {
        //console.log("checking for auto move");
        var validFlag = true;
        for(var i = 0; i < currState.tableau.length; i++) {
            var isDescending = checkTableauDescend(currState.tableau[i]);
            if(!isDescending) {
                validFlag = false;
                break;
            }
        }
        if(validFlag) {
            //console.log("can now auto move cards");
            setCanAutoMoveCard(true);
        }
    }

    const checkTableauDescend = (tableauCol: Card[]) => {
        if(tableauCol.length <= 1) return true;
        else {
            var validFlag = true;
            for(var i = 0; i <= tableauCol.length - 2; i++) {
                var beforeCard = tableauCol[i];
                var afterCard = tableauCol[i + 1];
                if(ranks.indexOf(afterCard.rank) > ranks.indexOf(beforeCard.rank)) {
                    validFlag = false;
                    break;
                }
            }
            return validFlag;
        }
    }

    const autoMoveToFoundation = (card: Card, source: string) => {
        const cardSuit = card.suit;
        var foundCol:Card[] = [];
        var colIdx = -1;
        var finalTab, finalFC, finalFound;
        currState.foundations.forEach((fc, i) => {
            if(fc.length !== 0 && fc[0].suit === cardSuit) {
                foundCol = fc;
                colIdx = i;
            }
        });
        //moving a card to an occupied foundation
        if(foundCol.length !== 0 && colIdx !== -1) {
            const isValid = isValidFoundationBuild(foundCol, card);
            if(isValid) {
                //console.log("he");
                if(source === "tableau") {
                    finalTab = moveFromTableauAP(card);
                } else if (source === "freecells") {
                    const fcIdx = currState.freecells.indexOf(card);
                    finalFC = moveFromFreecells(fcIdx);
                }
                finalFound = moveToFoundations(colIdx, card);
                if(card.rank === "K") {
                    setIsClear(prev =>
                        prev.map((num, i) => {
                            if(i === colIdx) {
                                console.log("foundation ", i, " clear!");
                                return 1;
                            }
                            return num;
                        })
                    );
                }
            }
        } else {
            //moving a card to a vacant foundation (must be ace)
            //console.log('ye');
            var firstEmptyCol = currState.foundations.findIndex(e => e.length === 0);
            console.log(firstEmptyCol);
            if(card.rank === "A") {
                if(source === "tableau") {
                    finalTab = moveFromTableauAP(card);
                } else if (source === "freecells") {
                    const fcIdx = currState.freecells.indexOf(card);
                    finalFC = moveFromFreecells(fcIdx);
                }
                finalFound = moveToFoundations(firstEmptyCol, card);
            }
        }
        //console.log("finalTab: ", finalTab, ", finalFC: ", finalFC, ", finalFound: ", finalFound);
        updateState(finalTab, finalFC, finalFound);
    }

    useEffect(() => {
        /*if(isClear.every(ic => ic === 1)) {
            setGameOverOpen(true);
        }*/
        if(currState.foundations.every(f => f.length === 13)) {
            setGameOverOpen(true);
        }
    }, [currState.foundations]);

    return(
        <IonPage>
            <IonContent>
                <IonGrid>
                    <IonRow>
                        <IonCol>
                            <IonRow>
                                {currState.freecells.map((fc, fci) => (
                                    <IonCol className="freecell-center">
                                        <div 
                                            style={{
                                                border: checkIfDefault(fc) ? "1px solid yellow" : "none"
                                            }}
                                        >
                                            <img 
                                                src={checkIfDefault(fc) ? deckCtx?.declareBack() : deckCtx?.declareFace(fc.getName())}
                                                style={{
                                                    width:"100px",
                                                    filter: selectedCardRun.includes(fc) && fc !== defaultCard() ? "brightness(50%)" : "brightness(100%)",
                                                    opacity: checkIfDefault(fc) ? "0%" : "100%"
                                                }}
                                                onClick={() => clickOnCard(fc, "freecells", fci)}
                                            />
                                        </div>
                                    </IonCol>
                                ))}
                            </IonRow>
                            <IonRow className="freecell-center">
                                <IonText className="freecell-seedinfo">Freecells</IonText>
                            </IonRow>
                        </IonCol>
                        <IonCol size="1" className="freecell-center" style={{flexDirection: "column"}}>
                            {isSeededDeal.current &&
                            <IonRow>
                                <IonLabel className="freecell-seedinfo">{`Seed #${seed.current}`}</IonLabel>
                            </IonRow>
                            }
                            {/*<IonRow>
                                <IonButton onClick={undo}>
                                    <IonLabel>Undo</IonLabel>
                                </IonButton>
                            </IonRow>*/}
                            <IonRow>
                                {deckCtx?.screenWidth === "large" &&
                                    <IonButton 
                                        className="freecell-button" 
                                        onClick={() => canUndo ? undo() : undefined}
                                        disabled={!canUndo ? true : false}
                                    >
                                        <IonLabel>Undo</IonLabel>
                                    </IonButton>
                                }
                                {deckCtx?.screenWidth !== "large" &&
                                    <div 
                                        className="freecell-button-sm" 
                                        onClick={() => canUndo ? undo() : undefined}
                                        style={{filter: canUndo ? "brightness(100%)" : "brightness(50%)"}}
                                    >
                                        <IonLabel>Undo</IonLabel>
                                    </div>
                                }
                            </IonRow>
                        </IonCol>
                        <IonCol>
                            <IonRow>
                                {currState.foundations.map((fnd, fndi) => (
                                    <IonCol className="freecell-center">
                                        <div
                                            style={{
                                                border: fnd.length === 0 ? "1px solid white" : "none"
                                            }}
                                        >
                                            <img 
                                                src={fnd.length === 0 ? deckCtx?.declareBack() : deckCtx?.declareFace(fnd[fnd.length - 1].getName())}
                                                style={{
                                                    width:"100px",
                                                    opacity: fnd.length === 0 ? "0%" : "100%"
                                                }}
                                                onClick={() => clickOnCard(fnd[fnd.length - 1], "foundations", fndi)}
                                            />
                                        </div>
                                    </IonCol>
                                ))}
                            </IonRow>
                            <IonRow className="freecell-center">
                                <IonText className="freecell-seedinfo">Foundations</IonText>
                            </IonRow>
                        </IonCol>
                    </IonRow>
                    <IonRow>
                        {currState.tableau.map((tb, tbi) => {
                            if(tb.length > 0) { 
                                return( 
                                    <IonCol>
                                        {tb.map((tbc, tbci) => (
                                            <IonRow 
                                                className="freecell-tableau-center"
                                                style={{
                                                    position: "relative",
                                                    height: `${deckCtx?.screenWidth === "large" ? 30 : 20}px`
                                                }}
                                            >
                                                <img 
                                                    src={deckCtx?.declareFace(tbc.getName())}
                                                    style={{
                                                        width:"100px",
                                                        position: "absolute",
                                                        filter: selectedCardRun.includes(tbc) ? "brightness(50%)" : "brightness(100%)"
                                                    }}
                                                    onClick={() => isValidRun(tb, tbci) ? clickOnCard(tbc, "tableau", tbi) : undefined}
                                                />
                                            </IonRow>
                                        ))}
                                    </IonCol>
                                )
                            } else {
                                return(
                                    <IonCol>
                                        <IonRow className="freecell-tableau-center">
                                            <div 
                                                style={{
                                                    border: "1px solid white",
                                                    display: "flex",
                                                }}
                                            >
                                                <img 
                                                    src={deckCtx?.declareBack()}
                                                    style={{
                                                        width:"100px",
                                                        opacity: "0%"
                                                    }}
                                                    onClick={() => clickOnCard(defaultCard(), "tableau", tbi)}
                                                />
                                            </div>
                                        </IonRow>
                                    </IonCol>
                                )
                            }
                        })}
                    </IonRow>
                </IonGrid>
                <IonAlert
                    isOpen={gameOverOpen}
                    header="Game Over"
                    message="You Win!"
                    buttons={['Finish']}
                    onDidDismiss={() => {
                        setGameOverOpen(false);
                        history.goBack();
                    }}
                />
                <IonAlert 
                    isOpen={startGameOpen}
                    header="Choose Your Deal"
                    inputs={[
                        {
                            label: 'Random Deal',
                            type: 'radio', 
                            value: 'randomDeal',
                        },
                        {
                            label: 'Random Seeded Deal',
                            type: 'radio', 
                            value: 'randomSeed',
                        },
                        {
                            label: 'Chosen Seeded Deal',
                            type: 'radio', 
                            value: 'seededDeal',
                        },
                    ]}
                    backdropDismiss={false}
                    buttons={[{
                        text: 'Confirm',
                        role: 'confirm',
                        handler: (data) => {
                            //console.log(data);
                            //debugging to make sure user selects something when pressing submit
                            if(data === undefined) return false;

                            setStartGameOpen(false);
                            if(data === "randomDeal") {
                                //setIsSeededDeal(false);
                                isSeededDeal.current = false;
                                newGame();
                            } else {
                                //setIsSeededDeal(true);
                                isSeededDeal.current = true;
                                if(data === "randomSeed") {
                                    var randomSeedNo = Math.floor(Math.random() * 32000) + 1;
                                    //setSeed(randomSeedNo);
                                    seed.current = randomSeedNo;
                                    newGame();
                                } else {
                                    setSelectSeedOpen(true);
                                }
                            }
                        }
                    }]}
                />
                {/* Ionic does not support text and radio inputs at the same time, unfortunately */}
                <IonAlert 
                    isOpen={selectSeedOpen}
                    header="Choose Seed Number (1-32000)"
                    inputs={[
                        {
                            name: 'seedNo',
                            type: 'number',
                            placeholder: 'Seed Number',
                            min: 1,
                            max: 32000
                        }
                    ]}
                    buttons={[{
                        text: 'Confirm',
                        role: 'confirm',
                        handler: (data) => {
                            setSelectSeedOpen(false);
                            console.log(data.seedNo);
                            //setSeed(data.seedNo);
                            seed.current = data.seedNo;
                            newGame();
                        }
                    }]}
                />
            </IonContent>
        </IonPage>
    );
}

export default FreeCell;