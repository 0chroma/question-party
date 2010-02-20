from txjsonrpc.web.jsonrpc import JSONRPC

class QpRpc(JSONRPC):
    def jsonrpc_foo(self):
        return "lol"
