import { IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonItem, IonItemDivider, IonItemGroup, IonLabel, IonModal, IonSelect, IonSelectOption, IonTitle, IonToolbar } from "@ionic/react";
import { settings } from "ionicons/icons";
import React, { useContext, useState } from "react";
import { DeckContext } from "../Context/DeckContext";
import { useHistory } from "react-router";

const MenuNavbar = () => {
    const [modalOpen, setModalOpen] = useState(false);
    const deckCtx = useContext(DeckContext);
    const history = useHistory();

    const changeDeck = (type: string) => {
        deckCtx?.changeSet(type);
    }

    const goToRules = () => {
        history.push("/rules");
        setModalOpen(false);
    }
    return(
        <>
        <IonHeader>
            <IonToolbar>
                <IonTitle>Card Game Collection</IonTitle>
                <IonButtons slot="end">
                    <IonButton onClick={() => setModalOpen(true)}>
                        <IonIcon slot="icon-only" icon={settings} />
                    </IonButton>
                </IonButtons>
            </IonToolbar>
        </IonHeader>
        <IonModal isOpen={modalOpen}>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Settings</IonTitle>
                    <IonButtons slot="end">
                        <IonButton onClick={() => setModalOpen(false)}>
                            <IonLabel>Close</IonLabel>
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                <IonItemGroup>
                    <IonItemDivider>
                        <IonLabel>Card Settings</IonLabel>
                    </IonItemDivider>
                    <IonItem>
                        <IonSelect 
                            label="Card Face"
                            value={deckCtx?.chosenSet}
                            onIonChange={(e) => changeDeck(e.detail.value)}
                        >
                            <IonSelectOption value="fpk">Simple Card Set</IonSelectOption>
                            <IonSelectOption value="dsu">Dondorf - Swiss Costumes Card Set</IonSelectOption>
                            {/*<IonSelectOption>Paris Pattern Card Set</IonSelectOption>
                            <IonSelectOption>English Pattern Card Set</IonSelectOption>
                            <IonSelectOption>Atlasnye Pattern Card Set</IonSelectOption>
                            <IonSelectOption>Dondorf - Four Continents Card Set</IonSelectOption>
                            <IonSelectOption>Dondorf - Tarot Card Set</IonSelectOption>*/}
                            <IonSelectOption value="doa">Dead or Alive Card Set</IonSelectOption>
                            <IonSelectOption value="xvv">Venus Vacation Card Set</IonSelectOption>
                        </IonSelect>
                    </IonItem>
                    <IonItem>
                        <IonSelect 
                            label="Four-Color Mode"
                            value={deckCtx?.isFourCol}
                            onIonChange={(e) => deckCtx?.change4COps(e.detail.value)}
                        >
                            <IonSelectOption value={true}>On</IonSelectOption>
                            <IonSelectOption value={false}>Off</IonSelectOption>
                        </IonSelect>
                    </IonItem>
                </IonItemGroup>
                <IonItemGroup>
                    <IonItemDivider>
                        <IonLabel>Rules</IonLabel>
                    </IonItemDivider>
                    <IonItem button onClick={goToRules}>
                            <IonLabel>View Game Rules</IonLabel>
                    </IonItem>
                </IonItemGroup>
            </IonContent>
        </IonModal>
        </>
    );
}

export default MenuNavbar;