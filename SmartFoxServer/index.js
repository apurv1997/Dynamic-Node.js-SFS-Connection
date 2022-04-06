/*Importing libraries and Files */
const WebSocket = require("ws");``
Object.assign(global, { WebSocket: require("ws") });
const SFS2X = require("sfs2x-api");
const { response } = require("express");
const res = require("express/lib/response");

/*********Variable declaration***********/
let GotResponse = 0;
let ResponseVar = [];
let login = false;
let config = {};
let handlerName = '';
let loginUser='';

// export the function.
exports.sfsConn = (reqParms, handler_name, ip, port, zone) => {
  // Create configuration object
  config.host = ip;
  config.port = port;
  config.zone = zone;
  config.handler_name = handler_name;
  config.debug = false;
  config.useSSL = false;

  // Parameter declaration.
  clientid = reqParms.client_id;
  gameid = reqParms.game_id;
  playertype = reqParms.player_type;
  handlerName = handler_name;
  reqParams = reqParms;
  loginuser = loginUser;
  
  console.log(config);

  // create SmartFox client instance
  sfs = new SFS2X.SmartFox(config);

  /**************** Event Listeners ********************/
  sfs.addEventListener(SFS2X.SFSEvent.EXTENSION_RESPONSE,onExtensionResponse, this);
  sfs.addEventListener(SFS2X.SFSEvent.CONNECTION, onConnection, this);
  sfs.addEventListener(SFS2X.SFSEvent.CONNECTION_LOST, onConnectionLost, this);
  sfs.addEventListener(SFS2X.SFSEvent.LOGIN, onLogin, this);
  sfs.addEventListener(SFS2X.SFSEvent.LOGIN_ERROR, onLoginError, this);
  sfs.addEventListener(SFS2X.SFSEvent.LOGOUT, onLogOut, this);

  //Connect to SmartFoxServer
  sfs.connect();
};

/*onLogin function */
function onLogin(event) {
  console.log("Login Successfull !");
  login = true;
  console.log(reqParams, handlerName);
  
// Conditions for functions
  if(handlerName == "BotStatus"){
    get_bot(reqParams, handlerName);
  } 
  else if(handlerName == "Sum"){
    get_num(reqParams, handlerName);
  }
  else{
    //sfs.disconnect()
  }
}

/*onLogin Error function */
function onLoginError(event) {
  console.log("Login Failure: " + event.errorMessage);
}

/*onConnection function */
function onConnection(event) {
  if (event.success) {
    console.log("Connected to SmartFoxServer 2X!");
    console.log("SFS2X API version:" + sfs.version);
    sfs.send(new SFS2X.LoginRequest(loginUser, "", null, config.zone));
  } 
  else {
    console.warn("Connection Failed: " +(event.errorMessage? event.errorMessage + "(" + event.errorCode + ")": "Server is not running at all..."));
  }
}

/*onConnectionLost function */
function onConnectionLost(event) {
   login = false;
  let reason = event.reason;
  console.log("Disconnection occured; reason: " + event.reason);
}

/*onLogOut function */
function onLogOut(event) {  
  sfs.send(new SFS2X.LogoutRequest());
  console.log("LogOut Executed!!");
}

/*onExtensionRequest function */
function onExtensionResponse(evtparams) {
  //Switch cases:
  switch(evtparams.cmd)
  {// case for handler_name = BotStatus
    case 'BotStatus':
    responseBot(evtparams)
    break;
// case for handler_name = Sum
    case 'Sum':
    responseSum(evtparams)
    break;
  }
}
// responseBot() function
function responseBot(evtparams) {
  
  if(evtparams.cmd == 'BotStatus'){
    let responseParams = evtparams.params;
    console.log("The result is: " + responseParams.getBool("result"));
    console.log("The table name is: " + responseParams.getUtfStringArray("tableName"));
    console.log("The bot name is: " + responseParams.getUtfStringArray("botName"));
    console.log("The message is: " + responseParams.getUtfString("message"));
    console.log("The player_type is: " + responseParams.getUtfStringArray("playerType"));

    /**Get all the Parameters */
    var result = responseParams.getBool("result");
    var tableName = responseParams.getUtfStringArray("tableName");
    var botName = responseParams.getUtfStringArray("botName");
    var message = responseParams.getUtfString("message");
    var playerType = responseParams.getUtfStringArray("playerType")

    /*Put all the parameters in one Variable*/
    ResponseVar = {"result":result, "tablename":tableName, "botName":botName, "message":message, "playertype":playerType};

    console.log(ResponseVar);

    // Export the variables:
    exports.ResponseVar = ResponseVar;
    GotResponse = 1;
    exports.GotResponse = GotResponse;
    sfs.disconnect();
    }
} 

// Performing the SFSExtensionRequest:
function get_bot(reqParams,handlerName) {   
  let params = new SFS2X.SFSObject();
  console.log(reqParams)
 params.putInt("client_id", reqParams.client_id);
 params.putInt("game_id", reqParams.game_id);
 params.putUtfString("playerType", reqParams.player_type);

 sfs.send(new SFS2X.ExtensionRequest(handlerName, params));
}

// responseSum() function
function responseSum(evtparams) {
  if(evtparams.cmd == 'Sum') {
    let responseParams = evtparams.params;
    console.log("The sum is: " + responseParams.getInt("sumOfNum"));
    console.log("The status is: " + responseParams.getBool("status"));
    console.log("The message is: " + responseParams.getUtfString("message"));

    // Get all the parameters:
    var sumOfNum = responseParams.getInt("sumOfNum");
    var status = responseParams.getBool("status");
    var message = responseParams.getUtfString("message");

    // Put all the parameters in one Variable:
    ResponseVar = {"sumOfNum":sumOfNum, "status":status, "message":message};

    console.log(ResponseVar);

    // Export the variables:
    exports.ResponseVar = ResponseVar;
    GotResponse = 1;
    exports.GotResponse = GotResponse;
    sfs.disconnect();
  }
}

// Performing the SFSExtensionRequest:
function get_num(reqParams,handlerName) {
  let params = new SFS2X.SFSObject();
  console.log(reqParams)
 params.putInt("num1", reqParams.num1);
 params.putInt("num2", reqParams.num2);

 sfs.send(new SFS2X.ExtensionRequest(handlerName, params));
}

