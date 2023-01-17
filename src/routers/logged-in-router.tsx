import React from "react";
import { isLoggedInVar } from "../apollo";

export const LoggedInRouter = () => {
  const onclick = () => {
    isLoggedInVar(false);
  };
  return (
    <div>
      <h1>Logged In</h1>
      <button onClick={onclick}>Log Out</button>
    </div>
  );
};
