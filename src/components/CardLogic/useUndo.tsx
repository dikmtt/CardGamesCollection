import React, { useCallback, useState } from "react";

export function useUndo<T> (initVal: T, limit=25) {
    const [stateHist, setStateHist] = useState<T[]>([]);
    //const [currIndex, setCurrIndex] = useState(0);
    const [currState, setCurrState] = useState<T>(initVal);

    const set = useCallback(
        (newState: T) => {
            //console.log("newState in hook:", newState);
            setStateHist((prevH) => {
                setCurrState((prevC) => {
                    const newHist = [...prevH, prevC].slice(-limit);
                    setStateHist(newHist);
                    return newState;
                });
                return prevH;
            });
            /*var newStateHist = [...stateHist, currState];
            if(newStateHist.length > limit) {
                newStateHist = newStateHist.slice(newStateHist.length - limit);
            }
            //setStateHist((prev) => [...prev, currState]);
            setStateHist(newStateHist);*/
            //setCurrState(newState);
            //console.log("new state hist: ", newStateHist);
        },
        [limit]
    );

    const undo = useCallback(() => {
        setStateHist((prev) => {
            //console.log("history length: ", prev.length);
            if(prev.length === 0) return prev;
            const updatedHist = [...prev];
            const prevState = updatedHist.pop()!;

            setCurrState(updatedHist[updatedHist.length - 1]);
            //console.log("prevState: ", prevState);
            return updatedHist;
        });
    }, []);

    const canUndo = stateHist.length > 1;

    return { currState, set, undo, canUndo };

    /*const set = (val) => {
        let updatedHist = stateHist.slice(0, currIndex + 1);
        updatedHist.push(val);
        //console.log(updatedHist);

        if(updatedHist.length > limit) {
            updatedHist = updatedHist.slice(updatedHist.length - limit);
        }
        setStateHist(updatedHist);
        setCurrIndex(updatedHist.length - 1);
    }

    const undo = () => {
        setCurrIndex((currIndex) => Math.max(currIndex - 1, 0));
    }

    return [stateHist[currIndex], set, undo];*/
}

//export default useUndo;