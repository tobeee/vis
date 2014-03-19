/**
 * Created by Alex on 3/14/14.
 */

self.addEventListener('message', function(e) {_workerListener(e);}, false);

function _workerListener(event) {
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
}


  /**
   * This function traverses the barnesHutTree. It checks when it can approximate distant nodes with their center of mass.
   * If a region contains a single node, we check if it is not itself, then we apply the force.
   *
   * @param parentBranch
   * @param node
   * @private
   */
  function _getForceContribution(parentBranch,node) {
    // we get no force contribution from an empty region
    if (parentBranch.childrenCount > 0) {
      var dx,dy,distance;

      // get the distance from the center of mass to the node.
      dx = parentBranch.centerOfMass.x - node.x;
      dy = parentBranch.centerOfMass.y - node.y;
      distance = Math.sqrt(dx * dx + dy * dy);

      // BarnesHut condition
      // original condition : s/d < theta = passed  ===  d/s > 1/theta = passed
      // calcSize = 1/s --> d * 1/s > 1/theta = passed
      if (distance * parentBranch.calcSize > this.constants.physics.barnesHut.theta) {
        // duplicate code to reduce function calls to speed up program
        if (distance == 0) {
          distance = 0.1*Math.random();
          dx = distance;
        }
        var gravityForce = this.constants.physics.barnesHut.gravitationalConstant * parentBranch.mass * node.mass / (distance * distance * distance);
        var fx = dx * gravityForce;
        var fy = dy * gravityForce;
        node.fx += fx;
        node.fy += fy;
      }
      else {
        // Did not pass the condition, go into children if available
        if (parentBranch.childrenCount == 4) {
          this._getForceContribution(parentBranch.children.NW,node);
          this._getForceContribution(parentBranch.children.NE,node);
          this._getForceContribution(parentBranch.children.SW,node);
          this._getForceContribution(parentBranch.children.SE,node);
        }
        else { // parentBranch must have only one node, if it was empty we wouldnt be here
          if (parentBranch.children.data.id != node.id) { // if it is not self
            // duplicate code to reduce function calls to speed up program
            if (distance == 0) {
              distance = 0.5*Math.random();
              dx = distance;
            }
            var gravityForce = this.constants.physics.barnesHut.gravitationalConstant * parentBranch.mass * node.mass / (distance * distance * distance);
            var fx = dx * gravityForce;
            var fy = dy * gravityForce;
            node.fx += fx;
            node.fy += fy;
          }
        }
      }
    }
  }



  function _updateBranchMass(parentBranch, node) {
    var totalMass = parentBranch.mass + node.mass;
    var totalMassInv = 1/totalMass;

    parentBranch.centerOfMass.x = parentBranch.centerOfMass.x * parentBranch.mass + node.x * node.mass;
    parentBranch.centerOfMass.x *= totalMassInv;

    parentBranch.centerOfMass.y = parentBranch.centerOfMass.y * parentBranch.mass + node.y * node.mass;
    parentBranch.centerOfMass.y *= totalMassInv;

    parentBranch.mass = totalMass;
    var biggestSize = Math.max(Math.max(node.height,node.radius),node.width);
    parentBranch.maxWidth = (parentBranch.maxWidth < biggestSize) ? biggestSize : parentBranch.maxWidth;

  }


  function _placeInTree(parentBranch,node,skipMassUpdate) {
    if (skipMassUpdate != true || skipMassUpdate === undefined) {
      // update the mass of the branch.
      this._updateBranchMass(parentBranch,node);
    }

    if (parentBranch.children.NW.range.maxX > node.x) { // in NW or SW
      if (parentBranch.children.NW.range.maxY > node.y) { // in NW
        this._placeInRegion(parentBranch,node,'NW');
      }
      else { // in SW
        this._placeInRegion(parentBranch,node,'SW');
      }
    }
    else { // in NE or SE
      if (parentBranch.children.NW.range.maxY > node.y) { // in NE
        this._placeInRegion(parentBranch,node,'NE');
      }
      else { // in SE
        this._placeInRegion(parentBranch,node,'SE');
      }
    }
  }


  function _placeInRegion(parentBranch,node,region) {
    switch (parentBranch.children[region].childrenCount) {
      case 0: // place node here
        parentBranch.children[region].children.data = node;
        parentBranch.children[region].childrenCount = 1;
        this._updateBranchMass(parentBranch.children[region],node);
        break;
      case 1: // convert into children
        // if there are two nodes exactly overlapping (on init, on opening of cluster etc.)
        // we move one node a pixel and we do not put it in the tree.
        if (parentBranch.children[region].children.data.x == node.x &&
          parentBranch.children[region].children.data.y == node.y) {
          node.x += Math.random();
          node.y += Math.random();
          this._placeInTree(parentBranch,node,true);
        }
        else {
          this._splitBranch(parentBranch.children[region]);
          this._placeInTree(parentBranch.children[region],node);
        }
        break;
      case 4: // place in branch
        this._placeInTree(parentBranch.children[region],node);
        break;
    }
  }


  /**
   * this function splits a branch into 4 sub branches. If the branch contained a node, we place it in the subbranch
   * after the split is complete.
   *
   * @param parentBranch
   * @private
   */
  function _splitBranch(parentBranch) {
    // if the branch is filled with a node, replace the node in the new subset.
    var containedNode = null;
    if (parentBranch.childrenCount == 1) {
      containedNode = parentBranch.children.data;
      parentBranch.mass = 0; parentBranch.centerOfMass.x = 0; parentBranch.centerOfMass.y = 0;
    }
    parentBranch.childrenCount = 4;
    parentBranch.children.data = null;
    this._insertRegion(parentBranch,'NW');
    this._insertRegion(parentBranch,'NE');
    this._insertRegion(parentBranch,'SW');
    this._insertRegion(parentBranch,'SE');

    if (containedNode != null) {
      this._placeInTree(parentBranch,containedNode);
    }
  }


  /**
   * This function subdivides the region into four new segments.
   * Specifically, this inserts a single new segment.
   * It fills the children section of the parentBranch
   *
   * @param parentBranch
   * @param region
   * @param parentRange
   * @private
   */
  function _insertRegion(parentBranch, region) {
    var minX,maxX,minY,maxY;
    var childSize = 0.5 * parentBranch.size;
    switch (region) {
      case 'NW':
        minX = parentBranch.range.minX;
        maxX = parentBranch.range.minX + childSize;
        minY = parentBranch.range.minY;
        maxY = parentBranch.range.minY + childSize;
        break;
      case 'NE':
        minX = parentBranch.range.minX + childSize;
        maxX = parentBranch.range.maxX;
        minY = parentBranch.range.minY;
        maxY = parentBranch.range.minY + childSize;
        break;
      case 'SW':
        minX = parentBranch.range.minX;
        maxX = parentBranch.range.minX + childSize;
        minY = parentBranch.range.minY + childSize;
        maxY = parentBranch.range.maxY;
        break;
      case 'SE':
        minX = parentBranch.range.minX + childSize;
        maxX = parentBranch.range.maxX;
        minY = parentBranch.range.minY + childSize;
        maxY = parentBranch.range.maxY;
        break;
    }


    parentBranch.children[region] = {
      centerOfMass:{x:0,y:0},
      mass:0,
      range:{minX:minX,maxX:maxX,minY:minY,maxY:maxY},
      size: 0.5 * parentBranch.size,
      calcSize: 2 * parentBranch.calcSize,
      children: {data:null},
      maxWidth: 0,
      level: parentBranch.level+1,
      childrenCount: 0
    };
  }