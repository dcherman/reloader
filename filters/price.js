module.exports = function( results ) {
    return results.filter(function( result ) {
        return results.type === "powder" && results.price <= 150.00;
    });
};
