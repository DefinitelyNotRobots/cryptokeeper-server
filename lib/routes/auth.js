const router = require('express').Router();
const User = require('../models/User');
const Account = require('../models/Account');
const startingCurrency = require('../util/starting-currency');
const { HttpError } = require('../util/errors');
const ensureAuth = require('../util/ensure-auth');

module.exports = router
    .post('/signup', (req, res, next) => {
        const { name, email, clearPassword } = req.body;
        User.create({
            name,
            email,
            clearPassword
        })
            .then(user => {
                Account.create({
                    user: user._id,
                    exchange: 'Fake Market',
                    currencies: startingCurrency
                });
                const token = user.authToken();
                res.json({ user, token });
            })
            .catch(next);

    })

    .post('/signin', (req, res, next) => {
        const { email, clearPassword } = req.body;
        User.findOne({ email }).then(user => {
            const correctPassword = user && user.compare(clearPassword);
            if(correctPassword) {
                const token = user.authToken();
                res.json({ user, token });
            } else {
                next(new HttpError({
                    code: 401,
                    message: 'Bad email or password'
                }));
            }
        })
            .catch(next);
    })

    .get('/verify', ensureAuth, (req, res, next) => {
        res.json({ success: !!req.user })
            .catch(next);
    })

    .get('/me', ensureAuth, (req, res, next) => {
        res.json(req.user)
            .catch(next);
    });
