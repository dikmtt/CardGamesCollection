import { IonAlert, IonButton, IonCol, IonContent, IonGrid, IonLabel, IonPage, IonRow } from "@ionic/react";
import React, { useContext, useEffect, useState } from "react";
import { useHistory } from "react-router";
import { useUndo } from "../../../components/CardLogic/useUndo";
import { DeckContext } from "../../../components/Context/DeckContext";
import { shuffle } from "../../../components/CardLogic/deck";
import { checkForCompleteStackSpd, isValidBuildDownSpd, isValidRunToMoveSp } from "../../../components/Spider/spider";
import { Card, shuffleNew } from "../../../components/CardLogic/deckOOP";

type SimonState = {
    tableau: Card[][];
    completedStacks: number;
}

var initialSimonState: SimonState = {
    tableau: [[], [], [], [], [], [], [], [], [], []],
    completedStacks: 0,
}

const SimpleSimon: React.FC = () => {
    const deckCtx = useContext(DeckContext);
    deckCtx?.change4CSupportOps(true);
    const history = useHistory();
    const {currState, set, undo, canUndo} = useUndo<SimonState>(initialSimonState);

    const [isClear, setIsClear] = useState([0, 0, 0, 0]);

    const startGame = () => {
        var deck = shuffleNew();
        

        var startTableau = Array();
        for(var i = 0; i < 10; i++) {
            var col = Array();
            startTableau.push(col);
        }
        //the first row has 10 cards, 2nd 9, 3rd 8 and so on until 3 cards in the last row
        var rowID = 1;
        var colID = 0;
        var tabMod = 10;
        //console.log("start debugging initial tableau");
        for(var i = 0; i < 52; i++) {
            //console.log(deck.length);
            //var colIdx = i % tabMod;
            //console.log("colIdx: ", colID);
            //if the tableau column mod is the same as idx then start new row

            var card = deck.pop();
            startTableau[colID].push(card);
            
            if(colID === tabMod - 1) {
                //console.log("new row");
                tabMod -= 1;
                colID = 0;
            } else {
                colID += 1;
            }
        }
        //console.log(startTableau);

        const startGameState: SimonState = {
            tableau: startTableau,
            completedStacks: 0,
        };
        set(startGameState);
    }
    useEffect(() => {
        startGame();
    }, []);

    //Game Logic
    //Like Spider: selectedCardLoc is the col, row index of top card selected
    //selectedCardRun is all the cards selected as long as they are valid
    const [selectedCardLoc, setSelectedCardLoc] = useState<number[]>([]);
    const [selectedCardRun, setSelectedCardRun] = useState<Card[]>([]);

    //Actually a lot of this is directly from Spider
    //except that it is simpler because there are no face down cards
    const chooseCard = (col: number, row: number) => {
        //to choose a card, make sure that the column is not empty, there are no values in selectedCard variables,
        if(selectedCardLoc.length === 0 
            && selectedCardRun.length === 0 
            && currState.tableau[col].length === 0) {
                return;
            }
        //If the column is not empty, check for run for all cards beneath selected
        //if valid, store the index of top card and run
        if(selectedCardLoc.length === 0 
            && selectedCardRun.length === 0 
            && currState.tableau[col].length > 0) {
            const chosenCards = currState.tableau[col].slice(row);
                const isValidRun = isValidRunToMoveSp(chosenCards);
                if(isValidRun || chosenCards.length === 1) {
                    setSelectedCardLoc([col, row]);
                    setSelectedCardRun(chosenCards);
                }
        //if there are any cards selected
        } else {
            //if the card clicked is the same as selected card then reset
            if(selectedCardLoc[0] === col && selectedCardLoc[1] === row) {
                setSelectedCardLoc([]);
                setSelectedCardRun([]);
            } else {
                //check if building down is valid (rank is one lower)
                //console.log("isFaceUp of this: ", currState.isFaceUp[col]);
                var isValidBuild;
                if(currState.tableau[col].length > 0) {
                    //check if the targetCard and the selected run's top card make valid build
                    const targetCard = currState.tableau[col][row];
                    isValidBuild = isValidBuildDownSpd(targetCard, selectedCardRun[0]);
                    //console.log(isValidBuild);
                } else {
                    //if this column is empty
                    isValidBuild = true;
                }

                if(isValidBuild) {
                    moveCard(col);
                }
                setSelectedCardLoc([]);
                setSelectedCardRun([]);
            }
        }
    }

    const moveCard = (targetCol: number) => {
        var finalTableau;
        //update tableau
        const newTableau = currState.tableau.map((tb, tbi) => {
            if(tbi === targetCol) return [...tb, ...selectedCardRun];
            if(tbi === selectedCardLoc[0]) return tb.slice(0, selectedCardLoc[1]);
            return tb;
        });
        
        //check complete run
        const hasComplete = checkForCompleteStackSpd(newTableau[targetCol]);
        if(hasComplete) {
            //find the index of the completed run's king
            //why this way, because complete runs always have no cards after the ace
            const kingIdx = newTableau[targetCol].length - 14;
            //slice to get all cards from tableau start to the card before the king
            const newRun = newTableau[targetCol].slice(0, kingIdx + 1);

            const newerTableau = newTableau.map((tb, tbi) => {
                if(tbi === targetCol) return newRun;
                if(tbi === selectedCardLoc[0]) return newTableau[selectedCardLoc[0]];
                return tb;
            });

            finalTableau = newerTableau;
        } else {
            //if no complete runs, then keep the new tableau as it is

            finalTableau = newTableau;
        }

        set({
            ...currState,
            tableau: finalTableau,
            completedStacks: hasComplete ? currState.completedStacks + 1 : currState.completedStacks,
        });
    }
    
    const [showEndGame, setShowEndGame] = useState(false);
    useEffect(() => {
        if(currState.completedStacks >= 4) {
            setShowEndGame(true);
        }
    }, [currState.completedStacks]);

    return(
        <IonPage>
            <IonContent>
                <IonGrid>
                    <IonRow>
                        {/* header */}
                        <IonCol>
                        <IonButton
                            onClick={() => canUndo ? undo() : undefined}
                            disabled={!canUndo ? true : false}
                        >
                            <IonLabel>Undo</IonLabel>
                        </IonButton>
                        </IonCol>
                        <IonCol>
                            <IonLabel>Complete sets: {currState.completedStacks}</IonLabel>
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
                                                        deckCtx?.declareFace(tbc.getName())
                                                    }
                                                    style={{
                                                        width:"100px",
                                                        position: "absolute",
                                                        filter: tbi === selectedCardLoc[0] && tbci >= selectedCardLoc[1] ? 
                                                            "brightness(50%)" : 
                                                            "brightness(100%)"
                                                    }}
                                                    onClick={() => chooseCard(tbi, tbci)}
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

export default SimpleSimon;