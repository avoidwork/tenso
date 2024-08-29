import {tenso} from "./dist/tenso.js";

export const app = tenso();

app.get("/", "Hello, World!");
app.start();
