/**
*
* @factory
*/
function _RunServer(
    $route$_server
) {

    /**
    * @worker
    */
    return function RunServer(cmdArgs) {
        //start the server listening
        return $route$_server.listen(
            cmdArgs.arguments
        );
    };
}