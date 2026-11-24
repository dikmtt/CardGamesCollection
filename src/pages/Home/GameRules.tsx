import { IonBackButton, IonButtons, IonContent, IonHeader, IonItem, IonItemDivider, IonItemGroup, IonLabel, IonList, IonListHeader, IonMenu, IonMenuButton, IonPage, IonSplitPane, IonTitle, IonToolbar } from "@ionic/react";
import { useState } from "react";
import { useHistory } from "react-router";

const GameRules: React.FC = () => {
    const history = useHistory();
    const [chosen, setChosen] = useState("");

    const changeFormat = (word: string) => {
        var wordNoSpace = word.replace(/\s+/g, '');
        const resTitle = wordNoSpace.toLocaleLowerCase();
        return resTitle + "rules";
    }

    const getUrlName = (word: string) => {
        if(word === "Credits" || word === "Changelog") {
            return word.toLocaleLowerCase();
        } else {
            return changeFormat(word);
        }
    }
    return(
        <IonPage>
            <IonSplitPane when="xs">
                <IonMenu>
                    <IonHeader>
                        <IonToolbar color="tertiary">
                            <IonButtons slot="start">
                                <IonBackButton defaultHref="/home"></IonBackButton>
                            </IonButtons>
                            
                            <IonTitle>Game Rules</IonTitle>
                        </IonToolbar>
                    </IonHeader>
                    <IonContent>
                        <IonItemGroup>
                            <IonItemDivider>
                                <IonLabel>Multiplayer Games</IonLabel>
                            </IonItemDivider>
                        </IonItemGroup>
                            <IonItem button onClick={() => setChosen("Blitz")}>Blitz (31/41)</IonItem>
                            <IonItem button onClick={() => setChosen("Canadian Salad")}>Canadian Salad</IonItem>
                            <IonItem button onClick={() => setChosen("Hearts")}>Hearts</IonItem>

                        <IonItemGroup>
                            <IonItemDivider>
                                <IonLabel>Solitaire Games</IonLabel>
                            </IonItemDivider>
                        </IonItemGroup>
                            <IonItem button onClick={() => setChosen("Beehive")}>Beehive</IonItem>
                            <IonItem button onClick={() => setChosen("FreeCell")}>FreeCell</IonItem>
                            <IonItem button onClick={() => setChosen("Gimlet Rummy")}>Gimlet Rummy</IonItem>
                            <IonItem button onClick={() => setChosen("Simple Simon")}>Simple Simon</IonItem>
                            <IonItem button onClick={() => setChosen("Spider")}>Spider</IonItem>
                            <IonItem button onClick={() => setChosen("Sultan")}>Sultan</IonItem>

                        <IonItemGroup>
                            <IonItemDivider>
                                <IonLabel>Miscellaneous</IonLabel>
                            </IonItemDivider>
                        </IonItemGroup>
                        <IonItem button onClick={() => setChosen("Credits")}>Credits</IonItem>
                        <IonItem button onClick={() => setChosen("Changelog")}>Changelog</IonItem>
                    </IonContent>
                </IonMenu>
                <IonContent>
                    <IonHeader>
                        <IonToolbar color="tertiary">
                            <IonTitle>{chosen != "" ? chosen : "Choose a game"}</IonTitle>
                        </IonToolbar>
                    </IonHeader>
                    <IonContent>
                        {chosen != "" && 
                        <iframe 
                            src={`src/components/Rules/${getUrlName(chosen)}.html`}
                            width={"100%"}
                            height={"100%"}
                            
                        ></iframe>
                        }
                    </IonContent>
                </IonContent>
            </IonSplitPane>
        </IonPage>
    );
}

export default GameRules;