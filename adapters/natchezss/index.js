module.exports = function( powders ) {
    var Promise = require( "bluebird" ),
        _ = require( "lodash" ),
        request = Promise.promisify( require( "request" ) ),
        powderMap = require( "./powders.json" ),
        reverse = {};

    return Promise.try(function() {
        powders = powders.map(function( powder ) {
            var mapped = powderMap[ powder ];

            if ( !( powder in powderMap ) ) {
                throw new Error( "Missing a value in the powder map for " + powder );
            }

            reverse[ mapped ] = powder;

            return mapped;
        });

        function parseResultsPage( url ) {
            return request( url ).then(function( results ) {
                var items = JSON.parse( /new Product.Config\((.*)\)/.exec( results[ 1 ] ) ).childProducts;

                return items.map(function( item ) {
                    return {
                        id: item.SKU,
                        stock: item.isInStock !== "0",
                        price: item.price
                    };
                });
            });
        }

        return Promise.map( _.uniq( _.pluck( powders, 'url' ) ) ), parseResultsPage )
            .then(function( results ) {
                powders = _.pluck( powders, 'id' );

                return Array.prototype.concat.apply( [], results ).filter(function( powder ) {
                    return powders.indexOf( powder.id ) !== -1 && powder.stock;
                }).map(function( powder ) {
                    powder.description = reverse[ powder.id ];
                    powder.source = "Natchezs";
                    return powder;
                });
            });
    });
};
