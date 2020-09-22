/**
*
* @factory
*/
function _TestFormatter(
    promise
    , fs_fileInfo
    , defaults
) {

    /**
    * @worker
    */
    return function TestFormatter(
        entry
        , assets
    ) {
        try {
            //the tests collection should be the first asset, create the output file asset with it
            var testFile = fs_fileInfo(
                entry.config.fileName || defaults.testFileName
                , assets[0].data
            );

            assets[0] = testFile;

            return promise.resolve(assets);
        }
        catch(ex) {
            return promise.reject(ex);
        }
    };
}