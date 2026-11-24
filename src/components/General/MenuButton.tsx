import { IonButton } from "@ionic/react";
import React from "react";
import "./MenuButton.css";
import { useHistory } from "react-router";

interface MenuButtonProps {
    gameName: string;
    link: string;
    colorCode: string;
}

const MenuButton: React.FC<MenuButtonProps> = (props) => {
    const history = useHistory();
    const playGame = () => {
        history.push(props.link);
    }
    return(
        <IonButton 
            className="menu-button"
            style={{'--background': `#${props.colorCode}`}}
            onClick={() => playGame()}
        >
                {props.gameName}
        </IonButton>
    );
}

export default MenuButton;