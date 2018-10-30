const router = require('express').Router();
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const { getPrices } = require('../exchanges/coin-market-cap');
const { getTotalInUSD } = require('../util/get-USD');
const { HttpError } = require('../util/errors');

const updateOptions = {
    new: true,
    runValidators: true
};

module.exports = router
    .post('/accounts', (req, res, next) => {
        const { _id } = req.user;
        const { exchange } = req.body;
        Account.userHasAccountByExchange(_id, exchange)
            .then(hasExchange => {
                if(hasExchange) throw new HttpError({
                    code: 403,
                    message: 'Users may have only one account per marketplace'
                });

                return Account.create({
                    user: _id,
                    exchange: exchange
                });
            })
            .then(account => res.json(account))
            .catch(next);
    })

    .get('/accounts/total', getPrices, (req, res, next) => {
        const { _id } = req.user;
        const { marketData } = req;

        Account.findOne({ user: _id })
            .then(account => account.accountTotal(marketData))
            .then(total => res.json(total))
            .catch(next);
    })


    .get('/accounts', (req, res, next) => {
        const { _id } = req.user;
        Account.findOne({ 'user': _id })
            .select({ 'user': false, '_id': false, 'currencies._id': false })
            .then(account => res.json(account))
            .catch(next);
    })


    .post('/transactions', getPrices, (req, res, next) => {
        let marketData = req.marketData;
        const { currency: currencyName, exchange, quantity } = req.body;
        const { _id } = req.user;
        const currencyUpdate = { name: currencyName, quantity };
        const transactionInUSD = getTotalInUSD([currencyUpdate], marketData);
        const price = transactionInUSD / quantity;

        const transact = Transaction.create({
            user: req.user,
            currencyName,
            exchange,
            price,
            quantity
        });

        Account.findOne({ 'user': _id, exchange })
            .then(account => {
                const currentAccountUSD = account.getCurrency('USD').quantity;

                if(currentAccountUSD > transactionInUSD) {
                    return Promise.all([
                        transact,
                        Account.updateCurrency(_id, exchange, currencyUpdate),
                        Account.updateCurrency(_id, exchange, { name: 'USD', quantity: -transactionInUSD })
                    ]);
                } else {
                    throw new HttpError({
                        code: 403,
                        message: 'Insufficient funds'
                    });
                }
            })
            .then(([transaction]) => res.json(transaction))
            .catch(next);
    })

    .get('/transactions', (req, res, next) => {
        const { _id } = req.user;
        Transaction.findOne({ 'user': _id })
            .select({ 'user': false, '_id': false })
            .then(transaction => res.json(transaction))
            .catch(next);
    });
