module.exports = {
  utils: require('./lib/utils'),

  Controller: require('./lib/timeline/Controller'),
  DataSet: require('./lib/DataSet'),
  DataView: require('./lib/DataView'),
  Range: require('./lib/timeline/Range'),
  Stack: require('./lib/timeline/Stack'),
  TimeStep: require('./lib/timeline/TimeStep'),

  Timeline: require('./lib/timeline/Timeline'),
  components: {
    Component: require('./lib/timeline/component/Component'),
    CurrentTime: require('./lib/timeline/component/CurrentTime'),
    CustomTime: require('./lib/timeline/component/CustomTime'),
    Group: require('./lib/timeline/component/Group'),
    GroupSet: require('./lib/timeline/component/GroupSet'),
    ItemSet: require('./lib/timeline/component/ItemSet'),
    Panel: require('./lib/timeline/component/Panel'),
    RootPanel: require('./lib/timeline/component/RootPanel'),
    TimeAxis: require('./lib/timeline/component/TimeAxis'),

    items: {
      Item: require('./lib/timeline/component/item/Item'),
      ItemBox: require('./lib/timeline/component/item/ItemBox'),
      ItemPoint: require('./lib/timeline/component/item/ItemPoint'),
      ItemRange: require('./lib/timeline/component/item/ItemRange'),
      ItemRangeOverflow: require('./lib/timeline/component/item/ItemRangeOverflow')
    }
  }

  /* TODO: Graph
   Graph: Graph
  graph: {
    Node: Node,
    Edge: Edge,
    Popup: Popup,
    Groups: Groups,
    Images: Images
  },
  */
};
