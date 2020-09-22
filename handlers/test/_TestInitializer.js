/**
* The test initializer ensures the manifest entry has a test file entry in the `paths` array, as well as applies the default manifest entry configuration and adds required dependencies to the dtree
* @factory
* @config
*   @property {string} pathSuffix The file name suffix used as a filter
*
*/
function _TestInitializer(
    promise
    , is_array
    , is_object
    , is_numeric
    , is_empty
    , is_nill
    , utils_copy
    , defaults
) {

    /**
    * @worker
    */
    return function TestInitializer(
        entry
    ) {
        //add the test wildcard path to the manifest entry
        return addPathSuffix(
            entry
        )
        //then set determine the unit(s) under test
        .then(function thenDetermineUnitUnderTest() {
            return determineUnitUnderTest(entry);
        });
    };

    /**
    * Adds the default *.test.js entry to the paths property
    * @function
    */
    function addPathSuffix(entry) {
        try {
            ///INPUT VALIDATION
            //add the files entry if one doesn't exist
            if (!entry.hasOwnProperty(defaults.pathsPropertyName)) {
                entry[defaults.pathsPropertyName] = [];
            }
            //if the files entry is not an array
            if (!is_array(entry[defaults.pathsPropertyName])) {
                throw new Error(
                    `${errors.invalid_paths_property} (${typeof entry[defaults.pathsPropertyName]})`
                );
            }
            ///END INPUT VALIDATION

            //see if there is an entry with route.js in it
            if (!hasTestPathEntry(entry)) {
                entry[defaults.pathsPropertyName]
                    .push(`[r]./*${entry.config.test.pathSuffix}`);
            }

            return promise.resolve();
        }
        catch(ex) {
            return promise.reject(ex);
        }
    }
    /**
    * Checks the paths property for a test.js entry
    * @function
    */
    function hasTestPathEntry(entry) {
        var notFound =
            entry[defaults.pathsPropertyName]
            .every(function everyPath(path) {
                if (path.indexOf(entry.config.test.pathSuffix) !== -1) {
                    return false;
                }
                return true;
            });
        return !notFound;
    }
    /**
    * @function
    */
    function determineUnitUnderTest(entry) {
        try {
            var unitNameTemplate = defaults.unitUnderTestNameTemplate
            , unitName
            , includePropNames = Object.values(defaults.includeProperties)
            ;
            ///INPUT VALIDATION
            //if we don't have a `units` property, create the default
            if (!entry.hasOwnProperty("units")) {
                entry.units = {};
            }
            //if we don't have any unit entries then add the default
            if (is_empty(entry.units)) {
                unitName = unitNameTemplate.replace("${index}", 1);
                entry.units[unitName] = {
                    "include": {}
                };
            }
            //check each unit to see if it's using shorthand and to ensure there is an include
            Object.keys(entry.units)
            .forEach(function forEachKey(key) {
                var unit = entry.units[key], includeIndex;
                //shorthand, the property value is the include index
                if (!is_object(unit)) {
                    includeIndex = unit;
                    unit = entry.units[key] = {
                        "include": {}
                    };
                }
                //we must have an include object
                if (!unit.hasOwnProperty("include")) {
                    unit.include = {};
                }
                if (is_empty(unit.include)) {
                    if (is_numeric(includeIndex)) {
                        unit.include[defaults.testIncludeType] = includeIndex;
                    }
                    else {
                        unit.include[defaults.testIncludeType] =
                            defaults.testIncludeIndex;
                    }
                }
            });
            //make sure we have the entry level include object
            if (!is_object(entry.include)) {
                entry.include = {};
            }
            ///END INPUT VALIDATION

            //loop through the units and add each units include to the entry level include collection
            Object.keys(entry.units)
            .forEach(function forEachUnit(key) {
                var unit = entry.units[key]
                , unitInclude = unit.include
                , entryInclude = entry.include
                ;

                Object.keys(unitInclude)
                .forEach(function forEachUniutInclude(key) {
                    var includeValue = unitInclude[key];
                    ///INPUT VALIDATION
                    if (!entryInclude.hasOwnProperty(key)) {
                        entryInclude[key] = [];
                    }
                    else if (!is_array(entryInclude[key])) {
                        entryInclude[key] = [entryInclude[key]];
                    }
                    ///END INPUT VALIDATION
                    entryInclude[key].push(
                        includeValue
                    );
                });
            });

            return promise.resolve();
        }
        catch(ex) {
            return promise.reject(ex);
        }
    }
}