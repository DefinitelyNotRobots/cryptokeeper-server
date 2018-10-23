const router = require('express').Router();
const Account = require('../models/Account');

// const ensureAuth = require('../util/ensure-auth')

module.exports = router
    .post('/:id', (req, res, next) => {
        const { id } = req.params;
        const { exchange } = req.body;
        Account.create({
            user: id,
            exchange: exchange
        }).then(account => {
            res.json(account);
        });
    });