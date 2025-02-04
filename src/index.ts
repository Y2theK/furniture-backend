import express from "express";

// everythings is middleware in express
const app = express();
app.get('/', (req,res) => {
    res.send("Hello World");
    res.end();
})
app.listen(8080,() => {
    console.log("Server is running at port " + 8080);
})