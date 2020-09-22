/**
*
* @factory
*/
function _TestAssembler(
    promise
    , defaults
) {

    /**
    * @worker
    */
    return function TestAssembler(
        entry
        , assets
    ) {
        try {
            var tests = []
            , leftovers = []
            ;

            //loop through the assets and add them to an array
            assets.forEach(function forEachAsset(asset) {
                if (asset.isTest) {
                    tests.push(asset);
                }
                else {
                    leftovers.push(asset);
                }
            });

            return promise.resolve(
                [
                    {
                        "data": tests
                        , "isTest": true
                    }
                ]
                .concat(leftovers)
            );
        }
        catch(ex) {
            return promise.reject(ex);
        }
    };
}