import { IonButton, IonCol, IonContent, IonGrid, IonHeader, IonLabel, IonPage, IonRadio, IonRadioGroup, IonRow, IonText, IonTitle, IonToolbar } from '@ionic/react';
import ExploreContainer from '../../components/ExploreContainer';
import './Home.css';
import { useContext, useEffect, useState } from 'react';
import { shuffle, isNumber } from '../../components/CardLogic/deck';
import { useHistory } from 'react-router';
import { DeckContext } from '../../components/Context/DeckContext';
import MenuNavbar from '../../components/General/MenuNavbar';
import MenuButton from '../../components/General/MenuButton';
import { multiplayerGameList, solitaireGameList } from './gameList';

const Home: React.FC = () => {
  const history = useHistory();
  const deckCtx = useContext(DeckContext);
  const playGame = (gameLink: string) => {
    history.push(gameLink);
  }
  const changeDeck = (type: string) => {
    deckCtx?.changeSet(type);
  }
  return (
    <IonPage>
      <MenuNavbar />
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Card Game Collection</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonGrid>
          <IonRow>
            <IonText className='menu-sectiontitle'>Multiplayer</IonText>
          </IonRow>
          <IonRow>
            {multiplayerGameList.map((it, id) => (
              <IonCol key={id} size="6" sizeSm='4' sizeLg='2' className='menu-gamelist'>
                <MenuButton gameName={it.gameName} link={it.link} colorCode={it.colorCode} />
              </IonCol>
            ))}
          </IonRow>
          <IonRow>
            <IonText className='menu-sectiontitle'>Solitaire</IonText>
          </IonRow>
          <IonRow>
            {solitaireGameList.map((it, id) => (
              <IonCol key={id} size="6" sizeSm='4' sizeLg='2' className='menu-gamelist'>
                <MenuButton gameName={it.gameName} link={it.link} colorCode={it.colorCode} />
              </IonCol>
            ))}
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default Home;
