/**
*
* @factory
*/
function _RegistryEntryCreator(
    is_empty
    , is_string
    , encode
    , defaults
    , errors
) {
    /**
    * A regexp pattern to remove the leading comments from a javascript file
    * @property
    */
    var LEADING_COMM_PATT = /^^(?:(?:[/][*]{2}(?:.+?)(?<=[*])[/])|(?:[/]{2}[^\r\n]*)|\s)+/ms
    /**
    * A regexp pattern for matching underscores
    * @property
    */
    , LD_PATT = /[_]/g
    /**
    * A regexp pattern for replacing double quotes
    * @property
    */
    , QUOTE_PATT = /(?<![\\])["]/g
    /**
    * A regexp pattern for replacing new line characters
    * @property
    */
    , NL_PATT = /\r?\n/g
    /**
    * An array of extensions that require base64 enconding
    * @property
    */
    , base64Exts = Object.keys(defaults.base64EncodeMap)
    ;

    /**
    * @worker
    */
    return function RegistryEntryCreator(config, asset) {
        var namespace = asset.naming.namespace
        , value = asset.data
        , deps
        , options;
        //if this is javascript get the meta data
        if (asset.path.ext === ".js") {
            //remove any leading comments
            value = value.replace(LEADING_COMM_PATT, "");
            //try to get meta info about the asset
            var meta = asset.meta;
            if (meta.isFactory) {
                deps = getFactoryDependencies(
                    meta
                );
                if (!is_empty(deps)) {
                    options = {
                        "dependencies": deps
                    };
                }
            }
        }
        //see if this is
        else if (base64Exts.indexOf(asset.path.ext) !== -1) {
            value = base64EncodeValue(
                asset
            );
        }
        //if not json we'll need to encapsulate it
        else if (asset.path.ext !== ".json") {
            if (is_string(value)) {
                //escape quotes
                value = value.replace(QUOTE_PATT, "\\\"");
                //handle new line
                value = value.replace(NL_PATT, " \\\r\n");
                value = `"${value}"`;
            }
            else {
                value = `${value}`;
            }
        }

        return {
            "namespace": namespace
            , "value": value
            , "options": options
        };
    };

    /**
    * Changes the arguments to abstract namespace notation
    * @function
    */
    function getFactoryDependencies(meta) {
        return meta.arguments.map(function mapArgs(arg) {
            var depEntry = [
                `.${arg.replace(LD_PATT, ".")}`
            ];
            if (meta.argumentDefaults.hasOwnProperty(arg)) {
                depEntry.push({
                    "default": JSON.parse(meta.argumentDefaults[arg])
                });
            }
            return depEntry;
        });
    }
    /**n
    * @function
    */
    function base64EncodeValue(asset) {
        var mimeType = defaults.base64EncodeMap[asset.path.ext]
        , encodedData = encode.toBase64(
            asset.data
        );

        return `"data:${mimeType};base64,${encodedData}"`;
    }
}