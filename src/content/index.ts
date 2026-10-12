import { initContentController } from "./controller.js";
import { initDoubleClick } from "./double-click.js";
import "./selection.js";

void Promise.all([initContentController(), initDoubleClick()]);