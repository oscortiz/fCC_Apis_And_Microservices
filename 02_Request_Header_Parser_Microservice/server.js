const bodyParser = require('body-parser');
const express = require('express');

const app = express();
const port = process.env.PORT || 3000;

// enable CORS (https://en.wikipedia.org/wiki/Cross-origin_resource_sharing)
// so that your API is remotely testable by FCC 
var cors = require('cors');
app.use(cors({optionSuccessStatus: 200}));  // some legacy browsers choke on 204

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.enable('trust proxy');

app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/index.html');
});

app.get('/api/whoami', (req, res) => {
    res.json({
        'ipaddress': req.ip,
        'language': req.headers['accept-language'],
        'software': req.headers['user-agent']
    });
});

app.listen(port, () => {
    console.log(`Node is listening on port ${port}`);
});
