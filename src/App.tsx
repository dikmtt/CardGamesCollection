import { Redirect, Route } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import Home from './pages/Home/Home';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/**
 * Ionic Dark Mode
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */

/* import '@ionic/react/css/palettes/dark.always.css'; */
/* import '@ionic/react/css/palettes/dark.class.css'; */
import '@ionic/react/css/palettes/dark.system.css';

/* Theme variables */
import './theme/variables.css';
import SpeedPoker from './pages/Banking/SpeedPoker';
import VideoPoker from './pages/Banking/VideoPoker';
import { DeckProvider } from './components/Context/DeckContext';
import Hearts from './pages/TrickTaking/Hearts/Hearts';
import Pyramid from './pages/Solitaire/Pyramid/Pyramid';
import Gimlet from './pages/Solitaire/Gimlet/Gimlet';
import OldMaid from './pages/Others/OldMaid/OldMaid';
import EuchreSol from './pages/Solitaire/EuchreSol/EuchreSol';
import Eights from './pages/Others/Eights/Eights';
import Beehive from './pages/Solitaire/Beehive/Beehive';
import Sultan from './pages/Solitaire/Sultan/Sultan';
import FreeCell from './pages/Solitaire/FreeCell/FreeCell';
import Spider from './pages/Solitaire/Spider/Spider';
import CanadianSalad from './pages/TrickTaking/CanadianSalad/CanadianSalad';
import SimpleSimon from './pages/Solitaire/Spider/SimpleSimon';
import Blitz from './pages/Others/Blitz/Blitz';
import GameRules from './pages/Home/GameRules';

setupIonicReact();

{/*
    Games List (to be implemented)

    Trick-taking: Canadian Salad, Euchre, Hearts
    Draw and Discard: Gin Rummy, Golf
    Solitaire: Euchre, Gimlet, Pyramid
    Banking: Ride the Tide, Video Poker
  */}

  //export const 

const App: React.FC = () => {
  
  return(
  <IonApp>
    <IonReactRouter>
      <DeckProvider>
        <IonRouterOutlet>
          <Route exact path="/home" component={Home} />
          <Route exact path="/rules" component={GameRules} />
          <Route exact path="/speedpoker" component={SpeedPoker} />
          <Route exact path="/videopoker" component={VideoPoker} />
          <Route exact path="/hearts" component={Hearts} />
          <Route exact path="/pyramid" component={Pyramid} />
          <Route exact path="/gimlet" component={Gimlet} />
          <Route exact path="/oldmaid" component={OldMaid} />
          <Route exact path="/euchresol" component={EuchreSol} />
          <Route exact path="/crazyeights" component={Eights} />
          <Route exact path="/beehive" component={Beehive} />
          <Route exact path="/sultan" component={Sultan} />
          <Route exact path="/freecell" component={FreeCell} />
          <Route exact path="/spider" component={Spider} />
          <Route exact path="/salad" component={CanadianSalad} />
          <Route exact path="/simon" component={SimpleSimon} />
          <Route exact path="/blitz" component={Blitz} />
          <Route exact path="/">
            <Redirect to="/home" />
          </Route>
        </IonRouterOutlet>
      </DeckProvider>
    </IonReactRouter>
  </IonApp>
  );
};

export default App;
