import { singletonHook } from "./singletonHook";

export { singletonHook as createSingletonGlobalState };

const ReactSingletonHook = {
  //This Generic Arrow Function is creating a hook, not calling one, so naming convention should not have use prefix
  createSingletonGlobalState: singletonHook,
};

export default ReactSingletonHook;
