const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const cors = require('cors')

const uniqueValidator = require('mongoose-unique-validator');

const mongoose = require('mongoose')
const connectionOptions = {
    useNewUrlParser: true,
    dbName: process.env.DB_NAME
}

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost/exercise-track', connectionOptions).then(
    () => console.log('Database is connected'),
    error => console.log(`Can not connect to the database: ${error}`));

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

const REGEX_INT = /^\d+$/;
const REGEX_DATE = /([12]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]))/;

app.use(express.static(__dirname + '/public'))
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/index.html')
});

var Schema = mongoose.Schema;
let ObjectId = mongoose.Schema.Types.ObjectId;

var userSchema = new Schema({
    username : {
        type : String,
        required : true,
        unique: true
    },
    log : [
        {
            userId : { 
                type : ObjectId, 
                required : true 
            },
            description : { 
                type : String,            
                required : true 
            },
            duration : { 
                type : Number, 
                required : true 
            },
            date : {
                type: Date,
                default: new Date(Date.now())
            }
        }
    ]
});

userSchema.plugin(uniqueValidator);

let User = mongoose.model('User', userSchema);

app.post('/api/exercise/new-user', (req, res) => {
    var user = new User({
        username : req.body.username
    });
  
    user.save()
    .then(data => {
        res.json({
            'username': data.username,
            '_id': data._id
        });                    
    })
    .catch(error => {
        if (error) {
            if (error.name === 'ValidationError') {
                res.send('<p>username already taken</p>');
            }
        } else {                                        
            console.log(error);
        }
    });
});

app.get('/api/exercise/users', (req, res) => {
    User.find({})
    .then(data => {
        let users = [];
        data.forEach(user => {
            users.push( 
                {
                '_id' : user._id,
                'username' : user.username
                }
            )
        });
        res.json(users);        
    })
    .catch(error => console.log(error));
});

app.post('/api/exercise/add', (req, res) => {
    let {userId, description, duration, date} = req.body;
  
    let validationError = {};
    
    if (userId === null || userId === '') {
        validationError.userIdError = 'Path `userId` is required.';
    } else if (!mongoose.Types.ObjectId.isValid(userId)) {
        validationError.userIdError = 'Unknown `_id`.';
    }

    if (description === null || description === '') {
        validationError.descriptionError = 'Path `description` is required.';
    }    

    if (duration === null || duration === '') {
        validationError.durationError = 'Path `duration` is required.';
    } else if (duration.match(REGEX_INT) === null) {
        validationError.durationError = 'Path `duration` must be an integer.';
    }
  
    if (date === null || date === '' || date === undefined) {
        date = new Date(Date.now());
    } else if ((date !== null && date !== '') && (date.match(REGEX_DATE) === null || (new Date(date)).toString() === 'Invalid Date')) {
        validationError.dateError = '`date` is optional, but must be in yyyy-mm-dd format.';
    } else {
        date = new Date(date);
    }

    if (Object.keys(validationError).length !== 0) {
        res.json(validationError);
    } else {
        User.countDocuments({ _id : userId })
        .then(data => {
            if (data === 0) {
                res.json({'userIdError': 'Unknown `_id`.'});
            } else {
                User.findByIdAndUpdate({ _id : userId }, { $push: { log: { description, duration, date }}}, { new: true })
                .then(data => {
                    res.json({
                        'username': data.username,                      
                        'description': description,
                        'duration': parseInt(duration), 
                        '_id': data._id,
                        'date' : date.toDateString()
                    });
                })
                .catch(error => console.log(error));
            }
        })
        .catch(error => console.log(error));
    }
}); 

app.get('/api/exercise/log', (req, res) => {
    let {userId, from, to, limit} = req.query;

    let validationError = {};

    if (userId === undefined) {
        validationError.userIdError = '`_id` param is mandatory.';
    } else if (!mongoose.Types.ObjectId.isValid(userId)) {
        validationError.userIdError = 'Unknown `_id`.';
    }

    if (from !== undefined && (from.match(REGEX_DATE) === null || (new Date(from)).toString()  === 'Invalid Date')) {
        validationError.fromDateError = '`from` date parameter is optional, but must be in yyyy-mm-dd format.';
    }

    if (to !== undefined && (to.match(REGEX_DATE) === null || (new Date(to)).toString()  === 'Invalid Date')) {
        validationError.toDateError = '`to` date parameter is optional, but must be in yyyy-mm-dd format.';
    }

    if (limit !== undefined && limit.match(REGEX_INT) === null) { 
        validationError.limitError = '`limit` parameter is optional, but must be an integer.';
    }

    if (Object.keys(validationError).length !== 0) {
        res.json(validationError);
    } else {
        if (from !== undefined && to !== undefined && new Date(from) > new Date(to)) {
            let swapDate = from;
            from = to;
            to = swapDate;
        }

        User.aggregate()
        .unwind('$log')
        .match({_id: mongoose.Types.ObjectId(userId), 'log.date' : { $gte: new Date(from || '0000-01-01'), $lte: new Date(to || '9999-12-31') } })
        .limit(parseInt(limit) || Math.pow(2,31))
        .group({ _id : {_id : '$_id', username : '$username'}, log : { $push : '$log' }, count: { $sum : 1 } })     
        .then(data => {       
            res.json({
                _id : data[0]._id._id,
                username : data[0]._id.username,
                from : from,
                to : to,
                count : data[0].count,
                log : data[0].log
            });
        })
        .catch(error => console.log(error));
    }
});

// Not found middleware
app.use((req, res, next) => {
    return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
    let errCode, errMessage

    if (err.errors) {
        // mongoose validation error
        errCode = 400 // bad request
        const keys = Object.keys(err.errors)
        // report the first validation error
        errMessage = err.errors[keys[0]].message
    } else {
        // generic or custom error
        errCode = err.status || 500
        errMessage = err.message || 'Internal Server Error'
    }
    res.status(errCode).type('txt')
        .send(errMessage)
})

const listener = app.listen(process.env.PORT || 3000, () => {
    console.log('Your app is listening on port ' + listener.address().port)
})
