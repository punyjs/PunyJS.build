/**
*
* @factory
*/
function _TestPackager(
    promise
    , is_array
    , is_nill
    , utils_reference
) {
    /**
    * A regular expression patter for replacing "{tag}" bind variables
    * @property
    */
    var TAG_PATT = /\{([^\}]+)\}/g
    ;

    /**
    * @worker
    */
    return function TestPackager(
        entry
        , assets
    ) {
        try {
            var testFile = assets.shift()
            //create unit entries for each additional asset
            , units = createUnits(
                entry
                , assets
            );
            //add the units to the test data and stringify
            testFile.data = testFile.data.concat(units);
            testFile.data = JSON.stringify(testFile.data);

            return promise.resolve([testFile]);
        }
        catch(ex) {
            return promise.reject(ex);
        }
    };

    /**
    * @function
    */
    function createUnits(entry, assets) {
        var unitEntries = [];
        //loop through the assets

        assets
        .forEach(function forEachAsset(asset) {
            //determine the unit that the asset came from
            var unitKey = determineUnitKey(
                entry.units
                , asset
            )
            //create the unit entry
            , unitEntry = createUnitEntry(
                entry
                , asset
                , unitKey
            );

            unitEntries.push(unitEntry);
        });

        return unitEntries;
    }
    /**
    * @function
    */
    function determineUnitKey(units, asset) {
        var unitKey;

        if (!asset.included) {
            return;
        }

        Object.keys(units)
        .every(function findUnit(key) {
            var unit = units[key]
            , includeIndex = determineIncludeIndex(
                asset
                , unit
            );

            if (!is_nill(includeIndex)) {
                unitKey = key;
                return false;
            }

            return true;
        });

        return unitKey;
    }
    /**
    * @function
    */
    function determineIncludeIndex(asset, unit) {
        var includeIndex;

        Object.keys(unit.include)
        .every(function findIncludeIndex(includeKey) {
            var include = unit.include[includeKey];
            if (asset.included.includeName === includeKey) {
                if (asset.included.originalIndex === include) {
                    includeIndex = include;
                    return false;
                }
            }
            return true;
        });
    //console.log(asset.included, unit.include, includeIndex)
        return includeIndex;
    }
    /**
    * @function
    */
    function createUnitEntry(entry, asset, unitKey) {
        var unit = entry.units[unitKey];
        //record the number of assets that are associated to this unit
        if (is_nill(unit.count)) {
            unit.count = 1;
        }
        else {
            unit.count++;
        }
        //if there is not a nameTemplate use the unit key
        if (!unit.hasOwnProperty("nameTemplate")) {
            name = unitKey;
            if (unit.count > 1) {
                name+= `${unit.count - 1}`;
            }
        }
        else {
            templateData = {
                "key": unitKey
                , "unit": unit
                , "asset": asset
            };
            name = unit.nameTemplate.replace(
                TAG_PATT
                , function replaceTag(tag, path) {
                    var ref = utils_reference(
                        path
                        , templateData
                    );
                    if (ref.found) {
                        return ref.value;
                    }
                    return tag;
                }
            );
        }
        return {
            "type": "unit"
            , "id": name
            , "name": name
            , "namespace": name
            , "data": asset.data
        };
    }
}