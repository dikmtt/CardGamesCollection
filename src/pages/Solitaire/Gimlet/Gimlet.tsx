import { IonAlert, IonCol, IonContent, IonGrid, IonPage, IonRow, IonText } from "@ionic/react";
import React, { useContext, useEffect, useState } from "react";
import { shuffle } from "../../../components/CardLogic/deck";
import { DeckContext } from "../../../components/Context/DeckContext";
import "./Gimlet.css";
import { sortHand } from "../../../components/CardLogic/4-player-setup";
import { calculateDeadwood, findMelds, getFinalSetsAndRuns } from "../../../components/Rummy/rummy";
import { getSuit } from "../../../components/SpeedPoker/hands";
import { useHistory } from "react-router";
import { Card, defaultCard, shuffleNew } from "../../../components/CardLogic/deckOOP";

const Gimlet: React.FC = () => {
    const deckCtx = useContext(DeckContext);
    deckCtx?.change4CSupportOps(true);
    const history = useHistory();

    const [deck, setDeck] = useState<Card[]>([]);
    const [hand, setHand] = useState<Card[]>([]);
    const [handSets, sethandSets] = useState<Card[][]>([]);
    const [handRuns, sethandRuns] = useState<Card[][]>([]);

    const [currWaste, setCurrWaste] = useState<Card>(defaultCard());
    const [discards, setDiscards] = useState<Card[][]>();
    const suits = ["S", "H", "C", "D"];
    const [canDiscardHand, setCanDiscardHand] = useState(false);

    const [showGameOver, setShowGameOver] = useState(false);
    const [canSplitMelds, setCanSplitMelds] = useState(false);
    const [deadwoodCards, setDeadwoodCards] = useState<Card[]>([]);
    const [deadwoodScore, setDeadwoodScore] = useState<number>(-1);
    
    const newHand = () => {
        var deck = shuffleNew();
        var startingHand = Array();
        for(var i = 0; i < 10; i++) {
            var card = deck.pop();
            startingHand.push(card);
        }
        const sorted = sortHand(startingHand, "normal");
        //console.log(deck);
        //console.log(sorted);
        setDeck(deck);
        setHand(sorted);
        const [sets, runs] = findMelds(sorted);
        sethandSets(sets);
        sethandRuns(runs);
        const discards2 = Array();
        for(var i = 0; i < 4; i++) {
            const miniDiscard = Array();
            discards2.push(miniDiscard);
        }
        setDiscards(discards2);
        const [deadwoodC, deadwood] = calculateDeadwood(sorted, sets, runs);
        setDeadwoodCards(deadwoodC);
        setDeadwoodScore(deadwood);
        //console.log(discards2);
    }

    useEffect(() => {
        newHand();
    }, []);

    const deal = () => {
        var newCard = deck.pop();
        if(!currWaste.isEmpty()) {
            discard(currWaste);
        }
        setCurrWaste(newCard);
    }
    const discard = (card: Card) => {
        const discardedCardSuit = card.suit;
        const discardedSuitIdx = suits.indexOf(discardedCardSuit);

        setDiscards((prev) => {
            return prev.map((dsc, dscI) => {
                if(dscI === discardedSuitIdx) {
                    return [...dsc, card];
                } else {
                    return dsc;
                }
            });
        });
        setCurrWaste(defaultCard());
        //console.log(discards);
    }

    const addToHand = (card: Card) => {
        const handCopy = [...hand];
        handCopy.push(currWaste);
        const sortedHandCopy = sortHand(handCopy, "normal");
        setHand(sortedHandCopy);
        setCurrWaste(defaultCard());
        setCanDiscardHand(true);
        const [sets, runs] = findMelds(handCopy);
        sethandSets(sets);
        sethandRuns(runs);
        const [deadwoodC, deadwood] = calculateDeadwood(handCopy, sets, runs);
        setDeadwoodCards(deadwoodC);
        setDeadwoodScore(deadwood);
    }

    const discardFromHand = (card: Card) => {
        const handNew = hand.filter(c => c.getName() !== card.getName())
        setHand(handNew);
        setCanDiscardHand(false);
        discard(card);
        const [sets, runs] = findMelds(handNew);
        sethandSets(sets);
        sethandRuns(runs);
        const [deadwoodC, deadwood] = calculateDeadwood(handNew, sets, runs);
        setDeadwoodCards(deadwoodC);
        setDeadwoodScore(deadwood);
        //console.log(sets);
    }

    const endGame = () => {
        setShowGameOver(true);
        const [dwc, deadwood] = calculateDeadwood(hand, handSets, handRuns);
        setDeadwoodScore(deadwood);
        var [finSets, finRuns] = getFinalSetsAndRuns(hand, dwc);
        sethandSets(finSets);
        sethandRuns(finRuns);
        setCanSplitMelds(true);
    }

    useEffect(() => {
        discards?.map((dsc, idx) => {
            if(dsc.length >= 6) {
                endGame();
            }
        })
    }, [discards]);

    useEffect(() => {
        if(deadwoodScore === 0) {
            endGame();
        }
    }, [deadwoodScore]);
    return(
        <IonPage>
            <IonContent>
            <IonGrid>
                <IonCol>
                    <IonRow className="gimlet-nothand">
                        <IonCol size="2" className="notagimlethand">
                            <IonRow>
                                <img
                                    src={deckCtx?.declareBack()}
                                    style={{width: "150px"}}
                                    onClick={() => canSplitMelds || canDiscardHand ? undefined : deal()}
                                />
                            </IonRow>
                            <IonRow className="gimlet-decklabels">
                                <IonText>Deck</IonText>
                            </IonRow>
                        </IonCol>
                        <IonCol size="2" className="notagimlethand">
                            <IonRow>
                                <div 
                                    style={{
                                        padding: 0,
                                        border: currWaste.isEmpty() ? "1px solid white" : "none",
                                    }}
                                >
                                    <img
                                        src={
                                            currWaste.isEmpty() ?
                                            deckCtx?.declareBack() :
                                            deckCtx?.declareFace(currWaste.getName())
                                        }
                                        style={{
                                            maxWidth: "150px",
                                            opacity: currWaste.isEmpty() ? "0%" : "100%"
                                        }}
                                        onClick={() =>
                                            (!canSplitMelds && !currWaste.isEmpty()) ? 
                                            addToHand(currWaste) : undefined
                                        }
                                    />
                                </div>
                            </IonRow>
                            <IonRow className="gimlet-decklabels">
                                <IonText>Discard</IonText>
                            </IonRow>
                        </IonCol>
                        {discards?.map((dsc, dscI) => (
                            <IonCol size="2" className="notagimlethand" key={dscI}>
                                <IonRow>
                                <div 
                                    style={{
                                        padding: 0,
                                        border: dsc.length > 0 ? "none" : "1px solid white",
                                    }}
                                >
                                    <img 
                                        src={
                                            dsc.length > 0 ?
                                            deckCtx?.declareFace(dsc[dsc.length - 1].getName()) :
                                            deckCtx?.declareBack()
                                        }
                                        style={{
                                            width: "150px",
                                            opacity: dsc.length > 0 ? "100%" : "0%"
                                        }}
                                    />
                                </div>
                                </IonRow>
                                <IonRow className="gimlet-decklabels">
                                    <IonText>{dsc.length}</IonText>
                                </IonRow>
                            </IonCol>
                        ))}
                    </IonRow>
                    {!canSplitMelds && 
                    <IonRow className="gimlet-hand">
                        {hand.map((card, idx) => (
                            <IonCol className="gimlet-handcards" style={{left: `${idx * 92}px`}} key={idx}>
                                <img
                                    src={deckCtx?.declareFace(card.getName())}
                                    className="gimlet-card"
                                    style={{width: "150%"}}
                                    onClick={() =>
                                        canDiscardHand ? discardFromHand(card) : undefined
                                    }
                                />
                            </IonCol>
                        ))}
                    </IonRow>}
                    {canSplitMelds &&
                    <IonRow className="gimlet-hand" style={{alignItems: "flex-start"}}>
                        {handSets.map((set, idx) => (
                            <div 
                                key={idx} 
                                style={{
                                    position: "relative", width: `${set.length * 70 + 50}px`
                                }}
                            >
                                {set.map((sc, scI) => (
                                    <div 
                                        className="gimlet-handcards" 
                                        style={{
                                            position: "absolute", left: `${scI * 40}px`}} 
                                        key={scI}
                                    >
                                        <img
                                            src={deckCtx?.declareFace(sc.getName())}
                                            className="gimlet-card"
                                            style={{width: "150%"}}
                                        />
                                    </div>
                                ))}
                            </div>
                        ))}
                        {handRuns.map((run, idx) => (
                            <div 
                                key={idx} 
                                    style={{
                                    position: "relative", width: `${run.length * 70 + 50}px`
                                }}
                            >
                            {run.map((rc, rcI) => (
                                <div 
                                    className="gimlet-handcards" 
                                    style={{
                                        left: `${handSets.flatMap.length + rcI * 40}px`
                                    }} key={rcI}
                                >
                                    <img
                                        src={deckCtx?.declareFace(rc.getName())}
                                        className="gimlet-card"
                                        style={{width: "150%"}}
                                    />
                                </div>
                            ))}
                            </div>
                        ))}
                        <div style={{
                            position: "relative",
                            width: `${(deadwoodCards.length + 1) * 70 + 50}px`
                        }}>
                        {deadwoodCards.map((dwc, idx) => (
                            <div 
                                className="gimlet-handcards" 
                                    style={{
                                    left: `${idx * 40}px`}} 
                                key={idx}
                            >
                                <img
                                    src={deckCtx?.declareFace(dwc.getName())}
                                    className="gimlet-card"
                                    style={{width: "150%", position: "absolute"}}
                                />
                            </div>
                        ))}
                        </div>
                    </IonRow>}
                    <IonRow>
                        <IonText style={{marginTop: "10px"}}>
                            The Sets: {handSets.map((c, i) => `${c.map((cd, id) => `${cd.getName()}`)}. `)}
                        </IonText>
                    </IonRow>
                    <IonRow>
                        <IonText>
                            The Runs: {handRuns.map((c, i) => `${c.map((cd, id) => `${cd.getName()}`)}. `)}
                        </IonText>
                    </IonRow>
                    <IonRow>
                        <IonText>
                            Deadwood Cards: {deadwoodCards.map((c, i) => `${c.getName()}, `)}
                        </IonText>
                        <IonText>
                             | Deadwood Score: {deadwoodScore}
                        </IonText>
                    </IonRow>
                </IonCol>
            </IonGrid>
            <IonAlert
                isOpen={showGameOver}
                header="Game Over"
                subHeader={
                    deadwoodScore === 0 ? "You have gone Gimlet!" :
                    deadwoodScore <= 10 ? "It is satisfactory, though not perfect" :
                    "Your hand has gone sour!"
                }
                message={`Deadwood: ${deadwoodScore}`}
                buttons={[
                    {
                        text: 'View Melds',
                        role: 'viewmelds',
                        handler: () => {
                            setShowGameOver(false);
                            setTimeout(() => {
                                setShowGameOver(true);
                            }, 4000);
                        },
                    },
                    {
                        text: 'End Game',
                        role: 'endgame',
                        handler: () => {
                            //setShowGameOver(false);
                            history.goBack();
                        },
                    }
                ]}
                onDidDismiss={({detail}) => {
                    //console.log(detail.role);
                    setShowGameOver(false);
                    if(detail.role === "backdrop") {
                        history.goBack();
                    }
                }}
            ></IonAlert>
            </IonContent>
        </IonPage>
    );
}

export default Gimlet;