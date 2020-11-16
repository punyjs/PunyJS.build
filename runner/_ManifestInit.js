/**
* The ManifestInit utility uses the raw manifest object to generate an array of `{iManifestEntry}` instances. The `entries` property is the base for the array, each member is initialized and the default properties are applied to the entry object. The root properties in the manifest, other than the entries property, are add to each manifest entry; as a copy so no references exist between manifest entries.
* @factory
*   @dependency {function} utils_copy [":PunyJS.core.object.Copy"]
*   @dependency {function} utils_merge [":PunyJS.core.object.Merge"]
*   @dependency {function} utils_reference [":PunyJS.core.object.Reference"]
*   @dependency {function} is_object [":PunyJS.core.is_Object"]
*   @dependency {function} is_array [":PunyJS.core.is_Array"]
*   @dependency {object} defaults [":PunyJS.build.runner.Defaults"]
*   @dependency {object} errors [":PunyJS.build.runner.Errors"]
* @interface iManifestEntry
*   @property {string} type The build type to use for this manifest entry
*/
function _ManifestInit(
    utils_copy
    , utils_merge
    , utils_reference
    , is_object
    , is_array
    , is_nill
    , reporter
    , processDetails
    , defaults
    , errors
) {
    /**
    * A regular expression pattern for replacing bind variables in the entry value.
    * @property
    */
    var VAR_PATT = /\$\{([^\}]+)\}/g;

    /**
    * @worker
    */
    return function ManifestInit(manifest) {
        //check that the entries property is an array
        var entries = manifest[defaults.manifestEntriesPropertyName];
        if (!Array.isArray(entries)) {
            throw new Error(`${errors.invalid_manifest} (${typeof entries})`);
        }

        var initializedEntries = initManifest(
            manifest
        );

        updateInitializedEntries(
            initializedEntries
        );

        return initializedEntries;
    };

    /**
    * @function
    */
    function initManifest(manifest, parentProcDetail) {
        var entries = manifest[defaults.manifestEntriesPropertyName]
        , initializedEntries = []
        , manifestProcDetail
        ;
        if (!is_array(entries)) {
            return;
        }
        ///LOGGING
        manifestProcDetail = processDetails(
            "initManifest"
            , "_ManifestInit.ManifestInit"
            , parentProcDetail
        );
        reporter.extended(
            `Initializing manifest, ${entries.length} entries`
            , manifestProcDetail
        );
        ///END LOGGING
        //loop through the manifest entries, adding the manifest properties
        entries.forEach(function forEachEntry(entry, indx) {
            var entryProcDetail = processDetails(
                "initEntry"
                , "_ManifestInit.ManifestInit"
                , manifestProcDetail
            )
            , initializedEntry = initEntry(
                manifest
                , entry
                , indx
                , entryProcDetail
            );
            //if the initialized entry has an entries property run as a manifest
            if (
                initializedEntry.hasOwnProperty(
                    defaults.manifestEntriesPropertyName
                )
            ) {
                initializedEntries = initializedEntries.concat(
                    initManifest(
                        initializedEntry
                        , entryProcDetail
                    )
                );
            }
            //otherwise add the entry to the array
            else {
                initializedEntries.push(
                    initializedEntry
                );
            }
        });

        return initializedEntries;
    }
    /**
    * @function
    */
    function initEntry(manifest, entry, indx, procDetail) {
        ///LOGGING
        reporter.extended(
            `Initializing entry ${entry.name || indx}`
            , procDetail
        );
        ///END LOGGING
        //make a copy of the manifest to remove references
        manifest = utils_copy(manifest);
        delete manifest[defaults.manifestEntriesPropertyName];
        //Create a new entry merged with the manifest copy
        var newEntry = mergeObjects(
            manifest
            , entry
        );

        return newEntry;
    }
    /**
    * @function
    */
    function updateInitializedEntries(entries) {
        ///LOGGING
        reporter.extended(
            `Setting bind vars for ${entries.length} entries`
        );
        ///END LOGGING
        entries
        .forEach(function forEachEntry(entry) {
            updateEntryProperties(
                entry
            );
        });
    }
    /**
    * @function
    */
    function updateEntryProperties(entry, base) {
        base = base || entry;
        Object.keys(entry)
        .forEach(function forEachKey(key) {
            var val = entry[key];
            if (is_object(val) || is_array(val)) {
                updateEntryProperties(
                    val
                    , base
                );
            }
            else if (typeof val === "string") {
                while(VAR_PATT.test(val)) {
                    val = val.replace(
                        VAR_PATT
                        , function updateVar(match, name) {
                            var ref = utils_reference(name, base);
                            if (ref.found) {
                                return ref.value || "";
                            }
                            throw new Error(
                                `${errors.missing_manifest_variable} (${name})`
                            );
                        }
                    );
                }
                entry[key] = val;
            }
        });
    }
    /**
    * @function
    */
    function mergeObjects(topObject, finalObject) {
        var obj = {};
        //add the top object property without any + prefixes
        Object.keys(topObject)
        .forEach(function forEachTopKey(key) {
            if (key[0] === "+") {
                key = key.substring(1);
            }
            obj[key] = topObject[key];
        });
        //add/replace properties from the finalManifest
        Object.keys(finalObject)
        .forEach(function forEachFinalKey(key) {
            var value = finalObject[key]
            , append = key[0] === "+"
                ? ((key = key.substring(1)), true)
                : false
            ;
            //if the property is already on the manifest
            if (obj.hasOwnProperty(key)) {
                //arrays are concatinated
                if (is_array(obj[key]) && is_array(value)) {
                    obj[key] = obj[key].concat(value)
                    return;
                }
                //objects are merged
                else if (is_object(obj[key]) && is_object(value)) {
                    obj[key] = mergeObjects(obj[key], value);
                    return;
                }
                //if append then concat the current value and final value
                if (append) {
                    obj[key] = obj[key] + value;
                    return;
                }
                //anything else gets overwritten
            }
            //a null means we're not including this property at all
            if (value === null) {
                delete obj[key];
                return;
            }
            //otherwise add the property straight up
            obj[key] = value;
        });

        return obj;
    }
}