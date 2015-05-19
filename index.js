#!/usr/bin/env node

var Promise = require( "bluebird" ),
    pkg = require( "./package.json" ),
    program = require( "commander" ),
    nodemailer = require( "nodemailer" ),
    fs = require( "fs" ),
    adapters = require( "./adapters" );

Promise.promisify( require("request") );

program
    .version( pkg.version )
    .option( "-l, --loglevel [loglevel]", "The level of logging to use", "INFO" )
    .option( "-c, --config [config]", "Configuration file to use", __dirname + "/config.json" )
    .parse( process.argv );

var config = JSON.parse( fs.readFileSync( program.config, { encoding: "utf8" }) ),
    mailTransport = nodemailer.createTransport(
        config.smtp === "sendmail" ? require( "nodemailer-sendmail-transport" )({}) : config.smtp
    ),
    sendmail = Promise.promisify( mailTransport.sendMail.bind(mailTransport) );

adapters( config.powders ).then(function( results ) {
    if ( results.length ) {
        return sendmail({
            to: config.notifyEmail,
            subject: "PowderMon - Powders are available",
            text: "The following powders are available: \n\n" + results.map(function( powder ) {
                return "[" + powder.source + "] " + powder.description + ", " + powder.price;
            }).join( "\n" )
        });
    }
});
