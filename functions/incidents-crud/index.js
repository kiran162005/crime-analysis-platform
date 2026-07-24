'use strict';

const { IncomingMessage, ServerResponse } = require("http");

/**
 * 
 * @param {IncomingMessage} req 
 * @param {ServerResponse} res 
 */
module.exports = (req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ status: "stub - replace with real CRUD" }));
};