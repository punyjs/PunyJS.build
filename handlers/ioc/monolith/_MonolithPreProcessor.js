/**
*
* @factory
*/
function _MonolithPreProcessor(
    promise
    , buildHandlers_module_preprocess
    , buildHelpers_ioc_registryEntryCreator
    , buildHelpers_ioc_globalRedeclarationList
    , utils_func_inspector
) {
    /**
    * A collection of constants
    * @property
    */
    var cnsts = {
        "export": {
            "node": "module.exports = "
            , "browser": "export default "
        }
        , "defaultEngine": "browser"
    }
    /**
    * @alias
    */
    , modulePreProcessor = buildHandlers_module_preprocess
    /**
    * @alias
    */
    , registryEntryCreator = buildHelpers_ioc_registryEntryCreator
    /**
    * @alias
    */
    , globalRedeclarationList = buildHelpers_ioc_globalRedeclarationList
    /**
    * A contrainer for the stringifyied properties on the globalRedeclarationList
    * @property
    */
    , globalList = {}
    /**
    * A regexp pattern for matching new line (and CR)
    * @property
    */
    , NL_PATT = /\r?\n/g
    ;

    //setup the stringified redeclarition strings
    Object.keys(globalRedeclarationList)
    .forEach(function forEachEngine(engineKey) {
        globalList[engineKey] =
            JSON.stringify(globalRedeclarationList[engineKey]);
    });

    /**
    * @worker
    */
    return function MonolithPreProcessor(
        entry
        , assets
        , procDetail
    ) {
        //run the module preprocessor, it creates the naming for each asset
        return modulePreProcessor(
            entry
            , assets
            , procDetail
        )
        // then create header asset
        .then(function thenCreateHeaderAsset(pAssets) {
            assets = pAssets;
            return new promise(
                createHeader.bind(null, entry)
            );
        })
        //then create container asset
        .then(function thenUpdateContainerEntry(header) {
            assets.splice(1, 0, header);
            return new promise(
                updateContainerEntry.bind(null, entry, assets)
            );
        })
        //create register entries
        .then(function thenCreateRegisterEntries() {
            return new promise(
                createRegisterEntries.bind(null, entry, assets)
            );
        })
        ;
    };

    /**
    * Creates the begining of the script adding "use strict" and redeclaring the globals to hide them
    * @function
    */
    function createHeader(entry, resolve, reject) {
        try {
            var engine = entry.config.engine || cnsts.defaultEngine
            , header = {
                "data": [
                    `"use strict";`
                    , `//hide the globals from the dependencies`
                    , `var ${globalRedeclarationList[engine].join(",")};`
                ].join("\n\n")
                , "naming": {
                    "namespace": `${entry.config.project}.Header`
                    , "name": "Header"
                    , "parent": entry.config.project
                    , "root": entry.config.project.split(".")[0]
                }
            };

            resolve(header);
        }
        catch(ex) {
            reject(ex);
        }
    }
    /**
    * Updates the container entry to create an instance of _Container named `container`, exposes the `register` method, then exports the container, and finally hides the `container`
    * @function
    */
    function updateContainerEntry(entry, assets, resolve, reject) {
        try {
            var fnMeta = utils_func_inspector(
                assets[0].data
            )
            , container = fnMeta.fnText
            , engine = entry.config.engine || cnsts.defaultEngine;

            assets[0].data = [
                "// Create the IOC container"
                , `var container = (${container})(${globalList[engine]})`
                , ", register = container.register;"
                , "//export the container"
                , `${cnsts.export[engine]}container;`
                , "//hide the container from the dependencies"
                , "container = undefined;"
            ]
            . join("\n");

            resolve();
        }
        catch(ex) {
            reject(ex);
        }
    }
    /**
    * Loops through the assets and changes them to register entries
    * @function
    */
    function createRegisterEntries(entry, assets, resolve, reject) {
        try {
            //loop through each asset and create a registry entry for each
            assets.forEach(function forEachAsset(asset, indx) {
                //skip the container and header entries
                if (indx < 2) {
                    return;
                }
                //create the register entry and update the asset data
                var regEntry = registryEntryCreator(
                    entry.config
                    , asset
                )
                , entryValue = typeof regEntry.value === "string"
                    ? regEntry.value.replace(NL_PATT, "\n    ")
                    : regEntry.value
                , options
                ;
                //swap out the data for the registry entry
                if (!!regEntry.options) {
                    options = JSON.stringify(regEntry.options)
                    asset.data = `register(\n    "${regEntry.namespace}"\n    , ${entryValue}\n    , ${options}\n);`;
                }
                else {
                    asset.data = `register(\n    "${regEntry.namespace}"\n    , ${entryValue}\n);`;
                }
            });

            resolve(assets);
        }
        catch(ex) {
            reject(ex);
        }
    }
}