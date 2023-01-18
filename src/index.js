const express = require('express');
const route = require('./route/route');
const bodyParser = require('body-parser')
const  mongoose  = require('mongoose');
const app = express(); 

const multer= require("multer");

app.use( multer().any())
app.use(bodyParser.json())

mongoose.connect("mongodb+srv://rajeshkumar2233:9691501076Rj@cluster0.mrghs.mongodb.net/Database", {
    useNewUrlParser: true
})
    .then(() => console.log("MongoDb is connected"))
    .catch(err => console.log(err))



app.use('/', route)

app.listen(process.env.PORT || 3000, function () {
    console.log('Express app running on port ' + (process.env.PORT || 3000))
})