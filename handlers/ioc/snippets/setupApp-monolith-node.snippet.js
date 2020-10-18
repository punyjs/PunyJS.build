/**
*
* @function
*/
function setupApp(app) {
    try {
        //extend the node global to include require and other not included in the global object
        var extendendGlobal = Object.create(
            global
            , {
                "require": {
                    "enumerable": true
                    , "value": require
                }
                , "module": {
                    "enumerable": true
                    , "value": module
                }
                , "process": {
                    "enumerable": true
                    , "value": process
                }
                , "__dirname": {
                    "enumerable": true
                    , "value": __dirname
                }
                , "__filename": {
                    "enumerable": true
                    , "value": __filename
                }
                , "console": {
                    "enumerable": true
                    , "value": console
                }
                , "exports": {
                    "enumerable": true
                    , "value": exports
                }
                , "TextDecoder": {
                    "enumerable": true
                    , "value": TextDecoder
                }
                , "TextEncoder": {
                    "enumerable": true
                    , "value": TextEncoder
                }
                , "URL": {
                    "enumerable": true
                    , "value": URL
                }
                , "URLSearchParams": {
                    "enumerable": true
                    , "value": URLSearchParams
                }
                , "WebAssembly": {
                    "enumerable": true
                    , "value": WebAssembly
                }
                , "Buffer": {
                    "enumerable": true
                    , "value": Buffer
                }
                , "Promise": {
                    "enumerable": true
                    , "value": Promise
                }
                , "Proxy": {
                    "enumerable": true
                    , "value": Proxy
                }
                , "Date": {
                    "enumerable": true
                    , "value": Date
                }
                , "JSON": {
                    "enumerable": true
                    , "value": JSON
                }
                , "Object": {
                    "enumerable": true
                    , "value": Object
                }
                , "Function": {
                    "enumerable": true
                    , "value": Function
                }
                , "setTimeout": {
                    "enumerable": true
                    , "value": setTimeout
                }
            }
        );
        //setup IOC controller
        app.controller
            .setup
            .setContainer(app.container)
            .setAbstractTree(app.dependencyTree)
            .setGlobal(
                extendendGlobal
            )
        ;

        //add the ioc reporter as a dependency
        app.controller.dependency.upsert(
            ".reporter"
            , app.reporter
        );

        //report setup done
        app.reporter.info(
            `System Setup Complete`
        );

        return Promise.resolve(app);
    }
    catch(ex) {
        return Promise.reject(ex);
    }
}