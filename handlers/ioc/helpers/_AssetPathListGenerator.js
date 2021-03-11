/**
* The asset path list generator uses a translated dependency tree to create a collection of asset paths and their assocaited dependency entries.
* @factory
*/
function _AssetPathListGenerator(
    promise
    , workspacePath
    , defaults
) {
    /**
    * A reg exp pattern for replacing namespace dots
    * @property
    */
    var DOT_PATT = /(?<![\\])[.]/g
    /**
    * A reg exp pattern for replacing back slashes
    * @property
    */
    , ESC_DOT_PATT = /[\\][.]/g
    /**
    * A reg exp pattern for replacing back slashes
    * @property
    */
    , BS_PATT = /[\\]/g
    /**
    * A regex pattern for finding the last capitalized word in a namespace
    * @property
    */
    , LAST_UPCASE_PATT = /(.*)?([A-Z][a-z0-9_]+)$/
    ;

    /**
    * @worker
    */
    return function AssetPathListGenerator(entry, dtree) {
        try {
            //start the namespace collection object
            var nsCollection = {};
            //add the ioc container namespace
            nsCollection[entry.config.ioc.container] = null;
            //process the dependency tree, adding to the namespace collection, as each node in the tree is processed
            processTreeNode(
                dtree
                , nsCollection
            );

            return promise.resolve(
                convertNsToPath(nsCollection)
            );
        }
        catch(ex) {
            return promise.reject(ex);
        }
    };

    /**
    * Checks the node's type and determines the namespace values to add to the list
    * @function
    */
    function processTreeNode(depEntry, nsColl) {
        //branch, loop through the members and call recursively
        if (depEntry.type === "branch") {
            Object.keys(depEntry.members)
            .forEach(function forEachKey(key) {
                processTreeNode(
                    depEntry.members[key]
                    , nsColl
                );
            });
        }
        //factory dependencies have a child factoryEntry that has the actual namespace
        else if (depEntry.type === "factory") {
            if (depEntry.factoryEntry.type === "abstract") {
                return;
            }
            if (
                !nsColl.hasOwnProperty(depEntry.factoryEntry.namespace)
            ) {
                nsColl[depEntry.factoryEntry.namespace] = [];
            }
            nsColl[depEntry.factoryEntry.namespace]
                .push(depEntry);
        }
        //if the entry is a concrete
        else if (depEntry.type === "concrete") {
            if (
                !nsColl.hasOwnProperty(depEntry.namespace)
            ) {
                nsColl[depEntry.namespace] = [];
            }
            nsColl[depEntry.namespace]
                .push(depEntry);
        }
        //a union will hve 2..n embers
        else if (depEntry.type === "union") {
            depEntry.members
            .forEach(function forEachMem(member) {
                processTreeNode(
                    member
                    , nsColl
                );
            });
        }
    }
    /**
    * Converts the namespaces to asset paths
    * @function
    */
    function convertNsToPath(nsColl) {
        var wsPath = workspacePath.replace(BS_PATT, "/")
        , sourceDir = defaults.sourceDirectory;
        return Object.keys(nsColl)
            .map(function mapNs(ns) {
                var nsEntries = nsColl[ns]
                , nsPath =  getNsPath(ns);
                return {
                    "namespace": ns
                    , "path": `${wsPath}/${sourceDir}/${nsPath}`
                    , "entries": nsColl[ns]
                };
            });
    }
    /**
    * Creates the relative project path from the namespace, using the last 4 characters as and indicator of the file extension
    * @function
    */
    function getNsPath(ns) {
        //get the last capitalized word and use it
        var match = ns.match(LAST_UPCASE_PATT), path, suffix;
        if (!!match) {
            suffix = defaults.extSuffixMap[match[2]];
            if (!!suffix) {
                path = match[1].replace(DOT_PATT, "/");

            }
        }
        //use the default suffix if there wasn't a match
        if (!path) {
            path = ns.replace(DOT_PATT, "/");
            suffix = ".<js(?:on)?>";
        }

        //replace any escaped dots with dots
        path = path.replace(ESC_DOT_PATT, ".");

        return `${path}${suffix}`;
    }
}