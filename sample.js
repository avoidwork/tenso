import {tenso} from "./dist/tenso.js";

export const app = tenso({port: 8000});

app.get("/", "Hello, World!");
app.start();
