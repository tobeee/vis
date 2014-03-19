if (typeof window !== 'undefined') {
  window.URL = window.URL || window.webkitURL;
}

var minionsMixin = {

  _constructMinions : function() {
//    var functions = this._insertRegion.toString() + ";" +
//                    this._splitBranch.toString() + ";" +
//                    this._placeInRegion.toString() + ";" +
//                    this._placeInTree.toString() + ";" +
//                    this._updateBranchMass.toString() + ";"
//                    this._getForceContribution.toString() + ";"
//
//    functions += "self.addEventListener('message', " + this._workerListener.toString() + ", false);";
//    var blob;
//    try {
//      blob = new Blob([functions], {type: 'application/javascript'});
//    }
//    catch (e) { // Backwards-compatibility
//      window.BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder;
//      blob = new BlobBuilder();
//      blob.append(functions);
//      blob = blob.getBlob();
//    }

    this.webWorkers = [];
    this.webWorkers.push(new Worker("../../dist/dowork.js"));
    this.webWorkers.push(new Worker("../../dist/dowork.js"));
    this.webWorkers.push(new Worker("../../dist/dowork.js"));
    this.webWorkers.push(new Worker("../../dist/dowork.js"));


  },

  _workerListener : function(event) {
    var data = event.data;
    var returnData = {};
    returnData['assignment'] = event.assignment;
    if (event.assignment == 'constructTree') {
      var branch = event.branch;
      var nodes = data.nodes;
      for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        this._placeInRegion(branch,node);
      }
      returnData['area'] = data['area'];
      returnData['data'] = branch;
    }
    else if (event.assignment == 'calculateForce') {
      var treeRoot = data.root; // barnesHutTree.root.children.* -- 4 workers
      var nodes = data.nodes;
      for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        this._getForceContribution(treeRoot,node);
      }
      returnData['data'] = nodes;
    }
    self.postMessage(returnData);
  },

  _listenForWorker : function(event) {
    var data = event.data;
    if (event.assignment == 'constructTree') {

    }
    else if (event.assignment == 'calculateForce') {
      // store all calculated forces from the nodes in the worker data in this.calculationNodes
      for (var i = 0; i < data.data.length; i++) {
        var workerNode = data.data[i];
        this.calculationNodes[workerNode.id].fx += workerNode.fx;
        this.calculationNodes[workerNode.id].fy += workerNode.fy;
      }
    }
  }
};
