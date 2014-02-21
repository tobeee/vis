!function(e){"object"==typeof exports?module.exports=e():"function"==typeof define&&define.amd?define(e):"undefined"!=typeof window?window.vis=e():"undefined"!=typeof global?global.vis=e():"undefined"!=typeof self&&(self.vis=e())}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

},{"./lib/DataSet":2,"./lib/DataView":3,"./lib/timeline/Controller":5,"./lib/timeline/Range":6,"./lib/timeline/Stack":7,"./lib/timeline/TimeStep":8,"./lib/timeline/Timeline":9,"./lib/timeline/component/Component":10,"./lib/timeline/component/CurrentTime":11,"./lib/timeline/component/CustomTime":12,"./lib/timeline/component/Group":13,"./lib/timeline/component/GroupSet":14,"./lib/timeline/component/ItemSet":15,"./lib/timeline/component/Panel":16,"./lib/timeline/component/RootPanel":17,"./lib/timeline/component/TimeAxis":18,"./lib/timeline/component/item/Item":19,"./lib/timeline/component/item/ItemBox":20,"./lib/timeline/component/item/ItemPoint":21,"./lib/timeline/component/item/ItemRange":22,"./lib/timeline/component/item/ItemRangeOverflow":23,"./lib/utils":24}],2:[function(require,module,exports){
var util = require('./utils');

/**
 * DataSet
 *
 * Usage:
 *     var dataSet = new DataSet({
 *         fieldId: '_id',
 *         convert: {
 *             // ...
 *         }
 *     });
 *
 *     dataSet.add(item);
 *     dataSet.add(data);
 *     dataSet.update(item);
 *     dataSet.update(data);
 *     dataSet.remove(id);
 *     dataSet.remove(ids);
 *     var data = dataSet.get();
 *     var data = dataSet.get(id);
 *     var data = dataSet.get(ids);
 *     var data = dataSet.get(ids, options, data);
 *     dataSet.clear();
 *
 * A data set can:
 * - add/remove/update data
 * - gives triggers upon changes in the data
 * - can  import/export data in various data formats
 *
 * @param {Object} [options]   Available options:
 *                             {String} fieldId Field name of the id in the
 *                                              items, 'id' by default.
 *                             {Object.<String, String} convert
 *                                              A map with field names as key,
 *                                              and the field type as value.
 * @constructor DataSet
 */
// TODO: add a DataSet constructor DataSet(data, options)
function DataSet (options) {
  this.id = util.randomUUID();

  this.options = options || {};
  this.data = {};                                 // map with data indexed by id
  this.fieldId = this.options.fieldId || 'id';    // name of the field containing id
  this.convert = {};                              // field types by field name
  this.showInternalIds = this.options.showInternalIds || false; // show internal ids with the get function

  if (this.options.convert) {
    for (var field in this.options.convert) {
      if (this.options.convert.hasOwnProperty(field)) {
        var value = this.options.convert[field];
        if (value == 'Date' || value == 'ISODate' || value == 'ASPDate') {
          this.convert[field] = 'Date';
        }
        else {
          this.convert[field] = value;
        }
      }
    }
  }

  // event subscribers
  this.subscribers = {};

  this.internalIds = {};            // internally generated id's
}

/**
 * Subscribe to an event, add an event listener
 * @param {String} event        Event name. Available events: 'put', 'update',
 *                              'remove'
 * @param {function} callback   Callback method. Called with three parameters:
 *                                  {String} event
 *                                  {Object | null} params
 *                                  {String | Number} senderId
 */
DataSet.prototype.on = function on (event, callback) {
  var subscribers = this.subscribers[event];
  if (!subscribers) {
    subscribers = [];
    this.subscribers[event] = subscribers;
  }

  subscribers.push({
    callback: callback
  });
};

// TODO: make this function deprecated (replaced with `on` since version 0.5)
DataSet.prototype.subscribe = DataSet.prototype.on;

/**
 * Unsubscribe from an event, remove an event listener
 * @param {String} event
 * @param {function} callback
 */
DataSet.prototype.off = function off(event, callback) {
  var subscribers = this.subscribers[event];
  if (subscribers) {
    this.subscribers[event] = subscribers.filter(function (listener) {
      return (listener.callback != callback);
    });
  }
};

// TODO: make this function deprecated (replaced with `on` since version 0.5)
DataSet.prototype.unsubscribe = DataSet.prototype.off;

/**
 * Trigger an event
 * @param {String} event
 * @param {Object | null} params
 * @param {String} [senderId]       Optional id of the sender.
 * @private
 */
DataSet.prototype._trigger = function (event, params, senderId) {
  if (event == '*') {
    throw new Error('Cannot trigger event *');
  }

  var subscribers = [];
  if (event in this.subscribers) {
    subscribers = subscribers.concat(this.subscribers[event]);
  }
  if ('*' in this.subscribers) {
    subscribers = subscribers.concat(this.subscribers['*']);
  }

  for (var i = 0; i < subscribers.length; i++) {
    var subscriber = subscribers[i];
    if (subscriber.callback) {
      subscriber.callback(event, params, senderId || null);
    }
  }
};

/**
 * Add data.
 * Adding an item will fail when there already is an item with the same id.
 * @param {Object | Array | DataTable} data
 * @param {String} [senderId] Optional sender id
 * @return {Array} addedIds      Array with the ids of the added items
 */
DataSet.prototype.add = function (data, senderId) {
  var addedIds = [],
      id,
      me = this;

  if (data instanceof Array) {
    // Array
    for (var i = 0, len = data.length; i < len; i++) {
      id = me._addItem(data[i]);
      addedIds.push(id);
    }
  }
  else if (util.isDataTable(data)) {
    // Google DataTable
    var columns = this._getColumnNames(data);
    for (var row = 0, rows = data.getNumberOfRows(); row < rows; row++) {
      var item = {};
      for (var col = 0, cols = columns.length; col < cols; col++) {
        var field = columns[col];
        item[field] = data.getValue(row, col);
      }

      id = me._addItem(item);
      addedIds.push(id);
    }
  }
  else if (data instanceof Object) {
    // Single item
    id = me._addItem(data);
    addedIds.push(id);
  }
  else {
    throw new Error('Unknown dataType');
  }

  if (addedIds.length) {
    this._trigger('add', {items: addedIds}, senderId);
  }

  return addedIds;
};

/**
 * Update existing items. When an item does not exist, it will be created
 * @param {Object | Array | DataTable} data
 * @param {String} [senderId] Optional sender id
 * @return {Array} updatedIds     The ids of the added or updated items
 */
DataSet.prototype.update = function (data, senderId) {
  var addedIds = [],
      updatedIds = [],
      me = this,
      fieldId = me.fieldId;

  var addOrUpdate = function (item) {
    var id = item[fieldId];
    if (me.data[id]) {
      // update item
      id = me._updateItem(item);
      updatedIds.push(id);
    }
    else {
      // add new item
      id = me._addItem(item);
      addedIds.push(id);
    }
  };

  if (data instanceof Array) {
    // Array
    for (var i = 0, len = data.length; i < len; i++) {
      addOrUpdate(data[i]);
    }
  }
  else if (util.isDataTable(data)) {
    // Google DataTable
    var columns = this._getColumnNames(data);
    for (var row = 0, rows = data.getNumberOfRows(); row < rows; row++) {
      var item = {};
      for (var col = 0, cols = columns.length; col < cols; col++) {
        var field = columns[col];
        item[field] = data.getValue(row, col);
      }

      addOrUpdate(item);
    }
  }
  else if (data instanceof Object) {
    // Single item
    addOrUpdate(data);
  }
  else {
    throw new Error('Unknown dataType');
  }

  if (addedIds.length) {
    this._trigger('add', {items: addedIds}, senderId);
  }
  if (updatedIds.length) {
    this._trigger('update', {items: updatedIds}, senderId);
  }

  return addedIds.concat(updatedIds);
};

/**
 * Get a data item or multiple items.
 *
 * Usage:
 *
 *     get()
 *     get(options: Object)
 *     get(options: Object, data: Array | DataTable)
 *
 *     get(id: Number | String)
 *     get(id: Number | String, options: Object)
 *     get(id: Number | String, options: Object, data: Array | DataTable)
 *
 *     get(ids: Number[] | String[])
 *     get(ids: Number[] | String[], options: Object)
 *     get(ids: Number[] | String[], options: Object, data: Array | DataTable)
 *
 * Where:
 *
 * {Number | String} id         The id of an item
 * {Number[] | String{}} ids    An array with ids of items
 * {Object} options             An Object with options. Available options:
 *                              {String} [type] Type of data to be returned. Can
 *                                              be 'DataTable' or 'Array' (default)
 *                              {Object.<String, String>} [convert]
 *                              {String[]} [fields] field names to be returned
 *                              {function} [filter] filter items
 *                              {String | function} [order] Order the items by
 *                                  a field name or custom sort function.
 * {Array | DataTable} [data]   If provided, items will be appended to this
 *                              array or table. Required in case of Google
 *                              DataTable.
 *
 * @throws Error
 */
DataSet.prototype.get = function (args) {
  var me = this;
  var globalShowInternalIds = this.showInternalIds;

  // parse the arguments
  var id, ids, options, data;
  var firstType = util.getType(arguments[0]);
  if (firstType == 'String' || firstType == 'Number') {
    // get(id [, options] [, data])
    id = arguments[0];
    options = arguments[1];
    data = arguments[2];
  }
  else if (firstType == 'Array') {
    // get(ids [, options] [, data])
    ids = arguments[0];
    options = arguments[1];
    data = arguments[2];
  }
  else {
    // get([, options] [, data])
    options = arguments[0];
    data = arguments[1];
  }

  // determine the return type
  var type;
  if (options && options.type) {
    type = (options.type == 'DataTable') ? 'DataTable' : 'Array';

    if (data && (type != util.getType(data))) {
      throw new Error('Type of parameter "data" (' + util.getType(data) + ') ' +
          'does not correspond with specified options.type (' + options.type + ')');
    }
    if (type == 'DataTable' && !util.isDataTable(data)) {
      throw new Error('Parameter "data" must be a DataTable ' +
          'when options.type is "DataTable"');
    }
  }
  else if (data) {
    type = (util.getType(data) == 'DataTable') ? 'DataTable' : 'Array';
  }
  else {
    type = 'Array';
  }

  // we allow the setting of this value for a single get request.
  if (options != undefined) {
    if (options.showInternalIds != undefined) {
      this.showInternalIds = options.showInternalIds;
    }
  }

  // build options
  var convert = options && options.convert || this.options.convert;
  var filter = options && options.filter;
  var items = [], item, itemId, i, len;

  // convert items
  if (id != undefined) {
    // return a single item
    item = me._getItem(id, convert);
    if (filter && !filter(item)) {
      item = null;
    }
  }
  else if (ids != undefined) {
    // return a subset of items
    for (i = 0, len = ids.length; i < len; i++) {
      item = me._getItem(ids[i], convert);
      if (!filter || filter(item)) {
        items.push(item);
      }
    }
  }
  else {
    // return all items
    for (itemId in this.data) {
      if (this.data.hasOwnProperty(itemId)) {
        item = me._getItem(itemId, convert);
        if (!filter || filter(item)) {
          items.push(item);
        }
      }
    }
  }

  // restore the global value of showInternalIds
  this.showInternalIds = globalShowInternalIds;

  // order the results
  if (options && options.order && id == undefined) {
    this._sort(items, options.order);
  }

  // filter fields of the items
  if (options && options.fields) {
    var fields = options.fields;
    if (id != undefined) {
      item = this._filterFields(item, fields);
    }
    else {
      for (i = 0, len = items.length; i < len; i++) {
        items[i] = this._filterFields(items[i], fields);
      }
    }
  }

  // return the results
  if (type == 'DataTable') {
    var columns = this._getColumnNames(data);
    if (id != undefined) {
      // append a single item to the data table
      me._appendRow(data, columns, item);
    }
    else {
      // copy the items to the provided data table
      for (i = 0, len = items.length; i < len; i++) {
        me._appendRow(data, columns, items[i]);
      }
    }
    return data;
  }
  else {
    // return an array
    if (id != undefined) {
      // a single item
      return item;
    }
    else {
      // multiple items
      if (data) {
        // copy the items to the provided array
        for (i = 0, len = items.length; i < len; i++) {
          data.push(items[i]);
        }
        return data;
      }
      else {
        // just return our array
        return items;
      }
    }
  }
};

/**
 * Get ids of all items or from a filtered set of items.
 * @param {Object} [options]    An Object with options. Available options:
 *                              {function} [filter] filter items
 *                              {String | function} [order] Order the items by
 *                                  a field name or custom sort function.
 * @return {Array} ids
 */
DataSet.prototype.getIds = function (options) {
  var data = this.data,
      filter = options && options.filter,
      order = options && options.order,
      convert = options && options.convert || this.options.convert,
      i,
      len,
      id,
      item,
      items,
      ids = [];

  if (filter) {
    // get filtered items
    if (order) {
      // create ordered list
      items = [];
      for (id in data) {
        if (data.hasOwnProperty(id)) {
          item = this._getItem(id, convert);
          if (filter(item)) {
            items.push(item);
          }
        }
      }

      this._sort(items, order);

      for (i = 0, len = items.length; i < len; i++) {
        ids[i] = items[i][this.fieldId];
      }
    }
    else {
      // create unordered list
      for (id in data) {
        if (data.hasOwnProperty(id)) {
          item = this._getItem(id, convert);
          if (filter(item)) {
            ids.push(item[this.fieldId]);
          }
        }
      }
    }
  }
  else {
    // get all items
    if (order) {
      // create an ordered list
      items = [];
      for (id in data) {
        if (data.hasOwnProperty(id)) {
          items.push(data[id]);
        }
      }

      this._sort(items, order);

      for (i = 0, len = items.length; i < len; i++) {
        ids[i] = items[i][this.fieldId];
      }
    }
    else {
      // create unordered list
      for (id in data) {
        if (data.hasOwnProperty(id)) {
          item = data[id];
          ids.push(item[this.fieldId]);
        }
      }
    }
  }

  return ids;
};

/**
 * Execute a callback function for every item in the dataset.
 * The order of the items is not determined.
 * @param {function} callback
 * @param {Object} [options]    Available options:
 *                              {Object.<String, String>} [convert]
 *                              {String[]} [fields] filter fields
 *                              {function} [filter] filter items
 *                              {String | function} [order] Order the items by
 *                                  a field name or custom sort function.
 */
DataSet.prototype.forEach = function (callback, options) {
  var filter = options && options.filter,
      convert = options && options.convert || this.options.convert,
      data = this.data,
      item,
      id;

  if (options && options.order) {
    // execute forEach on ordered list
    var items = this.get(options);

    for (var i = 0, len = items.length; i < len; i++) {
      item = items[i];
      id = item[this.fieldId];
      callback(item, id);
    }
  }
  else {
    // unordered
    for (id in data) {
      if (data.hasOwnProperty(id)) {
        item = this._getItem(id, convert);
        if (!filter || filter(item)) {
          callback(item, id);
        }
      }
    }
  }
};

/**
 * Map every item in the dataset.
 * @param {function} callback
 * @param {Object} [options]    Available options:
 *                              {Object.<String, String>} [convert]
 *                              {String[]} [fields] filter fields
 *                              {function} [filter] filter items
 *                              {String | function} [order] Order the items by
 *                                  a field name or custom sort function.
 * @return {Object[]} mappedItems
 */
DataSet.prototype.map = function (callback, options) {
  var filter = options && options.filter,
      convert = options && options.convert || this.options.convert,
      mappedItems = [],
      data = this.data,
      item;

  // convert and filter items
  for (var id in data) {
    if (data.hasOwnProperty(id)) {
      item = this._getItem(id, convert);
      if (!filter || filter(item)) {
        mappedItems.push(callback(item, id));
      }
    }
  }

  // order items
  if (options && options.order) {
    this._sort(mappedItems, options.order);
  }

  return mappedItems;
};

/**
 * Filter the fields of an item
 * @param {Object} item
 * @param {String[]} fields     Field names
 * @return {Object} filteredItem
 * @private
 */
DataSet.prototype._filterFields = function (item, fields) {
  var filteredItem = {};

  for (var field in item) {
    if (item.hasOwnProperty(field) && (fields.indexOf(field) != -1)) {
      filteredItem[field] = item[field];
    }
  }

  return filteredItem;
};

/**
 * Sort the provided array with items
 * @param {Object[]} items
 * @param {String | function} order      A field name or custom sort function.
 * @private
 */
DataSet.prototype._sort = function (items, order) {
  if (util.isString(order)) {
    // order by provided field name
    var name = order; // field name
    items.sort(function (a, b) {
      var av = a[name];
      var bv = b[name];
      return (av > bv) ? 1 : ((av < bv) ? -1 : 0);
    });
  }
  else if (typeof order === 'function') {
    // order by sort function
    items.sort(order);
  }
  // TODO: extend order by an Object {field:String, direction:String}
  //       where direction can be 'asc' or 'desc'
  else {
    throw new TypeError('Order must be a function or a string');
  }
};

/**
 * Remove an object by pointer or by id
 * @param {String | Number | Object | Array} id Object or id, or an array with
 *                                              objects or ids to be removed
 * @param {String} [senderId] Optional sender id
 * @return {Array} removedIds
 */
DataSet.prototype.remove = function (id, senderId) {
  var removedIds = [],
      i, len, removedId;

  if (id instanceof Array) {
    for (i = 0, len = id.length; i < len; i++) {
      removedId = this._remove(id[i]);
      if (removedId != null) {
        removedIds.push(removedId);
      }
    }
  }
  else {
    removedId = this._remove(id);
    if (removedId != null) {
      removedIds.push(removedId);
    }
  }

  if (removedIds.length) {
    this._trigger('remove', {items: removedIds}, senderId);
  }

  return removedIds;
};

/**
 * Remove an item by its id
 * @param {Number | String | Object} id   id or item
 * @returns {Number | String | null} id
 * @private
 */
DataSet.prototype._remove = function (id) {
  if (util.isNumber(id) || util.isString(id)) {
    if (this.data[id]) {
      delete this.data[id];
      delete this.internalIds[id];
      return id;
    }
  }
  else if (id instanceof Object) {
    var itemId = id[this.fieldId];
    if (itemId && this.data[itemId]) {
      delete this.data[itemId];
      delete this.internalIds[itemId];
      return itemId;
    }
  }
  return null;
};

/**
 * Clear the data
 * @param {String} [senderId] Optional sender id
 * @return {Array} removedIds    The ids of all removed items
 */
DataSet.prototype.clear = function (senderId) {
  var ids = Object.keys(this.data);

  this.data = {};
  this.internalIds = {};

  this._trigger('remove', {items: ids}, senderId);

  return ids;
};

/**
 * Find the item with maximum value of a specified field
 * @param {String} field
 * @return {Object | null} item  Item containing max value, or null if no items
 */
DataSet.prototype.max = function (field) {
  var data = this.data,
      max = null,
      maxField = null;

  for (var id in data) {
    if (data.hasOwnProperty(id)) {
      var item = data[id];
      var itemField = item[field];
      if (itemField != null && (!max || itemField > maxField)) {
        max = item;
        maxField = itemField;
      }
    }
  }

  return max;
};

/**
 * Find the item with minimum value of a specified field
 * @param {String} field
 * @return {Object | null} item  Item containing max value, or null if no items
 */
DataSet.prototype.min = function (field) {
  var data = this.data,
      min = null,
      minField = null;

  for (var id in data) {
    if (data.hasOwnProperty(id)) {
      var item = data[id];
      var itemField = item[field];
      if (itemField != null && (!min || itemField < minField)) {
        min = item;
        minField = itemField;
      }
    }
  }

  return min;
};

/**
 * Find all distinct values of a specified field
 * @param {String} field
 * @return {Array} values  Array containing all distinct values. If the data
 *                         items do not contain the specified field, an array
 *                         containing a single value undefined is returned.
 *                         The returned array is unordered.
 */
DataSet.prototype.distinct = function (field) {
  var data = this.data,
      values = [],
      fieldType = this.options.convert[field],
      count = 0;

  for (var prop in data) {
    if (data.hasOwnProperty(prop)) {
      var item = data[prop];
      var value = util.convert(item[field], fieldType);
      var exists = false;
      for (var i = 0; i < count; i++) {
        if (values[i] == value) {
          exists = true;
          break;
        }
      }
      if (!exists) {
        values[count] = value;
        count++;
      }
    }
  }

  return values;
};

/**
 * Add a single item. Will fail when an item with the same id already exists.
 * @param {Object} item
 * @return {String} id
 * @private
 */
DataSet.prototype._addItem = function (item) {
  var id = item[this.fieldId];

  if (id != undefined) {
    // check whether this id is already taken
    if (this.data[id]) {
      // item already exists
      throw new Error('Cannot add item: item with id ' + id + ' already exists');
    }
  }
  else {
    // generate an id
    id = util.randomUUID();
    item[this.fieldId] = id;
    this.internalIds[id] = item;
  }

  var d = {};
  for (var field in item) {
    if (item.hasOwnProperty(field)) {
      var fieldType = this.convert[field];  // type may be undefined
      d[field] = util.convert(item[field], fieldType);
    }
  }
  this.data[id] = d;

  return id;
};

/**
 * Get an item. Fields can be converted to a specific type
 * @param {String} id
 * @param {Object.<String, String>} [convert]  field types to convert
 * @return {Object | null} item
 * @private
 */
DataSet.prototype._getItem = function (id, convert) {
  var field, value;

  // get the item from the dataset
  var raw = this.data[id];
  if (!raw) {
    return null;
  }

  // convert the items field types
  var converted = {},
      fieldId = this.fieldId,
      internalIds = this.internalIds;
  if (convert) {
    for (field in raw) {
      if (raw.hasOwnProperty(field)) {
        value = raw[field];
        // output all fields, except internal ids
        if ((field != fieldId) || (!(value in internalIds) || this.showInternalIds)) {
          converted[field] = util.convert(value, convert[field]);
        }
      }
    }
  }
  else {
    // no field types specified, no converting needed
    for (field in raw) {
      if (raw.hasOwnProperty(field)) {
        value = raw[field];
        // output all fields, except internal ids
        if ((field != fieldId) || (!(value in internalIds) || this.showInternalIds)) {
          converted[field] = value;
        }
      }
    }
  }
  return converted;
};

/**
 * Update a single item: merge with existing item.
 * Will fail when the item has no id, or when there does not exist an item
 * with the same id.
 * @param {Object} item
 * @return {String} id
 * @private
 */
DataSet.prototype._updateItem = function (item) {
  var id = item[this.fieldId];
  if (id == undefined) {
    throw new Error('Cannot update item: item has no id (item: ' + JSON.stringify(item) + ')');
  }
  var d = this.data[id];
  if (!d) {
    // item doesn't exist
    throw new Error('Cannot update item: no item with id ' + id + ' found');
  }

  // merge with current item
  for (var field in item) {
    if (item.hasOwnProperty(field)) {
      var fieldType = this.convert[field];  // type may be undefined
      d[field] = util.convert(item[field], fieldType);
    }
  }

  return id;
};

/**
 * check if an id is an internal or external id
 * @param id
 * @returns {boolean}
 * @private
 */
DataSet.prototype.isInternalId = function(id) {
  return (id in this.internalIds);
};


/**
 * Get an array with the column names of a Google DataTable
 * @param {DataTable} dataTable
 * @return {String[]} columnNames
 * @private
 */
DataSet.prototype._getColumnNames = function (dataTable) {
  var columns = [];
  for (var col = 0, cols = dataTable.getNumberOfColumns(); col < cols; col++) {
    columns[col] = dataTable.getColumnId(col) || dataTable.getColumnLabel(col);
  }
  return columns;
};

/**
 * Append an item as a row to the dataTable
 * @param dataTable
 * @param columns
 * @param item
 * @private
 */
DataSet.prototype._appendRow = function (dataTable, columns, item) {
  var row = dataTable.addRow();

  for (var col = 0, cols = columns.length; col < cols; col++) {
    var field = columns[col];
    dataTable.setValue(row, col, item[field]);
  }
};

// exports
module.exports = DataSet;

},{"./utils":24}],3:[function(require,module,exports){
var util = require('./utils'),
    DataSet = require('./DataSet');

/**
 * DataView
 *
 * a dataview offers a filtered view on a dataset or an other dataview.
 *
 * @param {DataSet | DataView} data
 * @param {Object} [options]   Available options: see method get
 *
 * @constructor DataView
 */
function DataView (data, options) {
  this.id = util.randomUUID();

  this.data = null;
  this.ids = {}; // ids of the items currently in memory (just contains a boolean true)
  this.options = options || {};
  this.fieldId = 'id'; // name of the field containing id
  this.subscribers = {}; // event subscribers

  var me = this;
  this.listener = function () {
    me._onEvent.apply(me, arguments);
  };

  this.setData(data);
}

// TODO: implement a function .config() to dynamically update things like configured filter
// and trigger changes accordingly

/**
 * Set a data source for the view
 * @param {DataSet | DataView} data
 */
DataView.prototype.setData = function (data) {
  var ids, dataItems, i, len;

  if (this.data) {
    // unsubscribe from current dataset
    if (this.data.unsubscribe) {
      this.data.unsubscribe('*', this.listener);
    }

    // trigger a remove of all items in memory
    ids = [];
    for (var id in this.ids) {
      if (this.ids.hasOwnProperty(id)) {
        ids.push(id);
      }
    }
    this.ids = {};
    this._trigger('remove', {items: ids});
  }

  this.data = data;

  if (this.data) {
    // update fieldId
    this.fieldId = this.options.fieldId ||
        (this.data && this.data.options && this.data.options.fieldId) ||
        'id';

    // trigger an add of all added items
    ids = this.data.getIds({filter: this.options && this.options.filter});
    for (i = 0, len = ids.length; i < len; i++) {
      id = ids[i];
      this.ids[id] = true;
    }
    this._trigger('add', {items: ids});

    // subscribe to new dataset
    if (this.data.on) {
      this.data.on('*', this.listener);
    }
  }
};

/**
 * Get data from the data view
 *
 * Usage:
 *
 *     get()
 *     get(options: Object)
 *     get(options: Object, data: Array | DataTable)
 *
 *     get(id: Number)
 *     get(id: Number, options: Object)
 *     get(id: Number, options: Object, data: Array | DataTable)
 *
 *     get(ids: Number[])
 *     get(ids: Number[], options: Object)
 *     get(ids: Number[], options: Object, data: Array | DataTable)
 *
 * Where:
 *
 * {Number | String} id         The id of an item
 * {Number[] | String{}} ids    An array with ids of items
 * {Object} options             An Object with options. Available options:
 *                              {String} [type] Type of data to be returned. Can
 *                                              be 'DataTable' or 'Array' (default)
 *                              {Object.<String, String>} [convert]
 *                              {String[]} [fields] field names to be returned
 *                              {function} [filter] filter items
 *                              {String | function} [order] Order the items by
 *                                  a field name or custom sort function.
 * {Array | DataTable} [data]   If provided, items will be appended to this
 *                              array or table. Required in case of Google
 *                              DataTable.
 * @param args
 */
DataView.prototype.get = function (args) {
  var me = this;

  // parse the arguments
  var ids, options, data;
  var firstType = util.getType(arguments[0]);
  if (firstType == 'String' || firstType == 'Number' || firstType == 'Array') {
    // get(id(s) [, options] [, data])
    ids = arguments[0];  // can be a single id or an array with ids
    options = arguments[1];
    data = arguments[2];
  }
  else {
    // get([, options] [, data])
    options = arguments[0];
    data = arguments[1];
  }

  // extend the options with the default options and provided options
  var viewOptions = util.extend({}, this.options, options);

  // create a combined filter method when needed
  if (this.options.filter && options && options.filter) {
    viewOptions.filter = function (item) {
      return me.options.filter(item) && options.filter(item);
    }
  }

  // build up the call to the linked data set
  var getArguments = [];
  if (ids != undefined) {
    getArguments.push(ids);
  }
  getArguments.push(viewOptions);
  getArguments.push(data);

  return this.data && this.data.get.apply(this.data, getArguments);
};

/**
 * Get ids of all items or from a filtered set of items.
 * @param {Object} [options]    An Object with options. Available options:
 *                              {function} [filter] filter items
 *                              {String | function} [order] Order the items by
 *                                  a field name or custom sort function.
 * @return {Array} ids
 */
DataView.prototype.getIds = function (options) {
  var ids;

  if (this.data) {
    var defaultFilter = this.options.filter;
    var filter;

    if (options && options.filter) {
      if (defaultFilter) {
        filter = function (item) {
          return defaultFilter(item) && options.filter(item);
        }
      }
      else {
        filter = options.filter;
      }
    }
    else {
      filter = defaultFilter;
    }

    ids = this.data.getIds({
      filter: filter,
      order: options && options.order
    });
  }
  else {
    ids = [];
  }

  return ids;
};

/**
 * Event listener. Will propagate all events from the connected data set to
 * the subscribers of the DataView, but will filter the items and only trigger
 * when there are changes in the filtered data set.
 * @param {String} event
 * @param {Object | null} params
 * @param {String} senderId
 * @private
 */
DataView.prototype._onEvent = function (event, params, senderId) {
  var i, len, id, item,
      ids = params && params.items,
      data = this.data,
      added = [],
      updated = [],
      removed = [];

  if (ids && data) {
    switch (event) {
      case 'add':
        // filter the ids of the added items
        for (i = 0, len = ids.length; i < len; i++) {
          id = ids[i];
          item = this.get(id);
          if (item) {
            this.ids[id] = true;
            added.push(id);
          }
        }

        break;

      case 'update':
        // determine the event from the views viewpoint: an updated
        // item can be added, updated, or removed from this view.
        for (i = 0, len = ids.length; i < len; i++) {
          id = ids[i];
          item = this.get(id);

          if (item) {
            if (this.ids[id]) {
              updated.push(id);
            }
            else {
              this.ids[id] = true;
              added.push(id);
            }
          }
          else {
            if (this.ids[id]) {
              delete this.ids[id];
              removed.push(id);
            }
            else {
              // nothing interesting for me :-(
            }
          }
        }

        break;

      case 'remove':
        // filter the ids of the removed items
        for (i = 0, len = ids.length; i < len; i++) {
          id = ids[i];
          if (this.ids[id]) {
            delete this.ids[id];
            removed.push(id);
          }
        }

        break;
    }

    if (added.length) {
      this._trigger('add', {items: added}, senderId);
    }
    if (updated.length) {
      this._trigger('update', {items: updated}, senderId);
    }
    if (removed.length) {
      this._trigger('remove', {items: removed}, senderId);
    }
  }
};

// copy subscription functionality from DataSet
DataView.prototype.on = DataSet.prototype.on;
DataView.prototype.off = DataSet.prototype.off;
DataView.prototype._trigger = DataSet.prototype._trigger;

// TODO: make these functions deprecated (replaced with `on` and `off` since version 0.5)
DataView.prototype.subscribe = DataView.prototype.on;
DataView.prototype.unsubscribe = DataView.prototype.off;

// exports
module.exports = DataView;

},{"./DataSet":2,"./utils":24}],4:[function(require,module,exports){
/**
 * vis.js module imports, how to load depends on whether running in browser
 * or node.js.
 *
 * Try to load dependencies from the global window object. If not available
 * there, load via commonjs.
 */

// TODO: this file is an ugly way to ensure cross platform

// moment.js
exports.moment = (typeof window !== 'undefined') && window['moment'] || require('moment');

// emitter-component
exports.Emitter = require('emitter-component');

// hammer.js
if (typeof window !== 'undefined') {
  // load hammer.js only when running in a browser (where window is available)
  exports.Hammer = window['Hammer'] || require('hammerjs');
}
else {
  exports.Hammer = function () {
    throw Error('hammer.js is only available in a browser, not in node.js.');
  }
}

// mousetrap.js
if (typeof window !== 'undefined') {
  // load mousetrap.js only when running in a browser (where window is available)
  exports.mousetrap = window['mousetrap'] || require('mousetrap');
}
else {
  exports.mousetrap = function () {
    throw Error('mouseTrap is only available in a browser, not in node.js.');
  }
}

},{"emitter-component":25,"hammerjs":26,"moment":27,"mousetrap":28}],5:[function(require,module,exports){
var utils = require('../utils'),
    Emitter = require('emitter-component'),
    Component = require('./component/Component');

/**
 * @constructor Controller
 *
 * A Controller controls the reflows and repaints of all components,
 * and is used as an event bus for all components.
 */
function Controller () {
  var me = this;

  this.id = utils.randomUUID();
  this.components = {};

  /**
   * Listen for a 'request-reflow' event. The controller will schedule a reflow
   * @param {Boolean} [force]     If true, an immediate reflow is forced. Default
   *                              is false.
   */
  var reflowTimer = null;
  this.on('request-reflow', function requestReflow(force) {
    if (force) {
      me.reflow();
    }
    else {
      if (!reflowTimer) {
        reflowTimer = setTimeout(function () {
          reflowTimer = null;
          me.reflow();
        }, 0);
      }
    }
  });

  /**
   * Request a repaint. The controller will schedule a repaint
   * @param {Boolean} [force]    If true, an immediate repaint is forced. Default
   *                             is false.
   */
  var repaintTimer = null;
  this.on('request-repaint', function requestRepaint(force) {
    if (force) {
      me.repaint();
    }
    else {
      if (!repaintTimer) {
        repaintTimer = setTimeout(function () {
          repaintTimer = null;
          me.repaint();
        }, 0);
      }
    }
  });
}

// Extend controller with Emitter mixin
Emitter(Controller.prototype);

/**
 * Add a component to the controller
 * @param {Component} component
 */
Controller.prototype.add = function add(component) {
  // validate the component
  if (component.id == undefined) {
    throw new Error('Component has no field id');
  }
  if (!(component instanceof Component) && !(component instanceof Controller)) {
    throw new TypeError('Component must be an instance of ' +
        'prototype Component or Controller');
  }

  // add the component
  component.setController(this);
  this.components[component.id] = component;
};

/**
 * Remove a component from the controller
 * @param {Component | String} component
 */
Controller.prototype.remove = function remove(component) {
  var id;
  for (id in this.components) {
    if (this.components.hasOwnProperty(id)) {
      if (id == component || this.components[id] === component) {
        break;
      }
    }
  }

  if (id) {
    // unregister the controller (gives the component the ability to unregister
    // event listeners and clean up other stuff)
    this.components[id].setController(null);

    delete this.components[id];
  }
};

/**
 * Repaint all components
 */
Controller.prototype.repaint = function repaint() {
  var changed = false;

  // cancel any running repaint request
  if (this.repaintTimer) {
    clearTimeout(this.repaintTimer);
    this.repaintTimer = undefined;
  }

  var done = {};

  function repaint(component, id) {
    if (!(id in done)) {
      // first repaint the components on which this component is dependent
      if (component.depends) {
        component.depends.forEach(function (dep) {
          repaint(dep, dep.id);
        });
      }
      if (component.parent) {
        repaint(component.parent, component.parent.id);
      }

      // repaint the component itself and mark as done
      changed = component.repaint() || changed;
      done[id] = true;
    }
  }

  utils.forEach(this.components, repaint);

  this.emit('repaint');

  // immediately reflow when needed
  if (changed) {
    this.reflow();
  }
  // TODO: limit the number of nested reflows/repaints, prevent loop
};

/**
 * Reflow all components
 */
Controller.prototype.reflow = function reflow() {
  var resized = false;

  // cancel any running repaint request
  if (this.reflowTimer) {
    clearTimeout(this.reflowTimer);
    this.reflowTimer = undefined;
  }

  var done = {};

  function reflow(component, id) {
    if (!(id in done)) {
      // first reflow the components on which this component is dependent
      if (component.depends) {
        component.depends.forEach(function (dep) {
          reflow(dep, dep.id);
        });
      }
      if (component.parent) {
        reflow(component.parent, component.parent.id);
      }

      // reflow the component itself and mark as done
      resized = component.reflow() || resized;
      done[id] = true;
    }
  }

  utils.forEach(this.components, reflow);

  this.emit('reflow');

  // immediately repaint when needed
  if (resized) {
    this.repaint();
  }
  // TODO: limit the number of nested reflows/repaints, prevent loop
};

// exports
module.exports = Controller;
},{"../utils":24,"./component/Component":10,"emitter-component":25}],6:[function(require,module,exports){
var utils = require('../utils'),
    Emitter = require('emitter-component'),
    ItemSet = require('./component/ItemSet');


/**
 * @constructor Range
 * A Range controls a numeric range with a start and end value.
 * The Range adjusts the range based on mouse events or programmatic changes,
 * and triggers events when the range is changing or has been changed.
 * @param {Object} [options]   See description at Range.setOptions
 * @extends Controller
 */
function Range(options) {
  this.id = utils.randomUUID();
  this.start = null; // Number
  this.end = null;   // Number

  this.options = options || {};

  this.setOptions(options);
}

// extend the Range prototype with an event emitter mixin
Emitter(Range.prototype);

/**
 * Set options for the range controller
 * @param {Object} options      Available options:
 *                              {Number} min    Minimum value for start
 *                              {Number} max    Maximum value for end
 *                              {Number} zoomMin    Set a minimum value for
 *                                                  (end - start).
 *                              {Number} zoomMax    Set a maximum value for
 *                                                  (end - start).
 */
Range.prototype.setOptions = function (options) {
  utils.extend(this.options, options);

  // re-apply range with new limitations
  if (this.start !== null && this.end !== null) {
    this.setRange(this.start, this.end);
  }
};

/**
 * Test whether direction has a valid value
 * @param {String} direction    'horizontal' or 'vertical'
 */
function validateDirection (direction) {
  if (direction != 'horizontal' && direction != 'vertical') {
    throw new TypeError('Unknown direction "' + direction + '". ' +
        'Choose "horizontal" or "vertical".');
  }
}

/**
 * Add listeners for mouse and touch events to the component
 * @param {Controller} controller
 * @param {Component} component  Should be a rootpanel
 * @param {String} event        Available events: 'move', 'zoom'
 * @param {String} direction    Available directions: 'horizontal', 'vertical'
 */
Range.prototype.subscribe = function (controller, component, event, direction) {
  var me = this;

  if (event == 'move') {
    // drag start listener
    controller.on('dragstart', function (event) {
      me._onDragStart(event, component);
    });

    // drag listener
    controller.on('drag', function (event) {
      me._onDrag(event, component, direction);
    });

    // drag end listener
    controller.on('dragend', function (event) {
      me._onDragEnd(event, component);
    });

    // ignore dragging when holding
    controller.on('hold', function (event) {
      me._onHold();
    });
  }
  else if (event == 'zoom') {
    // mouse wheel
    function mousewheel (event) {
      me._onMouseWheel(event, component, direction);
    }
    controller.on('mousewheel', mousewheel);
    controller.on('DOMMouseScroll', mousewheel); // For FF

    // pinch
    controller.on('touch', function (event) {
      me._onTouch(event);
    });
    controller.on('pinch', function (event) {
      me._onPinch(event, component, direction);
    });
  }
  else {
    throw new TypeError('Unknown event "' + event + '". ' +
        'Choose "move" or "zoom".');
  }
};

/**
 * Set a new start and end range
 * @param {Number} [start]
 * @param {Number} [end]
 */
Range.prototype.setRange = function(start, end) {
  var changed = this._applyRange(start, end);
  if (changed) {
    var params = {
          start: this.start,
          end: this.end
    };
    this.emit('rangechange', params);
    this.emit('rangechanged', params);
  }
};

/**
 * Set a new start and end range. This method is the same as setRange, but
 * does not trigger a range change and range changed event, and it returns
 * true when the range is changed
 * @param {Number} [start]
 * @param {Number} [end]
 * @return {Boolean} changed
 * @private
 */
Range.prototype._applyRange = function(start, end) {
  var newStart = (start != null) ? utils.convert(start, 'Date').valueOf() : this.start,
      newEnd   = (end != null)   ? utils.convert(end, 'Date').valueOf()   : this.end,
      max = (this.options.max != null) ? utils.convert(this.options.max, 'Date').valueOf() : null,
      min = (this.options.min != null) ? utils.convert(this.options.min, 'Date').valueOf() : null,
      diff;

  // check for valid number
  if (isNaN(newStart) || newStart === null) {
    throw new Error('Invalid start "' + start + '"');
  }
  if (isNaN(newEnd) || newEnd === null) {
    throw new Error('Invalid end "' + end + '"');
  }

  // prevent start < end
  if (newEnd < newStart) {
    newEnd = newStart;
  }

  // prevent start < min
  if (min !== null) {
    if (newStart < min) {
      diff = (min - newStart);
      newStart += diff;
      newEnd += diff;

      // prevent end > max
      if (max != null) {
        if (newEnd > max) {
          newEnd = max;
        }
      }
    }
  }

  // prevent end > max
  if (max !== null) {
    if (newEnd > max) {
      diff = (newEnd - max);
      newStart -= diff;
      newEnd -= diff;

      // prevent start < min
      if (min != null) {
        if (newStart < min) {
          newStart = min;
        }
      }
    }
  }

  // prevent (end-start) < zoomMin
  if (this.options.zoomMin !== null) {
    var zoomMin = parseFloat(this.options.zoomMin);
    if (zoomMin < 0) {
      zoomMin = 0;
    }
    if ((newEnd - newStart) < zoomMin) {
      if ((this.end - this.start) === zoomMin) {
        // ignore this action, we are already zoomed to the minimum
        newStart = this.start;
        newEnd = this.end;
      }
      else {
        // zoom to the minimum
        diff = (zoomMin - (newEnd - newStart));
        newStart -= diff / 2;
        newEnd += diff / 2;
      }
    }
  }

  // prevent (end-start) > zoomMax
  if (this.options.zoomMax !== null) {
    var zoomMax = parseFloat(this.options.zoomMax);
    if (zoomMax < 0) {
      zoomMax = 0;
    }
    if ((newEnd - newStart) > zoomMax) {
      if ((this.end - this.start) === zoomMax) {
        // ignore this action, we are already zoomed to the maximum
        newStart = this.start;
        newEnd = this.end;
      }
      else {
        // zoom to the maximum
        diff = ((newEnd - newStart) - zoomMax);
        newStart += diff / 2;
        newEnd -= diff / 2;
      }
    }
  }

  var changed = (this.start != newStart || this.end != newEnd);

  this.start = newStart;
  this.end = newEnd;

  return changed;
};

/**
 * Retrieve the current range.
 * @return {Object} An object with start and end properties
 */
Range.prototype.getRange = function() {
  return {
    start: this.start,
    end: this.end
  };
};

/**
 * Calculate the conversion offset and scale for current range, based on
 * the provided width
 * @param {Number} width
 * @returns {{offset: number, scale: number}} conversion
 */
Range.prototype.conversion = function (width) {
  return Range.conversion(this.start, this.end, width);
};

/**
 * Static method to calculate the conversion offset and scale for a range,
 * based on the provided start, end, and width
 * @param {Number} start
 * @param {Number} end
 * @param {Number} width
 * @returns {{offset: number, scale: number}} conversion
 */
Range.conversion = function (start, end, width) {
  if (width != 0 && (end - start != 0)) {
    return {
      offset: start,
      scale: width / (end - start)
    }
  }
  else {
    return {
      offset: 0,
      scale: 1
    };
  }
};

// global (private) object to store drag params
var touchParams = {};

/**
 * Start dragging horizontally or vertically
 * @param {Event} event
 * @param {Object} component
 * @private
 */
Range.prototype._onDragStart = function(event, component) {
  // refuse to drag when we where pinching to prevent the timeline make a jump
  // when releasing the fingers in opposite order from the touch screen
  if (touchParams.ignore) return;

  // TODO: reckon with option movable

  touchParams.start = this.start;
  touchParams.end = this.end;

  var frame = component.frame;
  if (frame) {
    frame.style.cursor = 'move';
  }
};

/**
 * Perform dragging operating.
 * @param {Event} event
 * @param {Component} component
 * @param {String} direction    'horizontal' or 'vertical'
 * @private
 */
Range.prototype._onDrag = function (event, component, direction) {
  validateDirection(direction);

  // TODO: reckon with option movable


  // refuse to drag when we where pinching to prevent the timeline make a jump
  // when releasing the fingers in opposite order from the touch screen
  if (touchParams.ignore) return;

  var delta = (direction == 'horizontal') ? event.gesture.deltaX : event.gesture.deltaY,
      interval = (touchParams.end - touchParams.start),
      width = (direction == 'horizontal') ? component.width : component.height,
      diffRange = -delta / width * interval;

  this._applyRange(touchParams.start + diffRange, touchParams.end + diffRange);

  this.emit('rangechange', {
    start: this.start,
    end: this.end
  });
};

/**
 * Stop dragging operating.
 * @param {event} event
 * @param {Component} component
 * @private
 */
Range.prototype._onDragEnd = function (event, component) {
  // refuse to drag when we where pinching to prevent the timeline make a jump
  // when releasing the fingers in opposite order from the touch screen
  if (touchParams.ignore) return;

  // TODO: reckon with option movable

  if (component.frame) {
    component.frame.style.cursor = 'auto';
  }

  // fire a rangechanged event
  this.emit('rangechanged', {
    start: this.start,
    end: this.end
  });
};

/**
 * Event handler for mouse wheel event, used to zoom
 * Code from http://adomas.org/javascript-mouse-wheel/
 * @param {Event} event
 * @param {Component} component
 * @param {String} direction    'horizontal' or 'vertical'
 * @private
 */
Range.prototype._onMouseWheel = function(event, component, direction) {
  validateDirection(direction);

  // TODO: reckon with option zoomable

  // retrieve delta
  var delta = 0;
  if (event.wheelDelta) { /* IE/Opera. */
    delta = event.wheelDelta / 120;
  } else if (event.detail) { /* Mozilla case. */
    // In Mozilla, sign of delta is different than in IE.
    // Also, delta is multiple of 3.
    delta = -event.detail / 3;
  }

  // If delta is nonzero, handle it.
  // Basically, delta is now positive if wheel was scrolled up,
  // and negative, if wheel was scrolled down.
  if (delta) {
    // perform the zoom action. Delta is normally 1 or -1

    // adjust a negative delta such that zooming in with delta 0.1
    // equals zooming out with a delta -0.1
    var scale;
    if (delta < 0) {
      scale = 1 - (delta / 5);
    }
    else {
      scale = 1 / (1 + (delta / 5)) ;
    }

    // calculate center, the date to zoom around
    var gesture = utils.fakeGesture(this, event),
        pointer = getPointer(gesture.center, component.frame),
        pointerDate = this._pointerToDate(component, direction, pointer);

    this.zoom(scale, pointerDate);
  }

  // Prevent default actions caused by mouse wheel
  // (else the page and timeline both zoom and scroll)
  event.preventDefault();
};

/**
 * Start of a touch gesture
 * @private
 */
Range.prototype._onTouch = function (event) {
  touchParams.start = this.start;
  touchParams.end = this.end;
  touchParams.ignore = false;
  touchParams.center = null;

  // don't move the range when dragging a selected event
  // TODO: it's not so neat to have to know about the state of the ItemSet
  var item = ItemSet.itemFromTarget(event);
  if (item && item.selected && this.options.editable) {
    touchParams.ignore = true;
  }
};

/**
 * On start of a hold gesture
 * @private
 */
Range.prototype._onHold = function () {
  touchParams.ignore = true;
};

/**
 * Handle pinch event
 * @param {Event} event
 * @param {Component} component
 * @param {String} direction    'horizontal' or 'vertical'
 * @private
 */
Range.prototype._onPinch = function (event, component, direction) {
  touchParams.ignore = true;

  // TODO: reckon with option zoomable

  if (event.gesture.touches.length > 1) {
    if (!touchParams.center) {
      touchParams.center = getPointer(event.gesture.center, component.frame);
    }

    var scale = 1 / event.gesture.scale,
        initDate = this._pointerToDate(component, direction, touchParams.center),
        center = getPointer(event.gesture.center, component.frame),
        date = this._pointerToDate(component, direction, center),
        delta = date - initDate; // TODO: utilize delta

    // calculate new start and end
    var newStart = parseInt(initDate + (touchParams.start - initDate) * scale);
    var newEnd = parseInt(initDate + (touchParams.end - initDate) * scale);

    // apply new range
    this.setRange(newStart, newEnd);
  }
};

/**
 * Helper function to calculate the center date for zooming
 * @param {Component} component
 * @param {{x: Number, y: Number}} pointer
 * @param {String} direction    'horizontal' or 'vertical'
 * @return {number} date
 * @private
 */
Range.prototype._pointerToDate = function (component, direction, pointer) {
  var conversion;
  if (direction == 'horizontal') {
    var width = component.width;
    conversion = this.conversion(width);
    return pointer.x / conversion.scale + conversion.offset;
  }
  else {
    var height = component.height;
    conversion = this.conversion(height);
    return pointer.y / conversion.scale + conversion.offset;
  }
};

/**
 * Get the pointer location relative to the location of the dom element
 * @param {{pageX: Number, pageY: Number}} touch
 * @param {Element} element   HTML DOM element
 * @return {{x: Number, y: Number}} pointer
 * @private
 */
function getPointer (touch, element) {
  return {
    x: touch.pageX - vis.utils.getAbsoluteLeft(element),
    y: touch.pageY - vis.utils.getAbsoluteTop(element)
  };
}

/**
 * Zoom the range the given scale in or out. Start and end date will
 * be adjusted, and the timeline will be redrawn. You can optionally give a
 * date around which to zoom.
 * For example, try scale = 0.9 or 1.1
 * @param {Number} scale      Scaling factor. Values above 1 will zoom out,
 *                            values below 1 will zoom in.
 * @param {Number} [center]   Value representing a date around which will
 *                            be zoomed.
 */
Range.prototype.zoom = function(scale, center) {
  // if centerDate is not provided, take it half between start Date and end Date
  if (center == null) {
    center = (this.start + this.end) / 2;
  }

  // calculate new start and end
  var newStart = center + (this.start - center) * scale;
  var newEnd = center + (this.end - center) * scale;

  this.setRange(newStart, newEnd);
};

/**
 * Move the range with a given delta to the left or right. Start and end
 * value will be adjusted. For example, try delta = 0.1 or -0.1
 * @param {Number}  delta     Moving amount. Positive value will move right,
 *                            negative value will move left
 */
Range.prototype.move = function(delta) {
  // zoom start Date and end Date relative to the centerDate
  var diff = (this.end - this.start);

  // apply new values
  var newStart = this.start + diff * delta;
  var newEnd = this.end + diff * delta;

  // TODO: reckon with min and max range

  this.start = newStart;
  this.end = newEnd;
};

/**
 * Move the range to a new center point
 * @param {Number} moveTo      New center point of the range
 */
Range.prototype.moveTo = function(moveTo) {
  var center = (this.start + this.end) / 2;

  var diff = center - moveTo;

  // calculate new start and end
  var newStart = this.start - diff;
  var newEnd = this.end - diff;

  this.setRange(newStart, newEnd);
};

module.exports = Range;

},{"../utils":24,"./component/ItemSet":15,"emitter-component":25}],7:[function(require,module,exports){
var utils = require('../utils'),
    ItemRange = require('./component/item/ItemRange');

/**
 * @constructor Stack
 * Stacks items on top of each other.
 * @param {ItemSet} itemset
 * @param {Object} [options]
 */
function Stack (itemset, options) {
  this.itemset = itemset;

  this.options = options || {};
  this.defaultOptions = {
    order: function (a, b) {
      //return (b.width - a.width) || (a.left - b.left);  // TODO: cleanup
      // Order: ranges over non-ranges, ranged ordered by width, and
      // lastly ordered by start.
      if (a instanceof ItemRange) {
        if (b instanceof ItemRange) {
          var aInt = (a.data.end - a.data.start);
          var bInt = (b.data.end - b.data.start);
          return (aInt - bInt) || (a.data.start - b.data.start);
        }
        else {
          return -1;
        }
      }
      else {
        if (b instanceof ItemRange) {
          return 1;
        }
        else {
          return (a.data.start - b.data.start);
        }
      }
    },
    margin: {
      item: 10
    }
  };

  this.ordered = [];  // ordered items
}

/**
 * Set options for the stack
 * @param {Object} options  Available options:
 *                          {ItemSet} itemset
 *                          {Number} margin
 *                          {function} order  Stacking order
 */
Stack.prototype.setOptions = function setOptions (options) {
  utils.extend(this.options, options);

  // TODO: register on data changes at the connected itemset, and update the changed part only and immediately
};

/**
 * Stack the items such that they don't overlap. The items will have a minimal
 * distance equal to options.margin.item.
 */
Stack.prototype.update = function update() {
  this._order();
  this._stack();
};

/**
 * Order the items. If a custom order function has been provided via the options,
 * then this will be used.
 * @private
 */
Stack.prototype._order = function _order () {
  var items = this.itemset.items;
  if (!items) {
    throw new Error('Cannot stack items: ItemSet does not contain items');
  }

  // TODO: store the sorted items, to have less work later on
  var ordered = [];
  var index = 0;
  // items is a map (no array)
  utils.forEach(items, function (item) {
    if (item.visible) {
      ordered[index] = item;
      index++;
    }
  });

  //if a customer stack order function exists, use it.
  var order = this.options.order || this.defaultOptions.order;
  if (!(typeof order === 'function')) {
    throw new Error('Option order must be a function');
  }

  ordered.sort(order);

  this.ordered = ordered;
};

/**
 * Adjust vertical positions of the events such that they don't overlap each
 * other.
 * @private
 */
Stack.prototype._stack = function _stack () {
  var i,
      iMax,
      ordered = this.ordered,
      options = this.options,
      orientation = options.orientation || this.defaultOptions.orientation,
      axisOnTop = (orientation == 'top'),
      margin;

  if (options.margin && options.margin.item !== undefined) {
    margin = options.margin.item;
  }
  else {
    margin = this.defaultOptions.margin.item
  }

  // calculate new, non-overlapping positions
  for (i = 0, iMax = ordered.length; i < iMax; i++) {
    var item = ordered[i];
    var collidingItem = null;
    do {
      // TODO: optimize checking for overlap. when there is a gap without items,
      //  you only need to check for items from the next item on, not from zero
      collidingItem = this.checkOverlap(ordered, i, 0, i - 1, margin);
      if (collidingItem != null) {
        // There is a collision. Reposition the event above the colliding element
        if (axisOnTop) {
          item.top = collidingItem.top + collidingItem.height + margin;
        }
        else {
          item.top = collidingItem.top - item.height - margin;
        }
      }
    } while (collidingItem);
  }
};

/**
 * Check if the destiny position of given item overlaps with any
 * of the other items from index itemStart to itemEnd.
 * @param {Array} items     Array with items
 * @param {int}  itemIndex  Number of the item to be checked for overlap
 * @param {int}  itemStart  First item to be checked.
 * @param {int}  itemEnd    Last item to be checked.
 * @return {Object | null}  colliding item, or undefined when no collisions
 * @param {Number} margin   A minimum required margin.
 *                          If margin is provided, the two items will be
 *                          marked colliding when they overlap or
 *                          when the margin between the two is smaller than
 *                          the requested margin.
 */
Stack.prototype.checkOverlap = function checkOverlap (items, itemIndex,
                                                      itemStart, itemEnd, margin) {
  var collision = this.collision;

  // we loop from end to start, as we suppose that the chance of a
  // collision is larger for items at the end, so check these first.
  var a = items[itemIndex];
  for (var i = itemEnd; i >= itemStart; i--) {
    var b = items[i];
    if (collision(a, b, margin)) {
      if (i != itemIndex) {
        return b;
      }
    }
  }

  return null;
};

/**
 * Test if the two provided items collide
 * The items must have parameters left, width, top, and height.
 * @param {Component} a     The first item
 * @param {Component} b     The second item
 * @param {Number} margin   A minimum required margin.
 *                          If margin is provided, the two items will be
 *                          marked colliding when they overlap or
 *                          when the margin between the two is smaller than
 *                          the requested margin.
 * @return {boolean}        true if a and b collide, else false
 */
Stack.prototype.collision = function collision (a, b, margin) {
  return ((a.left - margin) < (b.left + b.width) &&
      (a.left + a.width + margin) > b.left &&
      (a.top - margin) < (b.top + b.height) &&
      (a.top + a.height + margin) > b.top);
};

module.exports = Stack;

},{"../utils":24,"./component/item/ItemRange":22}],8:[function(require,module,exports){
var moment = require('../module/imports').moment;

/**
 * @constructor  TimeStep
 * The class TimeStep is an iterator for dates. You provide a start date and an
 * end date. The class itself determines the best scale (step size) based on the
 * provided start Date, end Date, and minimumStep.
 *
 * If minimumStep is provided, the step size is chosen as close as possible
 * to the minimumStep but larger than minimumStep. If minimumStep is not
 * provided, the scale is set to 1 DAY.
 * The minimumStep should correspond with the onscreen size of about 6 characters
 *
 * Alternatively, you can set a scale by hand.
 * After creation, you can initialize the class by executing first(). Then you
 * can iterate from the start date to the end date via next(). You can check if
 * the end date is reached with the function hasNext(). After each step, you can
 * retrieve the current date via getCurrent().
 * The TimeStep has scales ranging from milliseconds, seconds, minutes, hours,
 * days, to years.
 *
 * Version: 1.2
 *
 * @param {Date} [start]         The start date, for example new Date(2010, 9, 21)
 *                               or new Date(2010, 9, 21, 23, 45, 00)
 * @param {Date} [end]           The end date
 * @param {Number} [minimumStep] Optional. Minimum step size in milliseconds
 */
TimeStep = function(start, end, minimumStep) {
  // variables
  this.current = new Date();
  this._start = new Date();
  this._end = new Date();

  this.autoScale  = true;
  this.scale = TimeStep.SCALE.DAY;
  this.step = 1;

  // initialize the range
  this.setRange(start, end, minimumStep);
};

/// enum scale
TimeStep.SCALE = {
  MILLISECOND: 1,
  SECOND: 2,
  MINUTE: 3,
  HOUR: 4,
  DAY: 5,
  WEEKDAY: 6,
  MONTH: 7,
  YEAR: 8
};


/**
 * Set a new range
 * If minimumStep is provided, the step size is chosen as close as possible
 * to the minimumStep but larger than minimumStep. If minimumStep is not
 * provided, the scale is set to 1 DAY.
 * The minimumStep should correspond with the onscreen size of about 6 characters
 * @param {Date} [start]      The start date and time.
 * @param {Date} [end]        The end date and time.
 * @param {int} [minimumStep] Optional. Minimum step size in milliseconds
 */
TimeStep.prototype.setRange = function(start, end, minimumStep) {
  if (!(start instanceof Date) || !(end instanceof Date)) {
    throw  "No legal start or end date in method setRange";
  }

  this._start = (start != undefined) ? new Date(start.valueOf()) : new Date();
  this._end = (end != undefined) ? new Date(end.valueOf()) : new Date();

  if (this.autoScale) {
    this.setMinimumStep(minimumStep);
  }
};

/**
 * Set the range iterator to the start date.
 */
TimeStep.prototype.first = function() {
  this.current = new Date(this._start.valueOf());
  this.roundToMinor();
};

/**
 * Round the current date to the first minor date value
 * This must be executed once when the current date is set to start Date
 */
TimeStep.prototype.roundToMinor = function() {
  // round to floor
  // IMPORTANT: we have no breaks in this switch! (this is no bug)
  //noinspection FallthroughInSwitchStatementJS
  switch (this.scale) {
    case TimeStep.SCALE.YEAR:
      this.current.setFullYear(this.step * Math.floor(this.current.getFullYear() / this.step));
      this.current.setMonth(0);
    case TimeStep.SCALE.MONTH:        this.current.setDate(1);
    case TimeStep.SCALE.DAY:          // intentional fall through
    case TimeStep.SCALE.WEEKDAY:      this.current.setHours(0);
    case TimeStep.SCALE.HOUR:         this.current.setMinutes(0);
    case TimeStep.SCALE.MINUTE:       this.current.setSeconds(0);
    case TimeStep.SCALE.SECOND:       this.current.setMilliseconds(0);
    //case TimeStep.SCALE.MILLISECOND: // nothing to do for milliseconds
  }

  if (this.step != 1) {
    // round down to the first minor value that is a multiple of the current step size
    switch (this.scale) {
      case TimeStep.SCALE.MILLISECOND:  this.current.setMilliseconds(this.current.getMilliseconds() - this.current.getMilliseconds() % this.step);  break;
      case TimeStep.SCALE.SECOND:       this.current.setSeconds(this.current.getSeconds() - this.current.getSeconds() % this.step); break;
      case TimeStep.SCALE.MINUTE:       this.current.setMinutes(this.current.getMinutes() - this.current.getMinutes() % this.step); break;
      case TimeStep.SCALE.HOUR:         this.current.setHours(this.current.getHours() - this.current.getHours() % this.step); break;
      case TimeStep.SCALE.WEEKDAY:      // intentional fall through
      case TimeStep.SCALE.DAY:          this.current.setDate((this.current.getDate()-1) - (this.current.getDate()-1) % this.step + 1); break;
      case TimeStep.SCALE.MONTH:        this.current.setMonth(this.current.getMonth() - this.current.getMonth() % this.step);  break;
      case TimeStep.SCALE.YEAR:         this.current.setFullYear(this.current.getFullYear() - this.current.getFullYear() % this.step); break;
      default: break;
    }
  }
};

/**
 * Check if the there is a next step
 * @return {boolean}  true if the current date has not passed the end date
 */
TimeStep.prototype.hasNext = function () {
  return (this.current.valueOf() <= this._end.valueOf());
};

/**
 * Do the next step
 */
TimeStep.prototype.next = function() {
  var prev = this.current.valueOf();

  // Two cases, needed to prevent issues with switching daylight savings
  // (end of March and end of October)
  if (this.current.getMonth() < 6)   {
    switch (this.scale) {
      case TimeStep.SCALE.MILLISECOND:

        this.current = new Date(this.current.valueOf() + this.step); break;
      case TimeStep.SCALE.SECOND:       this.current = new Date(this.current.valueOf() + this.step * 1000); break;
      case TimeStep.SCALE.MINUTE:       this.current = new Date(this.current.valueOf() + this.step * 1000 * 60); break;
      case TimeStep.SCALE.HOUR:
        this.current = new Date(this.current.valueOf() + this.step * 1000 * 60 * 60);
        // in case of skipping an hour for daylight savings, adjust the hour again (else you get: 0h 5h 9h ... instead of 0h 4h 8h ...)
        var h = this.current.getHours();
        this.current.setHours(h - (h % this.step));
        break;
      case TimeStep.SCALE.WEEKDAY:      // intentional fall through
      case TimeStep.SCALE.DAY:          this.current.setDate(this.current.getDate() + this.step); break;
      case TimeStep.SCALE.MONTH:        this.current.setMonth(this.current.getMonth() + this.step); break;
      case TimeStep.SCALE.YEAR:         this.current.setFullYear(this.current.getFullYear() + this.step); break;
      default:                      break;
    }
  }
  else {
    switch (this.scale) {
      case TimeStep.SCALE.MILLISECOND:  this.current = new Date(this.current.valueOf() + this.step); break;
      case TimeStep.SCALE.SECOND:       this.current.setSeconds(this.current.getSeconds() + this.step); break;
      case TimeStep.SCALE.MINUTE:       this.current.setMinutes(this.current.getMinutes() + this.step); break;
      case TimeStep.SCALE.HOUR:         this.current.setHours(this.current.getHours() + this.step); break;
      case TimeStep.SCALE.WEEKDAY:      // intentional fall through
      case TimeStep.SCALE.DAY:          this.current.setDate(this.current.getDate() + this.step); break;
      case TimeStep.SCALE.MONTH:        this.current.setMonth(this.current.getMonth() + this.step); break;
      case TimeStep.SCALE.YEAR:         this.current.setFullYear(this.current.getFullYear() + this.step); break;
      default:                      break;
    }
  }

  if (this.step != 1) {
    // round down to the correct major value
    switch (this.scale) {
      case TimeStep.SCALE.MILLISECOND:  if(this.current.getMilliseconds() < this.step) this.current.setMilliseconds(0);  break;
      case TimeStep.SCALE.SECOND:       if(this.current.getSeconds() < this.step) this.current.setSeconds(0);  break;
      case TimeStep.SCALE.MINUTE:       if(this.current.getMinutes() < this.step) this.current.setMinutes(0);  break;
      case TimeStep.SCALE.HOUR:         if(this.current.getHours() < this.step) this.current.setHours(0);  break;
      case TimeStep.SCALE.WEEKDAY:      // intentional fall through
      case TimeStep.SCALE.DAY:          if(this.current.getDate() < this.step+1) this.current.setDate(1); break;
      case TimeStep.SCALE.MONTH:        if(this.current.getMonth() < this.step) this.current.setMonth(0);  break;
      case TimeStep.SCALE.YEAR:         break; // nothing to do for year
      default:                break;
    }
  }

  // safety mechanism: if current time is still unchanged, move to the end
  if (this.current.valueOf() == prev) {
    this.current = new Date(this._end.valueOf());
  }
};


/**
 * Get the current datetime
 * @return {Date}  current The current date
 */
TimeStep.prototype.getCurrent = function() {
  return this.current;
};

/**
 * Set a custom scale. Autoscaling will be disabled.
 * For example setScale(SCALE.MINUTES, 5) will result
 * in minor steps of 5 minutes, and major steps of an hour.
 *
 * @param {TimeStep.SCALE} newScale
 *                               A scale. Choose from SCALE.MILLISECOND,
 *                               SCALE.SECOND, SCALE.MINUTE, SCALE.HOUR,
 *                               SCALE.WEEKDAY, SCALE.DAY, SCALE.MONTH,
 *                               SCALE.YEAR.
 * @param {Number}     newStep   A step size, by default 1. Choose for
 *                               example 1, 2, 5, or 10.
 */
TimeStep.prototype.setScale = function(newScale, newStep) {
  this.scale = newScale;

  if (newStep > 0) {
    this.step = newStep;
  }

  this.autoScale = false;
};

/**
 * Enable or disable autoscaling
 * @param {boolean} enable  If true, autoascaling is set true
 */
TimeStep.prototype.setAutoScale = function (enable) {
  this.autoScale = enable;
};


/**
 * Automatically determine the scale that bests fits the provided minimum step
 * @param {Number} [minimumStep]  The minimum step size in milliseconds
 */
TimeStep.prototype.setMinimumStep = function(minimumStep) {
  if (minimumStep == undefined) {
    return;
  }

  var stepYear       = (1000 * 60 * 60 * 24 * 30 * 12);
  var stepMonth      = (1000 * 60 * 60 * 24 * 30);
  var stepDay        = (1000 * 60 * 60 * 24);
  var stepHour       = (1000 * 60 * 60);
  var stepMinute     = (1000 * 60);
  var stepSecond     = (1000);
  var stepMillisecond= (1);

  // find the smallest step that is larger than the provided minimumStep
  if (stepYear*1000 > minimumStep)        {this.scale = TimeStep.SCALE.YEAR;        this.step = 1000;}
  if (stepYear*500 > minimumStep)         {this.scale = TimeStep.SCALE.YEAR;        this.step = 500;}
  if (stepYear*100 > minimumStep)         {this.scale = TimeStep.SCALE.YEAR;        this.step = 100;}
  if (stepYear*50 > minimumStep)          {this.scale = TimeStep.SCALE.YEAR;        this.step = 50;}
  if (stepYear*10 > minimumStep)          {this.scale = TimeStep.SCALE.YEAR;        this.step = 10;}
  if (stepYear*5 > minimumStep)           {this.scale = TimeStep.SCALE.YEAR;        this.step = 5;}
  if (stepYear > minimumStep)             {this.scale = TimeStep.SCALE.YEAR;        this.step = 1;}
  if (stepMonth*3 > minimumStep)          {this.scale = TimeStep.SCALE.MONTH;       this.step = 3;}
  if (stepMonth > minimumStep)            {this.scale = TimeStep.SCALE.MONTH;       this.step = 1;}
  if (stepDay*5 > minimumStep)            {this.scale = TimeStep.SCALE.DAY;         this.step = 5;}
  if (stepDay*2 > minimumStep)            {this.scale = TimeStep.SCALE.DAY;         this.step = 2;}
  if (stepDay > minimumStep)              {this.scale = TimeStep.SCALE.DAY;         this.step = 1;}
  if (stepDay/2 > minimumStep)            {this.scale = TimeStep.SCALE.WEEKDAY;     this.step = 1;}
  if (stepHour*4 > minimumStep)           {this.scale = TimeStep.SCALE.HOUR;        this.step = 4;}
  if (stepHour > minimumStep)             {this.scale = TimeStep.SCALE.HOUR;        this.step = 1;}
  if (stepMinute*15 > minimumStep)        {this.scale = TimeStep.SCALE.MINUTE;      this.step = 15;}
  if (stepMinute*10 > minimumStep)        {this.scale = TimeStep.SCALE.MINUTE;      this.step = 10;}
  if (stepMinute*5 > minimumStep)         {this.scale = TimeStep.SCALE.MINUTE;      this.step = 5;}
  if (stepMinute > minimumStep)           {this.scale = TimeStep.SCALE.MINUTE;      this.step = 1;}
  if (stepSecond*15 > minimumStep)        {this.scale = TimeStep.SCALE.SECOND;      this.step = 15;}
  if (stepSecond*10 > minimumStep)        {this.scale = TimeStep.SCALE.SECOND;      this.step = 10;}
  if (stepSecond*5 > minimumStep)         {this.scale = TimeStep.SCALE.SECOND;      this.step = 5;}
  if (stepSecond > minimumStep)           {this.scale = TimeStep.SCALE.SECOND;      this.step = 1;}
  if (stepMillisecond*200 > minimumStep)  {this.scale = TimeStep.SCALE.MILLISECOND; this.step = 200;}
  if (stepMillisecond*100 > minimumStep)  {this.scale = TimeStep.SCALE.MILLISECOND; this.step = 100;}
  if (stepMillisecond*50 > minimumStep)   {this.scale = TimeStep.SCALE.MILLISECOND; this.step = 50;}
  if (stepMillisecond*10 > minimumStep)   {this.scale = TimeStep.SCALE.MILLISECOND; this.step = 10;}
  if (stepMillisecond*5 > minimumStep)    {this.scale = TimeStep.SCALE.MILLISECOND; this.step = 5;}
  if (stepMillisecond > minimumStep)      {this.scale = TimeStep.SCALE.MILLISECOND; this.step = 1;}
};

/**
 * Snap a date to a rounded value.
 * The snap intervals are dependent on the current scale and step.
 * @param {Date} date   the date to be snapped.
 * @return {Date} snappedDate
 */
TimeStep.prototype.snap = function(date) {
  var clone = new Date(date.valueOf());

  if (this.scale == TimeStep.SCALE.YEAR) {
    var year = clone.getFullYear() + Math.round(clone.getMonth() / 12);
    clone.setFullYear(Math.round(year / this.step) * this.step);
    clone.setMonth(0);
    clone.setDate(0);
    clone.setHours(0);
    clone.setMinutes(0);
    clone.setSeconds(0);
    clone.setMilliseconds(0);
  }
  else if (this.scale == TimeStep.SCALE.MONTH) {
    if (clone.getDate() > 15) {
      clone.setDate(1);
      clone.setMonth(clone.getMonth() + 1);
      // important: first set Date to 1, after that change the month.
    }
    else {
      clone.setDate(1);
    }

    clone.setHours(0);
    clone.setMinutes(0);
    clone.setSeconds(0);
    clone.setMilliseconds(0);
  }
  else if (this.scale == TimeStep.SCALE.DAY ||
      this.scale == TimeStep.SCALE.WEEKDAY) {
    //noinspection FallthroughInSwitchStatementJS
    switch (this.step) {
      case 5:
      case 2:
        clone.setHours(Math.round(clone.getHours() / 24) * 24); break;
      default:
        clone.setHours(Math.round(clone.getHours() / 12) * 12); break;
    }
    clone.setMinutes(0);
    clone.setSeconds(0);
    clone.setMilliseconds(0);
  }
  else if (this.scale == TimeStep.SCALE.HOUR) {
    switch (this.step) {
      case 4:
        clone.setMinutes(Math.round(clone.getMinutes() / 60) * 60); break;
      default:
        clone.setMinutes(Math.round(clone.getMinutes() / 30) * 30); break;
    }
    clone.setSeconds(0);
    clone.setMilliseconds(0);
  } else if (this.scale == TimeStep.SCALE.MINUTE) {
    //noinspection FallthroughInSwitchStatementJS
    switch (this.step) {
      case 15:
      case 10:
        clone.setMinutes(Math.round(clone.getMinutes() / 5) * 5);
        clone.setSeconds(0);
        break;
      case 5:
        clone.setSeconds(Math.round(clone.getSeconds() / 60) * 60); break;
      default:
        clone.setSeconds(Math.round(clone.getSeconds() / 30) * 30); break;
    }
    clone.setMilliseconds(0);
  }
  else if (this.scale == TimeStep.SCALE.SECOND) {
    //noinspection FallthroughInSwitchStatementJS
    switch (this.step) {
      case 15:
      case 10:
        clone.setSeconds(Math.round(clone.getSeconds() / 5) * 5);
        clone.setMilliseconds(0);
        break;
      case 5:
        clone.setMilliseconds(Math.round(clone.getMilliseconds() / 1000) * 1000); break;
      default:
        clone.setMilliseconds(Math.round(clone.getMilliseconds() / 500) * 500); break;
    }
  }
  else if (this.scale == TimeStep.SCALE.MILLISECOND) {
    var step = this.step > 5 ? this.step / 2 : 1;
    clone.setMilliseconds(Math.round(clone.getMilliseconds() / step) * step);
  }
  
  return clone;
};

/**
 * Check if the current value is a major value (for example when the step
 * is DAY, a major value is each first day of the MONTH)
 * @return {boolean} true if current date is major, else false.
 */
TimeStep.prototype.isMajor = function() {
  switch (this.scale) {
    case TimeStep.SCALE.MILLISECOND:
      return (this.current.getMilliseconds() == 0);
    case TimeStep.SCALE.SECOND:
      return (this.current.getSeconds() == 0);
    case TimeStep.SCALE.MINUTE:
      return (this.current.getHours() == 0) && (this.current.getMinutes() == 0);
    // Note: this is no bug. Major label is equal for both minute and hour scale
    case TimeStep.SCALE.HOUR:
      return (this.current.getHours() == 0);
    case TimeStep.SCALE.WEEKDAY: // intentional fall through
    case TimeStep.SCALE.DAY:
      return (this.current.getDate() == 1);
    case TimeStep.SCALE.MONTH:
      return (this.current.getMonth() == 0);
    case TimeStep.SCALE.YEAR:
      return false;
    default:
      return false;
  }
};


/**
 * Returns formatted text for the minor axislabel, depending on the current
 * date and the scale. For example when scale is MINUTE, the current time is
 * formatted as "hh:mm".
 * @param {Date} [date] custom date. if not provided, current date is taken
 */
TimeStep.prototype.getLabelMinor = function(date) {
  if (date == undefined) {
    date = this.current;
  }

  switch (this.scale) {
    case TimeStep.SCALE.MILLISECOND:  return moment(date).format('SSS');
    case TimeStep.SCALE.SECOND:       return moment(date).format('s');
    case TimeStep.SCALE.MINUTE:       return moment(date).format('HH:mm');
    case TimeStep.SCALE.HOUR:         return moment(date).format('HH:mm');
    case TimeStep.SCALE.WEEKDAY:      return moment(date).format('ddd D');
    case TimeStep.SCALE.DAY:          return moment(date).format('D');
    case TimeStep.SCALE.MONTH:        return moment(date).format('MMM');
    case TimeStep.SCALE.YEAR:         return moment(date).format('YYYY');
    default:                          return '';
  }
};


/**
 * Returns formatted text for the major axis label, depending on the current
 * date and the scale. For example when scale is MINUTE, the major scale is
 * hours, and the hour will be formatted as "hh".
 * @param {Date} [date] custom date. if not provided, current date is taken
 */
TimeStep.prototype.getLabelMajor = function(date) {
  if (date == undefined) {
    date = this.current;
  }

  //noinspection FallthroughInSwitchStatementJS
  switch (this.scale) {
    case TimeStep.SCALE.MILLISECOND:return moment(date).format('HH:mm:ss');
    case TimeStep.SCALE.SECOND:     return moment(date).format('D MMMM HH:mm');
    case TimeStep.SCALE.MINUTE:
    case TimeStep.SCALE.HOUR:       return moment(date).format('ddd D MMMM');
    case TimeStep.SCALE.WEEKDAY:
    case TimeStep.SCALE.DAY:        return moment(date).format('MMMM YYYY');
    case TimeStep.SCALE.MONTH:      return moment(date).format('YYYY');
    case TimeStep.SCALE.YEAR:       return '';
    default:                        return '';
  }
};

module.exports = TimeStep;

},{"../module/imports":4}],9:[function(require,module,exports){
var moment = require('../module/imports').moment,
    utils = require('../utils'),
    Controller = require('./Controller'),
    RootPanel = require('./component/RootPanel'),
    Panel = require('./component/Panel'),
    ItemSet = require('./component/ItemSet'),
    GroupSet = require('./component/GroupSet'),
    TimeAxis = require('./component/TimeAxis'),
    CurrentTime = require('./component/CurrentTime'),
    CustomTime = require('./component/CustomTime'),
    Range = require('./Range'),
    DataSet = require('../DataSet');

/**
 * Create a timeline visualization
 * @param {HTMLElement} container
 * @param {vis.DataSet | Array | google.visualization.DataTable} [items]
 * @param {Object} [options]  See Timeline.setOptions for the available options.
 * @constructor
 */
function Timeline (container, items, options) {
  var me = this;
  var now = moment().hours(0).minutes(0).seconds(0).milliseconds(0);
  this.options = {
    orientation: 'bottom',
    autoResize: true,
    editable: false,
    selectable: true,
    snap: null, // will be specified after timeaxis is created

    min: null,
    max: null,
    zoomMin: 10,                                // milliseconds
    zoomMax: 1000 * 60 * 60 * 24 * 365 * 10000, // milliseconds
    // moveable: true, // TODO: option moveable
    // zoomable: true, // TODO: option zoomable

    showMinorLabels: true,
    showMajorLabels: true,
    showCurrentTime: false,
    showCustomTime: false,

    onAdd: function (item, callback) {
      callback(item);
    },
    onUpdate: function (item, callback) {
      callback(item);
    },
    onMove: function (item, callback) {
      callback(item);
    },
    onRemove: function (item, callback) {
      callback(item);
    }
  };

  // controller
  this.controller = new Controller();

  // root panel
  if (!container) {
    throw new Error('No container element provided');
  }
  var rootOptions = Object.create(this.options);
  rootOptions.height = function () {
    // TODO: change to height
    if (me.options.height) {
      // fixed height
      return me.options.height;
    }
    else {
      // auto height
      return (me.timeaxis.height + me.content.height) + 'px';
    }
  };
  this.rootPanel = new RootPanel(container, rootOptions);
  this.controller.add(this.rootPanel);

  // single select (or unselect) when tapping an item
  this.controller.on('tap',  this._onSelectItem.bind(this));

  // multi select when holding mouse/touch, or on ctrl+click
  this.controller.on('hold', this._onMultiSelectItem.bind(this));

  // add item on doubletap
  this.controller.on('doubletap', this._onAddItem.bind(this));

  // item panel
  var itemOptions = Object.create(this.options);
  itemOptions.left = function () {
    return me.labelPanel.width;
  };
  itemOptions.width = function () {
    return me.rootPanel.width - me.labelPanel.width;
  };
  itemOptions.top = null;
  itemOptions.height = null;
  this.itemPanel = new Panel(this.rootPanel, [], itemOptions);
  this.controller.add(this.itemPanel);

  // label panel
  var labelOptions = Object.create(this.options);
  labelOptions.top = null;
  labelOptions.left = null;
  labelOptions.height = null;
  labelOptions.width = function () {
    if (me.content && typeof me.content.getLabelsWidth === 'function') {
      return me.content.getLabelsWidth();
    }
    else {
      return 0;
    }
  };
  this.labelPanel = new Panel(this.rootPanel, [], labelOptions);
  this.controller.add(this.labelPanel);

  // range
  var rangeOptions = Object.create(this.options);
  this.range = new Range(rangeOptions);
  this.range.setRange(
      now.clone().add('days', -3).valueOf(),
      now.clone().add('days', 4).valueOf()
  );

  this.range.subscribe(this.controller, this.rootPanel, 'move', 'horizontal');
  this.range.subscribe(this.controller, this.rootPanel, 'zoom', 'horizontal');
  this.range.on('rangechange', function (properties) {
    var force = true;
    me.controller.emit('rangechange', properties);
    me.controller.emit('request-reflow', force);
  });
  this.range.on('rangechanged', function (properties) {
    var force = true;
    me.controller.emit('rangechanged', properties);
    me.controller.emit('request-reflow', force);
  });

  // time axis
  var timeaxisOptions = Object.create(rootOptions);
  timeaxisOptions.range = this.range;
  timeaxisOptions.left = null;
  timeaxisOptions.top = null;
  timeaxisOptions.width = '100%';
  timeaxisOptions.height = null;
  this.timeaxis = new TimeAxis(this.itemPanel, [], timeaxisOptions);
  this.timeaxis.setRange(this.range);
  this.controller.add(this.timeaxis);
  this.options.snap = this.timeaxis.snap.bind(this.timeaxis);

  // current time bar
  this.currenttime = new CurrentTime(this.timeaxis, [], rootOptions);
  this.controller.add(this.currenttime);

  // custom time bar
  this.customtime = new CustomTime(this.timeaxis, [], rootOptions);
  this.controller.add(this.customtime);

  // create groupset
  this.setGroups(null);

  this.itemsData = null;      // DataSet
  this.groupsData = null;     // DataSet

  // apply options
  if (options) {
    this.setOptions(options);
  }

  // create itemset and groupset
  if (items) {
    this.setItems(items);
  }
}

/**
 * Add an event listener to the timeline
 * @param {String} event    Available events: select, rangechange, rangechanged,
 *                          timechange, timechanged
 * @param {function} callback
 */
Timeline.prototype.on = function on (event, callback) {
  this.controller.on(event, callback);
};

/**
 * Add an event listener from the timeline
 * @param {String} event
 * @param {function} callback
 */
Timeline.prototype.off = function off (event, callback) {
  this.controller.off(event, callback);
};

/**
 * Set options
 * @param {Object} options  TODO: describe the available options
 */
Timeline.prototype.setOptions = function (options) {
  utils.extend(this.options, options);

  // force update of range (apply new min/max etc.)
  // both start and end are optional
  this.range.setRange(options.start, options.end);

  if ('editable' in options || 'selectable' in options) {
    if (this.options.selectable) {
      // force update of selection
      this.setSelection(this.getSelection());
    }
    else {
      // remove selection
      this.setSelection([]);
    }
  }

  // validate the callback functions
  var validateCallback = (function (fn) {
    if (!(this.options[fn] instanceof Function) || this.options[fn].length != 2) {
      throw new Error('option ' + fn + ' must be a function ' + fn + '(item, callback)');
    }
  }).bind(this);
  ['onAdd', 'onUpdate', 'onRemove', 'onMove'].forEach(validateCallback);

  this.controller.reflow();
  this.controller.repaint();
};

/**
 * Set a custom time bar
 * @param {Date} time
 */
Timeline.prototype.setCustomTime = function (time) {
  if (!this.customtime) {
    throw new Error('Cannot get custom time: Custom time bar is not enabled');
  }

  this.customtime.setCustomTime(time);
};

/**
 * Retrieve the current custom time.
 * @return {Date} customTime
 */
Timeline.prototype.getCustomTime = function() {
  if (!this.customtime) {
    throw new Error('Cannot get custom time: Custom time bar is not enabled');
  }

  return this.customtime.getCustomTime();
};

/**
 * Set items
 * @param {vis.DataSet | Array | google.visualization.DataTable | null} items
 */
Timeline.prototype.setItems = function(items) {
  var initialLoad = (this.itemsData == null);

  // convert to type DataSet when needed
  var newDataSet;
  if (!items) {
    newDataSet = null;
  }
  else if (items instanceof DataSet) {
    newDataSet = items;
  }
  if (!(items instanceof DataSet)) {
    newDataSet = new DataSet({
      convert: {
        start: 'Date',
        end: 'Date'
      }
    });
    newDataSet.add(items);
  }

  // set items
  this.itemsData = newDataSet;
  this.content.setItems(newDataSet);

  if (initialLoad && (this.options.start == undefined || this.options.end == undefined)) {
    // apply the data range as range
    var dataRange = this.getItemRange();

    // add 5% space on both sides
    var start = dataRange.min;
    var end = dataRange.max;
    if (start != null && end != null) {
      var interval = (end.valueOf() - start.valueOf());
      if (interval <= 0) {
        // prevent an empty interval
        interval = 24 * 60 * 60 * 1000; // 1 day
      }
      start = new Date(start.valueOf() - interval * 0.05);
      end = new Date(end.valueOf() + interval * 0.05);
    }

    // override specified start and/or end date
    if (this.options.start != undefined) {
      start = utils.convert(this.options.start, 'Date');
    }
    if (this.options.end != undefined) {
      end = utils.convert(this.options.end, 'Date');
    }

    // apply range if there is a min or max available
    if (start != null || end != null) {
      this.range.setRange(start, end);
    }
  }
};

/**
 * Set groups
 * @param {vis.DataSet | Array | google.visualization.DataTable} groups
 */
Timeline.prototype.setGroups = function(groups) {
  var me = this;
  this.groupsData = groups;

  // switch content type between ItemSet or GroupSet when needed
  var Type = this.groupsData ? GroupSet : ItemSet;
  if (!(this.content instanceof Type)) {
    // remove old content set
    if (this.content) {
      this.content.hide();
      if (this.content.setItems) {
        this.content.setItems(); // disconnect from items
      }
      if (this.content.setGroups) {
        this.content.setGroups(); // disconnect from groups
      }
      this.controller.remove(this.content);
    }

    // create new content set
    var options = Object.create(this.options);
    utils.extend(options, {
      top: function () {
        if (me.options.orientation == 'top') {
          return me.timeaxis.height;
        }
        else {
          return me.itemPanel.height - me.timeaxis.height - me.content.height;
        }
      },
      left: null,
      width: '100%',
      height: function () {
        if (me.options.height) {
          // fixed height
          return me.itemPanel.height - me.timeaxis.height;
        }
        else {
          // auto height
          return null;
        }
      },
      maxHeight: function () {
        // TODO: change maxHeight to be a css string like '100%' or '300px'
        if (me.options.maxHeight) {
          if (!utils.isNumber(me.options.maxHeight)) {
            throw new TypeError('Number expected for property maxHeight');
          }
          return me.options.maxHeight - me.timeaxis.height;
        }
        else {
          return null;
        }
      },
      labelContainer: function () {
        return me.labelPanel.getContainer();
      }
    });

    this.content = new Type(this.itemPanel, [this.timeaxis], options);
    if (this.content.setRange) {
      this.content.setRange(this.range);
    }
    if (this.content.setItems) {
      this.content.setItems(this.itemsData);
    }
    if (this.content.setGroups) {
      this.content.setGroups(this.groupsData);
    }
    this.controller.add(this.content);
  }
};

/**
 * Get the data range of the item set.
 * @returns {{min: Date, max: Date}} range  A range with a start and end Date.
 *                                          When no minimum is found, min==null
 *                                          When no maximum is found, max==null
 */
Timeline.prototype.getItemRange = function getItemRange() {
  // calculate min from start filed
  var itemsData = this.itemsData,
      min = null,
      max = null;

  if (itemsData) {
    // calculate the minimum value of the field 'start'
    var minItem = itemsData.min('start');
    min = minItem ? minItem.start.valueOf() : null;

    // calculate maximum value of fields 'start' and 'end'
    var maxStartItem = itemsData.max('start');
    if (maxStartItem) {
      max = maxStartItem.start.valueOf();
    }
    var maxEndItem = itemsData.max('end');
    if (maxEndItem) {
      if (max == null) {
        max = maxEndItem.end.valueOf();
      }
      else {
        max = Math.max(max, maxEndItem.end.valueOf());
      }
    }
  }

  return {
    min: (min != null) ? new Date(min) : null,
    max: (max != null) ? new Date(max) : null
  };
};

/**
 * Set selected items by their id. Replaces the current selection
 * Unknown id's are silently ignored.
 * @param {Array} [ids] An array with zero or more id's of the items to be
 *                      selected. If ids is an empty array, all items will be
 *                      unselected.
 */
Timeline.prototype.setSelection = function setSelection (ids) {
  if (this.content) this.content.setSelection(ids);
};

/**
 * Get the selected items by their id
 * @return {Array} ids  The ids of the selected items
 */
Timeline.prototype.getSelection = function getSelection() {
  return this.content ? this.content.getSelection() : [];
};

/**
 * Set the visible window. Both parameters are optional, you can change only
 * start or only end.
 * @param {Date | Number | String} [start] Start date of visible window
 * @param {Date | Number | String} [end]   End date of visible window
 */
Timeline.prototype.setWindow = function setWindow(start, end) {
  this.range.setRange(start, end);
};

/**
 * Get the visible window
 * @return {{start: Date, end: Date}}   Visible range
 */
Timeline.prototype.getWindow = function setWindow() {
  var range = this.range.getRange();
  return {
    start: new Date(range.start),
    end: new Date(range.end)
  };
};

/**
 * Handle selecting/deselecting an item when tapping it
 * @param {Event} event
 * @private
 */
// TODO: move this function to ItemSet
Timeline.prototype._onSelectItem = function (event) {
  if (!this.options.selectable) return;

  var ctrlKey  = event.gesture.srcEvent && event.gesture.srcEvent.ctrlKey;
  var shiftKey = event.gesture.srcEvent && event.gesture.srcEvent.shiftKey;
  if (ctrlKey || shiftKey) {
    this._onMultiSelectItem(event);
    return;
  }

  var item = ItemSet.itemFromTarget(event);

  var selection = item ? [item.id] : [];
  this.setSelection(selection);

  this.controller.emit('select', {
    items: this.getSelection()
  });

  event.stopPropagation();
};

/**
 * Handle creation and updates of an item on double tap
 * @param event
 * @private
 */
Timeline.prototype._onAddItem = function (event) {
  if (!this.options.selectable) return;
  if (!this.options.editable) return;

  var me = this,
      item = ItemSet.itemFromTarget(event);

  if (item) {
    // update item

    // execute async handler to update the item (or cancel it)
    var itemData = me.itemsData.get(item.id); // get a clone of the data from the dataset
    this.options.onUpdate(itemData, function (itemData) {
      if (itemData) {
        me.itemsData.update(itemData);
      }
    });
  }
  else {
    // add item
    var xAbs = vis.utils.getAbsoluteLeft(this.rootPanel.frame);
    var x = event.gesture.center.pageX - xAbs;
    var newItem = {
      start: this.timeaxis.snap(this._toTime(x)),
      content: 'new item'
    };

    var id = utils.randomUUID();
    newItem[this.itemsData.fieldId] = id;

    var group = GroupSet.groupFromTarget(event);
    if (group) {
      newItem.group = group.groupId;
    }

    // execute async handler to customize (or cancel) adding an item
    this.options.onAdd(newItem, function (item) {
      if (item) {
        me.itemsData.add(newItem);

        // select the created item after it is repainted
        me.controller.once('repaint', function () {
          me.setSelection([id]);

          me.controller.emit('select', {
            items: me.getSelection()
          });
        }.bind(me));
      }
    });
  }
};

/**
 * Handle selecting/deselecting multiple items when holding an item
 * @param {Event} event
 * @private
 */
// TODO: move this function to ItemSet
Timeline.prototype._onMultiSelectItem = function (event) {
  if (!this.options.selectable) return;

  var selection,
      item = ItemSet.itemFromTarget(event);

  if (item) {
    // multi select items
    selection = this.getSelection(); // current selection
    var index = selection.indexOf(item.id);
    if (index == -1) {
      // item is not yet selected -> select it
      selection.push(item.id);
    }
    else {
      // item is already selected -> deselect it
      selection.splice(index, 1);
    }
    this.setSelection(selection);

    this.controller.emit('select', {
      items: this.getSelection()
    });

    event.stopPropagation();
  }
};

/**
 * Convert a position on screen (pixels) to a datetime
 * @param {int}     x    Position on the screen in pixels
 * @return {Date}   time The datetime the corresponds with given position x
 * @private
 */
Timeline.prototype._toTime = function _toTime(x) {
  var conversion = this.range.conversion(this.content.width);
  return new Date(x / conversion.scale + conversion.offset);
};

/**
 * Convert a datetime (Date object) into a position on the screen
 * @param {Date}   time A date
 * @return {int}   x    The position on the screen in pixels which corresponds
 *                      with the given date.
 * @private
 */
Timeline.prototype._toScreen = function _toScreen(time) {
  var conversion = this.range.conversion(this.content.width);
  return (time.valueOf() - conversion.offset) * conversion.scale;
};

// exports
module.exports = Timeline;

},{"../DataSet":2,"../module/imports":4,"../utils":24,"./Controller":5,"./Range":6,"./component/CurrentTime":11,"./component/CustomTime":12,"./component/GroupSet":14,"./component/ItemSet":15,"./component/Panel":16,"./component/RootPanel":17,"./component/TimeAxis":18}],10:[function(require,module,exports){
var utils = require('../../utils');

/**
 * Prototype for visual components
 */
function Component () {
  this.id = null;
  this.parent = null;
  this.depends = null;
  this.controller = null;
  this.options = null;

  this.frame = null; // main DOM element
  this.top = 0;
  this.left = 0;
  this.width = 0;
  this.height = 0;
}

/**
 * Set parameters for the frame. Parameters will be merged in current parameter
 * set.
 * @param {Object} options  Available parameters:
 *                          {String | function} [className]
 *                          {String | Number | function} [left]
 *                          {String | Number | function} [top]
 *                          {String | Number | function} [width]
 *                          {String | Number | function} [height]
 */
Component.prototype.setOptions = function setOptions(options) {
  if (options) {
    utils.extend(this.options, options);

    if (this.controller) {
      this.requestRepaint();
      this.requestReflow();
    }
  }
};

/**
 * Get an option value by name
 * The function will first check this.options object, and else will check
 * this.defaultOptions.
 * @param {String} name
 * @return {*} value
 */
Component.prototype.getOption = function getOption(name) {
  var value;
  if (this.options) {
    value = this.options[name];
  }
  if (value === undefined && this.defaultOptions) {
    value = this.defaultOptions[name];
  }
  return value;
};

/**
 * Set controller for this component, or remove current controller by passing
 * null as parameter value.
 * @param {Controller | null} controller
 */
Component.prototype.setController = function setController (controller) {
  this.controller = controller || null;
};

/**
 * Get controller of this component
 * @return {Controller} controller
 */
Component.prototype.getController = function getController () {
  return this.controller;
};

/**
 * Get the container element of the component, which can be used by a child to
 * add its own widgets. Not all components do have a container for childs, in
 * that case null is returned.
 * @returns {HTMLElement | null} container
 */
// TODO: get rid of the getContainer and getFrame methods, provide these via the options
Component.prototype.getContainer = function getContainer() {
  // should be implemented by the component
  return null;
};

/**
 * Get the frame element of the component, the outer HTML DOM element.
 * @returns {HTMLElement | null} frame
 */
Component.prototype.getFrame = function getFrame() {
  return this.frame;
};

/**
 * Repaint the component
 * @return {Boolean} changed
 */
Component.prototype.repaint = function repaint() {
  // should be implemented by the component
  return false;
};

/**
 * Reflow the component
 * @return {Boolean} resized
 */
Component.prototype.reflow = function reflow() {
  // should be implemented by the component
  return false;
};

/**
 * Hide the component from the DOM
 * @return {Boolean} changed
 */
Component.prototype.hide = function hide() {
  if (this.frame && this.frame.parentNode) {
    this.frame.parentNode.removeChild(this.frame);
    return true;
  }
  else {
    return false;
  }
};

/**
 * Show the component in the DOM (when not already visible).
 * A repaint will be executed when the component is not visible
 * @return {Boolean} changed
 */
Component.prototype.show = function show() {
  if (!this.frame || !this.frame.parentNode) {
    return this.repaint();
  }
  else {
    return false;
  }
};

/**
 * Request a repaint. The controller will schedule a repaint
 */
Component.prototype.requestRepaint = function requestRepaint() {
  if (this.controller) {
    this.controller.emit('request-repaint');
  }
  else {
    throw new Error('Cannot request a repaint: no controller configured');
    // TODO: just do a repaint when no parent is configured?
  }
};

/**
 * Request a reflow. The controller will schedule a reflow
 */
Component.prototype.requestReflow = function requestReflow() {
  if (this.controller) {
    this.controller.emit('request-reflow');
  }
  else {
    throw new Error('Cannot request a reflow: no controller configured');
    // TODO: just do a reflow when no parent is configured?
  }
};

module.exports = Component;

},{"../../utils":24}],11:[function(require,module,exports){
var utils = require('../../utils'),
    Component = require('./Component');

/**
 * A current time bar
 * @param {Component} parent
 * @param {Component[]} [depends]   Components on which this components depends
 *                                  (except for the parent)
 * @param {Object} [options]        Available parameters:
 *                                  {Boolean} [showCurrentTime]
 * @constructor CurrentTime
 * @extends Component
 */

function CurrentTime (parent, depends, options) {
  this.id = utils.randomUUID();
  this.parent = parent;
  this.depends = depends;

  this.options = options || {};
  this.defaultOptions = {
    showCurrentTime: false
  };
}

CurrentTime.prototype = new Component();

CurrentTime.prototype.setOptions = Component.prototype.setOptions;

/**
 * Get the container element of the bar, which can be used by a child to
 * add its own widgets.
 * @returns {HTMLElement} container
 */
CurrentTime.prototype.getContainer = function () {
  return this.frame;
};

/**
 * Repaint the component
 * @return {Boolean} changed
 */
CurrentTime.prototype.repaint = function () {
  var bar = this.frame,
      parent = this.parent,
      parentContainer = parent.parent.getContainer();

  if (!parent) {
    throw new Error('Cannot repaint bar: no parent attached');
  }

  if (!parentContainer) {
    throw new Error('Cannot repaint bar: parent has no container element');
  }

  if (!this.getOption('showCurrentTime')) {
    if (bar) {
      parentContainer.removeChild(bar);
      delete this.frame;
    }

    return false;
  }

  if (!bar) {
    bar = document.createElement('div');
    bar.className = 'currenttime';
    bar.style.position = 'absolute';
    bar.style.top = '0px';
    bar.style.height = '100%';

    parentContainer.appendChild(bar);
    this.frame = bar;
  }

  if (!parent.conversion) {
    parent._updateConversion();
  }

  var now = new Date();
  var x = parent.toScreen(now);

  bar.style.left = x + 'px';
  bar.title = 'Current time: ' + now;

  // start a timer to adjust for the new time
  if (this.currentTimeTimer !== undefined) {
    clearTimeout(this.currentTimeTimer);
    delete this.currentTimeTimer;
  }

  var timeline = this;
  var interval = 1 / parent.conversion.scale / 2;

  if (interval < 30) {
    interval = 30;
  }

  this.currentTimeTimer = setTimeout(function() {
    timeline.repaint();
  }, interval);

  return false;
};

module.exports = CurrentTime;

},{"../../utils":24,"./Component":10}],12:[function(require,module,exports){
var utils = require('../../utils'),
    Hammer = require('../../module/imports').Hammer,
    Emitter = require('emitter-component'),
    Component = require('./Component');

/**
 * A custom time bar
 * @param {Component} parent
 * @param {Component[]} [depends]   Components on which this components depends
 *                                  (except for the parent)
 * @param {Object} [options]        Available parameters:
 *                                  {Boolean} [showCustomTime]
 * @constructor CustomTime
 * @extends Component
 */

function CustomTime (parent, depends, options) {
  this.id = utils.randomUUID();
  this.parent = parent;
  this.depends = depends;

  this.options = options || {};
  this.defaultOptions = {
    showCustomTime: false
  };

  this.customTime = new Date();
  this.eventParams = {}; // stores state parameters while dragging the bar
}

CustomTime.prototype = new Component();

Emitter(CustomTime.prototype);

CustomTime.prototype.setOptions = Component.prototype.setOptions;

/**
 * Get the container element of the bar, which can be used by a child to
 * add its own widgets.
 * @returns {HTMLElement} container
 */
CustomTime.prototype.getContainer = function () {
  return this.frame;
};

/**
 * Repaint the component
 * @return {Boolean} changed
 */
CustomTime.prototype.repaint = function () {
  var bar = this.frame,
      parent = this.parent;

  if (!parent) {
    throw new Error('Cannot repaint bar: no parent attached');
  }

  var parentContainer = parent.parent.getContainer();
  if (!parentContainer) {
    throw new Error('Cannot repaint bar: parent has no container element');
  }

  if (!this.getOption('showCustomTime')) {
    if (bar) {
      parentContainer.removeChild(bar);
      delete this.frame;
    }

    return false;
  }

  if (!bar) {
    bar = document.createElement('div');
    bar.className = 'customtime';
    bar.style.position = 'absolute';
    bar.style.top = '0px';
    bar.style.height = '100%';

    parentContainer.appendChild(bar);

    var drag = document.createElement('div');
    drag.style.position = 'relative';
    drag.style.top = '0px';
    drag.style.left = '-10px';
    drag.style.height = '100%';
    drag.style.width = '20px';
    bar.appendChild(drag);

    this.frame = bar;

    // attach event listeners
    this.hammer = Hammer(bar, {
      prevent_default: true
    });
    this.hammer.on('dragstart', this._onDragStart.bind(this));
    this.hammer.on('drag',      this._onDrag.bind(this));
    this.hammer.on('dragend',   this._onDragEnd.bind(this));
  }

  if (!parent.conversion) {
    parent._updateConversion();
  }

  var x = parent.toScreen(this.customTime);

  bar.style.left = x + 'px';
  bar.title = 'Time: ' + this.customTime;

  return false;
};

/**
 * Set custom time.
 * @param {Date} time
 */
CustomTime.prototype.setCustomTime = function(time) {
  this.customTime = new Date(time.valueOf());
  this.repaint();
};

/**
 * Retrieve the current custom time.
 * @return {Date} customTime
 */
CustomTime.prototype.getCustomTime = function() {
  return new Date(this.customTime.valueOf());
};

/**
 * Start moving horizontally
 * @param {Event} event
 * @private
 */
CustomTime.prototype._onDragStart = function(event) {
  this.eventParams.customTime = this.customTime;

  event.stopPropagation();
  event.preventDefault();
};

/**
 * Perform moving operating.
 * @param {Event} event
 * @private
 */
CustomTime.prototype._onDrag = function (event) {
  var deltaX = event.gesture.deltaX,
      x = this.parent.toScreen(this.eventParams.customTime) + deltaX,
      time = this.parent.toTime(x);

  this.setCustomTime(time);

  // fire a timechange event
  if (this.controller) {
    this.controller.emit('timechange', {
      time: this.customTime
    })
  }

  event.stopPropagation();
  event.preventDefault();
};

/**
 * Stop moving operating.
 * @param {event} event
 * @private
 */
CustomTime.prototype._onDragEnd = function (event) {
  // fire a timechanged event
  if (this.controller) {
    this.controller.emit('timechanged', {
      time: this.customTime
    })
  }

  event.stopPropagation();
  event.preventDefault();
};

module.exports = CustomTime;

},{"../../module/imports":4,"../../utils":24,"./Component":10,"emitter-component":25}],13:[function(require,module,exports){
var utils = require('../../utils'),
    Component = require('./Component'),
    ItemSet = require('./ItemSet'),
    DataView = require('../../DataView');

/**
 * @constructor Group
 * @param {GroupSet} parent
 * @param {Number | String} groupId
 * @param {Object} [options]  Options to set initial property values
 *                            // TODO: describe available options
 * @extends Component
 */
function Group (parent, groupId, options) {
  this.id = utils.randomUUID();
  this.parent = parent;

  this.groupId = groupId;
  this.itemset = null;    // ItemSet
  this.options = options || {};
  this.options.top = 0;

  this.props = {
    label: {
      width: 0,
      height: 0
    }
  };

  this.top = 0;
  this.left = 0;
  this.width = 0;
  this.height = 0;
}

Group.prototype = new Component();

// TODO: comment
Group.prototype.setOptions = Component.prototype.setOptions;

/**
 * Get the container element of the panel, which can be used by a child to
 * add its own widgets.
 * @returns {HTMLElement} container
 */
Group.prototype.getContainer = function () {
  return this.parent.getContainer();
};

/**
 * Set item set for the group. The group will create a view on the itemset,
 * filtered by the groups id.
 * @param {DataSet | DataView} items
 */
Group.prototype.setItems = function setItems(items) {
  if (this.itemset) {
    // remove current item set
    this.itemset.hide();
    this.itemset.setItems();

    this.parent.controller.remove(this.itemset);
    this.itemset = null;
  }

  if (items) {
    var groupId = this.groupId;

    var itemsetOptions = Object.create(this.options);
    this.itemset = new ItemSet(this, null, itemsetOptions);
    this.itemset.setRange(this.parent.range);

    this.view = new DataView(items, {
      filter: function (item) {
        return item.group == groupId;
      }
    });
    this.itemset.setItems(this.view);

    this.parent.controller.add(this.itemset);
  }
};

/**
 * Set selected items by their id. Replaces the current selection.
 * Unknown id's are silently ignored.
 * @param {Array} [ids] An array with zero or more id's of the items to be
 *                      selected. If ids is an empty array, all items will be
 *                      unselected.
 */
Group.prototype.setSelection = function setSelection(ids) {
  if (this.itemset) this.itemset.setSelection(ids);
};

/**
 * Get the selected items by their id
 * @return {Array} ids  The ids of the selected items
 */
Group.prototype.getSelection = function getSelection() {
  return this.itemset ? this.itemset.getSelection() : [];
};

/**
 * Repaint the item
 * @return {Boolean} changed
 */
Group.prototype.repaint = function repaint() {
  return false;
};

/**
 * Reflow the item
 * @return {Boolean} resized
 */
Group.prototype.reflow = function reflow() {
  var changed = 0,
      update = utils.updateProperty;

  changed += update(this, 'top',    this.itemset ? this.itemset.top : 0);
  changed += update(this, 'height', this.itemset ? this.itemset.height : 0);

  // TODO: reckon with the height of the group label

  if (this.label) {
    var inner = this.label.firstChild;
    changed += update(this.props.label, 'width', inner.clientWidth);
    changed += update(this.props.label, 'height', inner.clientHeight);
  }
  else {
    changed += update(this.props.label, 'width', 0);
    changed += update(this.props.label, 'height', 0);
  }

  return (changed > 0);
};

module.exports = Group;

},{"../../DataView":3,"../../utils":24,"./Component":10,"./ItemSet":15}],14:[function(require,module,exports){
var utils = require('../../utils'),
    DataSet = require('../../DataSet'),
    Component = require('./Component'),
    Panel = require('./Panel'),
    Group = require('./Group'),
    ItemSet = require('./ItemSet');

/**
 * An GroupSet holds a set of groups
 * @param {Component} parent
 * @param {Component[]} [depends]   Components on which this components depends
 *                                  (except for the parent)
 * @param {Object} [options]        See GroupSet.setOptions for the available
 *                                  options.
 * @constructor GroupSet
 * @extends Panel
 */
function GroupSet(parent, depends, options) {
  this.id = utils.randomUUID();
  this.parent = parent;
  this.depends = depends;

  this.options = options || {};

  this.range = null;      // Range or Object {start: number, end: number}
  this.itemsData = null;  // DataSet with items
  this.groupsData = null; // DataSet with groups

  this.groups = {};       // map with groups

  this.dom = {};
  this.props = {
    labels: {
      width: 0
    }
  };

  // TODO: implement right orientation of the labels

  // changes in groups are queued  key/value map containing id/action
  this.queue = {};

  var me = this;
  this.listeners = {
    'add': function (event, params) {
      me._onAdd(params.items);
    },
    'update': function (event, params) {
      me._onUpdate(params.items);
    },
    'remove': function (event, params) {
      me._onRemove(params.items);
    }
  };
}

GroupSet.prototype = new Panel();

/**
 * Set options for the GroupSet. Existing options will be extended/overwritten.
 * @param {Object} [options] The following options are available:
 *                           {String | function} groupsOrder
 *                           TODO: describe options
 */
GroupSet.prototype.setOptions = Component.prototype.setOptions;

GroupSet.prototype.setRange = function (range) {
  // TODO: implement setRange
};

/**
 * Set items
 * @param {vis.DataSet | null} items
 */
GroupSet.prototype.setItems = function setItems(items) {
  this.itemsData = items;

  for (var id in this.groups) {
    if (this.groups.hasOwnProperty(id)) {
      var group = this.groups[id];
      group.setItems(items);
    }
  }
};

/**
 * Get items
 * @return {vis.DataSet | null} items
 */
GroupSet.prototype.getItems = function getItems() {
  return this.itemsData;
};

/**
 * Set range (start and end).
 * @param {Range | Object} range  A Range or an object containing start and end.
 */
GroupSet.prototype.setRange = function setRange(range) {
  this.range = range;
};

/**
 * Set groups
 * @param {vis.DataSet} groups
 */
GroupSet.prototype.setGroups = function setGroups(groups) {
  var me = this,
      ids;

  // unsubscribe from current dataset
  if (this.groupsData) {
    utils.forEach(this.listeners, function (callback, event) {
      me.groupsData.unsubscribe(event, callback);
    });

    // remove all drawn groups
    ids = this.groupsData.getIds();
    this._onRemove(ids);
  }

  // replace the dataset
  if (!groups) {
    this.groupsData = null;
  }
  else if (groups instanceof DataSet) {
    this.groupsData = groups;
  }
  else {
    this.groupsData = new DataSet({
      convert: {
        start: 'Date',
        end: 'Date'
      }
    });
    this.groupsData.add(groups);
  }

  if (this.groupsData) {
    // subscribe to new dataset
    var id = this.id;
    utils.forEach(this.listeners, function (callback, event) {
      me.groupsData.on(event, callback, id);
    });

    // draw all new groups
    ids = this.groupsData.getIds();
    this._onAdd(ids);
  }
};

/**
 * Get groups
 * @return {vis.DataSet | null} groups
 */
GroupSet.prototype.getGroups = function getGroups() {
  return this.groupsData;
};

/**
 * Set selected items by their id. Replaces the current selection.
 * Unknown id's are silently ignored.
 * @param {Array} [ids] An array with zero or more id's of the items to be
 *                      selected. If ids is an empty array, all items will be
 *                      unselected.
 */
GroupSet.prototype.setSelection = function setSelection(ids) {
  var selection = [],
      groups = this.groups;

  // iterate over each of the groups
  for (var id in groups) {
    if (groups.hasOwnProperty(id)) {
      var group = groups[id];
      group.setSelection(ids);
    }
  }

  return selection;
};

/**
 * Get the selected items by their id
 * @return {Array} ids  The ids of the selected items
 */
GroupSet.prototype.getSelection = function getSelection() {
  var selection = [],
      groups = this.groups;

  // iterate over each of the groups
  for (var id in groups) {
    if (groups.hasOwnProperty(id)) {
      var group = groups[id];
      selection = selection.concat(group.getSelection());
    }
  }

  return selection;
};

/**
 * Repaint the component
 * @return {Boolean} changed
 */
GroupSet.prototype.repaint = function repaint() {
  var changed = 0,
      i, id, group, label,
      update = utils.updateProperty,
      asSize = utils.option.asSize,
      asElement = utils.option.asElement,
      options = this.options,
      frame = this.dom.frame,
      labels = this.dom.labels,
      labelSet = this.dom.labelSet;

  // create frame
  if (!this.parent) {
    throw new Error('Cannot repaint groupset: no parent attached');
  }
  var parentContainer = this.parent.getContainer();
  if (!parentContainer) {
    throw new Error('Cannot repaint groupset: parent has no container element');
  }
  if (!frame) {
    frame = document.createElement('div');
    frame.className = 'groupset';
    frame['timeline-groupset'] = this;
    this.dom.frame = frame;

    var className = options.className;
    if (className) {
      utils.addClassName(frame, utils.option.asString(className));
    }

    changed += 1;
  }
  if (!frame.parentNode) {
    parentContainer.appendChild(frame);
    changed += 1;
  }

  // create labels
  var labelContainer = asElement(options.labelContainer);
  if (!labelContainer) {
    throw new Error('Cannot repaint groupset: option "labelContainer" not defined');
  }
  if (!labels) {
    labels = document.createElement('div');
    labels.className = 'labels';
    this.dom.labels = labels;
  }
  if (!labelSet) {
    labelSet = document.createElement('div');
    labelSet.className = 'label-set';
    labels.appendChild(labelSet);
    this.dom.labelSet = labelSet;
  }
  if (!labels.parentNode || labels.parentNode != labelContainer) {
    if (labels.parentNode) {
      labels.parentNode.removeChild(labels.parentNode);
    }
    labelContainer.appendChild(labels);
  }

  // reposition frame
  changed += update(frame.style, 'height', asSize(options.height, this.height + 'px'));
  changed += update(frame.style, 'top',    asSize(options.top, '0px'));
  changed += update(frame.style, 'left',   asSize(options.left, '0px'));
  changed += update(frame.style, 'width',  asSize(options.width, '100%'));

  // reposition labels
  changed += update(labelSet.style, 'top',    asSize(options.top, '0px'));
  changed += update(labelSet.style, 'height', asSize(options.height, this.height + 'px'));

  var me = this,
      queue = this.queue,
      groups = this.groups,
      groupsData = this.groupsData;

  // show/hide added/changed/removed groups
  var ids = Object.keys(queue);
  if (ids.length) {
    ids.forEach(function (id) {
      var action = queue[id];
      var group = groups[id];

      //noinspection FallthroughInSwitchStatementJS
      switch (action) {
        case 'add':
        case 'update':
          if (!group) {
            var groupOptions = Object.create(me.options);
            utils.extend(groupOptions, {
              height: null,
              maxHeight: null
            });

            group = new Group(me, id, groupOptions);
            group.setItems(me.itemsData); // attach items data
            groups[id] = group;

            me.controller.add(group);
          }

          // TODO: update group data
          group.data = groupsData.get(id);

          delete queue[id];
          break;

        case 'remove':
          if (group) {
            group.setItems(); // detach items data
            delete groups[id];

            me.controller.remove(group);
          }

          // update lists
          delete queue[id];
          break;

        default:
          console.log('Error: unknown action "' + action + '"');
      }
    });

    // the groupset depends on each of the groups
    //this.depends = this.groups; // TODO: gives a circular reference through the parent

    // TODO: apply dependencies of the groupset

    // update the top positions of the groups in the correct order
    var orderedGroups = this.groupsData.getIds({
      order: this.options.groupOrder
    });
    for (i = 0; i < orderedGroups.length; i++) {
      (function (group, prevGroup) {
        var top = 0;
        if (prevGroup) {
          top = function () {
            // TODO: top must reckon with options.maxHeight
            return prevGroup.top + prevGroup.height;
          }
        }
        group.setOptions({
          top: top
        });
      })(groups[orderedGroups[i]], groups[orderedGroups[i - 1]]);
    }

    // (re)create the labels
    while (labelSet.firstChild) {
      labelSet.removeChild(labelSet.firstChild);
    }
    for (i = 0; i < orderedGroups.length; i++) {
      id = orderedGroups[i];
      label = this._createLabel(id);
      labelSet.appendChild(label);
    }

    changed++;
  }

  // reposition the labels
  // TODO: labels are not displayed correctly when orientation=='top'
  // TODO: width of labelPanel is not immediately updated on a change in groups
  for (id in groups) {
    if (groups.hasOwnProperty(id)) {
      group = groups[id];
      label = group.label;
      if (label) {
        label.style.top = group.top + 'px';
        label.style.height = group.height + 'px';
      }
    }
  }

  return (changed > 0);
};

/**
 * Create a label for group with given id
 * @param {Number} id
 * @return {Element} label
 * @private
 */
GroupSet.prototype._createLabel = function(id) {
  var group = this.groups[id];
  var label = document.createElement('div');
  label.className = 'vlabel';
  var inner = document.createElement('div');
  inner.className = 'inner';
  label.appendChild(inner);

  var content = group.data && group.data.content;
  if (content instanceof Element) {
    inner.appendChild(content);
  }
  else if (content != undefined) {
    inner.innerHTML = content;
  }

  var className = group.data && group.data.className;
  if (className) {
    utils.addClassName(label, className);
  }

  group.label = label; // TODO: not so nice, parking labels in the group this way!!!

  return label;
};

/**
 * Get container element
 * @return {HTMLElement} container
 */
GroupSet.prototype.getContainer = function getContainer() {
  return this.dom.frame;
};

/**
 * Get the width of the group labels
 * @return {Number} width
 */
GroupSet.prototype.getLabelsWidth = function getContainer() {
  return this.props.labels.width;
};

/**
 * Reflow the component
 * @return {Boolean} resized
 */
GroupSet.prototype.reflow = function reflow() {
  var changed = 0,
      id, group,
      options = this.options,
      update = utils.updateProperty,
      asNumber = utils.option.asNumber,
      asSize = utils.option.asSize,
      frame = this.dom.frame;

  if (frame) {
    var maxHeight = asNumber(options.maxHeight);
    var fixedHeight = (asSize(options.height) != null);
    var height;
    if (fixedHeight) {
      height = frame.offsetHeight;
    }
    else {
      // height is not specified, calculate the sum of the height of all groups
      height = 0;

      for (id in this.groups) {
        if (this.groups.hasOwnProperty(id)) {
          group = this.groups[id];
          height += group.height;
        }
      }
    }
    if (maxHeight != null) {
      height = Math.min(height, maxHeight);
    }
    changed += update(this, 'height', height);

    changed += update(this, 'top', frame.offsetTop);
    changed += update(this, 'left', frame.offsetLeft);
    changed += update(this, 'width', frame.offsetWidth);
  }

  // calculate the maximum width of the labels
  var width = 0;
  for (id in this.groups) {
    if (this.groups.hasOwnProperty(id)) {
      group = this.groups[id];
      var labelWidth = group.props && group.props.label && group.props.label.width || 0;
      width = Math.max(width, labelWidth);
    }
  }
  changed += update(this.props.labels, 'width', width);

  return (changed > 0);
};

/**
 * Hide the component from the DOM
 * @return {Boolean} changed
 */
GroupSet.prototype.hide = function hide() {
  if (this.dom.frame && this.dom.frame.parentNode) {
    this.dom.frame.parentNode.removeChild(this.dom.frame);
    return true;
  }
  else {
    return false;
  }
};

/**
 * Show the component in the DOM (when not already visible).
 * A repaint will be executed when the component is not visible
 * @return {Boolean} changed
 */
GroupSet.prototype.show = function show() {
  if (!this.dom.frame || !this.dom.frame.parentNode) {
    return this.repaint();
  }
  else {
    return false;
  }
};

/**
 * Handle updated groups
 * @param {Number[]} ids
 * @private
 */
GroupSet.prototype._onUpdate = function _onUpdate(ids) {
  this._toQueue(ids, 'update');
};

/**
 * Handle changed groups
 * @param {Number[]} ids
 * @private
 */
GroupSet.prototype._onAdd = function _onAdd(ids) {
  this._toQueue(ids, 'add');
};

/**
 * Handle removed groups
 * @param {Number[]} ids
 * @private
 */
GroupSet.prototype._onRemove = function _onRemove(ids) {
  this._toQueue(ids, 'remove');
};

/**
 * Put groups in the queue to be added/updated/remove
 * @param {Number[]} ids
 * @param {String} action     can be 'add', 'update', 'remove'
 */
GroupSet.prototype._toQueue = function _toQueue(ids, action) {
  var queue = this.queue;
  ids.forEach(function (id) {
    queue[id] = action;
  });

  if (this.controller) {
    //this.requestReflow();
    this.requestRepaint();
  }
};

/**
 * Find the Group from an event target:
 * searches for the attribute 'timeline-groupset' in the event target's element
 * tree, then finds the right group in this groupset
 * @param {Event} event
 * @return {Group | null} group
 */
GroupSet.groupFromTarget = function groupFromTarget (event) {
  var groupset,
      target = event.target;

  while (target) {
    if (target.hasOwnProperty('timeline-groupset')) {
      groupset = target['timeline-groupset'];
      break;
    }
    target = target.parentNode;
  }

  if (groupset) {
    for (var groupId in groupset.groups) {
      if (groupset.groups.hasOwnProperty(groupId)) {
        var group = groupset.groups[groupId];
        if (group.itemset && ItemSet.itemSetFromTarget(event) == group.itemset) {
          return group;
        }
      }
    }
  }

  return null;
};

module.exports = GroupSet;

},{"../../DataSet":2,"../../utils":24,"./Component":10,"./Group":13,"./ItemSet":15,"./Panel":16}],15:[function(require,module,exports){
var utils = require('../../utils'),
    Stack = require('../Stack'),
    DataSet = require('../../DataSet'),
    DataView = require('../../DataView'),
    Component = require('./Component'),
    Panel = require('./Panel'),

    ItemBox = require('./item/ItemBox'),
    ItemPoint = require('./item/ItemPoint'),
    ItemRange = require('./item/ItemRange'),
    ItemRangeOverflow = require('./item/ItemRangeOverflow');

/**
 * An ItemSet holds a set of items and ranges which can be displayed in a
 * range. The width is determined by the parent of the ItemSet, and the height
 * is determined by the size of the items.
 * @param {Component} parent
 * @param {Component[]} [depends]   Components on which this components depends
 *                                  (except for the parent)
 * @param {Object} [options]        See ItemSet.setOptions for the available
 *                                  options.
 * @constructor ItemSet
 * @extends Panel
 */
// TODO: improve performance by replacing all Array.forEach with a for loop
function ItemSet(parent, depends, options) {
  this.id = utils.randomUUID();
  this.parent = parent;
  this.depends = depends;

  // event listeners
  this.eventListeners = {
    dragstart: this._onDragStart.bind(this),
    drag: this._onDrag.bind(this),
    dragend: this._onDragEnd.bind(this)
  };

  // one options object is shared by this itemset and all its items
  this.options = options || {};
  this.defaultOptions = {
    type: 'box',
    align: 'center',
    orientation: 'bottom',
    margin: {
      axis: 20,
      item: 10
    },
    padding: 5
  };

  this.dom = {};

  var me = this;
  this.itemsData = null;  // DataSet
  this.range = null;      // Range or Object {start: number, end: number}

  // data change listeners
  this.listeners = {
    'add': function (event, params, senderId) {
      if (senderId != me.id) {
        me._onAdd(params.items);
      }
    },
    'update': function (event, params, senderId) {
      if (senderId != me.id) {
        me._onUpdate(params.items);
      }
    },
    'remove': function (event, params, senderId) {
      if (senderId != me.id) {
        me._onRemove(params.items);
      }
    }
  };

  this.items = {};      // object with an Item for every data item
  this.selection = [];  // list with the ids of all selected nodes
  this.queue = {};      // queue with id/actions: 'add', 'update', 'delete'
  this.stack = new Stack(this, Object.create(this.options));
  this.conversion = null;

  this.touchParams = {}; // stores properties while dragging

  // TODO: ItemSet should also attach event listeners for rangechange and rangechanged, like timeaxis
}

ItemSet.prototype = new Panel();

// available item types will be registered here
ItemSet.types = {
  box: ItemBox,
  range: ItemRange,
  rangeoverflow: ItemRangeOverflow,
  point: ItemPoint
};

/**
 * Set options for the ItemSet. Existing options will be extended/overwritten.
 * @param {Object} [options] The following options are available:
 *                           {String | function} [className]
 *                              class name for the itemset
 *                           {String} [type]
 *                              Default type for the items. Choose from 'box'
 *                              (default), 'point', or 'range'. The default
 *                              Style can be overwritten by individual items.
 *                           {String} align
 *                              Alignment for the items, only applicable for
 *                              ItemBox. Choose 'center' (default), 'left', or
 *                              'right'.
 *                           {String} orientation
 *                              Orientation of the item set. Choose 'top' or
 *                              'bottom' (default).
 *                           {Number} margin.axis
 *                              Margin between the axis and the items in pixels.
 *                              Default is 20.
 *                           {Number} margin.item
 *                              Margin between items in pixels. Default is 10.
 *                           {Number} padding
 *                              Padding of the contents of an item in pixels.
 *                              Must correspond with the items css. Default is 5.
 *                           {Function} snap
 *                              Function to let items snap to nice dates when
 *                              dragging items.
 */
ItemSet.prototype.setOptions = Component.prototype.setOptions;



/**
 * Set controller for this component
 * @param {Controller | null} controller
 */
ItemSet.prototype.setController = function setController (controller) {
  var event;

  // unregister old event listeners
  if (this.controller) {
    for (event in this.eventListeners) {
      if (this.eventListeners.hasOwnProperty(event)) {
        this.controller.off(event, this.eventListeners[event]);
      }
    }
  }

  this.controller = controller || null;

  // register new event listeners
  if (this.controller) {
    for (event in this.eventListeners) {
      if (this.eventListeners.hasOwnProperty(event)) {
        this.controller.on(event, this.eventListeners[event]);
      }
    }
  }
};

// attach event listeners for dragging items to the controller
(function (me) {
  var _controller = null;
  var _onDragStart = null;
  var _onDrag = null;
  var _onDragEnd = null;

  Object.defineProperty(me, 'controller', {
    get: function () {
      return _controller;
    },

    set: function (controller) {

    }
  });
}) (this);


/**
 * Set range (start and end).
 * @param {Range | Object} range  A Range or an object containing start and end.
 */
ItemSet.prototype.setRange = function setRange(range) {
  if (!(range instanceof Range) && (!range || !range.start || !range.end)) {
    throw new TypeError('Range must be an instance of Range, ' +
        'or an object containing start and end.');
  }
  this.range = range;
};

/**
 * Set selected items by their id. Replaces the current selection
 * Unknown id's are silently ignored.
 * @param {Array} [ids] An array with zero or more id's of the items to be
 *                      selected. If ids is an empty array, all items will be
 *                      unselected.
 */
ItemSet.prototype.setSelection = function setSelection(ids) {
  var i, ii, id, item, selection;

  if (ids) {
    if (!Array.isArray(ids)) {
      throw new TypeError('Array expected');
    }

    // unselect currently selected items
    for (i = 0, ii = this.selection.length; i < ii; i++) {
      id = this.selection[i];
      item = this.items[id];
      if (item) item.unselect();
    }

    // select items
    this.selection = [];
    for (i = 0, ii = ids.length; i < ii; i++) {
      id = ids[i];
      item = this.items[id];
      if (item) {
        this.selection.push(id);
        item.select();
      }
    }

    if (this.controller) {
      this.requestRepaint();
    }
  }
};

/**
 * Get the selected items by their id
 * @return {Array} ids  The ids of the selected items
 */
ItemSet.prototype.getSelection = function getSelection() {
  return this.selection.concat([]);
};

/**
 * Deselect a selected item
 * @param {String | Number} id
 * @private
 */
ItemSet.prototype._deselect = function _deselect(id) {
  var selection = this.selection;
  for (var i = 0, ii = selection.length; i < ii; i++) {
    if (selection[i] == id) { // non-strict comparison!
      selection.splice(i, 1);
      break;
    }
  }
};

/**
 * Repaint the component
 * @return {Boolean} changed
 */
ItemSet.prototype.repaint = function repaint() {
  var changed = 0,
      update = utils.updateProperty,
      asSize = utils.option.asSize,
      options = this.options,
      orientation = this.getOption('orientation'),
      defaultOptions = this.defaultOptions,
      frame = this.frame;

  if (!frame) {
    frame = document.createElement('div');
    frame.className = 'itemset';
    frame['timeline-itemset'] = this;

    var className = options.className;
    if (className) {
      utils.addClassName(frame, utils.option.asString(className));
    }

    // create background panel
    var background = document.createElement('div');
    background.className = 'background';
    frame.appendChild(background);
    this.dom.background = background;

    // create foreground panel
    var foreground = document.createElement('div');
    foreground.className = 'foreground';
    frame.appendChild(foreground);
    this.dom.foreground = foreground;

    // create axis panel
    var axis = document.createElement('div');
    axis.className = 'itemset-axis';
    //frame.appendChild(axis);
    this.dom.axis = axis;

    this.frame = frame;
    changed += 1;
  }

  if (!this.parent) {
    throw new Error('Cannot repaint itemset: no parent attached');
  }
  var parentContainer = this.parent.getContainer();
  if (!parentContainer) {
    throw new Error('Cannot repaint itemset: parent has no container element');
  }
  if (!frame.parentNode) {
    parentContainer.appendChild(frame);
    changed += 1;
  }
  if (!this.dom.axis.parentNode) {
    parentContainer.appendChild(this.dom.axis);
    changed += 1;
  }

  // reposition frame
  changed += update(frame.style, 'left',   asSize(options.left, '0px'));
  changed += update(frame.style, 'top',    asSize(options.top, '0px'));
  changed += update(frame.style, 'width',  asSize(options.width, '100%'));
  changed += update(frame.style, 'height', asSize(options.height, this.height + 'px'));

  // reposition axis
  changed += update(this.dom.axis.style, 'left', asSize(options.left, '0px'));
  changed += update(this.dom.axis.style, 'width',  asSize(options.width, '100%'));
  if (orientation == 'bottom') {
    changed += update(this.dom.axis.style, 'top',  (this.height + this.top) + 'px');
  }
  else { // orientation == 'top'
    changed += update(this.dom.axis.style, 'top', this.top + 'px');
  }

  this._updateConversion();

  var me = this,
      queue = this.queue,
      itemsData = this.itemsData,
      items = this.items,
      dataOptions = {
        // TODO: cleanup
        // fields: [(itemsData && itemsData.fieldId || 'id'), 'start', 'end', 'content', 'type', 'className']
      };

  // show/hide added/changed/removed items
  for (var id in queue) {
    if (queue.hasOwnProperty(id)) {
      var entry = queue[id],
          item = items[id],
          action = entry.action;

      //noinspection FallthroughInSwitchStatementJS
      switch (action) {
        case 'add':
        case 'update':
          var itemData = itemsData && itemsData.get(id, dataOptions);

          if (itemData) {
            var type = itemData.type ||
                (itemData.start && itemData.end && 'range') ||
                options.type ||
                'box';
            var constructor = ItemSet.types[type];

            // TODO: how to handle items with invalid data? hide them and give a warning? or throw an error?
            if (item) {
              // update item
              if (!constructor || !(item instanceof constructor)) {
                // item type has changed, hide and delete the item
                changed += item.hide();
                item = null;
              }
              else {
                item.data = itemData; // TODO: create a method item.setData ?
                changed++;
              }
            }

            if (!item) {
              // create item
              if (constructor) {
                item = new constructor(me, itemData, options, defaultOptions);
                item.id = entry.id; // we take entry.id, as id itself is stringified
                changed++;
              }
              else {
                throw new TypeError('Unknown item type "' + type + '"');
              }
            }

            // force a repaint (not only a reposition)
            item.repaint();

            items[id] = item;
          }

          // update queue
          delete queue[id];
          break;

        case 'remove':
          if (item) {
            // remove the item from the set selected items
            if (item.selected) {
              me._deselect(id);
            }

            // remove DOM of the item
            changed += item.hide();
          }

          // update lists
          delete items[id];
          delete queue[id];
          break;

        default:
          console.log('Error: unknown action "' + action + '"');
      }
    }
  }

  // reposition all items. Show items only when in the visible area
  utils.forEach(this.items, function (item) {
    if (item.visible) {
      changed += item.show();
      item.reposition();
    }
    else {
      changed += item.hide();
    }
  });

  return (changed > 0);
};

/**
 * Get the foreground container element
 * @return {HTMLElement} foreground
 */
ItemSet.prototype.getForeground = function getForeground() {
  return this.dom.foreground;
};

/**
 * Get the background container element
 * @return {HTMLElement} background
 */
ItemSet.prototype.getBackground = function getBackground() {
  return this.dom.background;
};

/**
 * Get the axis container element
 * @return {HTMLElement} axis
 */
ItemSet.prototype.getAxis = function getAxis() {
  return this.dom.axis;
};

/**
 * Reflow the component
 * @return {Boolean} resized
 */
ItemSet.prototype.reflow = function reflow () {
  var changed = 0,
      options = this.options,
      marginAxis = options.margin && options.margin.axis || this.defaultOptions.margin.axis,
      marginItem = options.margin && options.margin.item || this.defaultOptions.margin.item,
      update = utils.updateProperty,
      asNumber = utils.option.asNumber,
      asSize = utils.option.asSize,
      frame = this.frame;

  if (frame) {
    this._updateConversion();

    utils.forEach(this.items, function (item) {
      changed += item.reflow();
    });

    // TODO: stack.update should be triggered via an event, in stack itself
    // TODO: only update the stack when there are changed items
    this.stack.update();

    var maxHeight = asNumber(options.maxHeight);
    var fixedHeight = (asSize(options.height) != null);
    var height;
    if (fixedHeight) {
      height = frame.offsetHeight;
    }
    else {
      // height is not specified, determine the height from the height and positioned items
      var visibleItems = this.stack.ordered; // TODO: not so nice way to get the filtered items
      if (visibleItems.length) {
        var min = visibleItems[0].top;
        var max = visibleItems[0].top + visibleItems[0].height;
        utils.forEach(visibleItems, function (item) {
          min = Math.min(min, item.top);
          max = Math.max(max, (item.top + item.height));
        });
        height = (max - min) + marginAxis + marginItem;
      }
      else {
        height = marginAxis + marginItem;
      }
    }
    if (maxHeight != null) {
      height = Math.min(height, maxHeight);
    }
    changed += update(this, 'height', height);

    // calculate height from items
    changed += update(this, 'top', frame.offsetTop);
    changed += update(this, 'left', frame.offsetLeft);
    changed += update(this, 'width', frame.offsetWidth);
  }
  else {
    changed += 1;
  }

  return (changed > 0);
};

/**
 * Hide this component from the DOM
 * @return {Boolean} changed
 */
ItemSet.prototype.hide = function hide() {
  var changed = false;

  // remove the DOM
  if (this.frame && this.frame.parentNode) {
    this.frame.parentNode.removeChild(this.frame);
    changed = true;
  }
  if (this.dom.axis && this.dom.axis.parentNode) {
    this.dom.axis.parentNode.removeChild(this.dom.axis);
    changed = true;
  }

  return changed;
};

/**
 * Set items
 * @param {vis.DataSet | null} items
 */
ItemSet.prototype.setItems = function setItems(items) {
  var me = this,
      ids,
      oldItemsData = this.itemsData;

  // replace the dataset
  if (!items) {
    this.itemsData = null;
  }
  else if (items instanceof DataSet || items instanceof DataView) {
    this.itemsData = items;
  }
  else {
    throw new TypeError('Data must be an instance of DataSet');
  }

  if (oldItemsData) {
    // unsubscribe from old dataset
    utils.forEach(this.listeners, function (callback, event) {
      oldItemsData.unsubscribe(event, callback);
    });

    // remove all drawn items
    ids = oldItemsData.getIds();
    this._onRemove(ids);
  }

  if (this.itemsData) {
    // subscribe to new dataset
    var id = this.id;
    utils.forEach(this.listeners, function (callback, event) {
      me.itemsData.on(event, callback, id);
    });

    // draw all new items
    ids = this.itemsData.getIds();
    this._onAdd(ids);
  }
};

/**
 * Get the current items items
 * @returns {vis.DataSet | null}
 */
ItemSet.prototype.getItems = function getItems() {
  return this.itemsData;
};

/**
 * Remove an item by its id
 * @param {String | Number} id
 */
ItemSet.prototype.removeItem = function removeItem (id) {
  var item = this.itemsData.get(id),
      dataset = this._myDataSet();

  if (item) {
    // confirm deletion
    this.options.onRemove(item, function (item) {
      if (item) {
        dataset.remove(item);
      }
    });
  }
};

/**
 * Handle updated items
 * @param {Number[]} ids
 * @private
 */
ItemSet.prototype._onUpdate = function _onUpdate(ids) {
  this._toQueue('update', ids);
};

/**
 * Handle changed items
 * @param {Number[]} ids
 * @private
 */
ItemSet.prototype._onAdd = function _onAdd(ids) {
  this._toQueue('add', ids);
};

/**
 * Handle removed items
 * @param {Number[]} ids
 * @private
 */
ItemSet.prototype._onRemove = function _onRemove(ids) {
  this._toQueue('remove', ids);
};

/**
 * Put items in the queue to be added/updated/remove
 * @param {String} action     can be 'add', 'update', 'remove'
 * @param {Number[]} ids
 */
ItemSet.prototype._toQueue = function _toQueue(action, ids) {
  var queue = this.queue;
  ids.forEach(function (id) {
    queue[id] = {
      id: id,
      action: action
    };
  });

  if (this.controller) {
    //this.requestReflow();
    this.requestRepaint();
  }
};

/**
 * Calculate the scale and offset to convert a position on screen to the
 * corresponding date and vice versa.
 * After the method _updateConversion is executed once, the methods toTime
 * and toScreen can be used.
 * @private
 */
ItemSet.prototype._updateConversion = function _updateConversion() {
  var range = this.range;
  if (!range) {
    throw new Error('No range configured');
  }

  if (range.conversion) {
    this.conversion = range.conversion(this.width);
  }
  else {
    this.conversion = Range.conversion(range.start, range.end, this.width);
  }
};

/**
 * Convert a position on screen (pixels) to a datetime
 * Before this method can be used, the method _updateConversion must be
 * executed once.
 * @param {int}     x    Position on the screen in pixels
 * @return {Date}   time The datetime the corresponds with given position x
 */
ItemSet.prototype.toTime = function toTime(x) {
  var conversion = this.conversion;
  return new Date(x / conversion.scale + conversion.offset);
};

/**
 * Convert a datetime (Date object) into a position on the screen
 * Before this method can be used, the method _updateConversion must be
 * executed once.
 * @param {Date}   time A date
 * @return {int}   x    The position on the screen in pixels which corresponds
 *                      with the given date.
 */
ItemSet.prototype.toScreen = function toScreen(time) {
  var conversion = this.conversion;
  return (time.valueOf() - conversion.offset) * conversion.scale;
};

/**
 * Start dragging the selected events
 * @param {Event} event
 * @private
 */
ItemSet.prototype._onDragStart = function (event) {
  if (!this.options.editable) {
    return;
  }

  var item = ItemSet.itemFromTarget(event),
      me = this;

  if (item && item.selected) {
    var dragLeftItem = event.target.dragLeftItem;
    var dragRightItem = event.target.dragRightItem;

    if (dragLeftItem) {
      this.touchParams.itemProps = [{
        item: dragLeftItem,
        start: item.data.start.valueOf()
      }];
    }
    else if (dragRightItem) {
      this.touchParams.itemProps = [{
        item: dragRightItem,
        end: item.data.end.valueOf()
      }];
    }
    else {
      this.touchParams.itemProps = this.getSelection().map(function (id) {
        var item = me.items[id];
        var props = {
          item: item
        };

        if ('start' in item.data) {
          props.start = item.data.start.valueOf()
        }
        if ('end' in item.data)   {
          props.end = item.data.end.valueOf()
        }

        return props;
      });
    }

    event.stopPropagation();
  }
};

/**
 * Drag selected items
 * @param {Event} event
 * @private
 */
ItemSet.prototype._onDrag = function (event) {
  if (this.touchParams.itemProps) {
    var snap = this.options.snap || null,
        deltaX = event.gesture.deltaX,
        offset = deltaX / this.conversion.scale;

    // move
    this.touchParams.itemProps.forEach(function (props) {
      if ('start' in props) {
        var start = new Date(props.start + offset);
        props.item.data.start = snap ? snap(start) : start;
      }
      if ('end' in props) {
        var end = new Date(props.end + offset);
        props.item.data.end = snap ? snap(end) : end;
      }
    });

    // TODO: implement onMoving handler

    // TODO: implement dragging from one group to another

    this.requestReflow();

    event.stopPropagation();
  }
};

/**
 * End of dragging selected items
 * @param {Event} event
 * @private
 */
ItemSet.prototype._onDragEnd = function (event) {
  if (this.touchParams.itemProps) {
    // prepare a change set for the changed items
    var changes = [],
        me = this,
        dataset = this._myDataSet(),
        type;

    this.touchParams.itemProps.forEach(function (props) {
      var id = props.item.id,
          item = me.itemsData.get(id);

      var changed = false;
      if ('start' in props.item.data) {
        changed = (props.start != props.item.data.start.valueOf());
        item.start = utils.convert(props.item.data.start, dataset.convert['start']);
      }
      if ('end' in props.item.data) {
        changed = changed  || (props.end != props.item.data.end.valueOf());
        item.end = utils.convert(props.item.data.end, dataset.convert['end']);
      }

      // only apply changes when start or end is actually changed
      if (changed) {
        me.options.onMove(item, function (item) {
          if (item) {
            // apply changes
            changes.push(item);
          }
          else {
            // restore original values
            if ('start' in props) props.item.data.start = props.start;
            if ('end' in props)   props.item.data.end   = props.end;
            me.requestReflow();
          }
        });
      }
    });
    this.touchParams.itemProps = null;

    // apply the changes to the data (if there are changes)
    if (changes.length) {
      dataset.update(changes);
    }

    event.stopPropagation();
  }
};

/**
 * Find an item from an event target:
 * searches for the attribute 'timeline-item' in the event target's element tree
 * @param {Event} event
 * @return {Item | null} item
 */
ItemSet.itemFromTarget = function itemFromTarget (event) {
  var target = event.target;
  while (target) {
    if (target.hasOwnProperty('timeline-item')) {
      return target['timeline-item'];
    }
    target = target.parentNode;
  }

  return null;
};

/**
 * Find the ItemSet from an event target:
 * searches for the attribute 'timeline-itemset' in the event target's element tree
 * @param {Event} event
 * @return {ItemSet | null} item
 */
ItemSet.itemSetFromTarget = function itemSetFromTarget (event) {
  var target = event.target;
  while (target) {
    if (target.hasOwnProperty('timeline-itemset')) {
      return target['timeline-itemset'];
    }
    target = target.parentNode;
  }

  return null;
};

/**
 * Find the DataSet to which this ItemSet is connected
 * @returns {null | DataSet} dataset
 * @private
 */
ItemSet.prototype._myDataSet = function _myDataSet() {
  // find the root DataSet
  var dataset = this.itemsData;
  while (dataset instanceof DataView) {
    dataset = dataset.data;
  }
  return dataset;
};

module.exports = ItemSet;

},{"../../DataSet":2,"../../DataView":3,"../../utils":24,"../Stack":7,"./Component":10,"./Panel":16,"./item/ItemBox":20,"./item/ItemPoint":21,"./item/ItemRange":22,"./item/ItemRangeOverflow":23}],16:[function(require,module,exports){
var utils = require('../../utils'),
    Component = require('./Component');

/**
 * A panel can contain components
 * @param {Component} [parent]
 * @param {Component[]} [depends]   Components on which this components depends
 *                                  (except for the parent)
 * @param {Object} [options]    Available parameters:
 *                              {String | Number | function} [left]
 *                              {String | Number | function} [top]
 *                              {String | Number | function} [width]
 *                              {String | Number | function} [height]
 *                              {String | function} [className]
 * @constructor Panel
 * @extends Component
 */
function Panel(parent, depends, options) {
  this.id = utils.randomUUID();
  this.parent = parent;
  this.depends = depends;

  this.options = options || {};
}

Panel.prototype = new Component();

/**
 * Set options. Will extend the current options.
 * @param {Object} [options]    Available parameters:
 *                              {String | function} [className]
 *                              {String | Number | function} [left]
 *                              {String | Number | function} [top]
 *                              {String | Number | function} [width]
 *                              {String | Number | function} [height]
 */
Panel.prototype.setOptions = Component.prototype.setOptions;

/**
 * Get the container element of the panel, which can be used by a child to
 * add its own widgets.
 * @returns {HTMLElement} container
 */
Panel.prototype.getContainer = function () {
  return this.frame;
};

/**
 * Repaint the component
 * @return {Boolean} changed
 */
Panel.prototype.repaint = function () {
  var changed = 0,
      update = utils.updateProperty,
      asSize = utils.option.asSize,
      options = this.options,
      frame = this.frame;
  if (!frame) {
    frame = document.createElement('div');
    frame.className = 'vpanel';

    var className = options.className;
    if (className) {
      if (typeof className == 'function') {
        utils.addClassName(frame, String(className()));
      }
      else {
        utils.addClassName(frame, String(className));
      }
    }

    this.frame = frame;
    changed += 1;
  }
  if (!frame.parentNode) {
    if (!this.parent) {
      throw new Error('Cannot repaint panel: no parent attached');
    }
    var parentContainer = this.parent.getContainer();
    if (!parentContainer) {
      throw new Error('Cannot repaint panel: parent has no container element');
    }
    parentContainer.appendChild(frame);
    changed += 1;
  }

  changed += update(frame.style, 'top',    asSize(options.top, '0px'));
  changed += update(frame.style, 'left',   asSize(options.left, '0px'));
  changed += update(frame.style, 'width',  asSize(options.width, '100%'));
  changed += update(frame.style, 'height', asSize(options.height, '100%'));

  return (changed > 0);
};

/**
 * Reflow the component
 * @return {Boolean} resized
 */
Panel.prototype.reflow = function () {
  var changed = 0,
      update = utils.updateProperty,
      frame = this.frame;

  if (frame) {
    changed += update(this, 'top', frame.offsetTop);
    changed += update(this, 'left', frame.offsetLeft);
    changed += update(this, 'width', frame.offsetWidth);
    changed += update(this, 'height', frame.offsetHeight);
  }
  else {
    changed += 1;
  }

  return (changed > 0);
};

module.exports = Panel;

},{"../../utils":24,"./Component":10}],17:[function(require,module,exports){
var utils = require('../../utils'),
    Hammer = require('../../module/imports').Hammer,
    Component = require('./Component'),
    Panel = require('./Panel');

/**
 * A root panel can hold components. The root panel must be initialized with
 * a DOM element as container.
 * @param {HTMLElement} container
 * @param {Object} [options]    Available parameters: see RootPanel.setOptions.
 * @constructor RootPanel
 * @extends Panel
 */
function RootPanel(container, options) {
  this.id = utils.randomUUID();
  this.container = container;

  // create functions to be used as DOM event listeners
  var me = this;
  this.hammer = null;

  // create listeners for all interesting events, these events will be emitted
  // via the controller
  var events = [
    'touch', 'pinch', 'tap', 'doubletap', 'hold',
    'dragstart', 'drag', 'dragend',
    'mousewheel', 'DOMMouseScroll' // DOMMouseScroll is for Firefox
  ];
  this.listeners = {};
  events.forEach(function (event) {
    me.listeners[event] = function () {
      var args = [event].concat(Array.prototype.slice.call(arguments, 0));
      me.controller.emit.apply(me.controller, args);
    };
  });

  this.options = options || {};
  this.defaultOptions = {
    autoResize: true
  };
}

RootPanel.prototype = new Panel();

/**
 * Set options. Will extend the current options.
 * @param {Object} [options]    Available parameters:
 *                              {String | function} [className]
 *                              {String | Number | function} [left]
 *                              {String | Number | function} [top]
 *                              {String | Number | function} [width]
 *                              {String | Number | function} [height]
 *                              {Boolean | function} [autoResize]
 */
RootPanel.prototype.setOptions = Component.prototype.setOptions;

/**
 * Repaint the component
 * @return {Boolean} changed
 */
RootPanel.prototype.repaint = function () {
  var changed = 0,
      update = utils.updateProperty,
      asSize = utils.option.asSize,
      options = this.options,
      frame = this.frame;

  if (!frame) {
    frame = document.createElement('div');

    this.frame = frame;

    this._registerListeners();

    changed += 1;
  }
  if (!frame.parentNode) {
    if (!this.container) {
      throw new Error('Cannot repaint root panel: no container attached');
    }
    this.container.appendChild(frame);
    changed += 1;
  }

  frame.className = 'vis timeline rootpanel ' + options.orientation +
      (options.editable ? ' editable' : '');
  var className = options.className;
  if (className) {
    utils.addClassName(frame, utils.option.asString(className));
  }

  changed += update(frame.style, 'top',    asSize(options.top, '0px'));
  changed += update(frame.style, 'left',   asSize(options.left, '0px'));
  changed += update(frame.style, 'width',  asSize(options.width, '100%'));
  changed += update(frame.style, 'height', asSize(options.height, '100%'));

  this._updateWatch();

  return (changed > 0);
};

/**
 * Reflow the component
 * @return {Boolean} resized
 */
RootPanel.prototype.reflow = function () {
  var changed = 0,
      update = utils.updateProperty,
      frame = this.frame;

  if (frame) {
    changed += update(this, 'top', frame.offsetTop);
    changed += update(this, 'left', frame.offsetLeft);
    changed += update(this, 'width', frame.offsetWidth);
    changed += update(this, 'height', frame.offsetHeight);
  }
  else {
    changed += 1;
  }

  return (changed > 0);
};

/**
 * Update watching for resize, depending on the current option
 * @private
 */
RootPanel.prototype._updateWatch = function () {
  var autoResize = this.getOption('autoResize');
  if (autoResize) {
    this._watch();
  }
  else {
    this._unwatch();
  }
};

/**
 * Watch for changes in the size of the frame. On resize, the Panel will
 * automatically redraw itself.
 * @private
 */
RootPanel.prototype._watch = function () {
  var me = this;

  this._unwatch();

  var checkSize = function () {
    var autoResize = me.getOption('autoResize');
    if (!autoResize) {
      // stop watching when the option autoResize is changed to false
      me._unwatch();
      return;
    }

    if (me.frame) {
      // check whether the frame is resized
      if ((me.frame.clientWidth != me.width) ||
          (me.frame.clientHeight != me.height)) {
        me.requestReflow();
      }
    }
  };

  // TODO: automatically cleanup the event listener when the frame is deleted
  utils.addEventListener(window, 'resize', checkSize);

  this.watchTimer = setInterval(checkSize, 1000);
};

/**
 * Stop watching for a resize of the frame.
 * @private
 */
RootPanel.prototype._unwatch = function () {
  if (this.watchTimer) {
    clearInterval(this.watchTimer);
    this.watchTimer = undefined;
  }

  // TODO: remove event listener on window.resize
};

/**
 * Set controller for this component, or remove current controller by passing
 * null as parameter value.
 * @param {Controller | null} controller
 */
RootPanel.prototype.setController = function setController (controller) {
  this.controller = controller || null;

  if (this.controller) {
    this._registerListeners();
  }
  else {
    this._unregisterListeners();
  }
};

/**
 * Register event emitters emitted by the rootpanel
 * @private
 */
RootPanel.prototype._registerListeners = function () {
  if (this.frame && this.controller && !this.hammer) {
    this.hammer = Hammer(this.frame, {
      prevent_default: true
    });

    for (var event in this.listeners) {
      if (this.listeners.hasOwnProperty(event)) {
        this.hammer.on(event, this.listeners[event]);
      }
    }
  }
};

/**
 * Unregister event emitters from the rootpanel
 * @private
 */
RootPanel.prototype._unregisterListeners = function () {
  if (this.hammer) {
    for (var event in this.listeners) {
      if (this.listeners.hasOwnProperty(event)) {
        this.hammer.off(event, this.listeners[event]);
      }
    }

    this.hammer = null;
  }
};

module.exports = RootPanel;

},{"../../module/imports":4,"../../utils":24,"./Component":10,"./Panel":16}],18:[function(require,module,exports){
var utils = require('../../utils'),
    Component = require('./Component'),
    TimeStep = require('../TimeStep');

/**
 * A horizontal time axis
 * @param {Component} parent
 * @param {Component[]} [depends]   Components on which this components depends
 *                                  (except for the parent)
 * @param {Object} [options]        See TimeAxis.setOptions for the available
 *                                  options.
 * @constructor TimeAxis
 * @extends Component
 */
function TimeAxis (parent, depends, options) {
  this.id = utils.randomUUID();
  this.parent = parent;
  this.depends = depends;

  this.dom = {
    majorLines: [],
    majorTexts: [],
    minorLines: [],
    minorTexts: [],
    redundant: {
      majorLines: [],
      majorTexts: [],
      minorLines: [],
      minorTexts: []
    }
  };
  this.props = {
    range: {
      start: 0,
      end: 0,
      minimumStep: 0
    },
    lineTop: 0
  };

  this.options = options || {};
  this.defaultOptions = {
    orientation: 'bottom',  // supported: 'top', 'bottom'
    // TODO: implement timeaxis orientations 'left' and 'right'
    showMinorLabels: true,
    showMajorLabels: true
  };

  this.conversion = null;
  this.range = null;
}

TimeAxis.prototype = new Component();

// TODO: comment options
TimeAxis.prototype.setOptions = Component.prototype.setOptions;

/**
 * Set a range (start and end)
 * @param {Range | Object} range  A Range or an object containing start and end.
 */
TimeAxis.prototype.setRange = function (range) {
  if (!(range instanceof Range) && (!range || !range.start || !range.end)) {
    throw new TypeError('Range must be an instance of Range, ' +
        'or an object containing start and end.');
  }
  this.range = range;
};

/**
 * Convert a position on screen (pixels) to a datetime
 * @param {int}     x    Position on the screen in pixels
 * @return {Date}   time The datetime the corresponds with given position x
 */
TimeAxis.prototype.toTime = function(x) {
  var conversion = this.conversion;
  return new Date(x / conversion.scale + conversion.offset);
};

/**
 * Convert a datetime (Date object) into a position on the screen
 * @param {Date}   time A date
 * @return {int}   x    The position on the screen in pixels which corresponds
 *                      with the given date.
 * @private
 */
TimeAxis.prototype.toScreen = function(time) {
  var conversion = this.conversion;
  return (time.valueOf() - conversion.offset) * conversion.scale;
};

/**
 * Repaint the component
 * @return {Boolean} changed
 */
TimeAxis.prototype.repaint = function () {
  var changed = 0,
      update = utils.updateProperty,
      asSize = utils.option.asSize,
      options = this.options,
      orientation = this.getOption('orientation'),
      props = this.props,
      step = this.step;

  var frame = this.frame;
  if (!frame) {
    frame = document.createElement('div');
    this.frame = frame;
    changed += 1;
  }
  frame.className = 'axis';
  // TODO: custom className?

  if (!frame.parentNode) {
    if (!this.parent) {
      throw new Error('Cannot repaint time axis: no parent attached');
    }
    var parentContainer = this.parent.getContainer();
    if (!parentContainer) {
      throw new Error('Cannot repaint time axis: parent has no container element');
    }
    parentContainer.appendChild(frame);

    changed += 1;
  }

  var parent = frame.parentNode;
  if (parent) {
    var beforeChild = frame.nextSibling;
    parent.removeChild(frame); //  take frame offline while updating (is almost twice as fast)

    var defaultTop = (orientation == 'bottom' && this.props.parentHeight && this.height) ?
        (this.props.parentHeight - this.height) + 'px' :
        '0px';
    changed += update(frame.style, 'top', asSize(options.top, defaultTop));
    changed += update(frame.style, 'left', asSize(options.left, '0px'));
    changed += update(frame.style, 'width', asSize(options.width, '100%'));
    changed += update(frame.style, 'height', asSize(options.height, this.height + 'px'));

    // get characters width and height
    this._repaintMeasureChars();

    if (this.step) {
      this._repaintStart();

      step.first();
      var xFirstMajorLabel = undefined;
      var max = 0;
      while (step.hasNext() && max < 1000) {
        max++;
        var cur = step.getCurrent(),
            x = this.toScreen(cur),
            isMajor = step.isMajor();

        // TODO: lines must have a width, such that we can create css backgrounds

        if (this.getOption('showMinorLabels')) {
          this._repaintMinorText(x, step.getLabelMinor());
        }

        if (isMajor && this.getOption('showMajorLabels')) {
          if (x > 0) {
            if (xFirstMajorLabel == undefined) {
              xFirstMajorLabel = x;
            }
            this._repaintMajorText(x, step.getLabelMajor());
          }
          this._repaintMajorLine(x);
        }
        else {
          this._repaintMinorLine(x);
        }

        step.next();
      }

      // create a major label on the left when needed
      if (this.getOption('showMajorLabels')) {
        var leftTime = this.toTime(0),
            leftText = step.getLabelMajor(leftTime),
            widthText = leftText.length * (props.majorCharWidth || 10) + 10; // upper bound estimation

        if (xFirstMajorLabel == undefined || widthText < xFirstMajorLabel) {
          this._repaintMajorText(0, leftText);
        }
      }

      this._repaintEnd();
    }

    this._repaintLine();

    // put frame online again
    if (beforeChild) {
      parent.insertBefore(frame, beforeChild);
    }
    else {
      parent.appendChild(frame)
    }
  }

  return (changed > 0);
};

/**
 * Start a repaint. Move all DOM elements to a redundant list, where they
 * can be picked for re-use, or can be cleaned up in the end
 * @private
 */
TimeAxis.prototype._repaintStart = function () {
  var dom = this.dom,
      redundant = dom.redundant;

  redundant.majorLines = dom.majorLines;
  redundant.majorTexts = dom.majorTexts;
  redundant.minorLines = dom.minorLines;
  redundant.minorTexts = dom.minorTexts;

  dom.majorLines = [];
  dom.majorTexts = [];
  dom.minorLines = [];
  dom.minorTexts = [];
};

/**
 * End a repaint. Cleanup leftover DOM elements in the redundant list
 * @private
 */
TimeAxis.prototype._repaintEnd = function () {
  utils.forEach(this.dom.redundant, function (arr) {
    while (arr.length) {
      var elem = arr.pop();
      if (elem && elem.parentNode) {
        elem.parentNode.removeChild(elem);
      }
    }
  });
};


/**
 * Create a minor label for the axis at position x
 * @param {Number} x
 * @param {String} text
 * @private
 */
TimeAxis.prototype._repaintMinorText = function (x, text) {
  // reuse redundant label
  var label = this.dom.redundant.minorTexts.shift();

  if (!label) {
    // create new label
    var content = document.createTextNode('');
    label = document.createElement('div');
    label.appendChild(content);
    label.className = 'text minor';
    this.frame.appendChild(label);
  }
  this.dom.minorTexts.push(label);

  label.childNodes[0].nodeValue = text;
  label.style.left = x + 'px';
  label.style.top  = this.props.minorLabelTop + 'px';
  //label.title = title;  // TODO: this is a heavy operation
};

/**
 * Create a Major label for the axis at position x
 * @param {Number} x
 * @param {String} text
 * @private
 */
TimeAxis.prototype._repaintMajorText = function (x, text) {
  // reuse redundant label
  var label = this.dom.redundant.majorTexts.shift();

  if (!label) {
    // create label
    var content = document.createTextNode(text);
    label = document.createElement('div');
    label.className = 'text major';
    label.appendChild(content);
    this.frame.appendChild(label);
  }
  this.dom.majorTexts.push(label);

  label.childNodes[0].nodeValue = text;
  label.style.top = this.props.majorLabelTop + 'px';
  label.style.left = x + 'px';
  //label.title = title; // TODO: this is a heavy operation
};

/**
 * Create a minor line for the axis at position x
 * @param {Number} x
 * @private
 */
TimeAxis.prototype._repaintMinorLine = function (x) {
  // reuse redundant line
  var line = this.dom.redundant.minorLines.shift();

  if (!line) {
    // create vertical line
    line = document.createElement('div');
    line.className = 'grid vertical minor';
    this.frame.appendChild(line);
  }
  this.dom.minorLines.push(line);

  var props = this.props;
  line.style.top = props.minorLineTop + 'px';
  line.style.height = props.minorLineHeight + 'px';
  line.style.left = (x - props.minorLineWidth / 2) + 'px';
};

/**
 * Create a Major line for the axis at position x
 * @param {Number} x
 * @private
 */
TimeAxis.prototype._repaintMajorLine = function (x) {
  // reuse redundant line
  var line = this.dom.redundant.majorLines.shift();

  if (!line) {
    // create vertical line
    line = document.createElement('DIV');
    line.className = 'grid vertical major';
    this.frame.appendChild(line);
  }
  this.dom.majorLines.push(line);

  var props = this.props;
  line.style.top = props.majorLineTop + 'px';
  line.style.left = (x - props.majorLineWidth / 2) + 'px';
  line.style.height = props.majorLineHeight + 'px';
};


/**
 * Repaint the horizontal line for the axis
 * @private
 */
TimeAxis.prototype._repaintLine = function() {
  var line = this.dom.line,
      frame = this.frame,
      options = this.options;

  // line before all axis elements
  if (this.getOption('showMinorLabels') || this.getOption('showMajorLabels')) {
    if (line) {
      // put this line at the end of all childs
      frame.removeChild(line);
      frame.appendChild(line);
    }
    else {
      // create the axis line
      line = document.createElement('div');
      line.className = 'grid horizontal major';
      frame.appendChild(line);
      this.dom.line = line;
    }

    line.style.top = this.props.lineTop + 'px';
  }
  else {
    if (line && line.parentElement) {
      frame.removeChild(line.line);
      delete this.dom.line;
    }
  }
};

/**
 * Create characters used to determine the size of text on the axis
 * @private
 */
TimeAxis.prototype._repaintMeasureChars = function () {
  // calculate the width and height of a single character
  // this is used to calculate the step size, and also the positioning of the
  // axis
  var dom = this.dom,
      text;

  if (!dom.measureCharMinor) {
    text = document.createTextNode('0');
    var measureCharMinor = document.createElement('DIV');
    measureCharMinor.className = 'text minor measure';
    measureCharMinor.appendChild(text);
    this.frame.appendChild(measureCharMinor);

    dom.measureCharMinor = measureCharMinor;
  }

  if (!dom.measureCharMajor) {
    text = document.createTextNode('0');
    var measureCharMajor = document.createElement('DIV');
    measureCharMajor.className = 'text major measure';
    measureCharMajor.appendChild(text);
    this.frame.appendChild(measureCharMajor);

    dom.measureCharMajor = measureCharMajor;
  }
};

/**
 * Reflow the component
 * @return {Boolean} resized
 */
TimeAxis.prototype.reflow = function () {
  var changed = 0,
      update = utils.updateProperty,
      frame = this.frame,
      range = this.range;

  if (!range) {
    throw new Error('Cannot repaint time axis: no range configured');
  }

  if (frame) {
    changed += update(this, 'top', frame.offsetTop);
    changed += update(this, 'left', frame.offsetLeft);

    // calculate size of a character
    var props = this.props,
        showMinorLabels = this.getOption('showMinorLabels'),
        showMajorLabels = this.getOption('showMajorLabels'),
        measureCharMinor = this.dom.measureCharMinor,
        measureCharMajor = this.dom.measureCharMajor;
    if (measureCharMinor) {
      props.minorCharHeight = measureCharMinor.clientHeight;
      props.minorCharWidth = measureCharMinor.clientWidth;
    }
    if (measureCharMajor) {
      props.majorCharHeight = measureCharMajor.clientHeight;
      props.majorCharWidth = measureCharMajor.clientWidth;
    }

    var parentHeight = frame.parentNode ? frame.parentNode.offsetHeight : 0;
    if (parentHeight != props.parentHeight) {
      props.parentHeight = parentHeight;
      changed += 1;
    }
    switch (this.getOption('orientation')) {
      case 'bottom':
        props.minorLabelHeight = showMinorLabels ? props.minorCharHeight : 0;
        props.majorLabelHeight = showMajorLabels ? props.majorCharHeight : 0;

        props.minorLabelTop = 0;
        props.majorLabelTop = props.minorLabelTop + props.minorLabelHeight;

        props.minorLineTop = -this.top;
        props.minorLineHeight = Math.max(this.top + props.majorLabelHeight, 0);
        props.minorLineWidth = 1; // TODO: really calculate width

        props.majorLineTop = -this.top;
        props.majorLineHeight = Math.max(this.top + props.minorLabelHeight + props.majorLabelHeight, 0);
        props.majorLineWidth = 1; // TODO: really calculate width

        props.lineTop = 0;

        break;

      case 'top':
        props.minorLabelHeight = showMinorLabels ? props.minorCharHeight : 0;
        props.majorLabelHeight = showMajorLabels ? props.majorCharHeight : 0;

        props.majorLabelTop = 0;
        props.minorLabelTop = props.majorLabelTop + props.majorLabelHeight;

        props.minorLineTop = props.minorLabelTop;
        props.minorLineHeight = Math.max(parentHeight - props.majorLabelHeight - this.top);
        props.minorLineWidth = 1; // TODO: really calculate width

        props.majorLineTop = 0;
        props.majorLineHeight = Math.max(parentHeight - this.top);
        props.majorLineWidth = 1; // TODO: really calculate width

        props.lineTop = props.majorLabelHeight +  props.minorLabelHeight;

        break;

      default:
        throw new Error('Unkown orientation "' + this.getOption('orientation') + '"');
    }

    var height = props.minorLabelHeight + props.majorLabelHeight;
    changed += update(this, 'width', frame.offsetWidth);
    changed += update(this, 'height', height);

    // calculate range and step
    this._updateConversion();

    var start = utils.convert(range.start, 'Number'),
        end = utils.convert(range.end, 'Number'),
        minimumStep = this.toTime((props.minorCharWidth || 10) * 5).valueOf()
            -this.toTime(0).valueOf();
    this.step = new TimeStep(new Date(start), new Date(end), minimumStep);
    changed += update(props.range, 'start', start);
    changed += update(props.range, 'end', end);
    changed += update(props.range, 'minimumStep', minimumStep.valueOf());
  }

  return (changed > 0);
};

/**
 * Calculate the scale and offset to convert a position on screen to the
 * corresponding date and vice versa.
 * After the method _updateConversion is executed once, the methods toTime
 * and toScreen can be used.
 * @private
 */
TimeAxis.prototype._updateConversion = function() {
  var range = this.range;
  if (!range) {
    throw new Error('No range configured');
  }

  if (range.conversion) {
    this.conversion = range.conversion(this.width);
  }
  else {
    this.conversion = Range.conversion(range.start, range.end, this.width);
  }
};

/**
 * Snap a date to a rounded value.
 * The snap intervals are dependent on the current scale and step.
 * @param {Date} date   the date to be snapped.
 * @return {Date} snappedDate
 */
TimeAxis.prototype.snap = function snap (date) {
  return this.step.snap(date);
};

module.exports = TimeAxis;

},{"../../utils":24,"../TimeStep":8,"./Component":10}],19:[function(require,module,exports){
var Hammer = require('../../../module/imports').Hammer;

/**
 * @constructor Item
 * @param {ItemSet} parent
 * @param {Object} data             Object containing (optional) parameters type,
 *                                  start, end, content, group, className.
 * @param {Object} [options]        Options to set initial property values
 * @param {Object} [defaultOptions] default options
 *                                  // TODO: describe available options
 */
function Item (parent, data, options, defaultOptions) {
  this.parent = parent;
  this.data = data;
  this.dom = null;
  this.options = options || {};
  this.defaultOptions = defaultOptions || {};

  this.selected = false;
  this.visible = false;
  this.top = 0;
  this.left = 0;
  this.width = 0;
  this.height = 0;
  this.offset = 0;
}

/**
 * Select current item
 */
Item.prototype.select = function select() {
  this.selected = true;
  if (this.visible) this.repaint();
};

/**
 * Unselect current item
 */
Item.prototype.unselect = function unselect() {
  this.selected = false;
  if (this.visible) this.repaint();
};

/**
 * Show the Item in the DOM (when not already visible)
 * @return {Boolean} changed
 */
Item.prototype.show = function show() {
  return false;
};

/**
 * Hide the Item from the DOM (when visible)
 * @return {Boolean} changed
 */
Item.prototype.hide = function hide() {
  return false;
};

/**
 * Repaint the item
 * @return {Boolean} changed
 */
Item.prototype.repaint = function repaint() {
  // should be implemented by the item
  return false;
};

/**
 * Reflow the item
 * @return {Boolean} resized
 */
Item.prototype.reflow = function reflow() {
  // should be implemented by the item
  return false;
};

/**
 * Give the item a display offset in pixels
 * @param {Number} offset    Offset on screen in pixels
 */
Item.prototype.setOffset = function setOffset(offset) {
  this.offset = offset;
};

/**
 * Repaint a delete button on the top right of the item when the item is selected
 * @param {HTMLElement} anchor
 * @private
 */
Item.prototype._repaintDeleteButton = function (anchor) {
  if (this.selected && this.options.editable && !this.dom.deleteButton) {
    // create and show button
    var parent = this.parent;
    var id = this.id;

    var deleteButton = document.createElement('div');
    deleteButton.className = 'delete';
    deleteButton.title = 'Delete this item';

    Hammer(deleteButton, {
      preventDefault: true
    }).on('tap', function (event) {
      parent.removeItem(id);
      event.stopPropagation();
    });

    anchor.appendChild(deleteButton);
    this.dom.deleteButton = deleteButton;
  }
  else if (!this.selected && this.dom.deleteButton) {
    // remove button
    if (this.dom.deleteButton.parentNode) {
      this.dom.deleteButton.parentNode.removeChild(this.dom.deleteButton);
    }
    this.dom.deleteButton = null;
  }
};

module.exports = Item;

},{"../../../module/imports":4}],20:[function(require,module,exports){
var utils = require('../../../utils'),
    Item = require('./Item');

/**
 * @constructor ItemBox
 * @extends Item
 * @param {ItemSet} parent
 * @param {Object} data             Object containing parameters start
 *                                  content, className.
 * @param {Object} [options]        Options to set initial property values
 * @param {Object} [defaultOptions] default options
 *                                  // TODO: describe available options
 */
function ItemBox (parent, data, options, defaultOptions) {
  this.props = {
    dot: {
      left: 0,
      top: 0,
      width: 0,
      height: 0
    },
    line: {
      top: 0,
      left: 0,
      width: 0,
      height: 0
    }
  };

  Item.call(this, parent, data, options, defaultOptions);
}

ItemBox.prototype = new Item (null, null);

/**
 * Repaint the item
 * @return {Boolean} changed
 */
ItemBox.prototype.repaint = function repaint() {
  // TODO: make an efficient repaint
  var changed = false;
  var dom = this.dom;

  if (!dom) {
    this._create();
    dom = this.dom;
    changed = true;
  }

  if (dom) {
    if (!this.parent) {
      throw new Error('Cannot repaint item: no parent attached');
    }

    if (!dom.box.parentNode) {
      var foreground = this.parent.getForeground();
      if (!foreground) {
        throw new Error('Cannot repaint time axis: ' +
            'parent has no foreground container element');
      }
      foreground.appendChild(dom.box);
      changed = true;
    }

    if (!dom.line.parentNode) {
      var background = this.parent.getBackground();
      if (!background) {
        throw new Error('Cannot repaint time axis: ' +
            'parent has no background container element');
      }
      background.appendChild(dom.line);
      changed = true;
    }

    if (!dom.dot.parentNode) {
      var axis = this.parent.getAxis();
      if (!background) {
        throw new Error('Cannot repaint time axis: ' +
            'parent has no axis container element');
      }
      axis.appendChild(dom.dot);
      changed = true;
    }

    this._repaintDeleteButton(dom.box);

    // update contents
    if (this.data.content != this.content) {
      this.content = this.data.content;
      if (this.content instanceof Element) {
        dom.content.innerHTML = '';
        dom.content.appendChild(this.content);
      }
      else if (this.data.content != undefined) {
        dom.content.innerHTML = this.content;
      }
      else {
        throw new Error('Property "content" missing in item ' + this.data.id);
      }
      changed = true;
    }

    // update class
    var className = (this.data.className? ' ' + this.data.className : '') +
        (this.selected ? ' selected' : '');
    if (this.className != className) {
      this.className = className;
      dom.box.className = 'item box' + className;
      dom.line.className = 'item line' + className;
      dom.dot.className  = 'item dot' + className;
      changed = true;
    }
  }

  return changed;
};

/**
 * Show the item in the DOM (when not already visible). The items DOM will
 * be created when needed.
 * @return {Boolean} changed
 */
ItemBox.prototype.show = function show() {
  if (!this.dom || !this.dom.box.parentNode) {
    return this.repaint();
  }
  else {
    return false;
  }
};

/**
 * Hide the item from the DOM (when visible)
 * @return {Boolean} changed
 */
ItemBox.prototype.hide = function hide() {
  var changed = false,
      dom = this.dom;
  if (dom) {
    if (dom.box.parentNode) {
      dom.box.parentNode.removeChild(dom.box);
      changed = true;
    }
    if (dom.line.parentNode) {
      dom.line.parentNode.removeChild(dom.line);
    }
    if (dom.dot.parentNode) {
      dom.dot.parentNode.removeChild(dom.dot);
    }
  }
  return changed;
};

/**
 * Reflow the item: calculate its actual size and position from the DOM
 * @return {boolean} resized    returns true if the axis is resized
 * @override
 */
ItemBox.prototype.reflow = function reflow() {
  var changed = 0,
      update,
      dom,
      props,
      options,
      margin,
      start,
      align,
      orientation,
      top,
      left,
      data,
      range;

  if (this.data.start == undefined) {
    throw new Error('Property "start" missing in item ' + this.data.id);
  }

  data = this.data;
  range = this.parent && this.parent.range;
  if (data && range) {
    // TODO: account for the width of the item
    var interval = (range.end - range.start);
    this.visible = (data.start > range.start - interval) && (data.start < range.end + interval);
  }
  else {
    this.visible = false;
  }

  if (this.visible) {
    dom = this.dom;
    if (dom) {
      update = utils.updateProperty;
      props = this.props;
      options = this.options;
      start = this.parent.toScreen(this.data.start) + this.offset;
      align = options.align || this.defaultOptions.align;
      margin = options.margin && options.margin.axis || this.defaultOptions.margin.axis;
      orientation = options.orientation || this.defaultOptions.orientation;

      changed += update(props.dot, 'height', dom.dot.offsetHeight);
      changed += update(props.dot, 'width', dom.dot.offsetWidth);
      changed += update(props.line, 'width', dom.line.offsetWidth);
      changed += update(props.line, 'height', dom.line.offsetHeight);
      changed += update(props.line, 'top', dom.line.offsetTop);
      changed += update(this, 'width', dom.box.offsetWidth);
      changed += update(this, 'height', dom.box.offsetHeight);
      if (align == 'right') {
        left = start - this.width;
      }
      else if (align == 'left') {
        left = start;
      }
      else {
        // default or 'center'
        left = start - this.width / 2;
      }
      changed += update(this, 'left', left);

      changed += update(props.line, 'left', start - props.line.width / 2);
      changed += update(props.dot, 'left', start - props.dot.width / 2);
      changed += update(props.dot, 'top', -props.dot.height / 2);
      if (orientation == 'top') {
        top = margin;

        changed += update(this, 'top', top);
      }
      else {
        // default or 'bottom'
        var parentHeight = this.parent.height;
        top = parentHeight - this.height - margin;

        changed += update(this, 'top', top);
      }
    }
    else {
      changed += 1;
    }
  }

  return (changed > 0);
};

/**
 * Create an items DOM
 * @private
 */
ItemBox.prototype._create = function _create() {
  var dom = this.dom;
  if (!dom) {
    this.dom = dom = {};

    // create the box
    dom.box = document.createElement('DIV');
    // className is updated in repaint()

    // contents box (inside the background box). used for making margins
    dom.content = document.createElement('DIV');
    dom.content.className = 'content';
    dom.box.appendChild(dom.content);

    // line to axis
    dom.line = document.createElement('DIV');
    dom.line.className = 'line';

    // dot on axis
    dom.dot = document.createElement('DIV');
    dom.dot.className = 'dot';

    // attach this item as attribute
    dom.box['timeline-item'] = this;
  }
};

/**
 * Reposition the item, recalculate its left, top, and width, using the current
 * range and size of the items itemset
 * @override
 */
ItemBox.prototype.reposition = function reposition() {
  var dom = this.dom,
      props = this.props,
      orientation = this.options.orientation || this.defaultOptions.orientation;

  if (dom) {
    var box = dom.box,
        line = dom.line,
        dot = dom.dot;

    box.style.left = this.left + 'px';
    box.style.top = this.top + 'px';

    line.style.left = props.line.left + 'px';
    if (orientation == 'top') {
      line.style.top = 0 + 'px';
      line.style.height = this.top + 'px';
    }
    else {
      // orientation 'bottom'
      line.style.top = (this.top + this.height) + 'px';
      line.style.height = Math.max(this.parent.height - this.top - this.height +
          this.props.dot.height / 2, 0) + 'px';
    }

    dot.style.left = props.dot.left + 'px';
    dot.style.top = props.dot.top + 'px';
  }
};

module.exports = ItemBox;

},{"../../../utils":24,"./Item":19}],21:[function(require,module,exports){
var utils = require('../../../utils'),
    Item = require('./Item');

/**
 * @constructor ItemPoint
 * @extends Item
 * @param {ItemSet} parent
 * @param {Object} data             Object containing parameters start
 *                                  content, className.
 * @param {Object} [options]        Options to set initial property values
 * @param {Object} [defaultOptions] default options
 *                                  // TODO: describe available options
 */
function ItemPoint (parent, data, options, defaultOptions) {
  this.props = {
    dot: {
      top: 0,
      width: 0,
      height: 0
    },
    content: {
      height: 0,
      marginLeft: 0
    }
  };

  Item.call(this, parent, data, options, defaultOptions);
}

ItemPoint.prototype = new Item (null, null);

/**
 * Repaint the item
 * @return {Boolean} changed
 */
ItemPoint.prototype.repaint = function repaint() {
  // TODO: make an efficient repaint
  var changed = false;
  var dom = this.dom;

  if (!dom) {
    this._create();
    dom = this.dom;
    changed = true;
  }

  if (dom) {
    if (!this.parent) {
      throw new Error('Cannot repaint item: no parent attached');
    }
    var foreground = this.parent.getForeground();
    if (!foreground) {
      throw new Error('Cannot repaint time axis: ' +
          'parent has no foreground container element');
    }

    if (!dom.point.parentNode) {
      foreground.appendChild(dom.point);
      foreground.appendChild(dom.point);
      changed = true;
    }

    // update contents
    if (this.data.content != this.content) {
      this.content = this.data.content;
      if (this.content instanceof Element) {
        dom.content.innerHTML = '';
        dom.content.appendChild(this.content);
      }
      else if (this.data.content != undefined) {
        dom.content.innerHTML = this.content;
      }
      else {
        throw new Error('Property "content" missing in item ' + this.data.id);
      }
      changed = true;
    }

    this._repaintDeleteButton(dom.point);

    // update class
    var className = (this.data.className? ' ' + this.data.className : '') +
        (this.selected ? ' selected' : '');
    if (this.className != className) {
      this.className = className;
      dom.point.className  = 'item point' + className;
      changed = true;
    }
  }

  return changed;
};

/**
 * Show the item in the DOM (when not already visible). The items DOM will
 * be created when needed.
 * @return {Boolean} changed
 */
ItemPoint.prototype.show = function show() {
  if (!this.dom || !this.dom.point.parentNode) {
    return this.repaint();
  }
  else {
    return false;
  }
};

/**
 * Hide the item from the DOM (when visible)
 * @return {Boolean} changed
 */
ItemPoint.prototype.hide = function hide() {
  var changed = false,
      dom = this.dom;
  if (dom) {
    if (dom.point.parentNode) {
      dom.point.parentNode.removeChild(dom.point);
      changed = true;
    }
  }
  return changed;
};

/**
 * Reflow the item: calculate its actual size from the DOM
 * @return {boolean} resized    returns true if the axis is resized
 * @override
 */
ItemPoint.prototype.reflow = function reflow() {
  var changed = 0,
      update,
      dom,
      props,
      options,
      margin,
      orientation,
      start,
      top,
      data,
      range;

  if (this.data.start == undefined) {
    throw new Error('Property "start" missing in item ' + this.data.id);
  }

  data = this.data;
  range = this.parent && this.parent.range;
  if (data && range) {
    // TODO: account for the width of the item
    var interval = (range.end - range.start);
    this.visible = (data.start > range.start - interval) && (data.start < range.end);
  }
  else {
    this.visible = false;
  }

  if (this.visible) {
    dom = this.dom;
    if (dom) {
      update = utils.updateProperty;
      props = this.props;
      options = this.options;
      orientation = options.orientation || this.defaultOptions.orientation;
      margin = options.margin && options.margin.axis || this.defaultOptions.margin.axis;
      start = this.parent.toScreen(this.data.start) + this.offset;

      changed += update(this, 'width', dom.point.offsetWidth);
      changed += update(this, 'height', dom.point.offsetHeight);
      changed += update(props.dot, 'width', dom.dot.offsetWidth);
      changed += update(props.dot, 'height', dom.dot.offsetHeight);
      changed += update(props.content, 'height', dom.content.offsetHeight);

      if (orientation == 'top') {
        top = margin;
      }
      else {
        // default or 'bottom'
        var parentHeight = this.parent.height;
        top = Math.max(parentHeight - this.height - margin, 0);
      }
      changed += update(this, 'top', top);
      changed += update(this, 'left', start - props.dot.width / 2);
      changed += update(props.content, 'marginLeft', 1.5 * props.dot.width);
      //changed += update(props.content, 'marginRight', 0.5 * props.dot.width); // TODO

      changed += update(props.dot, 'top', (this.height - props.dot.height) / 2);
    }
    else {
      changed += 1;
    }
  }

  return (changed > 0);
};

/**
 * Create an items DOM
 * @private
 */
ItemPoint.prototype._create = function _create() {
  var dom = this.dom;
  if (!dom) {
    this.dom = dom = {};

    // background box
    dom.point = document.createElement('div');
    // className is updated in repaint()

    // contents box, right from the dot
    dom.content = document.createElement('div');
    dom.content.className = 'content';
    dom.point.appendChild(dom.content);

    // dot at start
    dom.dot = document.createElement('div');
    dom.dot.className  = 'dot';
    dom.point.appendChild(dom.dot);

    // attach this item as attribute
    dom.point['timeline-item'] = this;
  }
};

/**
 * Reposition the item, recalculate its left, top, and width, using the current
 * range and size of the items itemset
 * @override
 */
ItemPoint.prototype.reposition = function reposition() {
  var dom = this.dom,
      props = this.props;

  if (dom) {
    dom.point.style.top = this.top + 'px';
    dom.point.style.left = this.left + 'px';

    dom.content.style.marginLeft = props.content.marginLeft + 'px';
    //dom.content.style.marginRight = props.content.marginRight + 'px'; // TODO

    dom.dot.style.top = props.dot.top + 'px';
  }
};

module.exports = ItemPoint;

},{"../../../utils":24,"./Item":19}],22:[function(require,module,exports){
var utils = require('../../../utils'),
    Hammer = require('../../../module/imports').Hammer,
    Item = require('./Item');

/**
 * @constructor ItemRange
 * @extends Item
 * @param {ItemSet} parent
 * @param {Object} data             Object containing parameters start, end
 *                                  content, className.
 * @param {Object} [options]        Options to set initial property values
 * @param {Object} [defaultOptions] default options
 *                                  // TODO: describe available options
 */
function ItemRange (parent, data, options, defaultOptions) {
  this.props = {
    content: {
      left: 0,
      width: 0
    }
  };

  Item.call(this, parent, data, options, defaultOptions);
}

ItemRange.prototype = new Item (null, null);

/**
 * Repaint the item
 * @return {Boolean} changed
 */
ItemRange.prototype.repaint = function repaint() {
  // TODO: make an efficient repaint
  var changed = false;
  var dom = this.dom;

  if (!dom) {
    this._create();
    dom = this.dom;
    changed = true;
  }

  if (dom) {
    if (!this.parent) {
      throw new Error('Cannot repaint item: no parent attached');
    }
    var foreground = this.parent.getForeground();
    if (!foreground) {
      throw new Error('Cannot repaint time axis: ' +
          'parent has no foreground container element');
    }

    if (!dom.box.parentNode) {
      foreground.appendChild(dom.box);
      changed = true;
    }

    // update content
    if (this.data.content != this.content) {
      this.content = this.data.content;
      if (this.content instanceof Element) {
        dom.content.innerHTML = '';
        dom.content.appendChild(this.content);
      }
      else if (this.data.content != undefined) {
        dom.content.innerHTML = this.content;
      }
      else {
        throw new Error('Property "content" missing in item ' + this.data.id);
      }
      changed = true;
    }

    this._repaintDeleteButton(dom.box);
    this._repaintDragLeft();
    this._repaintDragRight();

    // update class
    var className = (this.data.className ? (' ' + this.data.className) : '') +
        (this.selected ? ' selected' : '');
    if (this.className != className) {
      this.className = className;
      dom.box.className = 'item range' + className;
      changed = true;
    }
  }

  return changed;
};

/**
 * Show the item in the DOM (when not already visible). The items DOM will
 * be created when needed.
 * @return {Boolean} changed
 */
ItemRange.prototype.show = function show() {
  if (!this.dom || !this.dom.box.parentNode) {
    return this.repaint();
  }
  else {
    return false;
  }
};

/**
 * Hide the item from the DOM (when visible)
 * @return {Boolean} changed
 */
ItemRange.prototype.hide = function hide() {
  var changed = false,
      dom = this.dom;
  if (dom) {
    if (dom.box.parentNode) {
      dom.box.parentNode.removeChild(dom.box);
      changed = true;
    }
  }
  return changed;
};

/**
 * Reflow the item: calculate its actual size from the DOM
 * @return {boolean} resized    returns true if the axis is resized
 * @override
 */
ItemRange.prototype.reflow = function reflow() {
  var changed = 0,
      dom,
      props,
      options,
      margin,
      padding,
      parent,
      start,
      end,
      data,
      range,
      update,
      box,
      parentWidth,
      contentLeft,
      orientation,
      top;

  if (this.data.start == undefined) {
    throw new Error('Property "start" missing in item ' + this.data.id);
  }
  if (this.data.end == undefined) {
    throw new Error('Property "end" missing in item ' + this.data.id);
  }

  data = this.data;
  range = this.parent && this.parent.range;
  if (data && range) {
    // TODO: account for the width of the item. Take some margin
    this.visible = (data.start < range.end) && (data.end > range.start);
  }
  else {
    this.visible = false;
  }

  if (this.visible) {
    dom = this.dom;
    if (dom) {
      props = this.props;
      options = this.options;
      parent = this.parent;
      start = parent.toScreen(this.data.start) + this.offset;
      end = parent.toScreen(this.data.end) + this.offset;
      update = utils.updateProperty;
      box = dom.box;
      parentWidth = parent.width;
      orientation = options.orientation || this.defaultOptions.orientation;
      margin = options.margin && options.margin.axis || this.defaultOptions.margin.axis;
      padding = options.padding || this.defaultOptions.padding;

      changed += update(props.content, 'width', dom.content.offsetWidth);

      changed += update(this, 'height', box.offsetHeight);

      // limit the width of the this, as browsers cannot draw very wide divs
      if (start < -parentWidth) {
        start = -parentWidth;
      }
      if (end > 2 * parentWidth) {
        end = 2 * parentWidth;
      }

      // when range exceeds left of the window, position the contents at the left of the visible area
      if (start < 0) {
        contentLeft = Math.min(-start,
            (end - start - props.content.width - 2 * padding));
        // TODO: remove the need for options.padding. it's terrible.
      }
      else {
        contentLeft = 0;
      }
      changed += update(props.content, 'left', contentLeft);

      if (orientation == 'top') {
        top = margin;
        changed += update(this, 'top', top);
      }
      else {
        // default or 'bottom'
        top = parent.height - this.height - margin;
        changed += update(this, 'top', top);
      }

      changed += update(this, 'left', start);
      changed += update(this, 'width', Math.max(end - start, 1)); // TODO: reckon with border width;
    }
    else {
      changed += 1;
    }
  }

  return (changed > 0);
};

/**
 * Create an items DOM
 * @private
 */
ItemRange.prototype._create = function _create() {
  var dom = this.dom;
  if (!dom) {
    this.dom = dom = {};
    // background box
    dom.box = document.createElement('div');
    // className is updated in repaint()

    // contents box
    dom.content = document.createElement('div');
    dom.content.className = 'content';
    dom.box.appendChild(dom.content);

    // attach this item as attribute
    dom.box['timeline-item'] = this;
  }
};

/**
 * Reposition the item, recalculate its left, top, and width, using the current
 * range and size of the items itemset
 * @override
 */
ItemRange.prototype.reposition = function reposition() {
  var dom = this.dom,
      props = this.props;

  if (dom) {
    dom.box.style.top = this.top + 'px';
    dom.box.style.left = this.left + 'px';
    dom.box.style.width = this.width + 'px';

    dom.content.style.left = props.content.left + 'px';
  }
};

/**
 * Repaint a drag area on the left side of the range when the range is selected
 * @private
 */
ItemRange.prototype._repaintDragLeft = function () {
  if (this.selected && this.options.editable && !this.dom.dragLeft) {
    // create and show drag area
    var dragLeft = document.createElement('div');
    dragLeft.className = 'drag-left';
    dragLeft.dragLeftItem = this;

    // TODO: this should be redundant?
    Hammer(dragLeft, {
      preventDefault: true
    }).on('drag', function () {
          //console.log('drag left')
        });

    this.dom.box.appendChild(dragLeft);
    this.dom.dragLeft = dragLeft;
  }
  else if (!this.selected && this.dom.dragLeft) {
    // delete drag area
    if (this.dom.dragLeft.parentNode) {
      this.dom.dragLeft.parentNode.removeChild(this.dom.dragLeft);
    }
    this.dom.dragLeft = null;
  }
};

/**
 * Repaint a drag area on the right side of the range when the range is selected
 * @private
 */
ItemRange.prototype._repaintDragRight = function () {
  if (this.selected && this.options.editable && !this.dom.dragRight) {
    // create and show drag area
    var dragRight = document.createElement('div');
    dragRight.className = 'drag-right';
    dragRight.dragRightItem = this;

    // TODO: this should be redundant?
    Hammer(dragRight, {
      preventDefault: true
    }).on('drag', function () {
      //console.log('drag right')
    });

    this.dom.box.appendChild(dragRight);
    this.dom.dragRight = dragRight;
  }
  else if (!this.selected && this.dom.dragRight) {
    // delete drag area
    if (this.dom.dragRight.parentNode) {
      this.dom.dragRight.parentNode.removeChild(this.dom.dragRight);
    }
    this.dom.dragRight = null;
  }
};

module.exports = ItemRange;

},{"../../../module/imports":4,"../../../utils":24,"./Item":19}],23:[function(require,module,exports){
var ItemRange = require('./ItemRange');

/**
 * @constructor ItemRangeOverflow
 * @extends ItemRange
 * @param {ItemSet} parent
 * @param {Object} data             Object containing parameters start, end
 *                                  content, className.
 * @param {Object} [options]        Options to set initial property values
 * @param {Object} [defaultOptions] default options
 *                                  // TODO: describe available options
 */
function ItemRangeOverflow (parent, data, options, defaultOptions) {
  this.props = {
    content: {
      left: 0,
      width: 0
    }
  };

  // define a private property _width, which is the with of the range box
  // adhering to the ranges start and end date. The property width has a
  // getter which returns the max of border width and content width
  this._width = 0;
  Object.defineProperty(this, 'width', {
    get: function () {
      return (this.props.content && this._width < this.props.content.width) ?
          this.props.content.width :
          this._width;
    },

    set: function (width) {
      this._width = width;
    }
  });

  ItemRange.call(this, parent, data, options, defaultOptions);
}

ItemRangeOverflow.prototype = new ItemRange (null, null);

/**
 * Repaint the item
 * @return {Boolean} changed
 */
ItemRangeOverflow.prototype.repaint = function repaint() {
  // TODO: make an efficient repaint
  var changed = false;
  var dom = this.dom;

  if (!dom) {
    this._create();
    dom = this.dom;
    changed = true;
  }

  if (dom) {
    if (!this.parent) {
      throw new Error('Cannot repaint item: no parent attached');
    }
    var foreground = this.parent.getForeground();
    if (!foreground) {
      throw new Error('Cannot repaint time axis: ' +
          'parent has no foreground container element');
    }

    if (!dom.box.parentNode) {
      foreground.appendChild(dom.box);
      changed = true;
    }

    // update content
    if (this.data.content != this.content) {
      this.content = this.data.content;
      if (this.content instanceof Element) {
        dom.content.innerHTML = '';
        dom.content.appendChild(this.content);
      }
      else if (this.data.content != undefined) {
        dom.content.innerHTML = this.content;
      }
      else {
        throw new Error('Property "content" missing in item ' + this.id);
      }
      changed = true;
    }

    this._repaintDeleteButton(dom.box);
    this._repaintDragLeft();
    this._repaintDragRight();

    // update class
    var className = (this.data.className? ' ' + this.data.className : '') +
        (this.selected ? ' selected' : '');
    if (this.className != className) {
      this.className = className;
      dom.box.className = 'item rangeoverflow' + className;
      changed = true;
    }
  }

  return changed;
};

/**
 * Reposition the item, recalculate its left, top, and width, using the current
 * range and size of the items itemset
 * @override
 */
ItemRangeOverflow.prototype.reposition = function reposition() {
  var dom = this.dom,
      props = this.props;

  if (dom) {
    dom.box.style.top = this.top + 'px';
    dom.box.style.left = this.left + 'px';
    dom.box.style.width = this._width + 'px';

    dom.content.style.left = props.content.left + 'px';
  }
};

module.exports = ItemRangeOverflow;

},{"./ItemRange":22}],24:[function(require,module,exports){
// utility functions
var moment = require('./module/imports').moment,
    Hammer = require('./module/imports').Hammer;

/**
 * Test whether given object is a number
 * @param {*} object
 * @return {Boolean} isNumber
 */
exports.isNumber = function isNumber(object) {
  return (object instanceof Number || typeof object == 'number');
};

/**
 * Test whether given object is a string
 * @param {*} object
 * @return {Boolean} isString
 */
exports.isString = function isString(object) {
  return (object instanceof String || typeof object == 'string');
};

/**
 * Test whether given object is a Date, or a String containing a Date
 * @param {Date | String} object
 * @return {Boolean} isDate
 */
exports.isDate = function isDate(object) {
  if (object instanceof Date) {
    return true;
  }
  else if (exports.isString(object)) {
    // test whether this string contains a date
    var match = ASPDateRegex.exec(object);
    if (match) {
      return true;
    }
    else if (!isNaN(Date.parse(object))) {
      return true;
    }
  }

  return false;
};

/**
 * Test whether given object is an instance of google.visualization.DataTable
 * @param {*} object
 * @return {Boolean} isDataTable
 */
exports.isDataTable = function isDataTable(object) {
  return (typeof (google) !== 'undefined') &&
      (google.visualization) &&
      (google.visualization.DataTable) &&
      (object instanceof google.visualization.DataTable);
};

/**
 * Create a semi UUID
 * source: http://stackoverflow.com/a/105074/1262753
 * @return {String} uuid
 */
exports.randomUUID = function randomUUID () {
  var S4 = function () {
    return Math.floor(
        Math.random() * 0x10000 /* 65536 */
    ).toString(16);
  };

  return (
      S4() + S4() + '-' +
          S4() + '-' +
          S4() + '-' +
          S4() + '-' +
          S4() + S4() + S4()
      );
};

/**
 * Extend object a with the properties of object b or a series of objects
 * Only properties with defined values are copied
 * @param {Object} a
 * @param {... Object} b
 * @return {Object} a
 */
exports.extend = function (a, b) {
  for (var i = 1, len = arguments.length; i < len; i++) {
    var other = arguments[i];
    for (var prop in other) {
      if (other.hasOwnProperty(prop) && other[prop] !== undefined) {
        a[prop] = other[prop];
      }
    }
  }

  return a;
};

/**
 * Convert an object to another type
 * @param {Boolean | Number | String | Date | Moment | Null | undefined} object
 * @param {String | undefined} type   Name of the type. Available types:
 *                                    'Boolean', 'Number', 'String',
 *                                    'Date', 'Moment', ISODate', 'ASPDate'.
 * @return {*} object
 * @throws Error
 */
exports.convert = function convert(object, type) {
  var match;

  if (object === undefined) {
    return undefined;
  }
  if (object === null) {
    return null;
  }

  if (!type) {
    return object;
  }
  if (!(typeof type === 'string') && !(type instanceof String)) {
    throw new Error('Type must be a string');
  }

  //noinspection FallthroughInSwitchStatementJS
  switch (type) {
    case 'boolean':
    case 'Boolean':
      return Boolean(object);

    case 'number':
    case 'Number':
      return Number(object.valueOf());

    case 'string':
    case 'String':
      return String(object);

    case 'Date':
      if (exports.isNumber(object)) {
        return new Date(object);
      }
      if (object instanceof Date) {
        return new Date(object.valueOf());
      }
      else if (moment.isMoment(object)) {
        return new Date(object.valueOf());
      }
      if (exports.isString(object)) {
        match = ASPDateRegex.exec(object);
        if (match) {
          // object is an ASP date
          return new Date(Number(match[1])); // parse number
        }
        else {
          return moment(object).toDate(); // parse string
        }
      }
      else {
        throw new Error(
            'Cannot convert object of type ' + exports.getType(object) +
                ' to type Date');
      }

    case 'Moment':
      if (exports.isNumber(object)) {
        return moment(object);
      }
      if (object instanceof Date) {
        return moment(object.valueOf());
      }
      else if (moment.isMoment(object)) {
        return moment(object);
      }
      if (exports.isString(object)) {
        match = ASPDateRegex.exec(object);
        if (match) {
          // object is an ASP date
          return moment(Number(match[1])); // parse number
        }
        else {
          return moment(object); // parse string
        }
      }
      else {
        throw new Error(
            'Cannot convert object of type ' + exports.getType(object) +
                ' to type Date');
      }

    case 'ISODate':
      if (exports.isNumber(object)) {
        return new Date(object);
      }
      else if (object instanceof Date) {
        return object.toISOString();
      }
      else if (moment.isMoment(object)) {
        return object.toDate().toISOString();
      }
      else if (exports.isString(object)) {
        match = ASPDateRegex.exec(object);
        if (match) {
          // object is an ASP date
          return new Date(Number(match[1])).toISOString(); // parse number
        }
        else {
          return new Date(object).toISOString(); // parse string
        }
      }
      else {
        throw new Error(
            'Cannot convert object of type ' + exports.getType(object) +
                ' to type ISODate');
      }

    case 'ASPDate':
      if (exports.isNumber(object)) {
        return '/Date(' + object + ')/';
      }
      else if (object instanceof Date) {
        return '/Date(' + object.valueOf() + ')/';
      }
      else if (exports.isString(object)) {
        match = ASPDateRegex.exec(object);
        var value;
        if (match) {
          // object is an ASP date
          value = new Date(Number(match[1])).valueOf(); // parse number
        }
        else {
          value = new Date(object).valueOf(); // parse string
        }
        return '/Date(' + value + ')/';
      }
      else {
        throw new Error(
            'Cannot convert object of type ' + exports.getType(object) +
                ' to type ASPDate');
      }

    default:
      throw new Error('Cannot convert object of type ' + exports.getType(object) +
          ' to type "' + type + '"');
  }
};

// parse ASP.Net Date pattern,
// for example '/Date(1198908717056)/' or '/Date(1198908717056-0700)/'
// code from http://momentjs.com/
var ASPDateRegex = /^\/?Date\((\-?\d+)/i;

/**
 * Get the type of an object, for example exports.getType([]) returns 'Array'
 * @param {*} object
 * @return {String} type
 */
exports.getType = function getType(object) {
  var type = typeof object;

  if (type == 'object') {
    if (object == null) {
      return 'null';
    }
    if (object instanceof Boolean) {
      return 'Boolean';
    }
    if (object instanceof Number) {
      return 'Number';
    }
    if (object instanceof String) {
      return 'String';
    }
    if (object instanceof Array) {
      return 'Array';
    }
    if (object instanceof Date) {
      return 'Date';
    }
    return 'Object';
  }
  else if (type == 'number') {
    return 'Number';
  }
  else if (type == 'boolean') {
    return 'Boolean';
  }
  else if (type == 'string') {
    return 'String';
  }

  return type;
};

/**
 * Retrieve the absolute left value of a DOM element
 * @param {Element} elem        A dom element, for example a div
 * @return {number} left        The absolute left position of this element
 *                              in the browser page.
 */
exports.getAbsoluteLeft = function getAbsoluteLeft (elem) {
  var doc = document.documentElement;
  var body = document.body;

  var left = elem.offsetLeft;
  var e = elem.offsetParent;
  while (e != null && e != body && e != doc) {
    left += e.offsetLeft;
    left -= e.scrollLeft;
    e = e.offsetParent;
  }
  return left;
};

/**
 * Retrieve the absolute top value of a DOM element
 * @param {Element} elem        A dom element, for example a div
 * @return {number} top        The absolute top position of this element
 *                              in the browser page.
 */
exports.getAbsoluteTop = function getAbsoluteTop (elem) {
  var doc = document.documentElement;
  var body = document.body;

  var top = elem.offsetTop;
  var e = elem.offsetParent;
  while (e != null && e != body && e != doc) {
    top += e.offsetTop;
    top -= e.scrollTop;
    e = e.offsetParent;
  }
  return top;
};

/**
 * Get the absolute, vertical mouse position from an event.
 * @param {Event} event
 * @return {Number} pageY
 */
exports.getPageY = function getPageY (event) {
  if ('pageY' in event) {
    return event.pageY;
  }
  else {
    var clientY;
    if (('targetTouches' in event) && event.targetTouches.length) {
      clientY = event.targetTouches[0].clientY;
    }
    else {
      clientY = event.clientY;
    }

    var doc = document.documentElement;
    var body = document.body;
    return clientY +
        ( doc && doc.scrollTop || body && body.scrollTop || 0 ) -
        ( doc && doc.clientTop || body && body.clientTop || 0 );
  }
};

/**
 * Get the absolute, horizontal mouse position from an event.
 * @param {Event} event
 * @return {Number} pageX
 */
exports.getPageX = function getPageX (event) {
  if ('pageY' in event) {
    return event.pageX;
  }
  else {
    var clientX;
    if (('targetTouches' in event) && event.targetTouches.length) {
      clientX = event.targetTouches[0].clientX;
    }
    else {
      clientX = event.clientX;
    }

    var doc = document.documentElement;
    var body = document.body;
    return clientX +
        ( doc && doc.scrollLeft || body && body.scrollLeft || 0 ) -
        ( doc && doc.clientLeft || body && body.clientLeft || 0 );
  }
};

/**
 * add a className to the given elements style
 * @param {Element} elem
 * @param {String} className
 */
exports.addClassName = function addClassName(elem, className) {
  var classes = elem.className.split(' ');
  if (classes.indexOf(className) == -1) {
    classes.push(className); // add the class to the array
    elem.className = classes.join(' ');
  }
};

/**
 * add a className to the given elements style
 * @param {Element} elem
 * @param {String} className
 */
exports.removeClassName = function removeClassname(elem, className) {
  var classes = elem.className.split(' ');
  var index = classes.indexOf(className);
  if (index != -1) {
    classes.splice(index, 1); // remove the class from the array
    elem.className = classes.join(' ');
  }
};

/**
 * For each method for both arrays and objects.
 * In case of an array, the built-in Array.forEach() is applied.
 * In case of an Object, the method loops over all properties of the object.
 * @param {Object | Array} object   An Object or Array
 * @param {function} callback       Callback method, called for each item in
 *                                  the object or array with three parameters:
 *                                  callback(value, index, object)
 */
exports.forEach = function forEach (object, callback) {
  var i,
      len;
  if (object instanceof Array) {
    // array
    for (i = 0, len = object.length; i < len; i++) {
      callback(object[i], i, object);
    }
  }
  else {
    // object
    for (i in object) {
      if (object.hasOwnProperty(i)) {
        callback(object[i], i, object);
      }
    }
  }
};

/**
 * Update a property in an object
 * @param {Object} object
 * @param {String} key
 * @param {*} value
 * @return {Boolean} changed
 */
exports.updateProperty = function updateProp (object, key, value) {
  if (object[key] !== value) {
    object[key] = value;
    return true;
  }
  else {
    return false;
  }
};

/**
 * Add and event listener. Works for all browsers
 * @param {Element}     element    An html element
 * @param {string}      action     The action, for example "click",
 *                                 without the prefix "on"
 * @param {function}    listener   The callback function to be executed
 * @param {boolean}     [useCapture]
 */
exports.addEventListener = function addEventListener(element, action, listener, useCapture) {
  if (element.addEventListener) {
    if (useCapture === undefined)
      useCapture = false;

    if (action === "mousewheel" && navigator.userAgent.indexOf("Firefox") >= 0) {
      action = "DOMMouseScroll";  // For Firefox
    }

    element.addEventListener(action, listener, useCapture);
  } else {
    element.attachEvent("on" + action, listener);  // IE browsers
  }
};

/**
 * Remove an event listener from an element
 * @param {Element}     element         An html dom element
 * @param {string}      action          The name of the event, for example "mousedown"
 * @param {function}    listener        The listener function
 * @param {boolean}     [useCapture]
 */
exports.removeEventListener = function removeEventListener(element, action, listener, useCapture) {
  if (element.removeEventListener) {
    // non-IE browsers
    if (useCapture === undefined)
      useCapture = false;

    if (action === "mousewheel" && navigator.userAgent.indexOf("Firefox") >= 0) {
      action = "DOMMouseScroll";  // For Firefox
    }

    element.removeEventListener(action, listener, useCapture);
  } else {
    // IE browsers
    element.detachEvent("on" + action, listener);
  }
};


/**
 * Get HTML element which is the target of the event
 * @param {Event} event
 * @return {Element} target element
 */
exports.getTarget = function getTarget(event) {
  // code from http://www.quirksmode.org/js/events_properties.html
  if (!event) {
    event = window.event;
  }

  var target;

  if (event.target) {
    target = event.target;
  }
  else if (event.srcElement) {
    target = event.srcElement;
  }

  if (target.nodeType != undefined && target.nodeType == 3) {
    // defeat Safari bug
    target = target.parentNode;
  }

  return target;
};

/**
 * Fake a hammer.js gesture. Event can be a ScrollEvent or MouseMoveEvent
 * @param {Element} element
 * @param {Event} event
 */
exports.fakeGesture = function fakeGesture (element, event) {
  var eventType = null;

  // for hammer.js 1.0.5
  var gesture = Hammer.event.collectEventData(this, eventType, event);

  // for hammer.js 1.0.6
  //var touches = Hammer.event.getTouchList(event, eventType);
  // var gesture = Hammer.event.collectEventData(this, eventType, touches, event);

  // on IE in standards mode, no touches are recognized by hammer.js,
  // resulting in NaN values for center.pageX and center.pageY
  if (isNaN(gesture.center.pageX)) {
    gesture.center.pageX = event.pageX;
  }
  if (isNaN(gesture.center.pageY)) {
    gesture.center.pageY = event.pageY;
  }

  return gesture;
};

exports.option = {};

/**
 * Convert a value into a boolean
 * @param {Boolean | function | undefined} value
 * @param {Boolean} [defaultValue]
 * @returns {Boolean} bool
 */
exports.option.asBoolean = function (value, defaultValue) {
  if (typeof value == 'function') {
    value = value();
  }

  if (value != null) {
    return (value != false);
  }

  return defaultValue || null;
};

/**
 * Convert a value into a number
 * @param {Boolean | function | undefined} value
 * @param {Number} [defaultValue]
 * @returns {Number} number
 */
exports.option.asNumber = function (value, defaultValue) {
  if (typeof value == 'function') {
    value = value();
  }

  if (value != null) {
    return Number(value) || defaultValue || null;
  }

  return defaultValue || null;
};

/**
 * Convert a value into a string
 * @param {String | function | undefined} value
 * @param {String} [defaultValue]
 * @returns {String} str
 */
exports.option.asString = function (value, defaultValue) {
  if (typeof value == 'function') {
    value = value();
  }

  if (value != null) {
    return String(value);
  }

  return defaultValue || null;
};

/**
 * Convert a size or location into a string with pixels or a percentage
 * @param {String | Number | function | undefined} value
 * @param {String} [defaultValue]
 * @returns {String} size
 */
exports.option.asSize = function (value, defaultValue) {
  if (typeof value == 'function') {
    value = value();
  }

  if (exports.isString(value)) {
    return value;
  }
  else if (exports.isNumber(value)) {
    return value + 'px';
  }
  else {
    return defaultValue || null;
  }
};

/**
 * Convert a value into a DOM element
 * @param {HTMLElement | function | undefined} value
 * @param {HTMLElement} [defaultValue]
 * @returns {HTMLElement | null} dom
 */
exports.option.asElement = function (value, defaultValue) {
  if (typeof value == 'function') {
    value = value();
  }

  return value || defaultValue || null;
};



exports.GiveDec = function GiveDec(Hex) {
  var value;

  if(Hex == "A")
    value = 10;
  else
  if(Hex == "B")
    value = 11;
  else
  if(Hex == "C")
    value = 12;
  else
  if(Hex == "D")
    value = 13;
  else
  if(Hex == "E")
    value = 14;
  else
  if(Hex == "F")
    value = 15;
  else
    value = eval(Hex);

  return value;
};

exports.GiveHex = function GiveHex(Dec) {
  var value;
  if(Dec == 10)
    value = "A";
  else
  if(Dec == 11)
    value = "B";
  else
  if(Dec == 12)
    value = "C";
  else
  if(Dec == 13)
    value = "D";
  else
  if(Dec == 14)
    value = "E";
  else
  if(Dec == 15)
    value = "F";
  else
    value = "" + Dec;

  return value;
};

/**
 * http://www.yellowpipe.com/yis/tools/hex-to-rgb/color-converter.php
 *
 * @param {String} hex
 * @returns {{r: *, g: *, b: *}}
 */
exports.hexToRGB = function hexToRGB(hex) {
  hex = hex.replace("#","").toUpperCase();

  var a = exports.GiveDec(hex.substring(0, 1));
  var b = exports.GiveDec(hex.substring(1, 2));
  var c = exports.GiveDec(hex.substring(2, 3));
  var d = exports.GiveDec(hex.substring(3, 4));
  var e = exports.GiveDec(hex.substring(4, 5));
  var f = exports.GiveDec(hex.substring(5, 6));

  var r = (a * 16) + b;
  var g = (c * 16) + d;
  var b = (e * 16) + f;

  return {r:r,g:g,b:b};
};

exports.RGBToHex = function RGBToHex(red,green,blue) {
  var a = exports.GiveHex(Math.floor(red / 16));
  var b = exports.GiveHex(red % 16);
  var c = exports.GiveHex(Math.floor(green / 16));
  var d = exports.GiveHex(green % 16);
  var e = exports.GiveHex(Math.floor(blue / 16));
  var f = exports.GiveHex(blue % 16);

  var hex = a + b + c + d + e + f;
  return "#" + hex;
};


/**
 * http://www.javascripter.net/faq/rgb2hsv.htm
 *
 * @param red
 * @param green
 * @param blue
 * @returns {*}
 * @constructor
 */
exports.RGBToHSV = function RGBToHSV (red,green,blue) {
  red=red/255; green=green/255; blue=blue/255;
  var minRGB = Math.min(red,Math.min(green,blue));
  var maxRGB = Math.max(red,Math.max(green,blue));

  // Black-gray-white
  if (minRGB == maxRGB) {
    return {h:0,s:0,v:minRGB};
  }

  // Colors other than black-gray-white:
  var d = (red==minRGB) ? green-blue : ((blue==minRGB) ? red-green : blue-red);
  var h = (red==minRGB) ? 3 : ((blue==minRGB) ? 1 : 5);
  var hue = 60*(h - d/(maxRGB - minRGB))/360;
  var saturation = (maxRGB - minRGB)/maxRGB;
  var value = maxRGB;
  return {h:hue,s:saturation,v:value};
};


/**
 * https://gist.github.com/mjijackson/5311256
 * @param hue
 * @param saturation
 * @param value
 * @returns {{r: number, g: number, b: number}}
 * @constructor
 */
exports.HSVToRGB = function HSVToRGB(h, s, v) {
  var r, g, b;

  var i = Math.floor(h * 6);
  var f = h * 6 - i;
  var p = v * (1 - s);
  var q = v * (1 - f * s);
  var t = v * (1 - (1 - f) * s);

  switch (i % 6) {
    case 0: r = v, g = t, b = p; break;
    case 1: r = q, g = v, b = p; break;
    case 2: r = p, g = v, b = t; break;
    case 3: r = p, g = q, b = v; break;
    case 4: r = t, g = p, b = v; break;
    case 5: r = v, g = p, b = q; break;
  }

  return {r:Math.floor(r * 255), g:Math.floor(g * 255), b:Math.floor(b * 255) };
};

exports.HSVToHex = function HSVToHex(h,s,v) {
  var rgb = exports.HSVToRGB(h,s,v);
  return exports.RGBToHex(rgb.r,rgb.g,rgb.b);
};

exports.hexToHSV = function hexToHSV(hex) {
  var rgb = exports.hexToRGB(hex);
  return exports.RGBToHSV(rgb.r,rgb.g,rgb.b);
};

exports.isValidHex = function isValidHex(hex) {
  return /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(hex);
};

},{"./module/imports":4}],25:[function(require,module,exports){

/**
 * Expose `Emitter`.
 */

module.exports = Emitter;

/**
 * Initialize a new `Emitter`.
 *
 * @api public
 */

function Emitter(obj) {
  if (obj) return mixin(obj);
};

/**
 * Mixin the emitter properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
  for (var key in Emitter.prototype) {
    obj[key] = Emitter.prototype[key];
  }
  return obj;
}

/**
 * Listen on the given `event` with `fn`.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.on =
Emitter.prototype.addEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};
  (this._callbacks[event] = this._callbacks[event] || [])
    .push(fn);
  return this;
};

/**
 * Adds an `event` listener that will be invoked a single
 * time then automatically removed.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.once = function(event, fn){
  var self = this;
  this._callbacks = this._callbacks || {};

  function on() {
    self.off(event, on);
    fn.apply(this, arguments);
  }

  on.fn = fn;
  this.on(event, on);
  return this;
};

/**
 * Remove the given callback for `event` or all
 * registered callbacks.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.off =
Emitter.prototype.removeListener =
Emitter.prototype.removeAllListeners =
Emitter.prototype.removeEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};

  // all
  if (0 == arguments.length) {
    this._callbacks = {};
    return this;
  }

  // specific event
  var callbacks = this._callbacks[event];
  if (!callbacks) return this;

  // remove all handlers
  if (1 == arguments.length) {
    delete this._callbacks[event];
    return this;
  }

  // remove specific handler
  var cb;
  for (var i = 0; i < callbacks.length; i++) {
    cb = callbacks[i];
    if (cb === fn || cb.fn === fn) {
      callbacks.splice(i, 1);
      break;
    }
  }
  return this;
};

/**
 * Emit `event` with the given args.
 *
 * @param {String} event
 * @param {Mixed} ...
 * @return {Emitter}
 */

Emitter.prototype.emit = function(event){
  this._callbacks = this._callbacks || {};
  var args = [].slice.call(arguments, 1)
    , callbacks = this._callbacks[event];

  if (callbacks) {
    callbacks = callbacks.slice(0);
    for (var i = 0, len = callbacks.length; i < len; ++i) {
      callbacks[i].apply(this, args);
    }
  }

  return this;
};

/**
 * Return array of callbacks for `event`.
 *
 * @param {String} event
 * @return {Array}
 * @api public
 */

Emitter.prototype.listeners = function(event){
  this._callbacks = this._callbacks || {};
  return this._callbacks[event] || [];
};

/**
 * Check if this emitter has `event` handlers.
 *
 * @param {String} event
 * @return {Boolean}
 * @api public
 */

Emitter.prototype.hasListeners = function(event){
  return !! this.listeners(event).length;
};

},{}],26:[function(require,module,exports){
/*! Hammer.JS - v1.0.5 - 2013-04-07
 * http://eightmedia.github.com/hammer.js
 *
 * Copyright (c) 2013 Jorik Tangelder <j.tangelder@gmail.com>;
 * Licensed under the MIT license */

(function(window, undefined) {
    'use strict';

/**
 * Hammer
 * use this to create instances
 * @param   {HTMLElement}   element
 * @param   {Object}        options
 * @returns {Hammer.Instance}
 * @constructor
 */
var Hammer = function(element, options) {
    return new Hammer.Instance(element, options || {});
};

// default settings
Hammer.defaults = {
    // add styles and attributes to the element to prevent the browser from doing
    // its native behavior. this doesnt prevent the scrolling, but cancels
    // the contextmenu, tap highlighting etc
    // set to false to disable this
    stop_browser_behavior: {
		// this also triggers onselectstart=false for IE
        userSelect: 'none',
		// this makes the element blocking in IE10 >, you could experiment with the value
		// see for more options this issue; https://github.com/EightMedia/hammer.js/issues/241
        touchAction: 'none',
		touchCallout: 'none',
        contentZooming: 'none',
        userDrag: 'none',
        tapHighlightColor: 'rgba(0,0,0,0)'
    }

    // more settings are defined per gesture at gestures.js
};

// detect touchevents
Hammer.HAS_POINTEREVENTS = navigator.pointerEnabled || navigator.msPointerEnabled;
Hammer.HAS_TOUCHEVENTS = ('ontouchstart' in window);

// dont use mouseevents on mobile devices
Hammer.MOBILE_REGEX = /mobile|tablet|ip(ad|hone|od)|android/i;
Hammer.NO_MOUSEEVENTS = Hammer.HAS_TOUCHEVENTS && navigator.userAgent.match(Hammer.MOBILE_REGEX);

// eventtypes per touchevent (start, move, end)
// are filled by Hammer.event.determineEventTypes on setup
Hammer.EVENT_TYPES = {};

// direction defines
Hammer.DIRECTION_DOWN = 'down';
Hammer.DIRECTION_LEFT = 'left';
Hammer.DIRECTION_UP = 'up';
Hammer.DIRECTION_RIGHT = 'right';

// pointer type
Hammer.POINTER_MOUSE = 'mouse';
Hammer.POINTER_TOUCH = 'touch';
Hammer.POINTER_PEN = 'pen';

// touch event defines
Hammer.EVENT_START = 'start';
Hammer.EVENT_MOVE = 'move';
Hammer.EVENT_END = 'end';

// hammer document where the base events are added at
Hammer.DOCUMENT = document;

// plugins namespace
Hammer.plugins = {};

// if the window events are set...
Hammer.READY = false;

/**
 * setup events to detect gestures on the document
 */
function setup() {
    if(Hammer.READY) {
        return;
    }

    // find what eventtypes we add listeners to
    Hammer.event.determineEventTypes();

    // Register all gestures inside Hammer.gestures
    for(var name in Hammer.gestures) {
        if(Hammer.gestures.hasOwnProperty(name)) {
            Hammer.detection.register(Hammer.gestures[name]);
        }
    }

    // Add touch events on the document
    Hammer.event.onTouch(Hammer.DOCUMENT, Hammer.EVENT_MOVE, Hammer.detection.detect);
    Hammer.event.onTouch(Hammer.DOCUMENT, Hammer.EVENT_END, Hammer.detection.detect);

    // Hammer is ready...!
    Hammer.READY = true;
}

/**
 * create new hammer instance
 * all methods should return the instance itself, so it is chainable.
 * @param   {HTMLElement}       element
 * @param   {Object}            [options={}]
 * @returns {Hammer.Instance}
 * @constructor
 */
Hammer.Instance = function(element, options) {
    var self = this;

    // setup HammerJS window events and register all gestures
    // this also sets up the default options
    setup();

    this.element = element;

    // start/stop detection option
    this.enabled = true;

    // merge options
    this.options = Hammer.utils.extend(
        Hammer.utils.extend({}, Hammer.defaults),
        options || {});

    // add some css to the element to prevent the browser from doing its native behavoir
    if(this.options.stop_browser_behavior) {
        Hammer.utils.stopDefaultBrowserBehavior(this.element, this.options.stop_browser_behavior);
    }

    // start detection on touchstart
    Hammer.event.onTouch(element, Hammer.EVENT_START, function(ev) {
        if(self.enabled) {
            Hammer.detection.startDetect(self, ev);
        }
    });

    // return instance
    return this;
};


Hammer.Instance.prototype = {
    /**
     * bind events to the instance
     * @param   {String}      gesture
     * @param   {Function}    handler
     * @returns {Hammer.Instance}
     */
    on: function onEvent(gesture, handler){
        var gestures = gesture.split(' ');
        for(var t=0; t<gestures.length; t++) {
            this.element.addEventListener(gestures[t], handler, false);
        }
        return this;
    },


    /**
     * unbind events to the instance
     * @param   {String}      gesture
     * @param   {Function}    handler
     * @returns {Hammer.Instance}
     */
    off: function offEvent(gesture, handler){
        var gestures = gesture.split(' ');
        for(var t=0; t<gestures.length; t++) {
            this.element.removeEventListener(gestures[t], handler, false);
        }
        return this;
    },


    /**
     * trigger gesture event
     * @param   {String}      gesture
     * @param   {Object}      eventData
     * @returns {Hammer.Instance}
     */
    trigger: function triggerEvent(gesture, eventData){
        // create DOM event
        var event = Hammer.DOCUMENT.createEvent('Event');
		event.initEvent(gesture, true, true);
		event.gesture = eventData;

        // trigger on the target if it is in the instance element,
        // this is for event delegation tricks
        var element = this.element;
        if(Hammer.utils.hasParent(eventData.target, element)) {
            element = eventData.target;
        }

        element.dispatchEvent(event);
        return this;
    },


    /**
     * enable of disable hammer.js detection
     * @param   {Boolean}   state
     * @returns {Hammer.Instance}
     */
    enable: function enable(state) {
        this.enabled = state;
        return this;
    }
};

/**
 * this holds the last move event,
 * used to fix empty touchend issue
 * see the onTouch event for an explanation
 * @type {Object}
 */
var last_move_event = null;


/**
 * when the mouse is hold down, this is true
 * @type {Boolean}
 */
var enable_detect = false;


/**
 * when touch events have been fired, this is true
 * @type {Boolean}
 */
var touch_triggered = false;


Hammer.event = {
    /**
     * simple addEventListener
     * @param   {HTMLElement}   element
     * @param   {String}        type
     * @param   {Function}      handler
     */
    bindDom: function(element, type, handler) {
        var types = type.split(' ');
        for(var t=0; t<types.length; t++) {
            element.addEventListener(types[t], handler, false);
        }
    },


    /**
     * touch events with mouse fallback
     * @param   {HTMLElement}   element
     * @param   {String}        eventType        like Hammer.EVENT_MOVE
     * @param   {Function}      handler
     */
    onTouch: function onTouch(element, eventType, handler) {
		var self = this;

        this.bindDom(element, Hammer.EVENT_TYPES[eventType], function bindDomOnTouch(ev) {
            var sourceEventType = ev.type.toLowerCase();

            // onmouseup, but when touchend has been fired we do nothing.
            // this is for touchdevices which also fire a mouseup on touchend
            if(sourceEventType.match(/mouse/) && touch_triggered) {
                return;
            }

            // mousebutton must be down or a touch event
            else if( sourceEventType.match(/touch/) ||   // touch events are always on screen
                sourceEventType.match(/pointerdown/) || // pointerevents touch
                (sourceEventType.match(/mouse/) && ev.which === 1)   // mouse is pressed
            ){
                enable_detect = true;
            }

            // we are in a touch event, set the touch triggered bool to true,
            // this for the conflicts that may occur on ios and android
            if(sourceEventType.match(/touch|pointer/)) {
                touch_triggered = true;
            }

            // count the total touches on the screen
            var count_touches = 0;

            // when touch has been triggered in this detection session
            // and we are now handling a mouse event, we stop that to prevent conflicts
            if(enable_detect) {
                // update pointerevent
                if(Hammer.HAS_POINTEREVENTS && eventType != Hammer.EVENT_END) {
                    count_touches = Hammer.PointerEvent.updatePointer(eventType, ev);
                }
                // touch
                else if(sourceEventType.match(/touch/)) {
                    count_touches = ev.touches.length;
                }
                // mouse
                else if(!touch_triggered) {
                    count_touches = sourceEventType.match(/up/) ? 0 : 1;
                }

                // if we are in a end event, but when we remove one touch and
                // we still have enough, set eventType to move
                if(count_touches > 0 && eventType == Hammer.EVENT_END) {
                    eventType = Hammer.EVENT_MOVE;
                }
                // no touches, force the end event
                else if(!count_touches) {
                    eventType = Hammer.EVENT_END;
                }

                // because touchend has no touches, and we often want to use these in our gestures,
                // we send the last move event as our eventData in touchend
                if(!count_touches && last_move_event !== null) {
                    ev = last_move_event;
                }
                // store the last move event
                else {
                    last_move_event = ev;
                }

                // trigger the handler
                handler.call(Hammer.detection, self.collectEventData(element, eventType, ev));

                // remove pointerevent from list
                if(Hammer.HAS_POINTEREVENTS && eventType == Hammer.EVENT_END) {
                    count_touches = Hammer.PointerEvent.updatePointer(eventType, ev);
                }
            }

            //debug(sourceEventType +" "+ eventType);

            // on the end we reset everything
            if(!count_touches) {
                last_move_event = null;
                enable_detect = false;
                touch_triggered = false;
                Hammer.PointerEvent.reset();
            }
        });
    },


    /**
     * we have different events for each device/browser
     * determine what we need and set them in the Hammer.EVENT_TYPES constant
     */
    determineEventTypes: function determineEventTypes() {
        // determine the eventtype we want to set
        var types;

        // pointerEvents magic
        if(Hammer.HAS_POINTEREVENTS) {
            types = Hammer.PointerEvent.getEvents();
        }
        // on Android, iOS, blackberry, windows mobile we dont want any mouseevents
        else if(Hammer.NO_MOUSEEVENTS) {
            types = [
                'touchstart',
                'touchmove',
                'touchend touchcancel'];
        }
        // for non pointer events browsers and mixed browsers,
        // like chrome on windows8 touch laptop
        else {
            types = [
                'touchstart mousedown',
                'touchmove mousemove',
                'touchend touchcancel mouseup'];
        }

        Hammer.EVENT_TYPES[Hammer.EVENT_START]  = types[0];
        Hammer.EVENT_TYPES[Hammer.EVENT_MOVE]   = types[1];
        Hammer.EVENT_TYPES[Hammer.EVENT_END]    = types[2];
    },


    /**
     * create touchlist depending on the event
     * @param   {Object}    ev
     * @param   {String}    eventType   used by the fakemultitouch plugin
     */
    getTouchList: function getTouchList(ev/*, eventType*/) {
        // get the fake pointerEvent touchlist
        if(Hammer.HAS_POINTEREVENTS) {
            return Hammer.PointerEvent.getTouchList();
        }
        // get the touchlist
        else if(ev.touches) {
            return ev.touches;
        }
        // make fake touchlist from mouse position
        else {
            return [{
                identifier: 1,
                pageX: ev.pageX,
                pageY: ev.pageY,
                target: ev.target
            }];
        }
    },


    /**
     * collect event data for Hammer js
     * @param   {HTMLElement}   element
     * @param   {String}        eventType        like Hammer.EVENT_MOVE
     * @param   {Object}        eventData
     */
    collectEventData: function collectEventData(element, eventType, ev) {
        var touches = this.getTouchList(ev, eventType);

        // find out pointerType
        var pointerType = Hammer.POINTER_TOUCH;
        if(ev.type.match(/mouse/) || Hammer.PointerEvent.matchType(Hammer.POINTER_MOUSE, ev)) {
            pointerType = Hammer.POINTER_MOUSE;
        }

        return {
            center      : Hammer.utils.getCenter(touches),
            timeStamp   : new Date().getTime(),
            target      : ev.target,
            touches     : touches,
            eventType   : eventType,
            pointerType : pointerType,
            srcEvent    : ev,

            /**
             * prevent the browser default actions
             * mostly used to disable scrolling of the browser
             */
            preventDefault: function() {
                if(this.srcEvent.preventManipulation) {
                    this.srcEvent.preventManipulation();
                }

                if(this.srcEvent.preventDefault) {
                    this.srcEvent.preventDefault();
                }
            },

            /**
             * stop bubbling the event up to its parents
             */
            stopPropagation: function() {
                this.srcEvent.stopPropagation();
            },

            /**
             * immediately stop gesture detection
             * might be useful after a swipe was detected
             * @return {*}
             */
            stopDetect: function() {
                return Hammer.detection.stopDetect();
            }
        };
    }
};

Hammer.PointerEvent = {
    /**
     * holds all pointers
     * @type {Object}
     */
    pointers: {},

    /**
     * get a list of pointers
     * @returns {Array}     touchlist
     */
    getTouchList: function() {
        var self = this;
        var touchlist = [];

        // we can use forEach since pointerEvents only is in IE10
        Object.keys(self.pointers).sort().forEach(function(id) {
            touchlist.push(self.pointers[id]);
        });
        return touchlist;
    },

    /**
     * update the position of a pointer
     * @param   {String}   type             Hammer.EVENT_END
     * @param   {Object}   pointerEvent
     */
    updatePointer: function(type, pointerEvent) {
        if(type == Hammer.EVENT_END) {
            this.pointers = {};
        }
        else {
            pointerEvent.identifier = pointerEvent.pointerId;
            this.pointers[pointerEvent.pointerId] = pointerEvent;
        }

        return Object.keys(this.pointers).length;
    },

    /**
     * check if ev matches pointertype
     * @param   {String}        pointerType     Hammer.POINTER_MOUSE
     * @param   {PointerEvent}  ev
     */
    matchType: function(pointerType, ev) {
        if(!ev.pointerType) {
            return false;
        }

        var types = {};
        types[Hammer.POINTER_MOUSE] = (ev.pointerType == ev.MSPOINTER_TYPE_MOUSE || ev.pointerType == Hammer.POINTER_MOUSE);
        types[Hammer.POINTER_TOUCH] = (ev.pointerType == ev.MSPOINTER_TYPE_TOUCH || ev.pointerType == Hammer.POINTER_TOUCH);
        types[Hammer.POINTER_PEN] = (ev.pointerType == ev.MSPOINTER_TYPE_PEN || ev.pointerType == Hammer.POINTER_PEN);
        return types[pointerType];
    },


    /**
     * get events
     */
    getEvents: function() {
        return [
            'pointerdown MSPointerDown',
            'pointermove MSPointerMove',
            'pointerup pointercancel MSPointerUp MSPointerCancel'
        ];
    },

    /**
     * reset the list
     */
    reset: function() {
        this.pointers = {};
    }
};


Hammer.utils = {
    /**
     * extend method,
     * also used for cloning when dest is an empty object
     * @param   {Object}    dest
     * @param   {Object}    src
	 * @parm	{Boolean}	merge		do a merge
     * @returns {Object}    dest
     */
    extend: function extend(dest, src, merge) {
        for (var key in src) {
			if(dest[key] !== undefined && merge) {
				continue;
			}
            dest[key] = src[key];
        }
        return dest;
    },


    /**
     * find if a node is in the given parent
     * used for event delegation tricks
     * @param   {HTMLElement}   node
     * @param   {HTMLElement}   parent
     * @returns {boolean}       has_parent
     */
    hasParent: function(node, parent) {
        while(node){
            if(node == parent) {
                return true;
            }
            node = node.parentNode;
        }
        return false;
    },


    /**
     * get the center of all the touches
     * @param   {Array}     touches
     * @returns {Object}    center
     */
    getCenter: function getCenter(touches) {
        var valuesX = [], valuesY = [];

        for(var t= 0,len=touches.length; t<len; t++) {
            valuesX.push(touches[t].pageX);
            valuesY.push(touches[t].pageY);
        }

        return {
            pageX: ((Math.min.apply(Math, valuesX) + Math.max.apply(Math, valuesX)) / 2),
            pageY: ((Math.min.apply(Math, valuesY) + Math.max.apply(Math, valuesY)) / 2)
        };
    },


    /**
     * calculate the velocity between two points
     * @param   {Number}    delta_time
     * @param   {Number}    delta_x
     * @param   {Number}    delta_y
     * @returns {Object}    velocity
     */
    getVelocity: function getVelocity(delta_time, delta_x, delta_y) {
        return {
            x: Math.abs(delta_x / delta_time) || 0,
            y: Math.abs(delta_y / delta_time) || 0
        };
    },


    /**
     * calculate the angle between two coordinates
     * @param   {Touch}     touch1
     * @param   {Touch}     touch2
     * @returns {Number}    angle
     */
    getAngle: function getAngle(touch1, touch2) {
        var y = touch2.pageY - touch1.pageY,
            x = touch2.pageX - touch1.pageX;
        return Math.atan2(y, x) * 180 / Math.PI;
    },


    /**
     * angle to direction define
     * @param   {Touch}     touch1
     * @param   {Touch}     touch2
     * @returns {String}    direction constant, like Hammer.DIRECTION_LEFT
     */
    getDirection: function getDirection(touch1, touch2) {
        var x = Math.abs(touch1.pageX - touch2.pageX),
            y = Math.abs(touch1.pageY - touch2.pageY);

        if(x >= y) {
            return touch1.pageX - touch2.pageX > 0 ? Hammer.DIRECTION_LEFT : Hammer.DIRECTION_RIGHT;
        }
        else {
            return touch1.pageY - touch2.pageY > 0 ? Hammer.DIRECTION_UP : Hammer.DIRECTION_DOWN;
        }
    },


    /**
     * calculate the distance between two touches
     * @param   {Touch}     touch1
     * @param   {Touch}     touch2
     * @returns {Number}    distance
     */
    getDistance: function getDistance(touch1, touch2) {
        var x = touch2.pageX - touch1.pageX,
            y = touch2.pageY - touch1.pageY;
        return Math.sqrt((x*x) + (y*y));
    },


    /**
     * calculate the scale factor between two touchLists (fingers)
     * no scale is 1, and goes down to 0 when pinched together, and bigger when pinched out
     * @param   {Array}     start
     * @param   {Array}     end
     * @returns {Number}    scale
     */
    getScale: function getScale(start, end) {
        // need two fingers...
        if(start.length >= 2 && end.length >= 2) {
            return this.getDistance(end[0], end[1]) /
                this.getDistance(start[0], start[1]);
        }
        return 1;
    },


    /**
     * calculate the rotation degrees between two touchLists (fingers)
     * @param   {Array}     start
     * @param   {Array}     end
     * @returns {Number}    rotation
     */
    getRotation: function getRotation(start, end) {
        // need two fingers
        if(start.length >= 2 && end.length >= 2) {
            return this.getAngle(end[1], end[0]) -
                this.getAngle(start[1], start[0]);
        }
        return 0;
    },


    /**
     * boolean if the direction is vertical
     * @param    {String}    direction
     * @returns  {Boolean}   is_vertical
     */
    isVertical: function isVertical(direction) {
        return (direction == Hammer.DIRECTION_UP || direction == Hammer.DIRECTION_DOWN);
    },


    /**
     * stop browser default behavior with css props
     * @param   {HtmlElement}   element
     * @param   {Object}        css_props
     */
    stopDefaultBrowserBehavior: function stopDefaultBrowserBehavior(element, css_props) {
        var prop,
            vendors = ['webkit','khtml','moz','ms','o',''];

        if(!css_props || !element.style) {
            return;
        }

        // with css properties for modern browsers
        for(var i = 0; i < vendors.length; i++) {
            for(var p in css_props) {
                if(css_props.hasOwnProperty(p)) {
                    prop = p;

                    // vender prefix at the property
                    if(vendors[i]) {
                        prop = vendors[i] + prop.substring(0, 1).toUpperCase() + prop.substring(1);
                    }

                    // set the style
                    element.style[prop] = css_props[p];
                }
            }
        }

        // also the disable onselectstart
        if(css_props.userSelect == 'none') {
            element.onselectstart = function() {
                return false;
            };
        }
    }
};

Hammer.detection = {
    // contains all registred Hammer.gestures in the correct order
    gestures: [],

    // data of the current Hammer.gesture detection session
    current: null,

    // the previous Hammer.gesture session data
    // is a full clone of the previous gesture.current object
    previous: null,

    // when this becomes true, no gestures are fired
    stopped: false,


    /**
     * start Hammer.gesture detection
     * @param   {Hammer.Instance}   inst
     * @param   {Object}            eventData
     */
    startDetect: function startDetect(inst, eventData) {
        // already busy with a Hammer.gesture detection on an element
        if(this.current) {
            return;
        }

        this.stopped = false;

        this.current = {
            inst        : inst, // reference to HammerInstance we're working for
            startEvent  : Hammer.utils.extend({}, eventData), // start eventData for distances, timing etc
            lastEvent   : false, // last eventData
            name        : '' // current gesture we're in/detected, can be 'tap', 'hold' etc
        };

        this.detect(eventData);
    },


    /**
     * Hammer.gesture detection
     * @param   {Object}    eventData
     * @param   {Object}    eventData
     */
    detect: function detect(eventData) {
        if(!this.current || this.stopped) {
            return;
        }

        // extend event data with calculations about scale, distance etc
        eventData = this.extendEventData(eventData);

        // instance options
        var inst_options = this.current.inst.options;

        // call Hammer.gesture handlers
        for(var g=0,len=this.gestures.length; g<len; g++) {
            var gesture = this.gestures[g];

            // only when the instance options have enabled this gesture
            if(!this.stopped && inst_options[gesture.name] !== false) {
                // if a handler returns false, we stop with the detection
                if(gesture.handler.call(gesture, eventData, this.current.inst) === false) {
                    this.stopDetect();
                    break;
                }
            }
        }

        // store as previous event event
        if(this.current) {
            this.current.lastEvent = eventData;
        }

        // endevent, but not the last touch, so dont stop
        if(eventData.eventType == Hammer.EVENT_END && !eventData.touches.length-1) {
            this.stopDetect();
        }

        return eventData;
    },


    /**
     * clear the Hammer.gesture vars
     * this is called on endDetect, but can also be used when a final Hammer.gesture has been detected
     * to stop other Hammer.gestures from being fired
     */
    stopDetect: function stopDetect() {
        // clone current data to the store as the previous gesture
        // used for the double tap gesture, since this is an other gesture detect session
        this.previous = Hammer.utils.extend({}, this.current);

        // reset the current
        this.current = null;

        // stopped!
        this.stopped = true;
    },


    /**
     * extend eventData for Hammer.gestures
     * @param   {Object}   ev
     * @returns {Object}   ev
     */
    extendEventData: function extendEventData(ev) {
        var startEv = this.current.startEvent;

        // if the touches change, set the new touches over the startEvent touches
        // this because touchevents don't have all the touches on touchstart, or the
        // user must place his fingers at the EXACT same time on the screen, which is not realistic
        // but, sometimes it happens that both fingers are touching at the EXACT same time
        if(startEv && (ev.touches.length != startEv.touches.length || ev.touches === startEv.touches)) {
            // extend 1 level deep to get the touchlist with the touch objects
            startEv.touches = [];
            for(var i=0,len=ev.touches.length; i<len; i++) {
                startEv.touches.push(Hammer.utils.extend({}, ev.touches[i]));
            }
        }

        var delta_time = ev.timeStamp - startEv.timeStamp,
            delta_x = ev.center.pageX - startEv.center.pageX,
            delta_y = ev.center.pageY - startEv.center.pageY,
            velocity = Hammer.utils.getVelocity(delta_time, delta_x, delta_y);

        Hammer.utils.extend(ev, {
            deltaTime   : delta_time,

            deltaX      : delta_x,
            deltaY      : delta_y,

            velocityX   : velocity.x,
            velocityY   : velocity.y,

            distance    : Hammer.utils.getDistance(startEv.center, ev.center),
            angle       : Hammer.utils.getAngle(startEv.center, ev.center),
            direction   : Hammer.utils.getDirection(startEv.center, ev.center),

            scale       : Hammer.utils.getScale(startEv.touches, ev.touches),
            rotation    : Hammer.utils.getRotation(startEv.touches, ev.touches),

            startEvent  : startEv
        });

        return ev;
    },


    /**
     * register new gesture
     * @param   {Object}    gesture object, see gestures.js for documentation
     * @returns {Array}     gestures
     */
    register: function register(gesture) {
        // add an enable gesture options if there is no given
        var options = gesture.defaults || {};
        if(options[gesture.name] === undefined) {
            options[gesture.name] = true;
        }

        // extend Hammer default options with the Hammer.gesture options
        Hammer.utils.extend(Hammer.defaults, options, true);

        // set its index
        gesture.index = gesture.index || 1000;

        // add Hammer.gesture to the list
        this.gestures.push(gesture);

        // sort the list by index
        this.gestures.sort(function(a, b) {
            if (a.index < b.index) {
                return -1;
            }
            if (a.index > b.index) {
                return 1;
            }
            return 0;
        });

        return this.gestures;
    }
};


Hammer.gestures = Hammer.gestures || {};

/**
 * Custom gestures
 * ==============================
 *
 * Gesture object
 * --------------------
 * The object structure of a gesture:
 *
 * { name: 'mygesture',
 *   index: 1337,
 *   defaults: {
 *     mygesture_option: true
 *   }
 *   handler: function(type, ev, inst) {
 *     // trigger gesture event
 *     inst.trigger(this.name, ev);
 *   }
 * }

 * @param   {String}    name
 * this should be the name of the gesture, lowercase
 * it is also being used to disable/enable the gesture per instance config.
 *
 * @param   {Number}    [index=1000]
 * the index of the gesture, where it is going to be in the stack of gestures detection
 * like when you build an gesture that depends on the drag gesture, it is a good
 * idea to place it after the index of the drag gesture.
 *
 * @param   {Object}    [defaults={}]
 * the default settings of the gesture. these are added to the instance settings,
 * and can be overruled per instance. you can also add the name of the gesture,
 * but this is also added by default (and set to true).
 *
 * @param   {Function}  handler
 * this handles the gesture detection of your custom gesture and receives the
 * following arguments:
 *
 *      @param  {Object}    eventData
 *      event data containing the following properties:
 *          timeStamp   {Number}        time the event occurred
 *          target      {HTMLElement}   target element
 *          touches     {Array}         touches (fingers, pointers, mouse) on the screen
 *          pointerType {String}        kind of pointer that was used. matches Hammer.POINTER_MOUSE|TOUCH
 *          center      {Object}        center position of the touches. contains pageX and pageY
 *          deltaTime   {Number}        the total time of the touches in the screen
 *          deltaX      {Number}        the delta on x axis we haved moved
 *          deltaY      {Number}        the delta on y axis we haved moved
 *          velocityX   {Number}        the velocity on the x
 *          velocityY   {Number}        the velocity on y
 *          angle       {Number}        the angle we are moving
 *          direction   {String}        the direction we are moving. matches Hammer.DIRECTION_UP|DOWN|LEFT|RIGHT
 *          distance    {Number}        the distance we haved moved
 *          scale       {Number}        scaling of the touches, needs 2 touches
 *          rotation    {Number}        rotation of the touches, needs 2 touches *
 *          eventType   {String}        matches Hammer.EVENT_START|MOVE|END
 *          srcEvent    {Object}        the source event, like TouchStart or MouseDown *
 *          startEvent  {Object}        contains the same properties as above,
 *                                      but from the first touch. this is used to calculate
 *                                      distances, deltaTime, scaling etc
 *
 *      @param  {Hammer.Instance}    inst
 *      the instance we are doing the detection for. you can get the options from
 *      the inst.options object and trigger the gesture event by calling inst.trigger
 *
 *
 * Handle gestures
 * --------------------
 * inside the handler you can get/set Hammer.detection.current. This is the current
 * detection session. It has the following properties
 *      @param  {String}    name
 *      contains the name of the gesture we have detected. it has not a real function,
 *      only to check in other gestures if something is detected.
 *      like in the drag gesture we set it to 'drag' and in the swipe gesture we can
 *      check if the current gesture is 'drag' by accessing Hammer.detection.current.name
 *
 *      @readonly
 *      @param  {Hammer.Instance}    inst
 *      the instance we do the detection for
 *
 *      @readonly
 *      @param  {Object}    startEvent
 *      contains the properties of the first gesture detection in this session.
 *      Used for calculations about timing, distance, etc.
 *
 *      @readonly
 *      @param  {Object}    lastEvent
 *      contains all the properties of the last gesture detect in this session.
 *
 * after the gesture detection session has been completed (user has released the screen)
 * the Hammer.detection.current object is copied into Hammer.detection.previous,
 * this is usefull for gestures like doubletap, where you need to know if the
 * previous gesture was a tap
 *
 * options that have been set by the instance can be received by calling inst.options
 *
 * You can trigger a gesture event by calling inst.trigger("mygesture", event).
 * The first param is the name of your gesture, the second the event argument
 *
 *
 * Register gestures
 * --------------------
 * When an gesture is added to the Hammer.gestures object, it is auto registered
 * at the setup of the first Hammer instance. You can also call Hammer.detection.register
 * manually and pass your gesture object as a param
 *
 */

/**
 * Hold
 * Touch stays at the same place for x time
 * @events  hold
 */
Hammer.gestures.Hold = {
    name: 'hold',
    index: 10,
    defaults: {
        hold_timeout	: 500,
        hold_threshold	: 1
    },
    timer: null,
    handler: function holdGesture(ev, inst) {
        switch(ev.eventType) {
            case Hammer.EVENT_START:
                // clear any running timers
                clearTimeout(this.timer);

                // set the gesture so we can check in the timeout if it still is
                Hammer.detection.current.name = this.name;

                // set timer and if after the timeout it still is hold,
                // we trigger the hold event
                this.timer = setTimeout(function() {
                    if(Hammer.detection.current.name == 'hold') {
                        inst.trigger('hold', ev);
                    }
                }, inst.options.hold_timeout);
                break;

            // when you move or end we clear the timer
            case Hammer.EVENT_MOVE:
                if(ev.distance > inst.options.hold_threshold) {
                    clearTimeout(this.timer);
                }
                break;

            case Hammer.EVENT_END:
                clearTimeout(this.timer);
                break;
        }
    }
};


/**
 * Tap/DoubleTap
 * Quick touch at a place or double at the same place
 * @events  tap, doubletap
 */
Hammer.gestures.Tap = {
    name: 'tap',
    index: 100,
    defaults: {
        tap_max_touchtime	: 250,
        tap_max_distance	: 10,
		tap_always			: true,
        doubletap_distance	: 20,
        doubletap_interval	: 300
    },
    handler: function tapGesture(ev, inst) {
        if(ev.eventType == Hammer.EVENT_END) {
            // previous gesture, for the double tap since these are two different gesture detections
            var prev = Hammer.detection.previous,
				did_doubletap = false;

            // when the touchtime is higher then the max touch time
            // or when the moving distance is too much
            if(ev.deltaTime > inst.options.tap_max_touchtime ||
                ev.distance > inst.options.tap_max_distance) {
                return;
            }

            // check if double tap
            if(prev && prev.name == 'tap' &&
                (ev.timeStamp - prev.lastEvent.timeStamp) < inst.options.doubletap_interval &&
                ev.distance < inst.options.doubletap_distance) {
				inst.trigger('doubletap', ev);
				did_doubletap = true;
            }

			// do a single tap
			if(!did_doubletap || inst.options.tap_always) {
				Hammer.detection.current.name = 'tap';
				inst.trigger(Hammer.detection.current.name, ev);
			}
        }
    }
};


/**
 * Swipe
 * triggers swipe events when the end velocity is above the threshold
 * @events  swipe, swipeleft, swiperight, swipeup, swipedown
 */
Hammer.gestures.Swipe = {
    name: 'swipe',
    index: 40,
    defaults: {
        // set 0 for unlimited, but this can conflict with transform
        swipe_max_touches  : 1,
        swipe_velocity     : 0.7
    },
    handler: function swipeGesture(ev, inst) {
        if(ev.eventType == Hammer.EVENT_END) {
            // max touches
            if(inst.options.swipe_max_touches > 0 &&
                ev.touches.length > inst.options.swipe_max_touches) {
                return;
            }

            // when the distance we moved is too small we skip this gesture
            // or we can be already in dragging
            if(ev.velocityX > inst.options.swipe_velocity ||
                ev.velocityY > inst.options.swipe_velocity) {
                // trigger swipe events
                inst.trigger(this.name, ev);
                inst.trigger(this.name + ev.direction, ev);
            }
        }
    }
};


/**
 * Drag
 * Move with x fingers (default 1) around on the page. Blocking the scrolling when
 * moving left and right is a good practice. When all the drag events are blocking
 * you disable scrolling on that area.
 * @events  drag, drapleft, dragright, dragup, dragdown
 */
Hammer.gestures.Drag = {
    name: 'drag',
    index: 50,
    defaults: {
        drag_min_distance : 10,
        // set 0 for unlimited, but this can conflict with transform
        drag_max_touches  : 1,
        // prevent default browser behavior when dragging occurs
        // be careful with it, it makes the element a blocking element
        // when you are using the drag gesture, it is a good practice to set this true
        drag_block_horizontal   : false,
        drag_block_vertical     : false,
        // drag_lock_to_axis keeps the drag gesture on the axis that it started on,
        // It disallows vertical directions if the initial direction was horizontal, and vice versa.
        drag_lock_to_axis       : false,
        // drag lock only kicks in when distance > drag_lock_min_distance
        // This way, locking occurs only when the distance has become large enough to reliably determine the direction
        drag_lock_min_distance : 25
    },
    triggered: false,
    handler: function dragGesture(ev, inst) {
        // current gesture isnt drag, but dragged is true
        // this means an other gesture is busy. now call dragend
        if(Hammer.detection.current.name != this.name && this.triggered) {
            inst.trigger(this.name +'end', ev);
            this.triggered = false;
            return;
        }

        // max touches
        if(inst.options.drag_max_touches > 0 &&
            ev.touches.length > inst.options.drag_max_touches) {
            return;
        }

        switch(ev.eventType) {
            case Hammer.EVENT_START:
                this.triggered = false;
                break;

            case Hammer.EVENT_MOVE:
                // when the distance we moved is too small we skip this gesture
                // or we can be already in dragging
                if(ev.distance < inst.options.drag_min_distance &&
                    Hammer.detection.current.name != this.name) {
                    return;
                }

                // we are dragging!
                Hammer.detection.current.name = this.name;

                // lock drag to axis?
                if(Hammer.detection.current.lastEvent.drag_locked_to_axis || (inst.options.drag_lock_to_axis && inst.options.drag_lock_min_distance<=ev.distance)) {
                    ev.drag_locked_to_axis = true;
                }
                var last_direction = Hammer.detection.current.lastEvent.direction;
                if(ev.drag_locked_to_axis && last_direction !== ev.direction) {
                    // keep direction on the axis that the drag gesture started on
                    if(Hammer.utils.isVertical(last_direction)) {
                        ev.direction = (ev.deltaY < 0) ? Hammer.DIRECTION_UP : Hammer.DIRECTION_DOWN;
                    }
                    else {
                        ev.direction = (ev.deltaX < 0) ? Hammer.DIRECTION_LEFT : Hammer.DIRECTION_RIGHT;
                    }
                }

                // first time, trigger dragstart event
                if(!this.triggered) {
                    inst.trigger(this.name +'start', ev);
                    this.triggered = true;
                }

                // trigger normal event
                inst.trigger(this.name, ev);

                // direction event, like dragdown
                inst.trigger(this.name + ev.direction, ev);

                // block the browser events
                if( (inst.options.drag_block_vertical && Hammer.utils.isVertical(ev.direction)) ||
                    (inst.options.drag_block_horizontal && !Hammer.utils.isVertical(ev.direction))) {
                    ev.preventDefault();
                }
                break;

            case Hammer.EVENT_END:
                // trigger dragend
                if(this.triggered) {
                    inst.trigger(this.name +'end', ev);
                }

                this.triggered = false;
                break;
        }
    }
};


/**
 * Transform
 * User want to scale or rotate with 2 fingers
 * @events  transform, pinch, pinchin, pinchout, rotate
 */
Hammer.gestures.Transform = {
    name: 'transform',
    index: 45,
    defaults: {
        // factor, no scale is 1, zoomin is to 0 and zoomout until higher then 1
        transform_min_scale     : 0.01,
        // rotation in degrees
        transform_min_rotation  : 1,
        // prevent default browser behavior when two touches are on the screen
        // but it makes the element a blocking element
        // when you are using the transform gesture, it is a good practice to set this true
        transform_always_block  : false
    },
    triggered: false,
    handler: function transformGesture(ev, inst) {
        // current gesture isnt drag, but dragged is true
        // this means an other gesture is busy. now call dragend
        if(Hammer.detection.current.name != this.name && this.triggered) {
            inst.trigger(this.name +'end', ev);
            this.triggered = false;
            return;
        }

        // atleast multitouch
        if(ev.touches.length < 2) {
            return;
        }

        // prevent default when two fingers are on the screen
        if(inst.options.transform_always_block) {
            ev.preventDefault();
        }

        switch(ev.eventType) {
            case Hammer.EVENT_START:
                this.triggered = false;
                break;

            case Hammer.EVENT_MOVE:
                var scale_threshold = Math.abs(1-ev.scale);
                var rotation_threshold = Math.abs(ev.rotation);

                // when the distance we moved is too small we skip this gesture
                // or we can be already in dragging
                if(scale_threshold < inst.options.transform_min_scale &&
                    rotation_threshold < inst.options.transform_min_rotation) {
                    return;
                }

                // we are transforming!
                Hammer.detection.current.name = this.name;

                // first time, trigger dragstart event
                if(!this.triggered) {
                    inst.trigger(this.name +'start', ev);
                    this.triggered = true;
                }

                inst.trigger(this.name, ev); // basic transform event

                // trigger rotate event
                if(rotation_threshold > inst.options.transform_min_rotation) {
                    inst.trigger('rotate', ev);
                }

                // trigger pinch event
                if(scale_threshold > inst.options.transform_min_scale) {
                    inst.trigger('pinch', ev);
                    inst.trigger('pinch'+ ((ev.scale < 1) ? 'in' : 'out'), ev);
                }
                break;

            case Hammer.EVENT_END:
                // trigger dragend
                if(this.triggered) {
                    inst.trigger(this.name +'end', ev);
                }

                this.triggered = false;
                break;
        }
    }
};


/**
 * Touch
 * Called as first, tells the user has touched the screen
 * @events  touch
 */
Hammer.gestures.Touch = {
    name: 'touch',
    index: -Infinity,
    defaults: {
        // call preventDefault at touchstart, and makes the element blocking by
        // disabling the scrolling of the page, but it improves gestures like
        // transforming and dragging.
        // be careful with using this, it can be very annoying for users to be stuck
        // on the page
        prevent_default: false,

        // disable mouse events, so only touch (or pen!) input triggers events
        prevent_mouseevents: false
    },
    handler: function touchGesture(ev, inst) {
        if(inst.options.prevent_mouseevents && ev.pointerType == Hammer.POINTER_MOUSE) {
            ev.stopDetect();
            return;
        }

        if(inst.options.prevent_default) {
            ev.preventDefault();
        }

        if(ev.eventType ==  Hammer.EVENT_START) {
            inst.trigger(this.name, ev);
        }
    }
};


/**
 * Release
 * Called as last, tells the user has released the screen
 * @events  release
 */
Hammer.gestures.Release = {
    name: 'release',
    index: Infinity,
    handler: function releaseGesture(ev, inst) {
        if(ev.eventType ==  Hammer.EVENT_END) {
            inst.trigger(this.name, ev);
        }
    }
};

// node export
if(typeof module === 'object' && typeof module.exports === 'object'){
    module.exports = Hammer;
}
// just window export
else {
    window.Hammer = Hammer;

    // requireJS module definition
    if(typeof window.define === 'function' && window.define.amd) {
        window.define('hammer', [], function() {
            return Hammer;
        });
    }
}
})(this);
},{}],27:[function(require,module,exports){
//! moment.js
//! version : 2.5.1
//! authors : Tim Wood, Iskren Chernev, Moment.js contributors
//! license : MIT
//! momentjs.com

(function (undefined) {

    /************************************
        Constants
    ************************************/

    var moment,
        VERSION = "2.5.1",
        global = this,
        round = Math.round,
        i,

        YEAR = 0,
        MONTH = 1,
        DATE = 2,
        HOUR = 3,
        MINUTE = 4,
        SECOND = 5,
        MILLISECOND = 6,

        // internal storage for language config files
        languages = {},

        // moment internal properties
        momentProperties = {
            _isAMomentObject: null,
            _i : null,
            _f : null,
            _l : null,
            _strict : null,
            _isUTC : null,
            _offset : null,  // optional. Combine with _isUTC
            _pf : null,
            _lang : null  // optional
        },

        // check for nodeJS
        hasModule = (typeof module !== 'undefined' && module.exports && typeof require !== 'undefined'),

        // ASP.NET json date format regex
        aspNetJsonRegex = /^\/?Date\((\-?\d+)/i,
        aspNetTimeSpanJsonRegex = /(\-)?(?:(\d*)\.)?(\d+)\:(\d+)(?:\:(\d+)\.?(\d{3})?)?/,

        // from http://docs.closure-library.googlecode.com/git/closure_goog_date_date.js.source.html
        // somewhat more in line with 4.4.3.2 2004 spec, but allows decimal anywhere
        isoDurationRegex = /^(-)?P(?:(?:([0-9,.]*)Y)?(?:([0-9,.]*)M)?(?:([0-9,.]*)D)?(?:T(?:([0-9,.]*)H)?(?:([0-9,.]*)M)?(?:([0-9,.]*)S)?)?|([0-9,.]*)W)$/,

        // format tokens
        formattingTokens = /(\[[^\[]*\])|(\\)?(Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|YYYYYY|YYYYY|YYYY|YY|gg(ggg?)?|GG(GGG?)?|e|E|a|A|hh?|HH?|mm?|ss?|S{1,4}|X|zz?|ZZ?|.)/g,
        localFormattingTokens = /(\[[^\[]*\])|(\\)?(LT|LL?L?L?|l{1,4})/g,

        // parsing token regexes
        parseTokenOneOrTwoDigits = /\d\d?/, // 0 - 99
        parseTokenOneToThreeDigits = /\d{1,3}/, // 0 - 999
        parseTokenOneToFourDigits = /\d{1,4}/, // 0 - 9999
        parseTokenOneToSixDigits = /[+\-]?\d{1,6}/, // -999,999 - 999,999
        parseTokenDigits = /\d+/, // nonzero number of digits
        parseTokenWord = /[0-9]*['a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+|[\u0600-\u06FF\/]+(\s*?[\u0600-\u06FF]+){1,2}/i, // any word (or two) characters or numbers including two/three word month in arabic.
        parseTokenTimezone = /Z|[\+\-]\d\d:?\d\d/gi, // +00:00 -00:00 +0000 -0000 or Z
        parseTokenT = /T/i, // T (ISO separator)
        parseTokenTimestampMs = /[\+\-]?\d+(\.\d{1,3})?/, // 123456789 123456789.123

        //strict parsing regexes
        parseTokenOneDigit = /\d/, // 0 - 9
        parseTokenTwoDigits = /\d\d/, // 00 - 99
        parseTokenThreeDigits = /\d{3}/, // 000 - 999
        parseTokenFourDigits = /\d{4}/, // 0000 - 9999
        parseTokenSixDigits = /[+-]?\d{6}/, // -999,999 - 999,999
        parseTokenSignedNumber = /[+-]?\d+/, // -inf - inf

        // iso 8601 regex
        // 0000-00-00 0000-W00 or 0000-W00-0 + T + 00 or 00:00 or 00:00:00 or 00:00:00.000 + +00:00 or +0000 or +00)
        isoRegex = /^\s*(?:[+-]\d{6}|\d{4})-(?:(\d\d-\d\d)|(W\d\d$)|(W\d\d-\d)|(\d\d\d))((T| )(\d\d(:\d\d(:\d\d(\.\d+)?)?)?)?([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?$/,

        isoFormat = 'YYYY-MM-DDTHH:mm:ssZ',

        isoDates = [
            ['YYYYYY-MM-DD', /[+-]\d{6}-\d{2}-\d{2}/],
            ['YYYY-MM-DD', /\d{4}-\d{2}-\d{2}/],
            ['GGGG-[W]WW-E', /\d{4}-W\d{2}-\d/],
            ['GGGG-[W]WW', /\d{4}-W\d{2}/],
            ['YYYY-DDD', /\d{4}-\d{3}/]
        ],

        // iso time formats and regexes
        isoTimes = [
            ['HH:mm:ss.SSSS', /(T| )\d\d:\d\d:\d\d\.\d{1,3}/],
            ['HH:mm:ss', /(T| )\d\d:\d\d:\d\d/],
            ['HH:mm', /(T| )\d\d:\d\d/],
            ['HH', /(T| )\d\d/]
        ],

        // timezone chunker "+10:00" > ["10", "00"] or "-1530" > ["-15", "30"]
        parseTimezoneChunker = /([\+\-]|\d\d)/gi,

        // getter and setter names
        proxyGettersAndSetters = 'Date|Hours|Minutes|Seconds|Milliseconds'.split('|'),
        unitMillisecondFactors = {
            'Milliseconds' : 1,
            'Seconds' : 1e3,
            'Minutes' : 6e4,
            'Hours' : 36e5,
            'Days' : 864e5,
            'Months' : 2592e6,
            'Years' : 31536e6
        },

        unitAliases = {
            ms : 'millisecond',
            s : 'second',
            m : 'minute',
            h : 'hour',
            d : 'day',
            D : 'date',
            w : 'week',
            W : 'isoWeek',
            M : 'month',
            y : 'year',
            DDD : 'dayOfYear',
            e : 'weekday',
            E : 'isoWeekday',
            gg: 'weekYear',
            GG: 'isoWeekYear'
        },

        camelFunctions = {
            dayofyear : 'dayOfYear',
            isoweekday : 'isoWeekday',
            isoweek : 'isoWeek',
            weekyear : 'weekYear',
            isoweekyear : 'isoWeekYear'
        },

        // format function strings
        formatFunctions = {},

        // tokens to ordinalize and pad
        ordinalizeTokens = 'DDD w W M D d'.split(' '),
        paddedTokens = 'M D H h m s w W'.split(' '),

        formatTokenFunctions = {
            M    : function () {
                return this.month() + 1;
            },
            MMM  : function (format) {
                return this.lang().monthsShort(this, format);
            },
            MMMM : function (format) {
                return this.lang().months(this, format);
            },
            D    : function () {
                return this.date();
            },
            DDD  : function () {
                return this.dayOfYear();
            },
            d    : function () {
                return this.day();
            },
            dd   : function (format) {
                return this.lang().weekdaysMin(this, format);
            },
            ddd  : function (format) {
                return this.lang().weekdaysShort(this, format);
            },
            dddd : function (format) {
                return this.lang().weekdays(this, format);
            },
            w    : function () {
                return this.week();
            },
            W    : function () {
                return this.isoWeek();
            },
            YY   : function () {
                return leftZeroFill(this.year() % 100, 2);
            },
            YYYY : function () {
                return leftZeroFill(this.year(), 4);
            },
            YYYYY : function () {
                return leftZeroFill(this.year(), 5);
            },
            YYYYYY : function () {
                var y = this.year(), sign = y >= 0 ? '+' : '-';
                return sign + leftZeroFill(Math.abs(y), 6);
            },
            gg   : function () {
                return leftZeroFill(this.weekYear() % 100, 2);
            },
            gggg : function () {
                return leftZeroFill(this.weekYear(), 4);
            },
            ggggg : function () {
                return leftZeroFill(this.weekYear(), 5);
            },
            GG   : function () {
                return leftZeroFill(this.isoWeekYear() % 100, 2);
            },
            GGGG : function () {
                return leftZeroFill(this.isoWeekYear(), 4);
            },
            GGGGG : function () {
                return leftZeroFill(this.isoWeekYear(), 5);
            },
            e : function () {
                return this.weekday();
            },
            E : function () {
                return this.isoWeekday();
            },
            a    : function () {
                return this.lang().meridiem(this.hours(), this.minutes(), true);
            },
            A    : function () {
                return this.lang().meridiem(this.hours(), this.minutes(), false);
            },
            H    : function () {
                return this.hours();
            },
            h    : function () {
                return this.hours() % 12 || 12;
            },
            m    : function () {
                return this.minutes();
            },
            s    : function () {
                return this.seconds();
            },
            S    : function () {
                return toInt(this.milliseconds() / 100);
            },
            SS   : function () {
                return leftZeroFill(toInt(this.milliseconds() / 10), 2);
            },
            SSS  : function () {
                return leftZeroFill(this.milliseconds(), 3);
            },
            SSSS : function () {
                return leftZeroFill(this.milliseconds(), 3);
            },
            Z    : function () {
                var a = -this.zone(),
                    b = "+";
                if (a < 0) {
                    a = -a;
                    b = "-";
                }
                return b + leftZeroFill(toInt(a / 60), 2) + ":" + leftZeroFill(toInt(a) % 60, 2);
            },
            ZZ   : function () {
                var a = -this.zone(),
                    b = "+";
                if (a < 0) {
                    a = -a;
                    b = "-";
                }
                return b + leftZeroFill(toInt(a / 60), 2) + leftZeroFill(toInt(a) % 60, 2);
            },
            z : function () {
                return this.zoneAbbr();
            },
            zz : function () {
                return this.zoneName();
            },
            X    : function () {
                return this.unix();
            },
            Q : function () {
                return this.quarter();
            }
        },

        lists = ['months', 'monthsShort', 'weekdays', 'weekdaysShort', 'weekdaysMin'];

    function defaultParsingFlags() {
        // We need to deep clone this object, and es5 standard is not very
        // helpful.
        return {
            empty : false,
            unusedTokens : [],
            unusedInput : [],
            overflow : -2,
            charsLeftOver : 0,
            nullInput : false,
            invalidMonth : null,
            invalidFormat : false,
            userInvalidated : false,
            iso: false
        };
    }

    function padToken(func, count) {
        return function (a) {
            return leftZeroFill(func.call(this, a), count);
        };
    }
    function ordinalizeToken(func, period) {
        return function (a) {
            return this.lang().ordinal(func.call(this, a), period);
        };
    }

    while (ordinalizeTokens.length) {
        i = ordinalizeTokens.pop();
        formatTokenFunctions[i + 'o'] = ordinalizeToken(formatTokenFunctions[i], i);
    }
    while (paddedTokens.length) {
        i = paddedTokens.pop();
        formatTokenFunctions[i + i] = padToken(formatTokenFunctions[i], 2);
    }
    formatTokenFunctions.DDDD = padToken(formatTokenFunctions.DDD, 3);


    /************************************
        Constructors
    ************************************/

    function Language() {

    }

    // Moment prototype object
    function Moment(config) {
        checkOverflow(config);
        extend(this, config);
    }

    // Duration Constructor
    function Duration(duration) {
        var normalizedInput = normalizeObjectUnits(duration),
            years = normalizedInput.year || 0,
            months = normalizedInput.month || 0,
            weeks = normalizedInput.week || 0,
            days = normalizedInput.day || 0,
            hours = normalizedInput.hour || 0,
            minutes = normalizedInput.minute || 0,
            seconds = normalizedInput.second || 0,
            milliseconds = normalizedInput.millisecond || 0;

        // representation for dateAddRemove
        this._milliseconds = +milliseconds +
            seconds * 1e3 + // 1000
            minutes * 6e4 + // 1000 * 60
            hours * 36e5; // 1000 * 60 * 60
        // Because of dateAddRemove treats 24 hours as different from a
        // day when working around DST, we need to store them separately
        this._days = +days +
            weeks * 7;
        // It is impossible translate months into days without knowing
        // which months you are are talking about, so we have to store
        // it separately.
        this._months = +months +
            years * 12;

        this._data = {};

        this._bubble();
    }

    /************************************
        Helpers
    ************************************/


    function extend(a, b) {
        for (var i in b) {
            if (b.hasOwnProperty(i)) {
                a[i] = b[i];
            }
        }

        if (b.hasOwnProperty("toString")) {
            a.toString = b.toString;
        }

        if (b.hasOwnProperty("valueOf")) {
            a.valueOf = b.valueOf;
        }

        return a;
    }

    function cloneMoment(m) {
        var result = {}, i;
        for (i in m) {
            if (m.hasOwnProperty(i) && momentProperties.hasOwnProperty(i)) {
                result[i] = m[i];
            }
        }

        return result;
    }

    function absRound(number) {
        if (number < 0) {
            return Math.ceil(number);
        } else {
            return Math.floor(number);
        }
    }

    // left zero fill a number
    // see http://jsperf.com/left-zero-filling for performance comparison
    function leftZeroFill(number, targetLength, forceSign) {
        var output = '' + Math.abs(number),
            sign = number >= 0;

        while (output.length < targetLength) {
            output = '0' + output;
        }
        return (sign ? (forceSign ? '+' : '') : '-') + output;
    }

    // helper function for _.addTime and _.subtractTime
    function addOrSubtractDurationFromMoment(mom, duration, isAdding, ignoreUpdateOffset) {
        var milliseconds = duration._milliseconds,
            days = duration._days,
            months = duration._months,
            minutes,
            hours;

        if (milliseconds) {
            mom._d.setTime(+mom._d + milliseconds * isAdding);
        }
        // store the minutes and hours so we can restore them
        if (days || months) {
            minutes = mom.minute();
            hours = mom.hour();
        }
        if (days) {
            mom.date(mom.date() + days * isAdding);
        }
        if (months) {
            mom.month(mom.month() + months * isAdding);
        }
        if (milliseconds && !ignoreUpdateOffset) {
            moment.updateOffset(mom);
        }
        // restore the minutes and hours after possibly changing dst
        if (days || months) {
            mom.minute(minutes);
            mom.hour(hours);
        }
    }

    // check if is an array
    function isArray(input) {
        return Object.prototype.toString.call(input) === '[object Array]';
    }

    function isDate(input) {
        return  Object.prototype.toString.call(input) === '[object Date]' ||
                input instanceof Date;
    }

    // compare two arrays, return the number of differences
    function compareArrays(array1, array2, dontConvert) {
        var len = Math.min(array1.length, array2.length),
            lengthDiff = Math.abs(array1.length - array2.length),
            diffs = 0,
            i;
        for (i = 0; i < len; i++) {
            if ((dontConvert && array1[i] !== array2[i]) ||
                (!dontConvert && toInt(array1[i]) !== toInt(array2[i]))) {
                diffs++;
            }
        }
        return diffs + lengthDiff;
    }

    function normalizeUnits(units) {
        if (units) {
            var lowered = units.toLowerCase().replace(/(.)s$/, '$1');
            units = unitAliases[units] || camelFunctions[lowered] || lowered;
        }
        return units;
    }

    function normalizeObjectUnits(inputObject) {
        var normalizedInput = {},
            normalizedProp,
            prop;

        for (prop in inputObject) {
            if (inputObject.hasOwnProperty(prop)) {
                normalizedProp = normalizeUnits(prop);
                if (normalizedProp) {
                    normalizedInput[normalizedProp] = inputObject[prop];
                }
            }
        }

        return normalizedInput;
    }

    function makeList(field) {
        var count, setter;

        if (field.indexOf('week') === 0) {
            count = 7;
            setter = 'day';
        }
        else if (field.indexOf('month') === 0) {
            count = 12;
            setter = 'month';
        }
        else {
            return;
        }

        moment[field] = function (format, index) {
            var i, getter,
                method = moment.fn._lang[field],
                results = [];

            if (typeof format === 'number') {
                index = format;
                format = undefined;
            }

            getter = function (i) {
                var m = moment().utc().set(setter, i);
                return method.call(moment.fn._lang, m, format || '');
            };

            if (index != null) {
                return getter(index);
            }
            else {
                for (i = 0; i < count; i++) {
                    results.push(getter(i));
                }
                return results;
            }
        };
    }

    function toInt(argumentForCoercion) {
        var coercedNumber = +argumentForCoercion,
            value = 0;

        if (coercedNumber !== 0 && isFinite(coercedNumber)) {
            if (coercedNumber >= 0) {
                value = Math.floor(coercedNumber);
            } else {
                value = Math.ceil(coercedNumber);
            }
        }

        return value;
    }

    function daysInMonth(year, month) {
        return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    }

    function daysInYear(year) {
        return isLeapYear(year) ? 366 : 365;
    }

    function isLeapYear(year) {
        return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    }

    function checkOverflow(m) {
        var overflow;
        if (m._a && m._pf.overflow === -2) {
            overflow =
                m._a[MONTH] < 0 || m._a[MONTH] > 11 ? MONTH :
                m._a[DATE] < 1 || m._a[DATE] > daysInMonth(m._a[YEAR], m._a[MONTH]) ? DATE :
                m._a[HOUR] < 0 || m._a[HOUR] > 23 ? HOUR :
                m._a[MINUTE] < 0 || m._a[MINUTE] > 59 ? MINUTE :
                m._a[SECOND] < 0 || m._a[SECOND] > 59 ? SECOND :
                m._a[MILLISECOND] < 0 || m._a[MILLISECOND] > 999 ? MILLISECOND :
                -1;

            if (m._pf._overflowDayOfYear && (overflow < YEAR || overflow > DATE)) {
                overflow = DATE;
            }

            m._pf.overflow = overflow;
        }
    }

    function isValid(m) {
        if (m._isValid == null) {
            m._isValid = !isNaN(m._d.getTime()) &&
                m._pf.overflow < 0 &&
                !m._pf.empty &&
                !m._pf.invalidMonth &&
                !m._pf.nullInput &&
                !m._pf.invalidFormat &&
                !m._pf.userInvalidated;

            if (m._strict) {
                m._isValid = m._isValid &&
                    m._pf.charsLeftOver === 0 &&
                    m._pf.unusedTokens.length === 0;
            }
        }
        return m._isValid;
    }

    function normalizeLanguage(key) {
        return key ? key.toLowerCase().replace('_', '-') : key;
    }

    // Return a moment from input, that is local/utc/zone equivalent to model.
    function makeAs(input, model) {
        return model._isUTC ? moment(input).zone(model._offset || 0) :
            moment(input).local();
    }

    /************************************
        Languages
    ************************************/


    extend(Language.prototype, {

        set : function (config) {
            var prop, i;
            for (i in config) {
                prop = config[i];
                if (typeof prop === 'function') {
                    this[i] = prop;
                } else {
                    this['_' + i] = prop;
                }
            }
        },

        _months : "January_February_March_April_May_June_July_August_September_October_November_December".split("_"),
        months : function (m) {
            return this._months[m.month()];
        },

        _monthsShort : "Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec".split("_"),
        monthsShort : function (m) {
            return this._monthsShort[m.month()];
        },

        monthsParse : function (monthName) {
            var i, mom, regex;

            if (!this._monthsParse) {
                this._monthsParse = [];
            }

            for (i = 0; i < 12; i++) {
                // make the regex if we don't have it already
                if (!this._monthsParse[i]) {
                    mom = moment.utc([2000, i]);
                    regex = '^' + this.months(mom, '') + '|^' + this.monthsShort(mom, '');
                    this._monthsParse[i] = new RegExp(regex.replace('.', ''), 'i');
                }
                // test the regex
                if (this._monthsParse[i].test(monthName)) {
                    return i;
                }
            }
        },

        _weekdays : "Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"),
        weekdays : function (m) {
            return this._weekdays[m.day()];
        },

        _weekdaysShort : "Sun_Mon_Tue_Wed_Thu_Fri_Sat".split("_"),
        weekdaysShort : function (m) {
            return this._weekdaysShort[m.day()];
        },

        _weekdaysMin : "Su_Mo_Tu_We_Th_Fr_Sa".split("_"),
        weekdaysMin : function (m) {
            return this._weekdaysMin[m.day()];
        },

        weekdaysParse : function (weekdayName) {
            var i, mom, regex;

            if (!this._weekdaysParse) {
                this._weekdaysParse = [];
            }

            for (i = 0; i < 7; i++) {
                // make the regex if we don't have it already
                if (!this._weekdaysParse[i]) {
                    mom = moment([2000, 1]).day(i);
                    regex = '^' + this.weekdays(mom, '') + '|^' + this.weekdaysShort(mom, '') + '|^' + this.weekdaysMin(mom, '');
                    this._weekdaysParse[i] = new RegExp(regex.replace('.', ''), 'i');
                }
                // test the regex
                if (this._weekdaysParse[i].test(weekdayName)) {
                    return i;
                }
            }
        },

        _longDateFormat : {
            LT : "h:mm A",
            L : "MM/DD/YYYY",
            LL : "MMMM D YYYY",
            LLL : "MMMM D YYYY LT",
            LLLL : "dddd, MMMM D YYYY LT"
        },
        longDateFormat : function (key) {
            var output = this._longDateFormat[key];
            if (!output && this._longDateFormat[key.toUpperCase()]) {
                output = this._longDateFormat[key.toUpperCase()].replace(/MMMM|MM|DD|dddd/g, function (val) {
                    return val.slice(1);
                });
                this._longDateFormat[key] = output;
            }
            return output;
        },

        isPM : function (input) {
            // IE8 Quirks Mode & IE7 Standards Mode do not allow accessing strings like arrays
            // Using charAt should be more compatible.
            return ((input + '').toLowerCase().charAt(0) === 'p');
        },

        _meridiemParse : /[ap]\.?m?\.?/i,
        meridiem : function (hours, minutes, isLower) {
            if (hours > 11) {
                return isLower ? 'pm' : 'PM';
            } else {
                return isLower ? 'am' : 'AM';
            }
        },

        _calendar : {
            sameDay : '[Today at] LT',
            nextDay : '[Tomorrow at] LT',
            nextWeek : 'dddd [at] LT',
            lastDay : '[Yesterday at] LT',
            lastWeek : '[Last] dddd [at] LT',
            sameElse : 'L'
        },
        calendar : function (key, mom) {
            var output = this._calendar[key];
            return typeof output === 'function' ? output.apply(mom) : output;
        },

        _relativeTime : {
            future : "in %s",
            past : "%s ago",
            s : "a few seconds",
            m : "a minute",
            mm : "%d minutes",
            h : "an hour",
            hh : "%d hours",
            d : "a day",
            dd : "%d days",
            M : "a month",
            MM : "%d months",
            y : "a year",
            yy : "%d years"
        },
        relativeTime : function (number, withoutSuffix, string, isFuture) {
            var output = this._relativeTime[string];
            return (typeof output === 'function') ?
                output(number, withoutSuffix, string, isFuture) :
                output.replace(/%d/i, number);
        },
        pastFuture : function (diff, output) {
            var format = this._relativeTime[diff > 0 ? 'future' : 'past'];
            return typeof format === 'function' ? format(output) : format.replace(/%s/i, output);
        },

        ordinal : function (number) {
            return this._ordinal.replace("%d", number);
        },
        _ordinal : "%d",

        preparse : function (string) {
            return string;
        },

        postformat : function (string) {
            return string;
        },

        week : function (mom) {
            return weekOfYear(mom, this._week.dow, this._week.doy).week;
        },

        _week : {
            dow : 0, // Sunday is the first day of the week.
            doy : 6  // The week that contains Jan 1st is the first week of the year.
        },

        _invalidDate: 'Invalid date',
        invalidDate: function () {
            return this._invalidDate;
        }
    });

    // Loads a language definition into the `languages` cache.  The function
    // takes a key and optionally values.  If not in the browser and no values
    // are provided, it will load the language file module.  As a convenience,
    // this function also returns the language values.
    function loadLang(key, values) {
        values.abbr = key;
        if (!languages[key]) {
            languages[key] = new Language();
        }
        languages[key].set(values);
        return languages[key];
    }

    // Remove a language from the `languages` cache. Mostly useful in tests.
    function unloadLang(key) {
        delete languages[key];
    }

    // Determines which language definition to use and returns it.
    //
    // With no parameters, it will return the global language.  If you
    // pass in a language key, such as 'en', it will return the
    // definition for 'en', so long as 'en' has already been loaded using
    // moment.lang.
    function getLangDefinition(key) {
        var i = 0, j, lang, next, split,
            get = function (k) {
                if (!languages[k] && hasModule) {
                    try {
                        require('./lang/' + k);
                    } catch (e) { }
                }
                return languages[k];
            };

        if (!key) {
            return moment.fn._lang;
        }

        if (!isArray(key)) {
            //short-circuit everything else
            lang = get(key);
            if (lang) {
                return lang;
            }
            key = [key];
        }

        //pick the language from the array
        //try ['en-au', 'en-gb'] as 'en-au', 'en-gb', 'en', as in move through the list trying each
        //substring from most specific to least, but move to the next array item if it's a more specific variant than the current root
        while (i < key.length) {
            split = normalizeLanguage(key[i]).split('-');
            j = split.length;
            next = normalizeLanguage(key[i + 1]);
            next = next ? next.split('-') : null;
            while (j > 0) {
                lang = get(split.slice(0, j).join('-'));
                if (lang) {
                    return lang;
                }
                if (next && next.length >= j && compareArrays(split, next, true) >= j - 1) {
                    //the next array item is better than a shallower substring of this one
                    break;
                }
                j--;
            }
            i++;
        }
        return moment.fn._lang;
    }

    /************************************
        Formatting
    ************************************/


    function removeFormattingTokens(input) {
        if (input.match(/\[[\s\S]/)) {
            return input.replace(/^\[|\]$/g, "");
        }
        return input.replace(/\\/g, "");
    }

    function makeFormatFunction(format) {
        var array = format.match(formattingTokens), i, length;

        for (i = 0, length = array.length; i < length; i++) {
            if (formatTokenFunctions[array[i]]) {
                array[i] = formatTokenFunctions[array[i]];
            } else {
                array[i] = removeFormattingTokens(array[i]);
            }
        }

        return function (mom) {
            var output = "";
            for (i = 0; i < length; i++) {
                output += array[i] instanceof Function ? array[i].call(mom, format) : array[i];
            }
            return output;
        };
    }

    // format date using native date object
    function formatMoment(m, format) {

        if (!m.isValid()) {
            return m.lang().invalidDate();
        }

        format = expandFormat(format, m.lang());

        if (!formatFunctions[format]) {
            formatFunctions[format] = makeFormatFunction(format);
        }

        return formatFunctions[format](m);
    }

    function expandFormat(format, lang) {
        var i = 5;

        function replaceLongDateFormatTokens(input) {
            return lang.longDateFormat(input) || input;
        }

        localFormattingTokens.lastIndex = 0;
        while (i >= 0 && localFormattingTokens.test(format)) {
            format = format.replace(localFormattingTokens, replaceLongDateFormatTokens);
            localFormattingTokens.lastIndex = 0;
            i -= 1;
        }

        return format;
    }


    /************************************
        Parsing
    ************************************/


    // get the regex to find the next token
    function getParseRegexForToken(token, config) {
        var a, strict = config._strict;
        switch (token) {
        case 'DDDD':
            return parseTokenThreeDigits;
        case 'YYYY':
        case 'GGGG':
        case 'gggg':
            return strict ? parseTokenFourDigits : parseTokenOneToFourDigits;
        case 'Y':
        case 'G':
        case 'g':
            return parseTokenSignedNumber;
        case 'YYYYYY':
        case 'YYYYY':
        case 'GGGGG':
        case 'ggggg':
            return strict ? parseTokenSixDigits : parseTokenOneToSixDigits;
        case 'S':
            if (strict) { return parseTokenOneDigit; }
            /* falls through */
        case 'SS':
            if (strict) { return parseTokenTwoDigits; }
            /* falls through */
        case 'SSS':
            if (strict) { return parseTokenThreeDigits; }
            /* falls through */
        case 'DDD':
            return parseTokenOneToThreeDigits;
        case 'MMM':
        case 'MMMM':
        case 'dd':
        case 'ddd':
        case 'dddd':
            return parseTokenWord;
        case 'a':
        case 'A':
            return getLangDefinition(config._l)._meridiemParse;
        case 'X':
            return parseTokenTimestampMs;
        case 'Z':
        case 'ZZ':
            return parseTokenTimezone;
        case 'T':
            return parseTokenT;
        case 'SSSS':
            return parseTokenDigits;
        case 'MM':
        case 'DD':
        case 'YY':
        case 'GG':
        case 'gg':
        case 'HH':
        case 'hh':
        case 'mm':
        case 'ss':
        case 'ww':
        case 'WW':
            return strict ? parseTokenTwoDigits : parseTokenOneOrTwoDigits;
        case 'M':
        case 'D':
        case 'd':
        case 'H':
        case 'h':
        case 'm':
        case 's':
        case 'w':
        case 'W':
        case 'e':
        case 'E':
            return parseTokenOneOrTwoDigits;
        default :
            a = new RegExp(regexpEscape(unescapeFormat(token.replace('\\', '')), "i"));
            return a;
        }
    }

    function timezoneMinutesFromString(string) {
        string = string || "";
        var possibleTzMatches = (string.match(parseTokenTimezone) || []),
            tzChunk = possibleTzMatches[possibleTzMatches.length - 1] || [],
            parts = (tzChunk + '').match(parseTimezoneChunker) || ['-', 0, 0],
            minutes = +(parts[1] * 60) + toInt(parts[2]);

        return parts[0] === '+' ? -minutes : minutes;
    }

    // function to convert string input to date
    function addTimeToArrayFromToken(token, input, config) {
        var a, datePartArray = config._a;

        switch (token) {
        // MONTH
        case 'M' : // fall through to MM
        case 'MM' :
            if (input != null) {
                datePartArray[MONTH] = toInt(input) - 1;
            }
            break;
        case 'MMM' : // fall through to MMMM
        case 'MMMM' :
            a = getLangDefinition(config._l).monthsParse(input);
            // if we didn't find a month name, mark the date as invalid.
            if (a != null) {
                datePartArray[MONTH] = a;
            } else {
                config._pf.invalidMonth = input;
            }
            break;
        // DAY OF MONTH
        case 'D' : // fall through to DD
        case 'DD' :
            if (input != null) {
                datePartArray[DATE] = toInt(input);
            }
            break;
        // DAY OF YEAR
        case 'DDD' : // fall through to DDDD
        case 'DDDD' :
            if (input != null) {
                config._dayOfYear = toInt(input);
            }

            break;
        // YEAR
        case 'YY' :
            datePartArray[YEAR] = toInt(input) + (toInt(input) > 68 ? 1900 : 2000);
            break;
        case 'YYYY' :
        case 'YYYYY' :
        case 'YYYYYY' :
            datePartArray[YEAR] = toInt(input);
            break;
        // AM / PM
        case 'a' : // fall through to A
        case 'A' :
            config._isPm = getLangDefinition(config._l).isPM(input);
            break;
        // 24 HOUR
        case 'H' : // fall through to hh
        case 'HH' : // fall through to hh
        case 'h' : // fall through to hh
        case 'hh' :
            datePartArray[HOUR] = toInt(input);
            break;
        // MINUTE
        case 'm' : // fall through to mm
        case 'mm' :
            datePartArray[MINUTE] = toInt(input);
            break;
        // SECOND
        case 's' : // fall through to ss
        case 'ss' :
            datePartArray[SECOND] = toInt(input);
            break;
        // MILLISECOND
        case 'S' :
        case 'SS' :
        case 'SSS' :
        case 'SSSS' :
            datePartArray[MILLISECOND] = toInt(('0.' + input) * 1000);
            break;
        // UNIX TIMESTAMP WITH MS
        case 'X':
            config._d = new Date(parseFloat(input) * 1000);
            break;
        // TIMEZONE
        case 'Z' : // fall through to ZZ
        case 'ZZ' :
            config._useUTC = true;
            config._tzm = timezoneMinutesFromString(input);
            break;
        case 'w':
        case 'ww':
        case 'W':
        case 'WW':
        case 'd':
        case 'dd':
        case 'ddd':
        case 'dddd':
        case 'e':
        case 'E':
            token = token.substr(0, 1);
            /* falls through */
        case 'gg':
        case 'gggg':
        case 'GG':
        case 'GGGG':
        case 'GGGGG':
            token = token.substr(0, 2);
            if (input) {
                config._w = config._w || {};
                config._w[token] = input;
            }
            break;
        }
    }

    // convert an array to a date.
    // the array should mirror the parameters below
    // note: all values past the year are optional and will default to the lowest possible value.
    // [year, month, day , hour, minute, second, millisecond]
    function dateFromConfig(config) {
        var i, date, input = [], currentDate,
            yearToUse, fixYear, w, temp, lang, weekday, week;

        if (config._d) {
            return;
        }

        currentDate = currentDateArray(config);

        //compute day of the year from weeks and weekdays
        if (config._w && config._a[DATE] == null && config._a[MONTH] == null) {
            fixYear = function (val) {
                var int_val = parseInt(val, 10);
                return val ?
                  (val.length < 3 ? (int_val > 68 ? 1900 + int_val : 2000 + int_val) : int_val) :
                  (config._a[YEAR] == null ? moment().weekYear() : config._a[YEAR]);
            };

            w = config._w;
            if (w.GG != null || w.W != null || w.E != null) {
                temp = dayOfYearFromWeeks(fixYear(w.GG), w.W || 1, w.E, 4, 1);
            }
            else {
                lang = getLangDefinition(config._l);
                weekday = w.d != null ?  parseWeekday(w.d, lang) :
                  (w.e != null ?  parseInt(w.e, 10) + lang._week.dow : 0);

                week = parseInt(w.w, 10) || 1;

                //if we're parsing 'd', then the low day numbers may be next week
                if (w.d != null && weekday < lang._week.dow) {
                    week++;
                }

                temp = dayOfYearFromWeeks(fixYear(w.gg), week, weekday, lang._week.doy, lang._week.dow);
            }

            config._a[YEAR] = temp.year;
            config._dayOfYear = temp.dayOfYear;
        }

        //if the day of the year is set, figure out what it is
        if (config._dayOfYear) {
            yearToUse = config._a[YEAR] == null ? currentDate[YEAR] : config._a[YEAR];

            if (config._dayOfYear > daysInYear(yearToUse)) {
                config._pf._overflowDayOfYear = true;
            }

            date = makeUTCDate(yearToUse, 0, config._dayOfYear);
            config._a[MONTH] = date.getUTCMonth();
            config._a[DATE] = date.getUTCDate();
        }

        // Default to current date.
        // * if no year, month, day of month are given, default to today
        // * if day of month is given, default month and year
        // * if month is given, default only year
        // * if year is given, don't default anything
        for (i = 0; i < 3 && config._a[i] == null; ++i) {
            config._a[i] = input[i] = currentDate[i];
        }

        // Zero out whatever was not defaulted, including time
        for (; i < 7; i++) {
            config._a[i] = input[i] = (config._a[i] == null) ? (i === 2 ? 1 : 0) : config._a[i];
        }

        // add the offsets to the time to be parsed so that we can have a clean array for checking isValid
        input[HOUR] += toInt((config._tzm || 0) / 60);
        input[MINUTE] += toInt((config._tzm || 0) % 60);

        config._d = (config._useUTC ? makeUTCDate : makeDate).apply(null, input);
    }

    function dateFromObject(config) {
        var normalizedInput;

        if (config._d) {
            return;
        }

        normalizedInput = normalizeObjectUnits(config._i);
        config._a = [
            normalizedInput.year,
            normalizedInput.month,
            normalizedInput.day,
            normalizedInput.hour,
            normalizedInput.minute,
            normalizedInput.second,
            normalizedInput.millisecond
        ];

        dateFromConfig(config);
    }

    function currentDateArray(config) {
        var now = new Date();
        if (config._useUTC) {
            return [
                now.getUTCFullYear(),
                now.getUTCMonth(),
                now.getUTCDate()
            ];
        } else {
            return [now.getFullYear(), now.getMonth(), now.getDate()];
        }
    }

    // date from string and format string
    function makeDateFromStringAndFormat(config) {

        config._a = [];
        config._pf.empty = true;

        // This array is used to make a Date, either with `new Date` or `Date.UTC`
        var lang = getLangDefinition(config._l),
            string = '' + config._i,
            i, parsedInput, tokens, token, skipped,
            stringLength = string.length,
            totalParsedInputLength = 0;

        tokens = expandFormat(config._f, lang).match(formattingTokens) || [];

        for (i = 0; i < tokens.length; i++) {
            token = tokens[i];
            parsedInput = (string.match(getParseRegexForToken(token, config)) || [])[0];
            if (parsedInput) {
                skipped = string.substr(0, string.indexOf(parsedInput));
                if (skipped.length > 0) {
                    config._pf.unusedInput.push(skipped);
                }
                string = string.slice(string.indexOf(parsedInput) + parsedInput.length);
                totalParsedInputLength += parsedInput.length;
            }
            // don't parse if it's not a known token
            if (formatTokenFunctions[token]) {
                if (parsedInput) {
                    config._pf.empty = false;
                }
                else {
                    config._pf.unusedTokens.push(token);
                }
                addTimeToArrayFromToken(token, parsedInput, config);
            }
            else if (config._strict && !parsedInput) {
                config._pf.unusedTokens.push(token);
            }
        }

        // add remaining unparsed input length to the string
        config._pf.charsLeftOver = stringLength - totalParsedInputLength;
        if (string.length > 0) {
            config._pf.unusedInput.push(string);
        }

        // handle am pm
        if (config._isPm && config._a[HOUR] < 12) {
            config._a[HOUR] += 12;
        }
        // if is 12 am, change hours to 0
        if (config._isPm === false && config._a[HOUR] === 12) {
            config._a[HOUR] = 0;
        }

        dateFromConfig(config);
        checkOverflow(config);
    }

    function unescapeFormat(s) {
        return s.replace(/\\(\[)|\\(\])|\[([^\]\[]*)\]|\\(.)/g, function (matched, p1, p2, p3, p4) {
            return p1 || p2 || p3 || p4;
        });
    }

    // Code from http://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript
    function regexpEscape(s) {
        return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    }

    // date from string and array of format strings
    function makeDateFromStringAndArray(config) {
        var tempConfig,
            bestMoment,

            scoreToBeat,
            i,
            currentScore;

        if (config._f.length === 0) {
            config._pf.invalidFormat = true;
            config._d = new Date(NaN);
            return;
        }

        for (i = 0; i < config._f.length; i++) {
            currentScore = 0;
            tempConfig = extend({}, config);
            tempConfig._pf = defaultParsingFlags();
            tempConfig._f = config._f[i];
            makeDateFromStringAndFormat(tempConfig);

            if (!isValid(tempConfig)) {
                continue;
            }

            // if there is any input that was not parsed add a penalty for that format
            currentScore += tempConfig._pf.charsLeftOver;

            //or tokens
            currentScore += tempConfig._pf.unusedTokens.length * 10;

            tempConfig._pf.score = currentScore;

            if (scoreToBeat == null || currentScore < scoreToBeat) {
                scoreToBeat = currentScore;
                bestMoment = tempConfig;
            }
        }

        extend(config, bestMoment || tempConfig);
    }

    // date from iso format
    function makeDateFromString(config) {
        var i, l,
            string = config._i,
            match = isoRegex.exec(string);

        if (match) {
            config._pf.iso = true;
            for (i = 0, l = isoDates.length; i < l; i++) {
                if (isoDates[i][1].exec(string)) {
                    // match[5] should be "T" or undefined
                    config._f = isoDates[i][0] + (match[6] || " ");
                    break;
                }
            }
            for (i = 0, l = isoTimes.length; i < l; i++) {
                if (isoTimes[i][1].exec(string)) {
                    config._f += isoTimes[i][0];
                    break;
                }
            }
            if (string.match(parseTokenTimezone)) {
                config._f += "Z";
            }
            makeDateFromStringAndFormat(config);
        }
        else {
            config._d = new Date(string);
        }
    }

    function makeDateFromInput(config) {
        var input = config._i,
            matched = aspNetJsonRegex.exec(input);

        if (input === undefined) {
            config._d = new Date();
        } else if (matched) {
            config._d = new Date(+matched[1]);
        } else if (typeof input === 'string') {
            makeDateFromString(config);
        } else if (isArray(input)) {
            config._a = input.slice(0);
            dateFromConfig(config);
        } else if (isDate(input)) {
            config._d = new Date(+input);
        } else if (typeof(input) === 'object') {
            dateFromObject(config);
        } else {
            config._d = new Date(input);
        }
    }

    function makeDate(y, m, d, h, M, s, ms) {
        //can't just apply() to create a date:
        //http://stackoverflow.com/questions/181348/instantiating-a-javascript-object-by-calling-prototype-constructor-apply
        var date = new Date(y, m, d, h, M, s, ms);

        //the date constructor doesn't accept years < 1970
        if (y < 1970) {
            date.setFullYear(y);
        }
        return date;
    }

    function makeUTCDate(y) {
        var date = new Date(Date.UTC.apply(null, arguments));
        if (y < 1970) {
            date.setUTCFullYear(y);
        }
        return date;
    }

    function parseWeekday(input, language) {
        if (typeof input === 'string') {
            if (!isNaN(input)) {
                input = parseInt(input, 10);
            }
            else {
                input = language.weekdaysParse(input);
                if (typeof input !== 'number') {
                    return null;
                }
            }
        }
        return input;
    }

    /************************************
        Relative Time
    ************************************/


    // helper function for moment.fn.from, moment.fn.fromNow, and moment.duration.fn.humanize
    function substituteTimeAgo(string, number, withoutSuffix, isFuture, lang) {
        return lang.relativeTime(number || 1, !!withoutSuffix, string, isFuture);
    }

    function relativeTime(milliseconds, withoutSuffix, lang) {
        var seconds = round(Math.abs(milliseconds) / 1000),
            minutes = round(seconds / 60),
            hours = round(minutes / 60),
            days = round(hours / 24),
            years = round(days / 365),
            args = seconds < 45 && ['s', seconds] ||
                minutes === 1 && ['m'] ||
                minutes < 45 && ['mm', minutes] ||
                hours === 1 && ['h'] ||
                hours < 22 && ['hh', hours] ||
                days === 1 && ['d'] ||
                days <= 25 && ['dd', days] ||
                days <= 45 && ['M'] ||
                days < 345 && ['MM', round(days / 30)] ||
                years === 1 && ['y'] || ['yy', years];
        args[2] = withoutSuffix;
        args[3] = milliseconds > 0;
        args[4] = lang;
        return substituteTimeAgo.apply({}, args);
    }


    /************************************
        Week of Year
    ************************************/


    // firstDayOfWeek       0 = sun, 6 = sat
    //                      the day of the week that starts the week
    //                      (usually sunday or monday)
    // firstDayOfWeekOfYear 0 = sun, 6 = sat
    //                      the first week is the week that contains the first
    //                      of this day of the week
    //                      (eg. ISO weeks use thursday (4))
    function weekOfYear(mom, firstDayOfWeek, firstDayOfWeekOfYear) {
        var end = firstDayOfWeekOfYear - firstDayOfWeek,
            daysToDayOfWeek = firstDayOfWeekOfYear - mom.day(),
            adjustedMoment;


        if (daysToDayOfWeek > end) {
            daysToDayOfWeek -= 7;
        }

        if (daysToDayOfWeek < end - 7) {
            daysToDayOfWeek += 7;
        }

        adjustedMoment = moment(mom).add('d', daysToDayOfWeek);
        return {
            week: Math.ceil(adjustedMoment.dayOfYear() / 7),
            year: adjustedMoment.year()
        };
    }

    //http://en.wikipedia.org/wiki/ISO_week_date#Calculating_a_date_given_the_year.2C_week_number_and_weekday
    function dayOfYearFromWeeks(year, week, weekday, firstDayOfWeekOfYear, firstDayOfWeek) {
        var d = makeUTCDate(year, 0, 1).getUTCDay(), daysToAdd, dayOfYear;

        weekday = weekday != null ? weekday : firstDayOfWeek;
        daysToAdd = firstDayOfWeek - d + (d > firstDayOfWeekOfYear ? 7 : 0) - (d < firstDayOfWeek ? 7 : 0);
        dayOfYear = 7 * (week - 1) + (weekday - firstDayOfWeek) + daysToAdd + 1;

        return {
            year: dayOfYear > 0 ? year : year - 1,
            dayOfYear: dayOfYear > 0 ?  dayOfYear : daysInYear(year - 1) + dayOfYear
        };
    }

    /************************************
        Top Level Functions
    ************************************/

    function makeMoment(config) {
        var input = config._i,
            format = config._f;

        if (input === null) {
            return moment.invalid({nullInput: true});
        }

        if (typeof input === 'string') {
            config._i = input = getLangDefinition().preparse(input);
        }

        if (moment.isMoment(input)) {
            config = cloneMoment(input);

            config._d = new Date(+input._d);
        } else if (format) {
            if (isArray(format)) {
                makeDateFromStringAndArray(config);
            } else {
                makeDateFromStringAndFormat(config);
            }
        } else {
            makeDateFromInput(config);
        }

        return new Moment(config);
    }

    moment = function (input, format, lang, strict) {
        var c;

        if (typeof(lang) === "boolean") {
            strict = lang;
            lang = undefined;
        }
        // object construction must be done this way.
        // https://github.com/moment/moment/issues/1423
        c = {};
        c._isAMomentObject = true;
        c._i = input;
        c._f = format;
        c._l = lang;
        c._strict = strict;
        c._isUTC = false;
        c._pf = defaultParsingFlags();

        return makeMoment(c);
    };

    // creating with utc
    moment.utc = function (input, format, lang, strict) {
        var c;

        if (typeof(lang) === "boolean") {
            strict = lang;
            lang = undefined;
        }
        // object construction must be done this way.
        // https://github.com/moment/moment/issues/1423
        c = {};
        c._isAMomentObject = true;
        c._useUTC = true;
        c._isUTC = true;
        c._l = lang;
        c._i = input;
        c._f = format;
        c._strict = strict;
        c._pf = defaultParsingFlags();

        return makeMoment(c).utc();
    };

    // creating with unix timestamp (in seconds)
    moment.unix = function (input) {
        return moment(input * 1000);
    };

    // duration
    moment.duration = function (input, key) {
        var duration = input,
            // matching against regexp is expensive, do it on demand
            match = null,
            sign,
            ret,
            parseIso;

        if (moment.isDuration(input)) {
            duration = {
                ms: input._milliseconds,
                d: input._days,
                M: input._months
            };
        } else if (typeof input === 'number') {
            duration = {};
            if (key) {
                duration[key] = input;
            } else {
                duration.milliseconds = input;
            }
        } else if (!!(match = aspNetTimeSpanJsonRegex.exec(input))) {
            sign = (match[1] === "-") ? -1 : 1;
            duration = {
                y: 0,
                d: toInt(match[DATE]) * sign,
                h: toInt(match[HOUR]) * sign,
                m: toInt(match[MINUTE]) * sign,
                s: toInt(match[SECOND]) * sign,
                ms: toInt(match[MILLISECOND]) * sign
            };
        } else if (!!(match = isoDurationRegex.exec(input))) {
            sign = (match[1] === "-") ? -1 : 1;
            parseIso = function (inp) {
                // We'd normally use ~~inp for this, but unfortunately it also
                // converts floats to ints.
                // inp may be undefined, so careful calling replace on it.
                var res = inp && parseFloat(inp.replace(',', '.'));
                // apply sign while we're at it
                return (isNaN(res) ? 0 : res) * sign;
            };
            duration = {
                y: parseIso(match[2]),
                M: parseIso(match[3]),
                d: parseIso(match[4]),
                h: parseIso(match[5]),
                m: parseIso(match[6]),
                s: parseIso(match[7]),
                w: parseIso(match[8])
            };
        }

        ret = new Duration(duration);

        if (moment.isDuration(input) && input.hasOwnProperty('_lang')) {
            ret._lang = input._lang;
        }

        return ret;
    };

    // version number
    moment.version = VERSION;

    // default format
    moment.defaultFormat = isoFormat;

    // This function will be called whenever a moment is mutated.
    // It is intended to keep the offset in sync with the timezone.
    moment.updateOffset = function () {};

    // This function will load languages and then set the global language.  If
    // no arguments are passed in, it will simply return the current global
    // language key.
    moment.lang = function (key, values) {
        var r;
        if (!key) {
            return moment.fn._lang._abbr;
        }
        if (values) {
            loadLang(normalizeLanguage(key), values);
        } else if (values === null) {
            unloadLang(key);
            key = 'en';
        } else if (!languages[key]) {
            getLangDefinition(key);
        }
        r = moment.duration.fn._lang = moment.fn._lang = getLangDefinition(key);
        return r._abbr;
    };

    // returns language data
    moment.langData = function (key) {
        if (key && key._lang && key._lang._abbr) {
            key = key._lang._abbr;
        }
        return getLangDefinition(key);
    };

    // compare moment object
    moment.isMoment = function (obj) {
        return obj instanceof Moment ||
            (obj != null &&  obj.hasOwnProperty('_isAMomentObject'));
    };

    // for typechecking Duration objects
    moment.isDuration = function (obj) {
        return obj instanceof Duration;
    };

    for (i = lists.length - 1; i >= 0; --i) {
        makeList(lists[i]);
    }

    moment.normalizeUnits = function (units) {
        return normalizeUnits(units);
    };

    moment.invalid = function (flags) {
        var m = moment.utc(NaN);
        if (flags != null) {
            extend(m._pf, flags);
        }
        else {
            m._pf.userInvalidated = true;
        }

        return m;
    };

    moment.parseZone = function (input) {
        return moment(input).parseZone();
    };

    /************************************
        Moment Prototype
    ************************************/


    extend(moment.fn = Moment.prototype, {

        clone : function () {
            return moment(this);
        },

        valueOf : function () {
            return +this._d + ((this._offset || 0) * 60000);
        },

        unix : function () {
            return Math.floor(+this / 1000);
        },

        toString : function () {
            return this.clone().lang('en').format("ddd MMM DD YYYY HH:mm:ss [GMT]ZZ");
        },

        toDate : function () {
            return this._offset ? new Date(+this) : this._d;
        },

        toISOString : function () {
            var m = moment(this).utc();
            if (0 < m.year() && m.year() <= 9999) {
                return formatMoment(m, 'YYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
            } else {
                return formatMoment(m, 'YYYYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
            }
        },

        toArray : function () {
            var m = this;
            return [
                m.year(),
                m.month(),
                m.date(),
                m.hours(),
                m.minutes(),
                m.seconds(),
                m.milliseconds()
            ];
        },

        isValid : function () {
            return isValid(this);
        },

        isDSTShifted : function () {

            if (this._a) {
                return this.isValid() && compareArrays(this._a, (this._isUTC ? moment.utc(this._a) : moment(this._a)).toArray()) > 0;
            }

            return false;
        },

        parsingFlags : function () {
            return extend({}, this._pf);
        },

        invalidAt: function () {
            return this._pf.overflow;
        },

        utc : function () {
            return this.zone(0);
        },

        local : function () {
            this.zone(0);
            this._isUTC = false;
            return this;
        },

        format : function (inputString) {
            var output = formatMoment(this, inputString || moment.defaultFormat);
            return this.lang().postformat(output);
        },

        add : function (input, val) {
            var dur;
            // switch args to support add('s', 1) and add(1, 's')
            if (typeof input === 'string') {
                dur = moment.duration(+val, input);
            } else {
                dur = moment.duration(input, val);
            }
            addOrSubtractDurationFromMoment(this, dur, 1);
            return this;
        },

        subtract : function (input, val) {
            var dur;
            // switch args to support subtract('s', 1) and subtract(1, 's')
            if (typeof input === 'string') {
                dur = moment.duration(+val, input);
            } else {
                dur = moment.duration(input, val);
            }
            addOrSubtractDurationFromMoment(this, dur, -1);
            return this;
        },

        diff : function (input, units, asFloat) {
            var that = makeAs(input, this),
                zoneDiff = (this.zone() - that.zone()) * 6e4,
                diff, output;

            units = normalizeUnits(units);

            if (units === 'year' || units === 'month') {
                // average number of days in the months in the given dates
                diff = (this.daysInMonth() + that.daysInMonth()) * 432e5; // 24 * 60 * 60 * 1000 / 2
                // difference in months
                output = ((this.year() - that.year()) * 12) + (this.month() - that.month());
                // adjust by taking difference in days, average number of days
                // and dst in the given months.
                output += ((this - moment(this).startOf('month')) -
                        (that - moment(that).startOf('month'))) / diff;
                // same as above but with zones, to negate all dst
                output -= ((this.zone() - moment(this).startOf('month').zone()) -
                        (that.zone() - moment(that).startOf('month').zone())) * 6e4 / diff;
                if (units === 'year') {
                    output = output / 12;
                }
            } else {
                diff = (this - that);
                output = units === 'second' ? diff / 1e3 : // 1000
                    units === 'minute' ? diff / 6e4 : // 1000 * 60
                    units === 'hour' ? diff / 36e5 : // 1000 * 60 * 60
                    units === 'day' ? (diff - zoneDiff) / 864e5 : // 1000 * 60 * 60 * 24, negate dst
                    units === 'week' ? (diff - zoneDiff) / 6048e5 : // 1000 * 60 * 60 * 24 * 7, negate dst
                    diff;
            }
            return asFloat ? output : absRound(output);
        },

        from : function (time, withoutSuffix) {
            return moment.duration(this.diff(time)).lang(this.lang()._abbr).humanize(!withoutSuffix);
        },

        fromNow : function (withoutSuffix) {
            return this.from(moment(), withoutSuffix);
        },

        calendar : function () {
            // We want to compare the start of today, vs this.
            // Getting start-of-today depends on whether we're zone'd or not.
            var sod = makeAs(moment(), this).startOf('day'),
                diff = this.diff(sod, 'days', true),
                format = diff < -6 ? 'sameElse' :
                    diff < -1 ? 'lastWeek' :
                    diff < 0 ? 'lastDay' :
                    diff < 1 ? 'sameDay' :
                    diff < 2 ? 'nextDay' :
                    diff < 7 ? 'nextWeek' : 'sameElse';
            return this.format(this.lang().calendar(format, this));
        },

        isLeapYear : function () {
            return isLeapYear(this.year());
        },

        isDST : function () {
            return (this.zone() < this.clone().month(0).zone() ||
                this.zone() < this.clone().month(5).zone());
        },

        day : function (input) {
            var day = this._isUTC ? this._d.getUTCDay() : this._d.getDay();
            if (input != null) {
                input = parseWeekday(input, this.lang());
                return this.add({ d : input - day });
            } else {
                return day;
            }
        },

        month : function (input) {
            var utc = this._isUTC ? 'UTC' : '',
                dayOfMonth;

            if (input != null) {
                if (typeof input === 'string') {
                    input = this.lang().monthsParse(input);
                    if (typeof input !== 'number') {
                        return this;
                    }
                }

                dayOfMonth = this.date();
                this.date(1);
                this._d['set' + utc + 'Month'](input);
                this.date(Math.min(dayOfMonth, this.daysInMonth()));

                moment.updateOffset(this);
                return this;
            } else {
                return this._d['get' + utc + 'Month']();
            }
        },

        startOf: function (units) {
            units = normalizeUnits(units);
            // the following switch intentionally omits break keywords
            // to utilize falling through the cases.
            switch (units) {
            case 'year':
                this.month(0);
                /* falls through */
            case 'month':
                this.date(1);
                /* falls through */
            case 'week':
            case 'isoWeek':
            case 'day':
                this.hours(0);
                /* falls through */
            case 'hour':
                this.minutes(0);
                /* falls through */
            case 'minute':
                this.seconds(0);
                /* falls through */
            case 'second':
                this.milliseconds(0);
                /* falls through */
            }

            // weeks are a special case
            if (units === 'week') {
                this.weekday(0);
            } else if (units === 'isoWeek') {
                this.isoWeekday(1);
            }

            return this;
        },

        endOf: function (units) {
            units = normalizeUnits(units);
            return this.startOf(units).add((units === 'isoWeek' ? 'week' : units), 1).subtract('ms', 1);
        },

        isAfter: function (input, units) {
            units = typeof units !== 'undefined' ? units : 'millisecond';
            return +this.clone().startOf(units) > +moment(input).startOf(units);
        },

        isBefore: function (input, units) {
            units = typeof units !== 'undefined' ? units : 'millisecond';
            return +this.clone().startOf(units) < +moment(input).startOf(units);
        },

        isSame: function (input, units) {
            units = units || 'ms';
            return +this.clone().startOf(units) === +makeAs(input, this).startOf(units);
        },

        min: function (other) {
            other = moment.apply(null, arguments);
            return other < this ? this : other;
        },

        max: function (other) {
            other = moment.apply(null, arguments);
            return other > this ? this : other;
        },

        zone : function (input) {
            var offset = this._offset || 0;
            if (input != null) {
                if (typeof input === "string") {
                    input = timezoneMinutesFromString(input);
                }
                if (Math.abs(input) < 16) {
                    input = input * 60;
                }
                this._offset = input;
                this._isUTC = true;
                if (offset !== input) {
                    addOrSubtractDurationFromMoment(this, moment.duration(offset - input, 'm'), 1, true);
                }
            } else {
                return this._isUTC ? offset : this._d.getTimezoneOffset();
            }
            return this;
        },

        zoneAbbr : function () {
            return this._isUTC ? "UTC" : "";
        },

        zoneName : function () {
            return this._isUTC ? "Coordinated Universal Time" : "";
        },

        parseZone : function () {
            if (this._tzm) {
                this.zone(this._tzm);
            } else if (typeof this._i === 'string') {
                this.zone(this._i);
            }
            return this;
        },

        hasAlignedHourOffset : function (input) {
            if (!input) {
                input = 0;
            }
            else {
                input = moment(input).zone();
            }

            return (this.zone() - input) % 60 === 0;
        },

        daysInMonth : function () {
            return daysInMonth(this.year(), this.month());
        },

        dayOfYear : function (input) {
            var dayOfYear = round((moment(this).startOf('day') - moment(this).startOf('year')) / 864e5) + 1;
            return input == null ? dayOfYear : this.add("d", (input - dayOfYear));
        },

        quarter : function () {
            return Math.ceil((this.month() + 1.0) / 3.0);
        },

        weekYear : function (input) {
            var year = weekOfYear(this, this.lang()._week.dow, this.lang()._week.doy).year;
            return input == null ? year : this.add("y", (input - year));
        },

        isoWeekYear : function (input) {
            var year = weekOfYear(this, 1, 4).year;
            return input == null ? year : this.add("y", (input - year));
        },

        week : function (input) {
            var week = this.lang().week(this);
            return input == null ? week : this.add("d", (input - week) * 7);
        },

        isoWeek : function (input) {
            var week = weekOfYear(this, 1, 4).week;
            return input == null ? week : this.add("d", (input - week) * 7);
        },

        weekday : function (input) {
            var weekday = (this.day() + 7 - this.lang()._week.dow) % 7;
            return input == null ? weekday : this.add("d", input - weekday);
        },

        isoWeekday : function (input) {
            // behaves the same as moment#day except
            // as a getter, returns 7 instead of 0 (1-7 range instead of 0-6)
            // as a setter, sunday should belong to the previous week.
            return input == null ? this.day() || 7 : this.day(this.day() % 7 ? input : input - 7);
        },

        get : function (units) {
            units = normalizeUnits(units);
            return this[units]();
        },

        set : function (units, value) {
            units = normalizeUnits(units);
            if (typeof this[units] === 'function') {
                this[units](value);
            }
            return this;
        },

        // If passed a language key, it will set the language for this
        // instance.  Otherwise, it will return the language configuration
        // variables for this instance.
        lang : function (key) {
            if (key === undefined) {
                return this._lang;
            } else {
                this._lang = getLangDefinition(key);
                return this;
            }
        }
    });

    // helper for adding shortcuts
    function makeGetterAndSetter(name, key) {
        moment.fn[name] = moment.fn[name + 's'] = function (input) {
            var utc = this._isUTC ? 'UTC' : '';
            if (input != null) {
                this._d['set' + utc + key](input);
                moment.updateOffset(this);
                return this;
            } else {
                return this._d['get' + utc + key]();
            }
        };
    }

    // loop through and add shortcuts (Month, Date, Hours, Minutes, Seconds, Milliseconds)
    for (i = 0; i < proxyGettersAndSetters.length; i ++) {
        makeGetterAndSetter(proxyGettersAndSetters[i].toLowerCase().replace(/s$/, ''), proxyGettersAndSetters[i]);
    }

    // add shortcut for year (uses different syntax than the getter/setter 'year' == 'FullYear')
    makeGetterAndSetter('year', 'FullYear');

    // add plural methods
    moment.fn.days = moment.fn.day;
    moment.fn.months = moment.fn.month;
    moment.fn.weeks = moment.fn.week;
    moment.fn.isoWeeks = moment.fn.isoWeek;

    // add aliased format methods
    moment.fn.toJSON = moment.fn.toISOString;

    /************************************
        Duration Prototype
    ************************************/


    extend(moment.duration.fn = Duration.prototype, {

        _bubble : function () {
            var milliseconds = this._milliseconds,
                days = this._days,
                months = this._months,
                data = this._data,
                seconds, minutes, hours, years;

            // The following code bubbles up values, see the tests for
            // examples of what that means.
            data.milliseconds = milliseconds % 1000;

            seconds = absRound(milliseconds / 1000);
            data.seconds = seconds % 60;

            minutes = absRound(seconds / 60);
            data.minutes = minutes % 60;

            hours = absRound(minutes / 60);
            data.hours = hours % 24;

            days += absRound(hours / 24);
            data.days = days % 30;

            months += absRound(days / 30);
            data.months = months % 12;

            years = absRound(months / 12);
            data.years = years;
        },

        weeks : function () {
            return absRound(this.days() / 7);
        },

        valueOf : function () {
            return this._milliseconds +
              this._days * 864e5 +
              (this._months % 12) * 2592e6 +
              toInt(this._months / 12) * 31536e6;
        },

        humanize : function (withSuffix) {
            var difference = +this,
                output = relativeTime(difference, !withSuffix, this.lang());

            if (withSuffix) {
                output = this.lang().pastFuture(difference, output);
            }

            return this.lang().postformat(output);
        },

        add : function (input, val) {
            // supports only 2.0-style add(1, 's') or add(moment)
            var dur = moment.duration(input, val);

            this._milliseconds += dur._milliseconds;
            this._days += dur._days;
            this._months += dur._months;

            this._bubble();

            return this;
        },

        subtract : function (input, val) {
            var dur = moment.duration(input, val);

            this._milliseconds -= dur._milliseconds;
            this._days -= dur._days;
            this._months -= dur._months;

            this._bubble();

            return this;
        },

        get : function (units) {
            units = normalizeUnits(units);
            return this[units.toLowerCase() + 's']();
        },

        as : function (units) {
            units = normalizeUnits(units);
            return this['as' + units.charAt(0).toUpperCase() + units.slice(1) + 's']();
        },

        lang : moment.fn.lang,

        toIsoString : function () {
            // inspired by https://github.com/dordille/moment-isoduration/blob/master/moment.isoduration.js
            var years = Math.abs(this.years()),
                months = Math.abs(this.months()),
                days = Math.abs(this.days()),
                hours = Math.abs(this.hours()),
                minutes = Math.abs(this.minutes()),
                seconds = Math.abs(this.seconds() + this.milliseconds() / 1000);

            if (!this.asSeconds()) {
                // this is the same as C#'s (Noda) and python (isodate)...
                // but not other JS (goog.date)
                return 'P0D';
            }

            return (this.asSeconds() < 0 ? '-' : '') +
                'P' +
                (years ? years + 'Y' : '') +
                (months ? months + 'M' : '') +
                (days ? days + 'D' : '') +
                ((hours || minutes || seconds) ? 'T' : '') +
                (hours ? hours + 'H' : '') +
                (minutes ? minutes + 'M' : '') +
                (seconds ? seconds + 'S' : '');
        }
    });

    function makeDurationGetter(name) {
        moment.duration.fn[name] = function () {
            return this._data[name];
        };
    }

    function makeDurationAsGetter(name, factor) {
        moment.duration.fn['as' + name] = function () {
            return +this / factor;
        };
    }

    for (i in unitMillisecondFactors) {
        if (unitMillisecondFactors.hasOwnProperty(i)) {
            makeDurationAsGetter(i, unitMillisecondFactors[i]);
            makeDurationGetter(i.toLowerCase());
        }
    }

    makeDurationAsGetter('Weeks', 6048e5);
    moment.duration.fn.asMonths = function () {
        return (+this - this.years() * 31536e6) / 2592e6 + this.years() * 12;
    };


    /************************************
        Default Lang
    ************************************/


    // Set default language, other languages will inherit from English.
    moment.lang('en', {
        ordinal : function (number) {
            var b = number % 10,
                output = (toInt(number % 100 / 10) === 1) ? 'th' :
                (b === 1) ? 'st' :
                (b === 2) ? 'nd' :
                (b === 3) ? 'rd' : 'th';
            return number + output;
        }
    });

    /* EMBED_LANGUAGES */

    /************************************
        Exposing Moment
    ************************************/

    function makeGlobal(deprecate) {
        var warned = false, local_moment = moment;
        /*global ender:false */
        if (typeof ender !== 'undefined') {
            return;
        }
        // here, `this` means `window` in the browser, or `global` on the server
        // add `moment` as a global object via a string identifier,
        // for Closure Compiler "advanced" mode
        if (deprecate) {
            global.moment = function () {
                if (!warned && console && console.warn) {
                    warned = true;
                    console.warn(
                            "Accessing Moment through the global scope is " +
                            "deprecated, and will be removed in an upcoming " +
                            "release.");
                }
                return local_moment.apply(null, arguments);
            };
            extend(global.moment, local_moment);
        } else {
            global['moment'] = moment;
        }
    }

    // CommonJS module is defined
    if (hasModule) {
        module.exports = moment;
        makeGlobal(true);
    } else if (typeof define === "function" && define.amd) {
        define("moment", function (require, exports, module) {
            if (module.config && module.config() && module.config().noGlobal !== true) {
                // If user provided noGlobal, he is aware of global
                makeGlobal(module.config().noGlobal === undefined);
            }

            return moment;
        });
    } else {
        makeGlobal();
    }
}).call(this);

},{}],28:[function(require,module,exports){
/**
 * Copyright 2012 Craig Campbell
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Mousetrap is a simple keyboard shortcut library for Javascript with
 * no external dependencies
 *
 * @version 1.1.2
 * @url craig.is/killing/mice
 */

  /**
   * mapping of special keycodes to their corresponding keys
   *
   * everything in this dictionary cannot use keypress events
   * so it has to be here to map to the correct keycodes for
   * keyup/keydown events
   *
   * @type {Object}
   */
  var _MAP = {
          8: 'backspace',
          9: 'tab',
          13: 'enter',
          16: 'shift',
          17: 'ctrl',
          18: 'alt',
          20: 'capslock',
          27: 'esc',
          32: 'space',
          33: 'pageup',
          34: 'pagedown',
          35: 'end',
          36: 'home',
          37: 'left',
          38: 'up',
          39: 'right',
          40: 'down',
          45: 'ins',
          46: 'del',
          91: 'meta',
          93: 'meta',
          224: 'meta'
      },

      /**
       * mapping for special characters so they can support
       *
       * this dictionary is only used incase you want to bind a
       * keyup or keydown event to one of these keys
       *
       * @type {Object}
       */
      _KEYCODE_MAP = {
          106: '*',
          107: '+',
          109: '-',
          110: '.',
          111 : '/',
          186: ';',
          187: '=',
          188: ',',
          189: '-',
          190: '.',
          191: '/',
          192: '`',
          219: '[',
          220: '\\',
          221: ']',
          222: '\''
      },

      /**
       * this is a mapping of keys that require shift on a US keypad
       * back to the non shift equivelents
       *
       * this is so you can use keyup events with these keys
       *
       * note that this will only work reliably on US keyboards
       *
       * @type {Object}
       */
      _SHIFT_MAP = {
          '~': '`',
          '!': '1',
          '@': '2',
          '#': '3',
          '$': '4',
          '%': '5',
          '^': '6',
          '&': '7',
          '*': '8',
          '(': '9',
          ')': '0',
          '_': '-',
          '+': '=',
          ':': ';',
          '\"': '\'',
          '<': ',',
          '>': '.',
          '?': '/',
          '|': '\\'
      },

      /**
       * this is a list of special strings you can use to map
       * to modifier keys when you specify your keyboard shortcuts
       *
       * @type {Object}
       */
      _SPECIAL_ALIASES = {
          'option': 'alt',
          'command': 'meta',
          'return': 'enter',
          'escape': 'esc'
      },

      /**
       * variable to store the flipped version of _MAP from above
       * needed to check if we should use keypress or not when no action
       * is specified
       *
       * @type {Object|undefined}
       */
      _REVERSE_MAP,

      /**
       * a list of all the callbacks setup via Mousetrap.bind()
       *
       * @type {Object}
       */
      _callbacks = {},

      /**
       * direct map of string combinations to callbacks used for trigger()
       *
       * @type {Object}
       */
      _direct_map = {},

      /**
       * keeps track of what level each sequence is at since multiple
       * sequences can start out with the same sequence
       *
       * @type {Object}
       */
      _sequence_levels = {},

      /**
       * variable to store the setTimeout call
       *
       * @type {null|number}
       */
      _reset_timer,

      /**
       * temporary state where we will ignore the next keyup
       *
       * @type {boolean|string}
       */
      _ignore_next_keyup = false,

      /**
       * are we currently inside of a sequence?
       * type of action ("keyup" or "keydown" or "keypress") or false
       *
       * @type {boolean|string}
       */
      _inside_sequence = false;

  /**
   * loop through the f keys, f1 to f19 and add them to the map
   * programatically
   */
  for (var i = 1; i < 20; ++i) {
      _MAP[111 + i] = 'f' + i;
  }

  /**
   * loop through to map numbers on the numeric keypad
   */
  for (i = 0; i <= 9; ++i) {
      _MAP[i + 96] = i;
  }

  /**
   * cross browser add event method
   *
   * @param {Element|HTMLDocument} object
   * @param {string} type
   * @param {Function} callback
   * @returns void
   */
  function _addEvent(object, type, callback) {
      if (object.addEventListener) {
          return object.addEventListener(type, callback, false);
      }

      object.attachEvent('on' + type, callback);
  }

  /**
   * takes the event and returns the key character
   *
   * @param {Event} e
   * @return {string}
   */
  function _characterFromEvent(e) {

      // for keypress events we should return the character as is
      if (e.type == 'keypress') {
          return String.fromCharCode(e.which);
      }

      // for non keypress events the special maps are needed
      if (_MAP[e.which]) {
          return _MAP[e.which];
      }

      if (_KEYCODE_MAP[e.which]) {
          return _KEYCODE_MAP[e.which];
      }

      // if it is not in the special map
      return String.fromCharCode(e.which).toLowerCase();
  }

  /**
   * should we stop this event before firing off callbacks
   *
   * @param {Event} e
   * @return {boolean}
   */
  function _stop(e) {
      var element = e.target || e.srcElement,
          tag_name = element.tagName;

      // if the element has the class "mousetrap" then no need to stop
      if ((' ' + element.className + ' ').indexOf(' mousetrap ') > -1) {
          return false;
      }

      // stop for input, select, and textarea
      return tag_name == 'INPUT' || tag_name == 'SELECT' || tag_name == 'TEXTAREA' || (element.contentEditable && element.contentEditable == 'true');
  }

  /**
   * checks if two arrays are equal
   *
   * @param {Array} modifiers1
   * @param {Array} modifiers2
   * @returns {boolean}
   */
  function _modifiersMatch(modifiers1, modifiers2) {
      return modifiers1.sort().join(',') === modifiers2.sort().join(',');
  }

  /**
   * resets all sequence counters except for the ones passed in
   *
   * @param {Object} do_not_reset
   * @returns void
   */
  function _resetSequences(do_not_reset) {
      do_not_reset = do_not_reset || {};

      var active_sequences = false,
          key;

      for (key in _sequence_levels) {
          if (do_not_reset[key]) {
              active_sequences = true;
              continue;
          }
          _sequence_levels[key] = 0;
      }

      if (!active_sequences) {
          _inside_sequence = false;
      }
  }

  /**
   * finds all callbacks that match based on the keycode, modifiers,
   * and action
   *
   * @param {string} character
   * @param {Array} modifiers
   * @param {string} action
   * @param {boolean=} remove - should we remove any matches
   * @param {string=} combination
   * @returns {Array}
   */
  function _getMatches(character, modifiers, action, remove, combination) {
      var i,
          callback,
          matches = [];

      // if there are no events related to this keycode
      if (!_callbacks[character]) {
          return [];
      }

      // if a modifier key is coming up on its own we should allow it
      if (action == 'keyup' && _isModifier(character)) {
          modifiers = [character];
      }

      // loop through all callbacks for the key that was pressed
      // and see if any of them match
      for (i = 0; i < _callbacks[character].length; ++i) {
          callback = _callbacks[character][i];

          // if this is a sequence but it is not at the right level
          // then move onto the next match
          if (callback.seq && _sequence_levels[callback.seq] != callback.level) {
              continue;
          }

          // if the action we are looking for doesn't match the action we got
          // then we should keep going
          if (action != callback.action) {
              continue;
          }

          // if this is a keypress event that means that we need to only
          // look at the character, otherwise check the modifiers as
          // well
          if (action == 'keypress' || _modifiersMatch(modifiers, callback.modifiers)) {

              // remove is used so if you change your mind and call bind a
              // second time with a new function the first one is overwritten
              if (remove && callback.combo == combination) {
                  _callbacks[character].splice(i, 1);
              }

              matches.push(callback);
          }
      }

      return matches;
  }

  /**
   * takes a key event and figures out what the modifiers are
   *
   * @param {Event} e
   * @returns {Array}
   */
  function _eventModifiers(e) {
      var modifiers = [];

      if (e.shiftKey) {
          modifiers.push('shift');
      }

      if (e.altKey) {
          modifiers.push('alt');
      }

      if (e.ctrlKey) {
          modifiers.push('ctrl');
      }

      if (e.metaKey) {
          modifiers.push('meta');
      }

      return modifiers;
  }

  /**
   * actually calls the callback function
   *
   * if your callback function returns false this will use the jquery
   * convention - prevent default and stop propogation on the event
   *
   * @param {Function} callback
   * @param {Event} e
   * @returns void
   */
  function _fireCallback(callback, e) {
      if (callback(e) === false) {
          if (e.preventDefault) {
              e.preventDefault();
          }

          if (e.stopPropagation) {
              e.stopPropagation();
          }

          e.returnValue = false;
          e.cancelBubble = true;
      }
  }

  /**
   * handles a character key event
   *
   * @param {string} character
   * @param {Event} e
   * @returns void
   */
  function _handleCharacter(character, e) {

      // if this event should not happen stop here
      if (_stop(e)) {
          return;
      }

      var callbacks = _getMatches(character, _eventModifiers(e), e.type),
          i,
          do_not_reset = {},
          processed_sequence_callback = false;

      // loop through matching callbacks for this key event
      for (i = 0; i < callbacks.length; ++i) {

          // fire for all sequence callbacks
          // this is because if for example you have multiple sequences
          // bound such as "g i" and "g t" they both need to fire the
          // callback for matching g cause otherwise you can only ever
          // match the first one
          if (callbacks[i].seq) {
              processed_sequence_callback = true;

              // keep a list of which sequences were matches for later
              do_not_reset[callbacks[i].seq] = 1;
              _fireCallback(callbacks[i].callback, e);
              continue;
          }

          // if there were no sequence matches but we are still here
          // that means this is a regular match so we should fire that
          if (!processed_sequence_callback && !_inside_sequence) {
              _fireCallback(callbacks[i].callback, e);
          }
      }

      // if you are inside of a sequence and the key you are pressing
      // is not a modifier key then we should reset all sequences
      // that were not matched by this key event
      if (e.type == _inside_sequence && !_isModifier(character)) {
          _resetSequences(do_not_reset);
      }
  }

  /**
   * handles a keydown event
   *
   * @param {Event} e
   * @returns void
   */
  function _handleKey(e) {

      // normalize e.which for key events
      // @see http://stackoverflow.com/questions/4285627/javascript-keycode-vs-charcode-utter-confusion
      e.which = typeof e.which == "number" ? e.which : e.keyCode;

      var character = _characterFromEvent(e);

      // no character found then stop
      if (!character) {
          return;
      }

      if (e.type == 'keyup' && _ignore_next_keyup == character) {
          _ignore_next_keyup = false;
          return;
      }

      _handleCharacter(character, e);
  }

  /**
   * determines if the keycode specified is a modifier key or not
   *
   * @param {string} key
   * @returns {boolean}
   */
  function _isModifier(key) {
      return key == 'shift' || key == 'ctrl' || key == 'alt' || key == 'meta';
  }

  /**
   * called to set a 1 second timeout on the specified sequence
   *
   * this is so after each key press in the sequence you have 1 second
   * to press the next key before you have to start over
   *
   * @returns void
   */
  function _resetSequenceTimer() {
      clearTimeout(_reset_timer);
      _reset_timer = setTimeout(_resetSequences, 1000);
  }

  /**
   * reverses the map lookup so that we can look for specific keys
   * to see what can and can't use keypress
   *
   * @return {Object}
   */
  function _getReverseMap() {
      if (!_REVERSE_MAP) {
          _REVERSE_MAP = {};
          for (var key in _MAP) {

              // pull out the numeric keypad from here cause keypress should
              // be able to detect the keys from the character
              if (key > 95 && key < 112) {
                  continue;
              }

              if (_MAP.hasOwnProperty(key)) {
                  _REVERSE_MAP[_MAP[key]] = key;
              }
          }
      }
      return _REVERSE_MAP;
  }

  /**
   * picks the best action based on the key combination
   *
   * @param {string} key - character for key
   * @param {Array} modifiers
   * @param {string=} action passed in
   */
  function _pickBestAction(key, modifiers, action) {

      // if no action was picked in we should try to pick the one
      // that we think would work best for this key
      if (!action) {
          action = _getReverseMap()[key] ? 'keydown' : 'keypress';
      }

      // modifier keys don't work as expected with keypress,
      // switch to keydown
      if (action == 'keypress' && modifiers.length) {
          action = 'keydown';
      }

      return action;
  }

  /**
   * binds a key sequence to an event
   *
   * @param {string} combo - combo specified in bind call
   * @param {Array} keys
   * @param {Function} callback
   * @param {string=} action
   * @returns void
   */
  function _bindSequence(combo, keys, callback, action) {

      // start off by adding a sequence level record for this combination
      // and setting the level to 0
      _sequence_levels[combo] = 0;

      // if there is no action pick the best one for the first key
      // in the sequence
      if (!action) {
          action = _pickBestAction(keys[0], []);
      }

      /**
       * callback to increase the sequence level for this sequence and reset
       * all other sequences that were active
       *
       * @param {Event} e
       * @returns void
       */
      var _increaseSequence = function(e) {
              _inside_sequence = action;
              ++_sequence_levels[combo];
              _resetSequenceTimer();
          },

          /**
           * wraps the specified callback inside of another function in order
           * to reset all sequence counters as soon as this sequence is done
           *
           * @param {Event} e
           * @returns void
           */
          _callbackAndReset = function(e) {
              _fireCallback(callback, e);

              // we should ignore the next key up if the action is key down
              // or keypress.  this is so if you finish a sequence and
              // release the key the final key will not trigger a keyup
              if (action !== 'keyup') {
                  _ignore_next_keyup = _characterFromEvent(e);
              }

              // weird race condition if a sequence ends with the key
              // another sequence begins with
              setTimeout(_resetSequences, 10);
          },
          i;

      // loop through keys one at a time and bind the appropriate callback
      // function.  for any key leading up to the final one it should
      // increase the sequence. after the final, it should reset all sequences
      for (i = 0; i < keys.length; ++i) {
          _bindSingle(keys[i], i < keys.length - 1 ? _increaseSequence : _callbackAndReset, action, combo, i);
      }
  }

  /**
   * binds a single keyboard combination
   *
   * @param {string} combination
   * @param {Function} callback
   * @param {string=} action
   * @param {string=} sequence_name - name of sequence if part of sequence
   * @param {number=} level - what part of the sequence the command is
   * @returns void
   */
  function _bindSingle(combination, callback, action, sequence_name, level) {

      // make sure multiple spaces in a row become a single space
      combination = combination.replace(/\s+/g, ' ');

      var sequence = combination.split(' '),
          i,
          key,
          keys,
          modifiers = [];

      // if this pattern is a sequence of keys then run through this method
      // to reprocess each pattern one key at a time
      if (sequence.length > 1) {
          return _bindSequence(combination, sequence, callback, action);
      }

      // take the keys from this pattern and figure out what the actual
      // pattern is all about
      keys = combination === '+' ? ['+'] : combination.split('+');

      for (i = 0; i < keys.length; ++i) {
          key = keys[i];

          // normalize key names
          if (_SPECIAL_ALIASES[key]) {
              key = _SPECIAL_ALIASES[key];
          }

          // if this is not a keypress event then we should
          // be smart about using shift keys
          // this will only work for US keyboards however
          if (action && action != 'keypress' && _SHIFT_MAP[key]) {
              key = _SHIFT_MAP[key];
              modifiers.push('shift');
          }

          // if this key is a modifier then add it to the list of modifiers
          if (_isModifier(key)) {
              modifiers.push(key);
          }
      }

      // depending on what the key combination is
      // we will try to pick the best event for it
      action = _pickBestAction(key, modifiers, action);

      // make sure to initialize array if this is the first time
      // a callback is added for this key
      if (!_callbacks[key]) {
          _callbacks[key] = [];
      }

      // remove an existing match if there is one
      _getMatches(key, modifiers, action, !sequence_name, combination);

      // add this call back to the array
      // if it is a sequence put it at the beginning
      // if not put it at the end
      //
      // this is important because the way these are processed expects
      // the sequence ones to come first
      _callbacks[key][sequence_name ? 'unshift' : 'push']({
          callback: callback,
          modifiers: modifiers,
          action: action,
          seq: sequence_name,
          level: level,
          combo: combination
      });
  }

  /**
   * binds multiple combinations to the same callback
   *
   * @param {Array} combinations
   * @param {Function} callback
   * @param {string|undefined} action
   * @returns void
   */
  function _bindMultiple(combinations, callback, action) {
      for (var i = 0; i < combinations.length; ++i) {
          _bindSingle(combinations[i], callback, action);
      }
  }

  // start!
  _addEvent(document, 'keypress', _handleKey);
  _addEvent(document, 'keydown', _handleKey);
  _addEvent(document, 'keyup', _handleKey);

  var mousetrap = {

      /**
       * binds an event to mousetrap
       *
       * can be a single key, a combination of keys separated with +,
       * a comma separated list of keys, an array of keys, or
       * a sequence of keys separated by spaces
       *
       * be sure to list the modifier keys first to make sure that the
       * correct key ends up getting bound (the last key in the pattern)
       *
       * @param {string|Array} keys
       * @param {Function} callback
       * @param {string=} action - 'keypress', 'keydown', or 'keyup'
       * @returns void
       */
      bind: function(keys, callback, action) {
          _bindMultiple(keys instanceof Array ? keys : [keys], callback, action);
          _direct_map[keys + ':' + action] = callback;
          return this;
      },

      /**
       * unbinds an event to mousetrap
       *
       * the unbinding sets the callback function of the specified key combo
       * to an empty function and deletes the corresponding key in the
       * _direct_map dict.
       *
       * the keycombo+action has to be exactly the same as
       * it was defined in the bind method
       *
       * TODO: actually remove this from the _callbacks dictionary instead
       * of binding an empty function
       *
       * @param {string|Array} keys
       * @param {string} action
       * @returns void
       */
      unbind: function(keys, action) {
          if (_direct_map[keys + ':' + action]) {
              delete _direct_map[keys + ':' + action];
              this.bind(keys, function() {}, action);
          }
          return this;
      },

      /**
       * triggers an event that has already been bound
       *
       * @param {string} keys
       * @param {string=} action
       * @returns void
       */
      trigger: function(keys, action) {
          _direct_map[keys + ':' + action]();
          return this;
      },

      /**
       * resets the library back to its initial state.  this is useful
       * if you want to clear out the current keyboard shortcuts and bind
       * new ones - for example if you switch to another page
       *
       * @returns void
       */
      reset: function() {
          _callbacks = {};
          _direct_map = {};
          return this;
      }
  };

module.exports = mousetrap;


},{}]},{},[1])
(1)
});
;