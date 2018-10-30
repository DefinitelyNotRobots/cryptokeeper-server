const mongoose = require('mongoose');
const { getTotalInUSD } = require('../util/get-USD');

const accountSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId, ref: 'User',
            required: true
        },
        exchange: {
            type: String,
            enum: ['Fake Market', 'Make Farket'],
            required: true
        },
        currencies: [{
            name: {
                type: String,
            },
            quantity: {
                type: Number,
                default: 0,
                min: 0
            }
        }]
    },
    {
        toJSON: {
            transform: function(doc, ret) {
                delete ret.__v;
            }
        }
    }
);

accountSchema.methods.accountTotal = function(marketData) {
    return getTotalInUSD(this.currencies, marketData);
};

accountSchema.methods.getCurrency = function(currencyName) {
    return this.currencies.find(c => c.name === currencyName);
};

accountSchema.statics.userHasAccountByExchange = function(userId, exchangeName) {
    return this.find({ user: userId })
        .then(accounts => accounts.some(account => exchangeName === account.exchange));
};

accountSchema.statics.updateCurrency = function(userId, exchange, currency) {
    return this.findOne({ user: userId, exchange })
        .then(account => {
            const accountCurrency = account.getCurrency(currency.name);
            if(!accountCurrency) {
                return Account.findOneAndUpdate(
                    { user: userId },
                    { $push: { currencies: currency } },
                    { new: true, runValidators: true }
                );
            } else {
                return Account.findOneAndUpdate(
                    { 'user': userId, 'currencies.name': currency.name },
                    { $inc: { 'currencies.$.quantity': currency.quantity } },
                    { new: true, runValidators: true });
            }
        });

};


const Account = mongoose.model('Account', accountSchema);

module.exports = Account;
