module.exports = function( powders ) {
    var Promise = require( "bluebird" ),
        request = Promise.promisify( require( "request" ) ),
        cheerio = require( "cheerio" ),
        powderMap = require( "./powders.json" ),
        reverse = {};

    return Promise.try(function() {
        powders = powders.map(function( powder ) {
            var mapped = powderMap[ powder ];

            if ( !mapped ) {
                throw new Error( "Missing a value in the powder map for " + powder );
            }

            reverse[ mapped ] = powder;

            return mapped;
        });

        return Promise.map([
            "accurate",
            "alliant",
            "hodgdon",
            "imr",
            "nobelsport",
            "norma",
            "ramshot",
            "vv",
            "winchester"
        ], function( manufacturer ) {
            return request(
                "http://www.powdervalleyinc.com/" + manufacturer + ".shtml"
            ).then(function( results ) {
                var $ = cheerio.load( results[ 1 ] ),
                    items = $( 'form table' ).first().find( 'tr:not(:empty)' ).slice( 2 );

                return items.map(function() {
                    var cells = $( this ).children( 'td' );

                    return {
                        id: /[a-z0-9\-]+/i.exec( cells.first().text() )[ 0 ],
                        stock: cells.eq( 2 ).text().trim() === 'Yes',
                        price: parseFloat( /\d+\.\d+/.exec( cells.eq( 3 ).text() )[0] )
                    };
                }).get();
            });
        }).then(function( results ) {
            return Array.prototype.concat.apply( [], results ).filter(function( powder ) {
                return powders.indexOf( powder.id ) !== -1 && powder.stock;
            }).map(function( powder ) {
                powder.description = reverse[ powder.id ];
                powder.source = "Powder Valley";
                return powder;
            });
        });
    });
};
