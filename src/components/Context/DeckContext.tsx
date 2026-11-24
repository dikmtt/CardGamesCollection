import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { isNumber } from "../CardLogic/deck";

interface DeckContextType {
    chosenSet: string;
    //chosenHandNames: string;
    changeSet: (setType: string) => void;
    //changeHandNames: (setType: string) => void;
    declareBack: () => string;
    declareFace: (card: string) => string;
    screenWidth: string;
    isFourCol: boolean;
    supportsFourCol: boolean;
    change4COps: (val: boolean) => void;
    change4CSupportOps: (val: boolean) => void;
}

export const DeckContext = createContext<DeckContextType | null>(null);

export const useDeck = () => {
    const context = useContext(DeckContext);
    if(!context) throw new Error("useDeck must be used within DeckProvider");
    return context;
}

interface DeckProviderProps {
    children: ReactNode;
}

function getScreenWidth() {
        const width = window.innerWidth;
        if (width < 600) return "small";
        if (width < 800) return "medium";
        return "large";
    }

export const DeckProvider: React.FC<DeckProviderProps> = ({children}) => {
    const [chosenSet, setChosenSet] = useState<"doa" |"xvv" | "dsu" | "fpk">("fpk");
    //const [chosenHandNames, setChosenHandNames] = useState<"standard" |"holysheep">("standard");

    /*const changeHandNames = (setType: string) => {
        if(setType === "standard" || setType === "holysheep") {
            setChosenHandNames(setType);
        }
    }*/

    const changeSet = (setType: string) => {
        if(setType === "doa" || setType === "xvv" || setType === "dsu" || setType === "fpk") {
            setChosenSet(setType);
        }
    }

    const declareBack = () => {
        return `/assets/cards/set-${chosenSet}/back.png`;
    }

    //string to return in declareFace if large print is needed
    const isLargeS = () => {
        if(screenWidth !== "large") return "-large";
        return "";
    }

    //string to return in declareFace if 4 color is on
    const is4CS = () => {
        if(isFourCol && supportsFourCol && screenWidth === "large") return "-4c";
        return "";
    }

    const declareFace = (card: string) => {
        if(isNumber(card)) {
            return `/assets/cards${isLargeS()}${is4CS()}/${card}.png`;
        } else {
            return `/assets/cards${isLargeS()}${is4CS()}/set-${chosenSet}/${card}.png`;
        }
    }

    const [screenWidth, setScreenWidth] = useState(getScreenWidth());

    //whether 4 color mode for cards is turned on or off
    const [isFourCol, setIsFourCol] = useState(false);
    //whether the current game supports 4 color or not
    const [supportsFourCol, setSupportsFourCol] = useState(true);

    const change4COps = (val: boolean) => { setIsFourCol(val); }
    const change4CSupportOps = (val: boolean) => { setSupportsFourCol(val); }

    useEffect(() => {
        const update = () => setScreenWidth(getScreenWidth());
        window.addEventListener("resize", update);

        return () => {
            window.removeEventListener("resize", update);
        }
    }, []);

    return(
        <DeckContext.Provider
            value={{chosenSet, changeSet, declareBack, declareFace, screenWidth, 
                isFourCol, supportsFourCol, change4COps, change4CSupportOps}}
        >
            {children}
        </DeckContext.Provider>
    );
}