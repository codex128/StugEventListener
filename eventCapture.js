// for firefox
const originalRpc = window.sendrpc;
if (originalRpc) {
    window.sendrpc = function(...args) {
        const result = originalRpc.apply(this, args);
        window.postMessage({type: "FROM_GAME_RPC", payload: args});
        return result;
    };
} else {
    Console.log("Failed to find window sendrpc.");
}
