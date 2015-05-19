module.exports = function( powders ) {
    var Promise = require( "bluebird" );

    return Promise.map([
        require( "./powdervalley" ),
        require( "./midsouthshootersupply" )
    ], function( adapter ) {
        return adapter( powders );
    }).then(function( results ) {
        return Array.prototype.concat.apply( [], results );
    });
};
