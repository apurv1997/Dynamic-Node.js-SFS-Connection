/* Importing Libraries and Files*/
const index = require("../SmartFoxServer/index");
const SFS2X = require("sfs2x-api"); 
const express = require("express");
const res = require("express/lib/response");
const Joi = require("@hapi/joi");
const { config } = require("dotenv");
const app = express();
app.use(express.json());

// Importing the sfsConn() function
const { sfsConn } = require("../SmartFoxServer/index");
const { request } = require("express");

// Import the myModule variable.
let myModule = require("../SmartFoxServer/index");
let sfsresponseinterval;

//CREATE request handlers
app.post("/sfs/userdata", (req, res) => {
  /**All the request parameters */
  let ip = req.body.ip;
  let port = req.body.port;
  let zone = req.body.zone;
  let reqparams = req.body.req_params;
  let handler_name = req.body.handler_name;
 
/*Calling sfsConn function from index.js file */
  sfsConn(reqparams, handler_name, ip, port, zone);

  // Set setInterval Time function.  /*Export variables from index.js */
  sfsresponseinterval = setInterval(function () {
    // Import the two variables: ResponseVar, GotResponse.
    let ResponseVar = myModule.ResponseVar; 
    let GotResponse = myModule.GotResponse;
    console.log(GotResponse);
    if (GotResponse == 1) {
      myModule.GotResponse = 0; 
      clearInterval(sfsresponseinterval);
      console.log("resp:" + ResponseVar);
      res.status(200).json({ resp: ResponseVar });
    }
  }, 1000);
});

// PORT ENVIRONMENT
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port ${port}..`));
