from txjsonrpc.web.jsonrpc import JSONRPC
from py2json import Py2JSON
from twisted.web import resource
try:
    import json # standard module in python 2.6+
except ImportError:
    import simplejson as json # external module in 2.5 and earlier

class QpRpc():
    def jsonrpc_foo(self):
        return "lol"

class ExposedQpRpc(QpRpc, JSONRPC):
    pass

class RpcSmd(resource.Resource):
    isLeaf=True
    def render_GET(self, request):
        smd = Py2JSON(QpRpc)
        #we need to fix the generated SMD so that the jsonrpc_ prefix is gone
        smdObj = json.loads(smd.schema)
        newSmdObj=smdObj.copy()
        newSmdObj["services"] = {}
        for key in smdObj["services"]:
            value = smdObj["services"][key]
            value["target"] = value["target"][len("jsonrpc_"):]
            newSmdObj["services"][key[len("jsonrpc_"):]] = value
        return json.dumps(newSmdObj)
