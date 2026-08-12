import React from "react";
import renderer from "react-test-renderer";

try {
  renderer.create(
    React.createElement("input", {
      type: "number",
      value: "NaN"
    })
  );
  console.log("RENDER SUCCESSFUL! NO CRASH.");
} catch (e) {
  console.error("CRASH OCCURRED:");
  console.error(e);
}
