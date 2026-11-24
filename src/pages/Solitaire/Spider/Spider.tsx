import { IonAlert, IonButton, IonCol, IonContent, IonGrid, IonLabel, IonPage, IonRow, IonText } from "@ionic/react";
import React, { useContext, useEffect, useState } from "react";
import { DeckContext } from "../../../components/Context/DeckContext";
import { useHistory } from "react-router";
import { buildSpiderDeck, checkForCompleteStackSpd, getSpiderCardValue, isValidBuildDownSpd, isValidRunToMoveSp } from "../../../components/Spider/spider";
import { getRank, getStraightVal, getSuit } from "../../../components/SpeedPoker/hands";
import { useUndo } from "../../../components/CardLogic/useUndo";
import { Card } from "../../../components/CardLogic/deckOOP";

type SpiderState = {
    deck: Card[];
    tableau: Card[][];
    isFaceUp: number[][];
    completedStacks: number;
}

var initialSpiderState: SpiderState = {
    deck: [],
    tableau: [[], [], [], [], [], [], [], [], [], []],
    isFaceUp: [[], [], [], [], [], [], [], [], [], []],
    completedStacks: 0,
}

const Spider: React.FC = () => {
    const deckCtx = useContext(DeckContext);
    deckCtx?.change4CSupportOps(true);
    const history = useHistory();
    const {currState, set, undo, canUndo} = useUndo<SpiderState>(initialSpiderState);

    //the deck, tableau, isFaceUp and number of completed runs are now saved in a spider state
    //this is for easing of undos (max. 25)
    const [selectedCardLoc, setSelectedCardLoc] = useState<number[]>([]);
    const [selectedCardRun, setSelectedCardRun] = useState<Card[]>([]);
    const [difficulty, setDifficulty] = useState("");

    const [showEndGame, setShowEndGame] = useState(false);
    const [showDifficulty, setShowDifficulty] = useState(true);
    
    const startGame = () => {
        var startDeck = buildSpiderDeck(difficulty);

        //build the tableau columns (54 cards)
        var startTableau = Array();
        for(var i = 0; i < 10; i++) {
            var col = Array();
            startTableau.push(col);
        }
        for(var i = 0; i < 54; i++) {
            var colIdx = i % 10;
            var card = startDeck.pop();
            startTableau[colIdx].push(card);
        }

        //build the method for checking for face down cards
        var faceDown = Array();
        for(var i = 0; i < 10; i++) {
            if(i <= 3) {
                var col = Array(5).fill(0);
            } else {
                var col = Array(4).fill(0);
            }
            col.push(1);
            faceDown.push(col);
        }

        const startGameState: SpiderState = {
            deck: startDeck,
            tableau: startTableau,
            isFaceUp: faceDown,
            completedStacks: 0,
        };
        set(startGameState);
    }

    useEffect(() => {
        if(difficulty !== "") {
            startGame();
        }
    }, [difficulty]);

    const chooseCard = (col: number, row: number) => {
        //console.log(tableau[col].length);
        //to choose a card, make sure that the column is not empty, there are no values in selectedCard variables,
        //and the card is face up
        if(selectedCardLoc.length === 0 
            && selectedCardRun.length === 0 
            && currState.tableau[col].length === 0) {
                return;
            }
        if(selectedCardLoc.length === 0 
            && selectedCardRun.length === 0 
            && currState.tableau[col].length > 0
            && currState.isFaceUp[col][row] !== 0) {
            const chosenCards = currState.tableau[col].slice(row);
                const isValidRun = isValidRunToMoveSp(chosenCards);
                if(isValidRun || chosenCards.length === 1) {
                    setSelectedCardLoc([col, row]);
                    setSelectedCardRun(chosenCards);
                }
        } else {
            if(selectedCardLoc[0] === col && selectedCardLoc[1] === row) {
                setSelectedCardLoc([]);
                setSelectedCardRun([]);
            } else {
                //check if building down is valid (rank is one lower)
                //console.log("isFaceUp of this: ", currState.isFaceUp[col]);
                var isValidBuild;
                if(currState.tableau[col].length > 0) {
                    const targetCard = currState.tableau[col][row];
                    isValidBuild = isValidBuildDownSpd(targetCard, selectedCardRun[0]);
                    //console.log(isValidBuild);
                } else {
                    isValidBuild = true;
                }

                if(isValidBuild) {
                    moveCard(col);
                    //then update for any face down cards (turn it face up)
                    //hint: check the source column
                    //updateFaceUpValue(col, row, 1);
                }
                setSelectedCardLoc([]);
                setSelectedCardRun([]);
            }
        }
    }

    const moveCard = (targetCol: number) => {
        var finalTableau, finalIfu;
        const newTableau = currState.tableau.map((tb, tbi) => {
                if(tbi === targetCol) return [...tb, ...selectedCardRun];
                if(tbi === selectedCardLoc[0]) return tb.slice(0, selectedCardLoc[1]);
                return tb;
            });
        const newIfu = updateFaceUpValue(selectedCardLoc[0], selectedCardLoc[1], 1);
        //console.log("newTableau: ", newTableau);

        //console.log(isFaceUp[targetCol]);
        /*const firstUpPos = currState.isFaceUp[targetCol].findIndex((e) => e === 1);
        //console.log(firstUpPos);
        const faceUpRun = newTableau[targetCol].slice(firstUpPos);

        const hasComplete = checkForCompleteStack2(faceUpRun);*/
        const hasComplete = completeCheckWrapper(newTableau[targetCol], targetCol);
        if(hasComplete) {
            const kingIdx = newTableau[targetCol].length - 14;
            const newRun = newTableau[targetCol].slice(0, kingIdx + 1);
            //console.log(kingIdx, newRun);

            const newerTableau = newTableau.map((tb, tbi) => {
                if(tbi === targetCol) return newRun;
                if(tbi === selectedCardLoc[0]) return newTableau[selectedCardLoc[0]];
                return tb;
            });

            //soon to be updated (currently the update faceup value still reads curr state)
            //and this needs to read the newIfu variable instead
            const newerIfu = updateFaceUpValue(targetCol, kingIdx + 1, 2, newIfu);
            //setCompletedStacks(prev => prev + 1);

            finalTableau = newerTableau;
            finalIfu = newerIfu;
        } else {
            //console.log("newTableau again!!!:", newTableau);
            //setTableau(newTableau);

            finalTableau = newTableau;
            finalIfu = newIfu;
        }
        //console.log("newstacks: ", newstacks);

        if(finalIfu.length > 0) {
            set({
                ...currState,
                tableau: finalTableau,
                isFaceUp: finalIfu,
                completedStacks: hasComplete ? currState.completedStacks + 1 : currState.completedStacks,
            });
        } else {
            set({
                ...currState,
                tableau: finalTableau,
                completedStacks: hasComplete ? currState.completedStacks + 1 : currState.completedStacks,
            });
        }
    }

    //0 (i0)
    //0 (i1)
    //0 (i2)
    //0 (i3)
    //1 (i4)
    //if the bottom card is moved, the length goes from 5 to 4
    //there are 4 face down cards so update the last index

    const updateFaceUpValue = (col: number, row: number, mode: number, prevIfu?: number[][]) => {
        var col2: number, row2: number, oldIfu;
        if(mode === 1) {
            //mode 1: after cards have been moved
            //console.log("mode 1: ", selectedCardLoc);
            col2 = selectedCardLoc[0];
            row2 = selectedCardLoc[1];
            oldIfu = currState.isFaceUp;
        } else {
            //mode 2: after a stack has been cleared
            //console.log("mode 2: ", col, row);
            col2 = col;
            row2 = row;
            oldIfu = prevIfu;
            //console.log("oldIfu: ", oldIfu);
        }
        //all cards in the target tableau's column
        const cardsInCol = currState.tableau[col2];
        //because of react's asynchronous state the last element of the column is removed manually here
        const cardsInCol2 = cardsInCol.filter((c, i) => i < row2);
        const startingColFDCards = col2 <= 3 ? 5 : 4;
        //console.log(cardsInCol2);
        //console.log(cardsInCol2.length, startingColFDCards);

        //if(cardsInCol2.length <= startingColFDCards) {
            const newIfu = oldIfu!.map((ifu, ifui) => {
                    if(ifui === col2) {
                        const yee = ifu.map((c, ci) => ci === cardsInCol2.length - 1 ? 1 : c);
                        //console.log(yee);
                        return yee;
                    }
                    return ifu
                });
            //console.log("newIfu: ", newIfu);

            return newIfu;
        //}
        //return [];
    }

    const dealNewCards = () => {
        //first, check if there is an empty column
        if(currState.tableau.some(tb => tb.length === 0)) {
            console.log("please, fill all empty columns");
            return;
        }
        var tableauCopy = [...currState.tableau];
        var deckCopy = [...currState.deck];
        for(let i = 0; i < 10; i++) {
            var card = deckCopy.pop()!;
            tableauCopy[i] = [...tableauCopy[i], card];
        }

        //check for complete stacks after dealing (when a K-2 run gets dealt an ace in its row)
        var foundComplete = false;
        tableauCopy.forEach((col, i) => {
            var thisRunComp = completeCheckWrapper(col, i);
            if(thisRunComp) {
                foundComplete = true;
            }
        });
        //if(foundComplete) {}
        
        const newState = {
            ...currState,
            tableau: tableauCopy,
            deck: deckCopy,
        };
        //console.log(newState);
        set(newState);
    }

    //
    const completeCheckWrapper = (tabCol: Card[], tcIdx: number) => {
        //extract the first position of 1 in isFaceUp, then slice
        const firstUpPos = currState.isFaceUp[tcIdx].findIndex((e) => e === 1);
        //console.log(firstUpPos);
        const faceUpRun = tabCol.slice(firstUpPos);

        const hasComplete = checkForCompleteStackSpd(faceUpRun);
        return hasComplete;
    }

    useEffect(() => {
        if(currState.completedStacks >= 8) {
            setShowEndGame(true);
        }
    }, [currState.completedStacks]);
    return(
        <IonPage>
            <IonContent>
                <IonGrid>
                    <IonRow>
                        {/*header*/}
                        <IonCol className="freecell-center">
                            <IonText>
                                {`You have 
                                    ${difficulty === "hard" ? "retired" : "completed"} 
                                    ${currState.completedStacks} out of 8 
                                    ${difficulty === "hard" ? "\"legs\"" : "stacks"}`}
                            </IonText>
                        </IonCol>
                        <IonCol className="freecell-center">
                            <IonButton
                                onClick={() => currState.deck.length > 0 ? dealNewCards() : undefined}
                                disabled={currState.deck.length === 0 ? true : false}
                            >
                                <IonLabel>Deal</IonLabel>
                            </IonButton>
                            <IonButton
                                onClick={() => canUndo ? undo() : undefined}
                                disabled={!canUndo ? true : false}
                            >
                                <IonLabel>Undo</IonLabel>
                            </IonButton>
                        </IonCol>
                        <IonCol>
                            <IonRow>
                                <IonText>
                                    You have {currState.deck.length / 10} deals left
                                </IonText>
                            </IonRow>
                            <IonRow>
                                <IonText>
                                    ({currState.deck.length} cards remaining in deck)
                                </IonText>
                            </IonRow>
                        </IonCol>
                    </IonRow>
                    <IonRow>
                        {currState.tableau.map((tb, tbi) => {
                            if(tb.length > 0) {
                                return(
                                    <IonCol key={tbi}>
                                        {tb.map((tbc, tbci) => (
                                            <IonRow 
                                                className="freecell-tableau-center"
                                                style={{
                                                    position: "relative",
                                                    height: `${deckCtx?.screenWidth === "large" ? 30 : 20}px`
                                                }}
                                                key={`${tbi}-${tbci}`}
                                            >
                                                <img 
                                                    src={
                                                        currState.isFaceUp[tbi][tbci] === 0 ?
                                                        deckCtx?.declareBack() :
                                                        deckCtx?.declareFace(tbc.getName())
                                                    }
                                                    style={{
                                                        width:"100px",
                                                        position: "absolute",
                                                        filter: tbi === selectedCardLoc[0] && tbci >= selectedCardLoc[1] ? 
                                                            "brightness(50%)" : 
                                                            "brightness(100%)"
                                                    }}
                                                    onClick={() => currState.isFaceUp[tbi][tbci] === 0 ?
                                                        undefined : chooseCard(tbi, tbci)}
                                                />
                                            </IonRow>
                                        ))}
                                    </IonCol>
                                )
                            } else {
                                return(
                                    <IonCol key={tbi}>
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
                                                    onClick={() => chooseCard(tbi, 0)}
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
                    isOpen={showDifficulty}
                    header="Choose Difficulty"
                    buttons={[
                        {
                            text: 'Easy (1 suit)',
                            role: 'easy',
                            handler: () => {
                                setShowDifficulty(false);
                                setDifficulty("easy");
                            }
                        },
                        {
                            text: 'Medium (2 suits)',
                            role: 'medium',
                            handler: () => {
                                setShowDifficulty(false);
                                setDifficulty("medium");
                            }
                        },
                        {
                            text: 'Hard (4 suits)',
                            role: 'hard',
                            handler: () => {
                                setShowDifficulty(false);
                                setDifficulty("hard");
                            }
                        }
                    ]}
                    backdropDismiss={false}
                    onDidDismiss={() => {
                        //console.log(detail.role);
                        setShowDifficulty(false);
                    }}
                />
                <IonAlert
                    isOpen={showEndGame}
                    header="Game Over"
                    message="You Win!"
                    buttons={['Finish']}
                    onDidDismiss={() => {
                        setShowEndGame(false);
                        history.goBack();
                    }}
                />
            </IonContent>
        </IonPage>
    );
}

export default Spider;