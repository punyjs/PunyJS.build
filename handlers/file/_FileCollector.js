/**
*
* @factory
*/
function _FileCollector(
    promise
    , buildHelpers_file_filePathProcessor
    , buildHelpers_file_multiPathLoader
    , buildHelpers_file_pathListFilter
    , buildHelpers_file_checkoutRepositories
    , buildHelpers_javaScriptMetaExtractor
    , buildHelpers_pathParser
    , workspacePath
    , node_path
    , is_object
    , is_array
    , reporter
    , defaults
    , errors
) {
    /**
    * @alias
    */
    var filePathProcessor = buildHelpers_file_filePathProcessor
    /**
    * @alias
    */
    , multiPathLoader = buildHelpers_file_multiPathLoader
    /**
    * @alias
    */
    , pathListFilter = buildHelpers_file_pathListFilter
    /**
    * @alias
    */
    , checkoutRepositories = buildHelpers_file_checkoutRepositories
    /**
    * @alias
    */
    , pathParser = buildHelpers_pathParser
    /**
    * @alias
    */
    , javaScriptMetaExtractor = buildHelpers_javaScriptMetaExtractor
    /**
    * A regiular expression pattern for matching the file seperator
    * @property
    */
    , SEP_PATT = /[\\\/]/g;
    ;

    /**
    * @worker
    *   @async
    */
    return function FileCollector(
        entry
        , assets
        , procDetail
    ) {
        var  proc = promise.resolve();

        //checkout any required repositories
        if (entry.config.checkout === true) {
            proc = checkoutRepositories(
                entry
                , procDetail
            );
        }

        //then run the file path processor for each member of the files array
        return proc
        .then(function thenProcessPaths() {
            return processFilePaths(
                entry
            );
        })
        //then filter the array of path arrays based on the fragment and/or modifier
        .then(function thenFilterPathList(paths) {
            if (paths.length === 0) {
                return promise.resolve(paths);
            }
            //add the exclusions from the config
            addPathExclusions(
                paths
                , entry.config
            );
            //filter the paths
            return pathListFilter (
                paths
            );
        })
        //load the files
        .then(function thenLoadFiles(paths) {
            if (!paths) {
                return promise.resolve([]);
            }
            return multiPathLoader(
                paths
                , procDetail
            );
        })
        //then add the meta data
        .then(function thenAddMetaData(assets) {
            return addMetaData(
                entry
                , assets
            );
        });
    };

    /**
    * Creates an array of promises, each of which executes the file path processor for a path in the files array from the manifest entry
    * @function
    */
    function processFilePaths(entry) {
        var files = entry[defaults.pathsPropertyName], procs = [];

        if (!Array.isArray(files)) {
            if (!is_object(entry.include)) {
                return promise.reject(
                    new Error(
                        `${errors.missing_paths_property} (${entry.type})`
                    )
                );
            }
            return promise.resolve([]);
        }

        //create a promise group to run concurrently
        files.forEach(function forEachPath(path) {
            procs.push(
                filePathProcessor(
                    path
                    , entry.config.project
                )
            );
        });

        return Promise.all(procs);
    }
    /**
    * Adds the path exclusions to the paths array
    * @function
    */
    function addPathExclusions(paths, config) {
        if (is_array(config.excludePaths)) {
            config.excludePaths
            .forEach(function forEachExclude(path) {
                var pathFrag = pathParser(path);
                pathFrag.minus = true;
                paths.push(
                    {
                        "path": pathFrag
                    }
                );
            });
        }
    }
    /**
    * @function
    */
    function addMetaData(entry, assets) {
        try {
            assets.forEach(function forEachAsset(asset) {
                var meta = getAssetMetaData(
                    entry
                    , asset
                );
                asset.meta = meta;
            });

            return promise.resolve(assets);
        }
        catch(ex) {
            return promise.reject(ex);
        }
    }
    /**
    * @function
    */
    function getAssetMetaData(entry, asset) {
        var meta, name;

        if (asset.path.ext === ".js") {
            meta = javaScriptMetaExtractor(
                asset
            );
        }
        else {
            meta = {};
        }

        if (!!entry.config.project) {
            meta.projectName = entry.config.project;
        }

        //create the namespace from the path
        name = createNamespace(
            asset.path
        );

        meta.namespace = name.namespace;
        meta.schemes = name.schemes;

        return meta;
    }
    /**
    * @function
    */
    function createNamespace(path) {
        var dotIndex = path.name.indexOf(".")
        , name = dotIndex === -1
            ? path.name
            : path.name
                .substring(0, dotIndex)
        , schemes = dotIndex !== -1
            ? path.name
                .substring(dotIndex + 1)
                .split(".")
            : null
        , namespace = path.dir
            .replace(SEP_PATT, ".")
        , rootPath = node_path.join(workspacePath, defaults.sourceDirectory)
            .replace(SEP_PATT, ".")
        ;
        namespace = namespace.replace(`${rootPath}.`, "");

        return {
            "namespace": `${namespace}.${name}`
            , "schemes": schemes
        };
    }
}