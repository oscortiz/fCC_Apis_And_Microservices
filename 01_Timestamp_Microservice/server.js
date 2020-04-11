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

app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/index.html');
});

app.get('/api/timestamp', (req, res) => {
    res.json({ 'unix': new Date().getTime(), 'utc': new Date().toUTCString() });
});

app.get('/api/timestamp/:date_string', (req, res) => {
    let date = req.params.date_string;
    if (!isNaN(date)) {
        res.json({ 'unix': new Date(parseInt(date)).getTime(), 'utc': new Date(parseInt(date)).toUTCString() });
    } else if (date.includes('-') && (new Date(date)).toString() !== 'Invalid Date') {
        res.json({ 'unix': new Date(date).getTime(), 'utc': new Date(date).toUTCString() });
    } else {
        res.json({ 'error': 'Invalid Date' });
    }
});

app.listen(port, () => {
    console.log(`Node is listening on port ${port}`);
});
