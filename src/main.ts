import { singletonHook } from "./singletonHook";

export { singletonHook as createSingletonStateHook };

const ReactSingletonHook = {
  // This naming aligns with React’s convention for hook factories (using create*)
  createSingletonStateHook: singletonHook,
};

export default ReactSingletonHook;
