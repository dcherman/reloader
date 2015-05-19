module.exports = function( powders ) {
    var Promise = require( "bluebird" ),
        request = Promise.promisify( require( "request" ) ),
        cheerio = require( "cheerio" ),
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
                var $ = cheerio.load( results[ 1 ] ),
                    items = $( '.Item_holder' );

                return items.map(function() {
                    var item = $( this );

                    return {
                        id: item.find( '.CatalogItemItemNo' ).text().trim(),
                        stock: item.find( '.instock' ).text().trim() === 'In Stock',
                        price: item.find( '[itemprop="Price"]' ).text().trim()
                    };
                }).get();
            });
        }

        return Promise.map([
            "http://www.midsouthshooterssupply.com/Vendor/00034/Hodgdon-,-Imr-And-Winchester/Dept/reloading/smokeless-powder?CurrentPage=1",
            "http://www.midsouthshooterssupply.com/Vendor/00034/Hodgdon-,-Imr-And-Winchester/Dept/reloading/smokeless-powder?CurrentPage=2",
            "http://www.midsouthshooterssupply.com/Vendor/00034/Hodgdon-,-Imr-And-Winchester/Dept/reloading/smokeless-powder?CurrentPage=3",
            "http://www.midsouthshooterssupply.com/Vendor/00034/Hodgdon-,-Imr-And-Winchester/Dept/reloading/smokeless-powder?CurrentPage=4",
            "http://www.midsouthshooterssupply.com/Vendor/00034/Hodgdon-,-Imr-And-Winchester/Dept/reloading/smokeless-powder?CurrentPage=5",
            "http://www.midsouthshooterssupply.com/Vendor/00137/Alliant-Powder/Dept/reloading/smokeless-powder?CurrentPage=1",
            "http://www.midsouthshooterssupply.com/Vendor/00137/Alliant-Powder/Dept/reloading/smokeless-powder?CurrentPage=2",
            "http://www.midsouthshooterssupply.com/Vendor/00079/Western-And-Accurate-Powder/Dept/reloading/smokeless-powder?CurrentPage=1",
            "http://www.midsouthshooterssupply.com/Vendor/00079/Western-And-Accurate-Powder/Dept/reloading/smokeless-powder?CurrentPage=2"
        ], parseResultsPage ).then(function( results ) {
            return Array.prototype.concat.apply( [], results ).filter(function( powder ) {
                return powders.indexOf( powder.id ) !== -1 && powder.stock;
            }).map(function( powder ) {
                powder.description = reverse[ powder.id ];
                powder.source = "Midsouth Shooter Supply";
                return powder;
            });
        });
    });
};
