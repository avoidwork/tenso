import {tenso} from "./dist/tenso.js";

export const app = tenso({prometheus: {enabled: true}});

app.get("/", "Hello, World!");
app.start();
