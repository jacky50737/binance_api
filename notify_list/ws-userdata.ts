import {
  DefaultLogger,
  isWsFormattedFuturesUserDataEvent,
  isWsFormattedSpotUserDataEvent,
  isWsFormattedUserDataEvent,
  WsUserDataEvents,
} from '../src';
import { WebsocketClient } from '../src/websocket-client';

// or
// import { DefaultLogger, WebsocketClient } from 'binance';

var splitted = __filename.split(".");
var splitted1 = splitted[0].split("/"); 
var splitted2 = splitted1[6].split("-");
var db_apikey =  splitted2[2];
var db_apisecret =  splitted2[3];
console.log(db_apikey);
console.log(db_apisecret);

(async () => {
  const key = db_apikey;
  const secret = db_apisecret;
  const request = require('request');
  const logger = {
    ...DefaultLogger,
    silly: (...params) => console.log(params),
  };

  const wsClient = new WebsocketClient({
    api_key: key,
    api_secret: secret,
    beautify: true,
  }, logger);

  wsClient.on('message', (data) => {
    // console.log('raw message received ', JSON.stringify(data, null, 2));
  });

  function onUserDataEvent(data: WsUserDataEvents) {
    // the market denotes which API category it came from
    // if (data.wsMarket.includes('spot')) {

    // or use a type guard, if one exists (PRs welcome)
    if (isWsFormattedSpotUserDataEvent(data)) {
      console.log('spot user data event: ', data);
      // spot user data event
      return;
    }
    if (data.wsMarket.includes('margin')) {
      console.log('margin user data event: ', data);
      return;
    }
    if (data.wsMarket.includes('isolatedMargin')) {
      console.log('isolatedMargin user data event: ', data);
      return;
    }
    if (data.wsMarket.includes('usdmTestnet')) {
      console.log('usdmTestnet user data event: ', data);
      return;
    }
    if (isWsFormattedFuturesUserDataEvent(data)) {
      if ("order" in data) {
        let symbol = data.order.symbol

        request.post(
            {
              url:'https://binance-tool-api.cryptoharvester.com.tw/receiveTreadData.php?'+
                  'API_KEY='+key+
                  '&symbol='+symbol+
                  '&orderId='+data['order']['orderId']+
                  '&orderSide='+data['order']['orderSide']+
                  '&positionSide='+data['order']['positionSide']+
                  '&orderStatus='+data['order']['orderStatus']+
                  '&averagePrice='+data['order']['averagePrice']+
                  '&originalQuantity='+data['order']['originalQuantity']+
                  '&commissionAmount='+data['order']['commissionAmount']+
                  '&realisedProfit='+data['order']['realisedProfit']
              ,
              encoding:'utf8'
            },
            function(error, response, body){
              if(response.statusCode == 200){
                console.log(body);
              }else{
                console.log(response.statusCode);
              }
            }
        );
      }
      console.log('usdm user data event: ', data);
      return;
    }
  }

  wsClient.on('formattedMessage', (data) => {
    // The wsKey can be parsed to determine the type of message (what websocket it came from)
    // if (!Array.isArray(data) && data.wsKey.includes('userData')) {
    //   return onUserDataEvent(data);
    // }

    // or use a type guard if available
    if (isWsFormattedUserDataEvent(data)) {
      return onUserDataEvent(data);
    }
    console.log('formattedMsg: ', JSON.stringify(data, null, 2));
  });

  wsClient.on('open', (data) => {
    console.log('connection opened open:', data.wsKey, data.ws.target.url);
  });

  // response to command sent via WS stream (e.g LIST_SUBSCRIPTIONS)
  wsClient.on('reply', (data) => {
    console.log('log reply: ', JSON.stringify(data, null, 2));
  });
  wsClient.on('reconnecting', (data) => {
    console.log('ws automatically reconnecting.... ', data?.wsKey );
  });
  wsClient.on('reconnected', (data) => {
    console.log('ws has reconnected ', data?.wsKey );
  });

  // wsClient.subscribeSpotUserDataStream();
  // wsClient.subscribeMarginUserDataStream();
  // wsClient.subscribeIsolatedMarginUserDataStream('BTCUSDT');
  wsClient.subscribeUsdFuturesUserDataStream();

})();
