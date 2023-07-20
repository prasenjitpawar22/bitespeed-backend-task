import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";

import { indentify } from "./routers/identify";

dotenv.config();

const app: Express = express();
app.use(express.json());
const port = process.env.PORT || 3000;

app.get("/", (req: Request, res: Response) => {
  res.send({ data: "ol" });
});

app.use("/api/identify", indentify);

app.listen(port, () => {
  console.log("server" + port);
});
