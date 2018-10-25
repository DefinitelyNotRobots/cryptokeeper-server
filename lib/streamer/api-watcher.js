const request = require('superagent');

const DEFAULT_INTERVAL = 60 * 1000;

const priceOverTime = {};

const getHistoricalPrice = name => {
    const potc = priceOverTime[name];
    if(potc && potc.length > 0) return potc;
    return [];
};

const getCurrentPrice = name => {
    const potc = getHistoricalPrice(name);
    if(potc.length > 0) return potc[potc.length - 1];
    return null;
};

const getSymbols = () => Object.keys(priceOverTime);

const getCurrentPrices = () => getSymbols().map(getCurrentPrice);

const getHistoricalPrices = () => getSymbols().map(getHistoricalPrice);

const pushPrice = coins => {

    coins.forEach(coin => {

        const priceHistory = getHistoricalPrice(coin.symbol);
        if(priceHistory.length < 1) priceHistory.push(coin);
        else {
            const currentPrice = getCurrentPrice(coin.symbol);
            if(currentPrice.last_updated !== coin.last_updated) {
                priceHistory.push(coin);
            }
        }
        while(priceHistory.length > 30) {
            priceHistory.unshift();
        }
    });
};

const fetchPrices = apiKey => {

    return request.get('https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest')
        .set({
            'X-CMC_PRO_API_KEY': apiKey,
            'Accept-Encoding': 'gzip, deflate',
            'Content-Type': 'application/json;charset=UTF-8'
        })
        .query({
            start: 1,
            limit: 10,
            convert: 'USD',
            sort: 'market_cap',
            sort_dir: 'desc'
        })
        .type('json')
        .then(({ body }) => {
            pushPrice(body.data);
            return body.data;
        });
};

let running = false;
const startWatch = (apiKey, interval = DEFAULT_INTERVAL) => {
    if(running) return;
    running = true;
    setInterval(fetchPrices.bind(this, apiKey), interval);
};



module.exports = {
    getCurrentPrice, getHistoricalPrice,
    getCurrentPrices, getHistoricalPrices,
    startWatch
};