import {tenso} from "./dist/tenso.js";

export const app = tenso({port: 8000});

app.get("/", (req, res) => res.send("Hello, World!"));
app.start();
