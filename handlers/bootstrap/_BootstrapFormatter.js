/**
*
* @factory
*/
function _BootstrapFormatter (
    promise
    , utils_reference
    , is_object
    , is_array
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
    return function BootstrapFormatter (
        entry
        , assets
    ) {
        try {
            assets[0].data = updateValue(
                assets[0].data
                , entry
            );

            return promise.resolve(assets);
        }
        catch (ex) {
            return promise.reject(ex);
        }
    };

    /**
    * @function
    */
    function updateValue(value, entry) {
        return value.replace(VAR_PATT, function replaceVars(match, name) {
            var ref = utils_reference(name, entry)
            , val = "";
            if (ref.found && ref.value !== undefined) {
                val = ref.value;
            }
            else if (entry.templateDefaults.hasOwnProperty(name)) {
                val = entry.templateDefaults[name];
                if (is_object(val) || is_array(val)) {
                    val = JSON.stringify(val);
                }
                val = updateValue(
                    val + ""
                    , entry
                );
            }
            if (is_object(val)) {
                val = JSON.stringify(val);
            }
            return val;
        });
    }
}