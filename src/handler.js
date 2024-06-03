const serverless = require("serverless-http");
const express = require("express");
const app = express();

const bobAssistantController = require("./controller/bobAssistantController");

app.get("/:payload", bobAssistantController.getResponseBobAssistant);



exports.handler = serverless(app);
