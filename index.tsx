import "/twind.config";

import { render } from "preact";
import { ComponentChildren } from "preact";

import Home from "./apps/home";

render(<Home />, document.body);

export type Children = ComponentChildren | ComponentChildren[];
