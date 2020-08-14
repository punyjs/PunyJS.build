/**
* The test preprocessor
* @factory
*/
function _TestPreprocessor(
    promise
    , buildHelpers_docExtractor
    , utils_funcInspector
    , defaults
) {
    /**
    * @constants
    */
    var cnsts = {
        "skipProperties": [
            "indent"
            , "raw"
            , "tag"
            , "offset"
        ]
    }
    /**
    * A regular expression to trim leading and trailing NLCR and whitespace
    * @property
    */
    , TRIM_PATT = /^[\r\n ]*(.+\S)[\r\n ]*$/s
    /**
    * @alias
    */
    , docExtractor = buildHelpers_docExtractor
    ;

    /**
    * @worker
    */
    return function TestPreprocessor(
        entry
        , assets
    ) {
        //extract the test entries from the assets
        return new promise(
            extractTestEntries.bind(null, assets)
        );
    };

    /**
    * @function
    */
    function extractTestEntries(assets, resolve, reject) {
        try {
            var tests = [];

            assets.forEach(function forEachAsset(asset) {
                tests = tests.concat(
                    processAsset(asset)
                );
            });

            resolve(tests);
        }
        catch(ex) {
            reject(ex);
        }
    }
    /**
    * @function
    */
    function processAsset(asset) {
        var docs = docExtractor(asset)
        , tests = [];

        //loop through the doc assets, for the test entries,
        docs.forEach(function forEachDocEntry(entry, indx) {
            //process the doc entry's test property
            if (!!entry.test) {
                //create the test asset and add it to the list
                tests.push(
                    createTestAsset(
                        entry
                        , asset
                    )
                );
            }
        });

        return tests;
    }
    /**
    * @function
    */
    function createTestAsset(docEntry, asset) {
        var data = asset.data
        , test = {}
        , funcMeta;
        //loop through the test properties, skipping the meta properties
        Object.keys(docEntry.test)
        .filter(function filterKeys(key) {
            return cnsts.skipProperties.indexOf(key) === -1;
        })
        .forEach(function forEachKey(key) {
            var prop = docEntry.test[key];
            test[key] = prop.name || prop.desc;
        });
        //pull the test code from the data
        test.data = data.substring(
            docEntry.documentEnd
            , docEntry.offsetEnd
        );
        test.data = test.data.match(TRIM_PATT)[1];

        //make sure we have a test type
        if (!test.hasOwnProperty("type")) {
            test.type = defaults.testEntryType;
        }

        //get the test function name
        funcMeta = utils_funcInspector(
            test.data
        );
        test.dependencies = funcMeta.params;
        //use the function name if the test doesn't have one already
        if (!test.name) {
            test.name = funcMeta.name;
        }
        //if there isn't a namespace use the file namespace
        if (!test.namespace) {
            test.namespace = asset.meta.namespace;
        }
        //use the namespace + test name as the id if missing
        if (!test.id) {
            test.id = `${test.namespace}.${test.name}`;
        }

        return test;
    }
}