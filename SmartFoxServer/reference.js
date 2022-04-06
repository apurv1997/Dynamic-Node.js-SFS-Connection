var sfs;
var count = 0;
var zone_name = "";
var port = 8080;

var debug = 1;
var login = false;
var method_call = "";
var ply_username = "";
var ply_client_id = "";
var login_user = "";
var dataformat = "";
var roomName = "";
var userstatus_flag = false;
//------------------------------------
// USER INTERFACE HANDLERS
//------------------------------------

function onConnectBtClick(method_name, username, client_id, sfs_address, zonename, tableName, formatdata, client_name) {
    // Clear log window
    //document.getElementById("log").innerHTML = "";

    // Disable interface
    enableInterface(false);
    method_call = method_name;
    address = sfs_address;
    ply_username = username;
    roomName = $.trim(tableName);
    zone_name = zonename;
    dataformat = formatdata;
    ply_client_id = client_id;
    login_user = client_name;
    // Log message
    trace("Connecting...");

    // Create configuration object
    var config = {};
    console.log(address + port + zone_name);
    //	config.host = document.getElementById("addressIn").value;
    //	config.port = Number(document.getElementById("portIn").value);
    //	config.debug = document.getElementById("debugCb").checked;
    config.host = address;
    config.port = port;
    config.debug = debug;
    config.useSSL = false;
    config.zone = zone_name;
    console.log(config);
    // Create SmartFox client instance
    sfs = new SFS2X.SmartFox(config);

    // Set logging
    sfs.logger.level = SFS2X.LogLevel.INFO;
    sfs.logger.enableConsoleOutput = true;
    sfs.logger.enableEventDispatching = true;

    sfs.logger.addEventListener(SFS2X.LoggerEvent.DEBUG, onDebugLogged, this);
    sfs.logger.addEventListener(SFS2X.LoggerEvent.INFO, onInfoLogged, this);
    sfs.logger.addEventListener(SFS2X.LoggerEvent.WARNING, onWarningLogged, this);
    sfs.logger.addEventListener(SFS2X.LoggerEvent.ERROR, onErrorLogged, this);

    // Add event listeners
    sfs.addEventListener(SFS2X.SFSEvent.EXTENSION_RESPONSE, onExtensionResponse, this);
    sfs.addEventListener(SFS2X.SFSEvent.CONNECTION, onConnection, this);
    sfs.addEventListener(SFS2X.SFSEvent.CONNECTION_LOST, onConnectionLost, this);
    sfs.addEventListener(SFS2X.SFSEvent.LOGIN_ERROR, onLoginError, this);
    sfs.addEventListener(SFS2X.SFSEvent.LOGIN, onLogin, this);
    sfs.addEventListener(SFS2X.SFSEvent.ROOM_JOIN, OnRoomJoin, this);
    sfs.addEventListener(SFS2X.SFSEvent.ROOM_JOIN_ERROR, OnRoomJoinError, this);
    //        sfs.addEventListener(SFS2X.SFSEvent.USER_COUNT_CHANGE,onUserCountChange, this);
    //        sfs.addEventListener(SFS2X.SFSEvent.ROOM_JOIN_ERROR, onRoomJoinError, this);
    // sfs.addEventListener(SFS2X.SFSEvent.ROOM_JOIN, onRoomJoin, this);
    // Attempt connection
    sfs.connect();

}

function onDisconnectBtClick() {
    // Log message
    trace("Disconnecting...");

    // Disconnect
    sfs.disconnect();
}
function onUserCountChange(evtParams) {
    console.log(evtParams);
    //    var responseArray = evtParams.getUtfStringArray("onlineUserNames");
    //    console.log(responseArray);
    var room = evtParams.room;
    var uCount = evtParams.uCount;
    var sCount = evtParams.sCount;

    console.log("Room: " + room.name + " now contains " + uCount + " users and " + sCount + " spectators");
}
function onLogin(evtparams) {

    login = true;
    trace("Login Success: ");
    if (method_call == "user_handler") {
        user_handler(ply_username);
    } else if (method_call == "ActivePlayerSendOut_handler") {
        ActivePlayerSendOut_handler(ply_username, ply_client_id);
    }
    else if (method_call == "ActiveTableName") {
        ActiveTableName(ply_username, ply_client_id);
    }
    if (method_call == "GetPlayerHandRanking") {
        GetPlayerHandRanking(roomName);
    }
}

function call_handler() {
    // don't remove

}

function user_handler(username) {

    if (login == true) {
        var params = new SFS2X.SFSObject();
        params.putUtfString("userName", username);
        sfs.send(new SFS2X.ExtensionRequest("PlayerClaimBack", params));

    }
}

function ActivePlayerSendOut_handler(username, client_id) {
    if (login == true) {
        var params = new SFS2X.SFSObject();
        params.putUtfString("userName", username);
        params.putInt("clientId", parseInt(client_id));
        sfs.send(new SFS2X.ExtensionRequest("ActivePlayerSendOut", params));

    }
    return true;
}

function ActiveTableName(username, client_id) {
    if (login == true) {
        var params = new SFS2X.SFSObject();
        params.putUtfString("playerName", username);
        params.putInt("clientId", parseInt(client_id));
        sfs.send(new SFS2X.ExtensionRequest("ActiveTableName", params));

    }
    return true;
}
function GetPlayerHandRanking(roomName) {
    sfs.send(new SFS2X.JoinRoomRequest(roomName));
    return true;
}
function onLoginError(evtparams) {
    login = false;
    trace("Login failed: " + evtparams.errorMessage);
}

function OnRoomJoin(evtparams) {

    console.log("Room joining success: " + roomName);
    console.log(evtparams);

    var params1 = new SFS2X.SFSObject();
    sfs.send(new SFS2X.ExtensionRequest("GetPlayerHandRanking", params1, sfs.lastJoinedRoom));

}

function OnRoomJoinError(evtparams) {
    //Console.WriteLine("Room join failed: " + evtparams.errorMessage);
    console.log("Room joining failed: " + evtparams.errorMessage);
    cleartables();
}

// function onRoomJoinError(evtparams)
// {
// 	console.log("Room joining failed: " + evtparams.errorMessage);
// }
function onExtensionResponse(evtparams) {
    console.log(evtparams);
    switch (evtparams.cmd) {
        case "GetOnlineUserAndTableCount":
            get_countuser(evtparams.params);
            break;
        case "AiBotListCount":
            get_countbot(evtparams.params);
            break;
        case "ActivePlayerSendOut":
            ActivePlayerSendOut_response(evtparams.params);
            break;
        case "PlayerClaimBack":
            user_loginstatus(evtparams.params);
            break;
        case "ActiveTableName":
            user_tablelist(evtparams.params);
            break;
        case "GetPlayerHandRanking":
            player_tablelist(evtparams.params);
            break;
        // case "ActiveUserAndRoomName":
        // get_active_user(evtparams.params);
        // break;
    }

}
function get_countuser(responseParams) {

    var roomcount = 0;
    var onlineBotCount = 0;
    trace("dfds" + responseParams.getInt("onlineUserCount") + "Room" + responseParams.getInt("onlineRoomCount"));
    //		console.log("Count is: " + responseParams.onlineUserCount + "Room" + responseParams.onlineRoomCount);
    console.log("Count is: " + responseParams.getInt("onlineUserCount") + "Room" + responseParams.getInt("onlineRoomCount"));
    count = responseParams.getInt("onlineUserCount");
    roomcount = responseParams.getInt("onlineRoomCount");
    onlineBotCount = responseParams.getInt("onlineBotCount");
    $("#countdisplay").html(count);
    $("#roomcountdisplay").html(roomcount);
    //   $("#countbots").html(onlineBotCount);


}
function get_countbot(responseParams) {


    var onlineUserCount = 0;
    trace("botcount-" + responseParams.getInt("onlineUserCount"));
    //   console.log("Count is: " + responseParams.onlineUserCount + "Room" + responseParams.onlineRoomCount);
    onlineBotCount = responseParams.getInt("onlineUserCount");

    $("#countbots").html(onlineBotCount);


}
function get_alluser(responseParams) {
    console.log("sfdf----" + responseParams);
    var responseArray = responseParams.getUtfStringArray("serverUserName");
    //   var strParams = (responseArray).toArray(new String[responseArray.size()]);
    console.log("array is" + responseArray);
    //               if(responseArray!=null && count!=0){
    //                   var num="";
    //                   var tbody="";
    //                   var x=0;
    //                    responseArray.forEach(function(num){
    //                         tbody=tbody + "<tr><td>"+ (parseInt(++x)) +"</td><td>"+num+"</td></tr>";
    //                   });
    //                   $('#active_user_tbody').html(tbody);
    //               }



}
function get_active_user(responseParams) {
    console.log("sfdf----" + responseParams);
    var responseArray = responseParams.getUtfStringArray("serverUserName");
    var responseArray2 = responseParams.getUtfStringArray("serverRoomName");
    //   var strParams = (responseArray).toArray(new String[responseArray.size()]);
    console.log("array is" + responseArray2);
    console.log("array is" + responseArray);
    if (responseArray != null && count != 0) {
        fill_tablePlayerList(responseArray2, responseArray)
    }

}

// function user_loginstatus(responseParams){

//     userstatus_flag=false;

//     trace("---hhhhhhhhhh----"+responseParams.getBool("userExists"));
//    //    console.log("Count is: " + responseParams.onlineUserCount + "Room" + responseParams.onlineRoomCount);
//    var msg=responseParams.getUtfString("message");
//     console.log("ddd"+msg);
//       userstatus_flag= responseParams.getBool("userExists");
//       console.log("--sdssssss" + $("#withdraw_max_club").length);
//       if(userstatus_flag==true){
//         if($("#withdraw_max_club").length == 0) {

//           $('#message_show').removeClass('hidden');
//           $("div#adjusttranspin").html("<span class='succmsg'>"+msg+"</span>");

//         }else{

//           $("#savebtn").attr("disabled","disabled");
//           $("div#adjusttranspin").html("<span class='succmsg'>"+msg+"</span>");
//           $("div#adjusttranspin").fadeOut(4000); 
//         }  
//       } 
//     return userstatus_flag;

// }

function user_loginstatus(responseParams) {

    userstatus_flag = true;

    trace("---hhhhhhhhhh----" + responseParams.getBool("userExists"));
    //    console.log("Count is: " + responseParams.onlineUserCount + "Room" + responseParams.onlineRoomCount);
    var msg = responseParams.getUtfString("message");
    console.log("ddd" + msg);
    userstatus_flag = responseParams.getBool("userExists");
    //  alert(userstatus_flag)
    if (userstatus_flag == true) {
        $("#savebtn").attr("disabled", "disabled");
        $("div#adjusttranspin").html("<span class='succmsg'>" + msg + "</span>");
        $("div#adjusttranspin").fadeOut(4000);
    } else {
        $("#savebtn").removeAttr("disabled", "disabled");
        $("div#adjusttranspin").html("");
        //$("div#adjusttranspin").fadeOut(4000); 
    }
    return userstatus_flag;

}


function user_tablelist(responseParams) {



    trace("---hhhhhhhhhh----" + responseParams.getBool("status"));
    //    console.log("Count is: " + responseParams.onlineUserCount + "Room" + responseParams.onlineRoomCount);
    var msg = responseParams.getUtfString("message");

    console.log("ddd" + msg);
    userstatus_flag = responseParams.getBool("status");
    //  alert(userstatus_flag)
    //if(userstatus_flag==true){
    var roomName = responseParams.getUtfString("roomName");
    listtable_patti(userstatus_flag, msg, roomName)
    //sfs.send(new SFS2X.LogoutRequest());
    // }else{

    //$("div#adjusttranspin").fadeOut(4000); 
    // }
    return userstatus_flag;

}
function player_tablelist(responseParams) {



    trace("---hhhhhhhhhh----" + responseParams.getBool("status"));
    //    console.log("Count is: " + responseParams.onlineUserCount + "Room" + responseParams.onlineRoomCount);
    var msg = responseParams.getUtfString("message");

    console.log("ddd" + msg);
    console.log(responseParams);
    userstatus_flag = responseParams.getBool("status");
    //  alert(userstatus_flag)
    //if(userstatus_flag==true){
    var roomName = responseParams.getUtfString("roomName");
    var playerNames = responseParams.getUtfStringArray("playerNames");
    var winCombination = responseParams.getUtfStringArray("winCombination");
    var rank = responseParams.getIntArray("rank");
    console.log(winCombination);
    console.log(playerNames);
    console.log(rank);
    if (dataformat == 'popup') {
        listplayer_patti(userstatus_flag, msg, playerNames, winCombination, rank)
    } else {
        listplayer_patti_table(userstatus_flag, msg, playerNames, winCombination, rank)
    }
    // sfs.send(new SFS2X.LeaveRoomRequest());
    //sfs.send(new SFS2X.LogoutRequest());
    // }else{

    //$("div#adjusttranspin").fadeOut(4000); 
    // }
    return userstatus_flag;

}



function ActivePlayerSendOut_response(responseParams) {


    trace("---sendout" + responseParams.getBool("dbResult"));
    //    console.log("Count is: " + responseParams.onlineUserCount + "Room" + responseParams.onlineRoomCount);
    // var msg=responseParams.getUtfString("message");
    //  console.log(msg);
    //    output= responseParams.getBool("userExists");

}

function onDebugLogged(event) {
    //console.log(event);
    trace(event.message, "DEBUG", true);
}

function onInfoLogged(event) {
    //console.log(event);
    trace(event.message, "INFO", true);
}

function onWarningLogged(event) {
    trace(event.message, "WARN", true);
}

function onErrorLogged(event) {
    trace(event.message, "ERROR", true);
}

//------------------------------------
// SFS EVENT HANDLERS
//------------------------------------

function onConnection(event) {
    if (event.success) {
        trace("Connected to SmartFoxServer 2X!<br>SFS2X API version: " + sfs.version);

        // Show disconnect button
        //switchButtons();
        sfs.send(new SFS2X.LoginRequest(login_user, "", null, zone_name));
        //                onLogin();
    }
    else {
        trace("Connection failed: " + (event.errorMessage ? event.errorMessage + " (" + event.errorCode + ")" : "Is the server running at all?"));

        // Reset
        reset();
    }
}

function onConnectionLost(event) {
    login = false;
    trace("Disconnection occurred; reason is: " + event.reason);
    var reason = event.reason;

    //	if (reason != SFS2X.Utils.ClientDisconnectionReason.MANUAL)
    //	{
    //		if (reason == SFS2X.Utils.ClientDisconnectionReason.IDLE)
    //			console.log("A disconnection occurred due to inactivity");
    //		else if (reason == SFS2X.Utils.ClientDisconnectionReason.KICK)
    //			console.log("You have been kicked by the moderator");
    //		else if (reason == SFS2X.Utils.ClientDisconnectionReason.BAN)
    //			console.log("You have been banned by the moderator");
    //		else
    //			console.log("A disconnection occurred due to unknown reason; please check the server log");
    //	}
    //	else
    //	{
    //		// Manual disconnection is usually ignored
    //	}
    // Hide disconnect button
    //switchButtons();

    // Reset
    reset();
}

//------------------------------------
// OTHER METHODS
//------------------------------------

function enableInterface(enabled) {
    //	document.getElementById("addressIn").disabled = !enabled;
    //	document.getElementById("portIn").disabled = !enabled;
    //	document.getElementById("debugCb").disabled = !enabled;
    //	document.getElementById("connectBt").disabled = !enabled;
}

function trace(message, prefix, isDebug) {
    var text = "";

    var open = "<div" + (isDebug ? " class='debug'" : "") + ">" + (prefix ? "<strong>[SFS2X " + prefix + "]</strong><br>" : "");
    var close = "</div>";

    if (isDebug)
        message = "<pre>" + message.replace(/(?:\r\n|\r|\n)/g, "<br>") + "</pre>";

    console.log(text + open + message + close);
}

//function switchButtons()
//{
//    var connectBt = document.getElementById("connectBt");
//    var disconnectBt = document.getElementById("disconnectBt");
//
//    if (connectBt.style.display === "none")
//    {
//        connectBt.style.display = "block";
//        disconnectBt.style.display = "none";
//    }
//    else
//    {
//        connectBt.style.display = "none";
//        disconnectBt.style.display = "block";
//    }
//}

function reset() {
    // Enable interface
    enableInterface(true);

    // Remove SFS2X listeners
    sfs.removeEventListener(SFS2X.SFSEvent.CONNECTION, onConnection);
    sfs.removeEventListener(SFS2X.SFSEvent.CONNECTION_LOST, onConnectionLost);

    sfs.logger.removeEventListener(SFS2X.LoggerEvent.DEBUG, onDebugLogged);
    sfs.logger.removeEventListener(SFS2X.LoggerEvent.INFO, onInfoLogged);
    sfs.logger.removeEventListener(SFS2X.LoggerEvent.WARNING, onWarningLogged);
    sfs.logger.removeEventListener(SFS2X.LoggerEvent.ERROR, onErrorLogged);

    sfs = null;
}
// setTimeout(function() {setInterval(function(){
//     console.log("login fdsf:"+login);
//    if(login==true){ 
//     call_handler();
//     }
// }, 15000);}, 30 * 1000);

// setInterval(function(){ 
//   onConnectBtClick();
// }, 1800000);

// onConnectBtClick();
