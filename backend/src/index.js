import connectDb from "./db/index.js";
import dotenv from "dotenv";
import app from "./app.js"

dotenv.config({
    path: "./.env"
})

connectDb()
.then(() => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`Server is running on port number : ${process.env.PORT || 8000}`);
    })
})
.catch((err) => {
    console.log("MONGODB connection failed !!", err);
})
