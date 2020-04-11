'use strict';

var express = require('express');
var cors = require('cors');
var bodyParser = require('body-parser');
var multer = require('multer');

const upload = multer({ dest: 'uploads/' })

const app = express();
app.use(cors());

const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/index.html');
});

app.post('/api/fileanalyse', upload.single('upfile'), (req, res) => {
    res.json({
        'name' : req.file.originalname,
        'type' : req.file.mimetype,
        'size' : req.file.size
    }); 
});

app.listen(port, () => {
    console.log(`Node is listening on port ${port}`);
});
