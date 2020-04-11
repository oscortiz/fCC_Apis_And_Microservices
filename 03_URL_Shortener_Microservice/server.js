const bodyParser = require('body-parser');
const express = require('express');
const mongoose = require('mongoose');
const dns = require('dns');
const uniqueValidator = require('mongoose-unique-validator');
const autoIncrement = require('mongoose-sequence')(mongoose);

var cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(cors());

app.use(express.static(__dirname + '/public'));

const connectionOptions = {
    useNewUrlParser: true,
    dbName: process.env.DB_NAME
}

mongoose.connect(process.env.MONGO_URI, connectionOptions).then(
    () => console.log('Database is connected'),
    error => console.log(`Can not connect to the database: ${error}`));

var Schema = mongoose.Schema;

var urlSchema = new Schema({
    originalUrl : {
        type : String,
        required : true,
        unique: true
    }
});

urlSchema.plugin(uniqueValidator);

urlSchema.plugin(autoIncrement, {inc_field: 'shortUrl'});

var Url = mongoose.model('Url', urlSchema);

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/index.html');
});

app.post('/api/shorturl/new', (req, res) => {
    let urlNoProtocol = req.body.url.replace(/https?:\/\//, '');

    dns.lookup(urlNoProtocol, (error, address) => {
        if (error) {
            res.json({ "error": "invalid URL" });
        } else {
            var url = new Url({
                originalUrl : req.body.url
            });
          
            url.save()
            .then(data => {
                res.json({
                    'original_url': data.originalUrl,
                    'short_url': data.shortUrl
                });                    
            })
            .catch(error => {
                if (error) {
                    if (error.name === 'ValidationError') {
                        Url.find({originalUrl : req.body.url})
                        .then(data => 
                            res.json({
                                'original_url': data[0].originalUrl,
                                'short_url': data[0].shortUrl
                            })
                        )  
                        .catch(error => console.log(error))
                    }
                } else {                                        
                    console.log(error);
                }
            });
        }        
    });
});

app.get('/api/shorturl/:shortUrl', (req, res) => {
    Url.find({shortUrl : req.params.shortUrl})
    .then(data => res.redirect(data[0].originalUrl))  
    .catch(error => res.json({ "error": "invalid shorturl" }))
});

app.listen(port, () => {
    console.log(`Node is listening on port ${port}`);
});

