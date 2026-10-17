import express from "express"
import kolcsonzesroutes from "./routes/kolcsonzes.js";


const app = express();

app.use(express.json());
app.use("/kolcsonzesek", kolcsonzesroutes)


app.listen(3000,()=>{
    console.log("http://localhost:3000")
})