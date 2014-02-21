/**
 * vis.js
 * https://github.com/almende/vis
 *
 * A dynamic, browser-based visualization library.
 *
 * @version 0.6.0-SNAPSHOT
 * @date    2014-02-21
 *
 * @license
 * Copyright (C) 2011-2014 Almende B.V, http://almende.com
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy
 * of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

(function webpackUniversalModuleDefinition(root) {
	return function webpackUniversalModuleDefinitionWrapBootstrap(fn) {
		return function webpackUniversalModuleDefinitionBootstrap(modules) {
			if(typeof exports === 'object' && typeof module === 'object')
				module.exports = fn(modules);
			else if(typeof define === 'function' && define.amd)
				define(function() { return fn(modules); });
			else if(typeof exports === 'object')
				exports["vis"] = fn(modules);
			else
				root["vis"] = fn(modules);
		}
	}
})(this)
/******/ (function(modules) { // webpackBootstrap
/******/ 	// shortcut for better minimizing
/******/ 	var exports = "exports";
/******/ 	
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/ 	
/******/ 	// The require function
/******/ 	function require(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId][exports];
/******/ 		
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/ 		
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module[exports], module, module[exports], require);
/******/ 		
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/ 		
/******/ 		// Return the exports of the module
/******/ 		return module[exports];
/******/ 	}
/******/ 	
/******/ 	
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	require.modules = modules;
/******/ 	
/******/ 	// expose the module cache
/******/ 	require.cache = installedModules;
/******/ 	
/******/ 	// __webpack_public_path__
/******/ 	require.p = "";
/******/ 	
/******/ 	
/******/ 	// Load entry module and return exports
/******/ 	return require(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, require) {

	exports.DataSet = require(1);
	exports.DataView = require(2);
	exports.utils = require(3);

/***/ },
/* 1 */
/***/ function(module, exports, require) {

	var util = require(3);

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


/***/ },
/* 2 */
/***/ function(module, exports, require) {

	var util = require(3),
	    DataSet = require(1);

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


/***/ },
/* 3 */
/***/ function(module, exports, require) {

	// utility functions
	var moment = require(4).moment;

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


/***/ },
/* 4 */
/***/ function(module, exports, require) {

	/**
	 * vis.js module imports, how to load depends on whether running in browser
	 * or node.js.
	 *
	 * Try to load dependencies from the global window object. If not available
	 * there, load via commonjs.
	 */

	// moment.js
	exports.moment = (typeof window !== 'undefined') && window['moment'] || require(6);

	// emitter-component
	exports.Emitter = require(5);

	// hammer.js
	if (typeof window !== 'undefined') {
	  // load hammer.js only when running in a browser (where window is available)
	  exports.Hammer = window['Hammer'] || require(8);
	}
	else {
	  exports.Hammer = function () {
	    throw Error('hammer.js is only available in a browser, not in node.js.');
	  }
	}

	// mousetrap.js
	if (typeof window !== 'undefined') {
	  // load mousetrap.js only when running in a browser (where window is available)
	  exports.mousetrap = window['mousetrap'] || require(7);
	}
	else {
	  exports.mousetrap = function () {
	    throw Error('mouseTrap is only available in a browser, not in node.js.');
	  }
	}


/***/ },
/* 5 */
/***/ function(module, exports, require) {

	
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


/***/ },
/* 6 */
/***/ function(module, exports, require) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/* WEBPACK VAR INJECTION */(function(require, module) {//! moment.js
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
	        hasModule = (typeof module !== 'undefined' && module.exports && 'function' !== 'undefined'),

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
	                        require(9)("./" + k);
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
	    } else if (true) {
	        !(__WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, module) {
	            if (module.config && module.config() && module.config().noGlobal !== true) {
	                // If user provided noGlobal, he is aware of global
	                makeGlobal(module.config().noGlobal === undefined);
	            }

	            return moment;
	        }.call(exports, require, exports, module)), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	    } else {
	        makeGlobal();
	    }
	}).call(this);
	
	/* WEBPACK VAR INJECTION */}.call(exports, require, require(78)(module)))

/***/ },
/* 7 */
/***/ function(module, exports, require) {

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



/***/ },
/* 8 */
/***/ function(module, exports, require) {

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

/***/ },
/* 9 */
/***/ function(module, exports, require) {

	var map = {
		"./ar": 11,
		"./ar-ma": 10,
		"./ar-ma.js": 10,
		"./ar.js": 11,
		"./bg": 12,
		"./bg.js": 12,
		"./br": 13,
		"./br.js": 13,
		"./bs": 14,
		"./bs.js": 14,
		"./ca": 15,
		"./ca.js": 15,
		"./cs": 16,
		"./cs.js": 16,
		"./cv": 17,
		"./cv.js": 17,
		"./cy": 18,
		"./cy.js": 18,
		"./da": 19,
		"./da.js": 19,
		"./de": 20,
		"./de.js": 20,
		"./el": 21,
		"./el.js": 21,
		"./en-au": 22,
		"./en-au.js": 22,
		"./en-ca": 23,
		"./en-ca.js": 23,
		"./en-gb": 24,
		"./en-gb.js": 24,
		"./eo": 25,
		"./eo.js": 25,
		"./es": 26,
		"./es.js": 26,
		"./et": 27,
		"./et.js": 27,
		"./eu": 28,
		"./eu.js": 28,
		"./fa": 29,
		"./fa.js": 29,
		"./fi": 30,
		"./fi.js": 30,
		"./fo": 31,
		"./fo.js": 31,
		"./fr": 33,
		"./fr-ca": 32,
		"./fr-ca.js": 32,
		"./fr.js": 33,
		"./gl": 34,
		"./gl.js": 34,
		"./he": 35,
		"./he.js": 35,
		"./hi": 36,
		"./hi.js": 36,
		"./hr": 37,
		"./hr.js": 37,
		"./hu": 38,
		"./hu.js": 38,
		"./hy-am": 39,
		"./hy-am.js": 39,
		"./id": 40,
		"./id.js": 40,
		"./is": 41,
		"./is.js": 41,
		"./it": 42,
		"./it.js": 42,
		"./ja": 43,
		"./ja.js": 43,
		"./ka": 44,
		"./ka.js": 44,
		"./ko": 45,
		"./ko.js": 45,
		"./lb": 46,
		"./lb.js": 46,
		"./lt": 47,
		"./lt.js": 47,
		"./lv": 48,
		"./lv.js": 48,
		"./mk": 49,
		"./mk.js": 49,
		"./ml": 50,
		"./ml.js": 50,
		"./mr": 51,
		"./mr.js": 51,
		"./ms-my": 52,
		"./ms-my.js": 52,
		"./nb": 53,
		"./nb.js": 53,
		"./ne": 54,
		"./ne.js": 54,
		"./nl": 55,
		"./nl.js": 55,
		"./nn": 56,
		"./nn.js": 56,
		"./pl": 57,
		"./pl.js": 57,
		"./pt": 59,
		"./pt-br": 58,
		"./pt-br.js": 58,
		"./pt.js": 59,
		"./ro": 60,
		"./ro.js": 60,
		"./rs": 61,
		"./rs.js": 61,
		"./ru": 62,
		"./ru.js": 62,
		"./sk": 63,
		"./sk.js": 63,
		"./sl": 64,
		"./sl.js": 64,
		"./sq": 65,
		"./sq.js": 65,
		"./sv": 66,
		"./sv.js": 66,
		"./ta": 67,
		"./ta.js": 67,
		"./th": 68,
		"./th.js": 68,
		"./tl-ph": 69,
		"./tl-ph.js": 69,
		"./tr": 70,
		"./tr.js": 70,
		"./tzm": 72,
		"./tzm-la": 71,
		"./tzm-la.js": 71,
		"./tzm.js": 72,
		"./uk": 73,
		"./uk.js": 73,
		"./uz": 74,
		"./uz.js": 74,
		"./vn": 75,
		"./vn.js": 75,
		"./zh-cn": 76,
		"./zh-cn.js": 76,
		"./zh-tw": 77,
		"./zh-tw.js": 77
	};
	function webpackContext(req) {
		return require(webpackContextResolve(req));
	};
	function webpackContextResolve(req) {
		return map[req] || (function() { throw new Error("Cannot find module '" + req + "'.") }());
	};
	webpackContext.keys = function webpackContextKeys() {
		return Object.keys(map);
	};
	webpackContext.resolve = webpackContextResolve;
	module.exports = webpackContext;


/***/ },
/* 10 */
/***/ function(module, exports, require) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;// moment.js language configuration
	// language : Moroccan Arabic (ar-ma)
	// author : ElFadili Yassine : https://github.com/ElFadiliY
	// author : Abdel Said : https://github.com/abdelsaid

	(function (factory) {
	    if (true) {
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [require(6)], __WEBPACK_AMD_DEFINE_RESULT__ = (factory.apply(null, __WEBPACK_AMD_DEFINE_ARRAY__)), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)); // AMD
	    } else if (typeof exports === 'object') {
	        module.exports = factory(require('../moment')); // Node
	    } else {
	        factory(window.moment); // Browser global
	    }
	}(function (moment) {
	    return moment.lang('ar-ma', {
	        months : "يناير_فبراير_مارس_أبريل_ماي_يونيو_يوليوز_غشت_شتنبر_أكتوبر_نونبر_دجنبر".split("_"),
	        monthsShort : "يناير_فبراير_مارس_أبريل_ماي_يونيو_يوليوز_غشت_شتنبر_أكتوبر_نونبر_دجنبر".split("_"),
	        weekdays : "الأحد_الإتنين_الثلاثاء_الأربعاء_الخميس_الجمعة_السبت".split("_"),
	        weekdaysShort : "احد_اتنين_ثلاثاء_اربعاء_خميس_جمعة_سبت".split("_"),
	        weekdaysMin : "ح_ن_ث_ر_خ_ج_س".split("_"),
	        longDateFormat : {
	            LT : "HH:mm",
	            L : "DD/MM/YYYY",
	            LL : "D MMMM YYYY",
	            LLL : "D MMMM YYYY LT",
	            LLLL : "dddd D MMMM YYYY LT"
	        },
	        calendar : {
	            sameDay: "[اليوم على الساعة] LT",
	            nextDay: '[غدا على الساعة] LT',
	            nextWeek: 'dddd [على الساعة] LT',
	            lastDay: '[أمس على الساعة] LT',
	            lastWeek: 'dddd [على الساعة] LT',
	            sameElse: 'L'
	        },
	        relativeTime : {
	            future : "في %s",
	            past : "منذ %s",
	            s : "ثوان",
	            m : "دقيقة",
	            mm : "%d دقائق",
	            h : "ساعة",
	            hh : "%d ساعات",
	            d : "يوم",
	            dd : "%d أيام",
	            M : "شهر",
	            MM : "%d أشهر",
	            y : "سنة",
	            yy : "%d سنوات"
	        },
	        week : {
	            dow : 6, // Saturday is the first day of the week.
	            doy : 12  // The week that contains Jan 1st is the first week of the year.
	        }
	    });
	}));


/***/ },
/* 11 */
/***/ function(module, exports, require) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;// moment.js language configuration
	// language : Arabic (ar)
	// author : Abdel Said : https://github.com/abdelsaid
	// changes in months, weekdays : Ahmed Elkhatib

	(function (factory) {
	    if (true) {
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [require(6)], __WEBPACK_AMD_DEFINE_RESULT__ = (factory.apply(null, __WEBPACK_AMD_DEFINE_ARRAY__)), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)); // AMD
	    } else if (typeof exports === 'object') {
	        module.exports = factory(require('../moment')); // Node
	    } else {
	        factory(window.moment); // Browser global
	    }
	}(function (moment) {
	    return moment.lang('ar', {
	        months : "يناير/ كانون الثاني_فبراير/ شباط_مارس/ آذار_أبريل/ نيسان_مايو/ أيار_يونيو/ حزيران_يوليو/ تموز_أغسطس/ آب_سبتمبر/ أيلول_أكتوبر/ تشرين الأول_نوفمبر/ تشرين الثاني_ديسمبر/ كانون الأول".split("_"),
	        monthsShort : "يناير/ كانون الثاني_فبراير/ شباط_مارس/ آذار_أبريل/ نيسان_مايو/ أيار_يونيو/ حزيران_يوليو/ تموز_أغسطس/ آب_سبتمبر/ أيلول_أكتوبر/ تشرين الأول_نوفمبر/ تشرين الثاني_ديسمبر/ كانون الأول".split("_"),
	        weekdays : "الأحد_الإثنين_الثلاثاء_الأربعاء_الخميس_الجمعة_السبت".split("_"),
	        weekdaysShort : "الأحد_الإثنين_الثلاثاء_الأربعاء_الخميس_الجمعة_السبت".split("_"),
	        weekdaysMin : "ح_ن_ث_ر_خ_ج_س".split("_"),
	        longDateFormat : {
	            LT : "HH:mm",
	            L : "DD/MM/YYYY",
	            LL : "D MMMM YYYY",
	            LLL : "D MMMM YYYY LT",
	            LLLL : "dddd D MMMM YYYY LT"
	        },
	        calendar : {
	            sameDay: "[اليوم على الساعة] LT",
	            nextDay: '[غدا على الساعة] LT',
	            nextWeek: 'dddd [على الساعة] LT',
	            lastDay: '[أمس على الساعة] LT',
	            lastWeek: 'dddd [على الساعة] LT',
	            sameElse: 'L'
	        },
	        relativeTime : {
	            future : "في %s",
	            past : "منذ %s",
	            s : "ثوان",
	            m : "دقيقة",
	            mm : "%d دقائق",
	            h : "ساعة",
	            hh : "%d ساعات",
	            d : "يوم",
	            dd : "%d أيام",
	            M : "شهر",
	            MM : "%d أشهر",
	            y : "سنة",
	            yy : "%d سنوات"
	        },
	        week : {
	            dow : 6, // Saturday is the first day of the week.
	            doy : 12  // The week that contains Jan 1st is the first week of the year.
	        }
	    });
	}));


/***/ },
/* 12 */
/***/ function(module, exports, require) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;// moment.js language configuration
	// language : bulgarian (bg)
	// author : Krasen Borisov : https://github.com/kraz

	(function (factory) {
	    if (true) {
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [require(6)], __WEBPACK_AMD_DEFINE_RESULT__ = (factory.apply(null, __WEBPACK_AMD_DEFINE_ARRAY__)), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)); // AMD
	    } else if (typeof exports === 'object') {
	        module.exports = factory(require('../moment')); // Node
	    } else {
	        factory(window.moment); // Browser global
	    }
	}(function (moment) {
	    return moment.lang('bg', {
	        months : "януари_февруари_март_април_май_юни_юли_август_септември_октомври_ноември_декември".split("_"),
	        monthsShort : "янр_фев_мар_апр_май_юни_юли_авг_сеп_окт_ное_дек".split("_"),
	        weekdays : "неделя_понеделник_вторник_сряда_четвъртък_петък_събота".split("_"),
	        weekdaysShort : "нед_пон_вто_сря_чет_пет_съб".split("_"),
	        weekdaysMin : "нд_пн_вт_ср_чт_пт_сб".split("_"),
	        longDateFormat : {
	            LT : "H:mm",
	            L : "D.MM.YYYY",
	            LL : "D MMMM YYYY",
	            LLL : "D MMMM YYYY LT",
	            LLLL : "dddd, D MMMM YYYY LT"
	        },
	        calendar : {
	            sameDay : '[Днес в] LT',
	            nextDay : '[Утре в] LT',
	            nextWeek : 'dddd [в] LT',
	            lastDay : '[Вчера в] LT',
	            lastWeek : function () {
	                switch (this.day()) {
	                case 0:
	                case 3:
	                case 6:
	                    return '[В изминалата] dddd [в] LT';
	                case 1:
	                case 2:
	                case 4:
	                case 5:
	                    return '[В изминалия] dddd [в] LT';
	                }
	            },
	            sameElse : 'L'
	        },
	        relativeTime : {
	            future : "след %s",
	            past : "преди %s",
	            s : "няколко секунди",
	            m : "минута",
	            mm : "%d минути",
	            h : "час",
	            hh : "%d часа",
	            d : "ден",
	            dd : "%d дни",
	            M : "месец",
	            MM : "%d месеца",
	            y : "година",
	            yy : "%d години"
	        },
	        ordinal : function (number) {
	            var lastDigit = number % 10,
	                last2Digits = number % 100;
	            if (number === 0) {
	                return number + '-ев';
	            } else if (last2Digits === 0) {
	                return number + '-ен';
	            } else if (last2Digits > 10 && last2Digits < 20) {
	                return number + '-ти';
	            } else if (lastDigit === 1) {
	                return number + '-ви';
	            } else if (lastDigit === 2) {
	                return number + '-ри';
	            } else if (lastDigit === 7 || lastDigit === 8) {
	                return number + '-ми';
	            } else {
	                return number + '-ти';
	            }
	        },
	        week : {
	            dow : 1, // Monday is the first day of the week.
	            doy : 7  // The week that contains Jan 1st is the first week of the year.
	        }
	    });
	}));


/***/ },
/* 13 */
/***/ function(module, exports, require) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;// moment.js language configuration
	// language : breton (br)
	// author : Jean-Baptiste Le Duigou : https://github.com/jbleduigou

	(function (factory) {
	    if (true) {
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [require(6)], __WEBPACK_AMD_DEFINE_RESULT__ = (factory.apply(null, __WEBPACK_AMD_DEFINE_ARRAY__)), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)); // AMD
	    } else if (typeof exports === 'object') {
	        module.exports = factory(require('../moment')); // Node
	    } else {
	        factory(window.moment); // Browser global
	    }
	}(function (moment) {
	    function relativeTimeWithMutation(number, withoutSuffix, key) {
	        var format = {
	            'mm': "munutenn",
	            'MM': "miz",
	            'dd': "devezh"
	        };
	        return number + ' ' + mutation(format[key], number);
	    }

	    function specialMutationForYears(number) {
	        switch (lastNumber(number)) {
	        case 1:
	        case 3:
	        case 4:
	        case 5:
	        case 9:
	            return number + ' bloaz';
	        default:
	            return number + ' vloaz';
	        }
	    }

	    function lastNumber(number) {
	        if (number > 9) {
	            return lastNumber(number % 10);
	        }
	        return number;
	    }

	    function mutation(text, number) {
	        if (number === 2) {
	            return softMutation(text);
	        }
	        return text;
	    }

	    function softMutation(text) {
	        var mutationTable = {
	            'm': 'v',
	            'b': 'v',
	            'd': 'z'
	        };
	        if (mutationTable[text.charAt(0)] === undefined) {
	            return text;
	        }
	        return mutationTable[text.charAt(0)] + text.substring(1);
	    }

	    return moment.lang('br', {
	        months : "Genver_C'hwevrer_Meurzh_Ebrel_Mae_Mezheven_Gouere_Eost_Gwengolo_Here_Du_Kerzu".split("_"),
	        monthsShort : "Gen_C'hwe_Meu_Ebr_Mae_Eve_Gou_Eos_Gwe_Her_Du_Ker".split("_"),
	        weekdays : "Sul_Lun_Meurzh_Merc'her_Yaou_Gwener_Sadorn".split("_"),
	        weekdaysShort : "Sul_Lun_Meu_Mer_Yao_Gwe_Sad".split("_"),
	        weekdaysMin : "Su_Lu_Me_Mer_Ya_Gw_Sa".split("_"),
	        longDateFormat : {
	            LT : "h[e]mm A",
	            L : "DD/MM/YYYY",
	            LL : "D [a viz] MMMM YYYY",
	            LLL : "D [a viz] MMMM YYYY LT",
	            LLLL : "dddd, D [a viz] MMMM YYYY LT"
	        },
	        calendar : {
	            sameDay : '[Hiziv da] LT',
	            nextDay : '[Warc\'hoazh da] LT',
	            nextWeek : 'dddd [da] LT',
	            lastDay : '[Dec\'h da] LT',
	            lastWeek : 'dddd [paset da] LT',
	            sameElse : 'L'
	        },
	        relativeTime : {
	            future : "a-benn %s",
	            past : "%s 'zo",
	            s : "un nebeud segondennoù",
	            m : "ur vunutenn",
	            mm : relativeTimeWithMutation,
	            h : "un eur",
	            hh : "%d eur",
	            d : "un devezh",
	            dd : relativeTimeWithMutation,
	            M : "ur miz",
	            MM : relativeTimeWithMutation,
	            y : "ur bloaz",
	            yy : specialMutationForYears
	        },
	        ordinal : function (number) {
	            var output = (number === 1) ? 'añ' : 'vet';
	            return number + output;
	        },
	        week : {
	            dow : 1, // Monday is the first day of the week.
	            doy : 4  // The week that contains Jan 4th is the first week of the year.
	        }
	    });
	}));


/***/ },
/* 14 */
/***/ function(module, exports, require) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;// moment.js language configuration
	// language : bosnian (bs)
	// author : Nedim Cholich : https://github.com/frontyard
	// based on (hr) translation by Bojan Marković

	(function (factory) {
	    if (true) {
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [require(6)], __WEBPACK_AMD_DEFINE_RESULT__ = (factory.apply(null, __WEBPACK_AMD_DEFINE_ARRAY__)), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)); // AMD
	    } else if (typeof exports === 'object') {
	        module.exports = factory(require('../moment')); // Node
	    } else {
	        factory(window.moment); // Browser global
	    }
	}(function (moment) {

	    function translate(number, withoutSuffix, key) {
	        var result = number + " ";
	        switch (key) {
	        case 'm':
	            return withoutSuffix ? 'jedna minuta' : 'jedne minute';
	        case 'mm':
	            if (number === 1) {
	                result += 'minuta';
	            } else if (number === 2 || number === 3 || number === 4) {
	                result += 'minute';
	            } else {
	                result += 'minuta';
	            }
	            return result;
	        case 'h':
	            return withoutSuffix ? 'jedan sat' : 'jednog sata';
	        case 'hh':
	            if (number === 1) {
	                result += 'sat';
	            } else if (number === 2 || number === 3 || number === 4) {
	                result += 'sata';
	            } else {
	                result += 'sati';
	            }
	            return result;
	        case 'dd':
	            if (number === 1) {
	                result += 'dan';
	            } else {
	                result += 'dana';
	            }
	            return result;
	        case 'MM':
	            if (number === 1) {
	                result += 'mjesec';
	            } else if (number === 2 || number === 3 || number === 4) {
	                result += 'mjeseca';
	            } else {
	                result += 'mjeseci';
	            }
	            return result;
	        case 'yy':
	            if (number === 1) {
	                result += 'godina';
	            } else if (number === 2 || number === 3 || number === 4) {
	                result += 'godine';
	            } else {
	                result += 'godina';
	            }
	            return result;
	        }
	    }

	    return moment.lang('bs', {
			months : "januar_februar_mart_april_maj_juni_juli_avgust_septembar_oktobar_novembar_decembar".split("_"),
			monthsShort : "jan._feb._mar._apr._maj._jun._jul._avg._sep._okt._nov._dec.".split("_"),
	        weekdays : "nedjelja_ponedjeljak_utorak_srijeda_četvrtak_petak_subota".split("_"),
	        weekdaysShort : "ned._pon._uto._sri._čet._pet._sub.".split("_"),
	        weekdaysMin : "ne_po_ut_sr_če_pe_su".split("_"),
	        longDateFormat : {
	            LT : "H:mm",
	            L : "DD. MM. YYYY",
	            LL : "D. MMMM YYYY",
	            LLL : "D. MMMM YYYY LT",
	            LLLL : "dddd, D. MMMM YYYY LT"
	        },
	        calendar : {
	            sameDay  : '[danas u] LT',
	            nextDay  : '[sutra u] LT',

	            nextWeek : function () {
	                switch (this.day()) {
	                case 0:
	                    return '[u] [nedjelju] [u] LT';
	                case 3:
	                    return '[u] [srijedu] [u] LT';
	                case 6:
	                    return '[u] [subotu] [u] LT';
	                case 1:
	                case 2:
	                case 4:
	                case 5:
	                    return '[u] dddd [u] LT';
	                }
	            },
	            lastDay  : '[jučer u] LT',
	            lastWeek : function () {
	                switch (this.day()) {
	                case 0:
	                case 3:
	                    return '[prošlu] dddd [u] LT';
	                case 6:
	                    return '[prošle] [subote] [u] LT';
	                case 1:
	                case 2:
	                case 4:
	                case 5:
	                    return '[prošli] dddd [u] LT';
	                }
	            },
	            sameElse : 'L'
	        },
	        relativeTime : {
	            future : "za %s",
	            past   : "prije %s",
	            s      : "par sekundi",
	            m      : translate,
	            mm     : translate,
	            h      : translate,
	            hh     : translate,
	            d      : "dan",
	            dd     : translate,
	            M      : "mjesec",
	            MM     : translate,
	            y      : "godinu",
	            yy     : translate
	        },
	        ordinal : '%d.',
	        week : {
	            dow : 1, // Monday is the first day of the week.
	            doy : 7  // The week that contains Jan 1st is the first week of the year.
	        }
	    });
	}));


/***/ },
/* 15 */
/***/ function(module, exports, require) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;// moment.js language configuration
	// language : catalan (ca)
	// author : Juan G. Hurtado : https://github.com/juanghurtado

	(function (factory) {
	    if (true) {
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [require(6)], __WEBPACK_AMD_DEFINE_RESULT__ = (factory.apply(null, __WEBPACK_AMD_DEFINE_ARRAY__)), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)); // AMD
	    } else if (typeof exports === 'object') {
	        module.exports = factory(require('../moment')); // Node
	    } else {
	        factory(window.moment); // Browser global
	    }
	}(function (moment) {
	    return moment.lang('ca', {
	        months : "gener_febrer_març_abril_maig_juny_juliol_agost_setembre_octubre_novembre_desembre".split("_"),
	        monthsShort : "gen._febr._mar._abr._mai._jun._jul._ag._set._oct._nov._des.".split("_"),
	        weekdays : "diumenge_dilluns_dimarts_dimecres_dijous_divendres_dissabte".split("_"),
	        weekdaysShort : "dg._dl._dt._dc._dj._dv._ds.".split("_"),
	        weekdaysMin : "Dg_Dl_Dt_Dc_Dj_Dv_Ds".split("_"),
	        longDateFormat : {
	            LT : "H:mm",
	            L : "DD/MM/YYYY",
	            LL : "D MMMM YYYY",
	            LLL : "D MMMM YYYY LT",
	            LLLL : "dddd D MMMM YYYY LT"
	        },
	        calendar : {
	            sameDay : function () {
	                return '[avui a ' + ((this.hours() !== 1) ? 'les' : 'la') + '] LT';
	            },
	            nextDay : function () {
	                return '[demà a ' + ((this.hours() !== 1) ? 'les' : 'la') + '] LT';
	            },
	            nextWeek : function () {
	                return 'dddd [a ' + ((this.hours() !== 1) ? 'les' : 'la') + '] LT';
	            },
	            lastDay : function () {
	                return '[ahir a ' + ((this.hours() !== 1) ? 'les' : 'la') + '] LT';
	            },
	            lastWeek : function () {
	                return '[el] dddd [passat a ' + ((this.hours() !== 1) ? 'les' : 'la') + '] LT';
	            },
	            sameElse : 'L'
	        },
	        relativeTime : {
	            future : "en %s",
	            past : "fa %s",
	            s : "uns segons",
	            m : "un minut",
	            mm : "%d minuts",
	            h : "una hora",
	            hh : "%d hores",
	            d : "un dia",
	            dd : "%d dies",
	            M : "un mes",
	            MM : "%d mesos",
	            y : "un any",
	            yy : "%d anys"
	        },
	        ordinal : '%dº',
	        week : {
	            dow : 1, // Monday is the first day of the week.
	            doy : 4  // The week that contains Jan 4th is the first week of the year.
	        }
	    });
	}));


/***/ },
/* 16 */
/***/ function(module, exports, require) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;// moment.js language configuration
	// language : czech (cs)
	// author : petrbela : https://github.com/petrbela

	(function (factory) {
	    if (true) {
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [require(6)], __WEBPACK_AMD_DEFINE_RESULT__ = (factory.apply(null, __WEBPACK_AMD_DEFINE_ARRAY__)), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)); // AMD
	    } else if (typeof exports === 'object') {
	        module.exports = factory(require('../moment')); // Node
	    } else {
	        factory(window.moment); // Browser global
	    }
	}(function (moment) {
	    var months = "leden_únor_březen_duben_květen_červen_červenec_srpen_září_říjen_listopad_prosinec".split("_"),
	        monthsShort = "led_úno_bře_dub_kvě_čvn_čvc_srp_zář_říj_lis_pro".split("_");

	    function plural(n) {
	        return (n > 1) && (n < 5) && (~~(n / 10) !== 1);
	    }

	    function translate(number, withoutSuffix, key, isFuture) {
	        var result = number + " ";
	        switch (key) {
	        case 's':  // a few seconds / in a few seconds / a few seconds ago
	            return (withoutSuffix || isFuture) ? 'pár vteřin' : 'pár vteřinami';
	        case 'm':  // a minute / in a minute / a minute ago
	            return withoutSuffix ? 'minuta' : (isFuture ? 'minutu' : 'minutou');
	        case 'mm': // 9 minutes / in 9 minutes / 9 minutes ago
	            if (withoutSuffix || isFuture) {
	                return result + (plural(number) ? 'minuty' : 'minut');
	            } else {
	                return result + 'minutami';
	            }
	            break;
	        case 'h':  // an hour / in an hour / an hour ago
	            return withoutSuffix ? 'hodina' : (isFuture ? 'hodinu' : 'hodinou');
	        case 'hh': // 9 hours / in 9 hours / 9 hours ago
	            if (withoutSuffix || isFuture) {
	                return result + (plural(number) ? 'hodiny' : 'hodin');
	            } else {
	                return result + 'hodinami';
	            }
	            break;
	        case 'd':  // a day / in a day / a day ago
	            return (withoutSuffix || isFuture) ? 'den' : 'dnem';
	        case 'dd': // 9 days / in 9 days / 9 days ago
	            if (withoutSuffix || isFuture) {
	                return result + (plural(number) ? 'dny' : 'dní');
	            } else {
	                return result + 'dny';
	            }
	            break;
	        case 'M':  // a month / in a month / a month ago
	            return (withoutSuffix || isFuture) ? 'měsíc' : 'měsícem';
	        case 'MM': // 9 months / in 9 months / 9 months ago
	            if (withoutSuffix || isFuture) {
	                return result + (plural(number) ? 'měsíce' : 'měsíců');
	            } else {
	                return result + 'měsíci';
	            }
	            break;
	        case 'y':  // a year / in a year / a year ago
	            return (withoutSuffix || isFuture) ? 'rok' : 'rokem';
	        case 'yy': // 9 years / in 9 years / 9 years ago
	            if (withoutSuffix || isFuture) {
	                return result + (plural(number) ? 'roky' : 'let');
	            } else {
	                return result + 'lety';
	            }
	            break;
	        }
	    }

	    return moment.lang('cs', {
	        months : months,
	        monthsShort : monthsShort,
	        monthsParse : (function (months, monthsShort) {
	            var i, _monthsParse = [];
	            for (i = 0; i < 12; i++) {
	                // use custom parser to solve problem with July (červenec)
	                _monthsParse[i] = new RegExp('^' + months[i] + '$|^' + monthsShort[i] + '$', 'i');
	            }
	            return _monthsParse;
	        }(months, monthsShort)),
	        weekdays : "neděle_pondělí_úterý_středa_čtvrtek_pátek_sobota".split("_"),
	        weekdaysShort : "ne_po_út_st_čt_pá_so".split("_"),
	        weekdaysMin : "ne_po_út_st_čt_pá_so".split("_"),
	        longDateFormat : {
	            LT: "H:mm",
	            L : "DD.MM.YYYY",
	            LL : "D. MMMM YYYY",
	            LLL : "D. MMMM YYYY LT",
	            LLLL : "dddd D. MMMM YYYY LT"
	        },
	        calendar : {
	            sameDay: "[dnes v] LT",
	            nextDay: '[zítra v] LT',
	            nextWeek: function () {
	                switch (this.day()) {
	                case 0:
	                    return '[v neděli v] LT';
	                case 1:
	                case 2:
	                    return '[v] dddd [v] LT';
	                case 3:
	                    return '[ve středu v] LT';
	                case 4:
	                    return '[ve čtvrtek v] LT';
	                case 5:
	                    return '[v pátek v] LT';
	                case 6:
	                    return '[v sobotu v] LT';
	                }
	            },
	            lastDay: '[včera v] LT',
	            lastWeek: function () {
	                switch (this.day()) {
	                case 0:
	                    return '[minulou neděli v] LT';
	                case 1:
	                case 2:
	                    return '[minulé] dddd [v] LT';
	                case 3:
	                    return '[minulou středu v] LT';
	                case 4:
	                case 5:
	                    return '[minulý] dddd [v] LT';
	                case 6:
	                    return '[minulou sobotu v] LT';
	                }
	            },
	            sameElse: "L"
	        },
	        relativeTime : {
	            future : "za %s",
	            past : "před %s",
	            s : translate,
	            m : translate,
	            mm : translate,
	            h : translate,
	            hh : translate,
	            d : translate,
	            dd : translate,
	            M : translate,
	            MM : translate,
	            y : translate,
	            yy : translate
	        },
	        ordinal : '%d.',
	        week : {
	            dow : 1, // Monday is the first day of the week.
	            doy : 4  // The week that contains Jan 4th is the first week of the year.
	        }
	    });
	}));


/***/ },
/* 17 */
/***/ function(module, exports, require) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;// moment.js language configuration
	// language : chuvash (cv)
	// author : Anatoly Mironov : https://github.com/mirontoli

	(function (factory) {
	    if (true) {
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [require(6)], __WEBPACK_AMD_DEFINE_RESULT__ = (factory.apply(null, __WEBPACK_AMD_DEFINE_ARRAY__)), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)); // AMD
	    } else if (typeof exports === 'object') {
	        module.exports = factory(require('../moment')); // Node
	    } else {
	        factory(window.moment); // Browser global
	    }
	}(function (moment) {
	    return moment.lang('cv', {
	        months : "кăрлач_нарăс_пуш_ака_май_çĕртме_утă_çурла_авăн_юпа_чӳк_раштав".split("_"),
	        monthsShort : "кăр_нар_пуш_ака_май_çĕр_утă_çур_ав_юпа_чӳк_раш".split("_"),
	        weekdays : "вырсарникун_тунтикун_ытларикун_юнкун_кĕçнерникун_эрнекун_шăматкун".split("_"),
	        weekdaysShort : "выр_тун_ытл_юн_кĕç_эрн_шăм".split("_"),
	        weekdaysMin : "вр_тн_ыт_юн_кç_эр_шм".split("_"),
	        longDateFormat : {
	            LT : "HH:mm",
	            L : "DD-MM-YYYY",
	            LL : "YYYY [çулхи] MMMM [уйăхĕн] D[-мĕшĕ]",
	            LLL : "YYYY [çулхи] MMMM [уйăхĕн] D[-мĕшĕ], LT",
	            LLLL : "dddd, YYYY [çулхи] MMMM [уйăхĕн] D[-мĕшĕ], LT"
	        },
	        calendar : {
	            sameDay: '[Паян] LT [сехетре]',
	            nextDay: '[Ыран] LT [сехетре]',
	            lastDay: '[Ĕнер] LT [сехетре]',
	            nextWeek: '[Çитес] dddd LT [сехетре]',
	            lastWeek: '[Иртнĕ] dddd LT [сехетре]',
	            sameElse: 'L'
	        },
	        relativeTime : {
	            future : function (output) {
	                var affix = /сехет$/i.exec(output) ? "рен" : /çул$/i.exec(output) ? "тан" : "ран";
	                return output + affix;
	            },
	            past : "%s каялла",
	            s : "пĕр-ик çеккунт",
	            m : "пĕр минут",
	            mm : "%d минут",
	            h : "пĕр сехет",
	            hh : "%d сехет",
	            d : "пĕр кун",
	            dd : "%d кун",
	            M : "пĕр уйăх",
	            MM : "%d уйăх",
	            y : "пĕр çул",
	            yy : "%d çул"
	        },
	        ordinal : '%d-мĕш',
	        week : {
	            dow : 1, // Monday is the first day of the week.
	            doy : 7  // The week that contains Jan 1st is the first week of the year.
	        }
	    });
	}));


/***/ },
/* 18 */
/***/ function(module, exports, require) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;// moment.js language configuration
	// language : Welsh (cy)
	// author : Robert Allen

	(function (factory) {
	    if (true) {
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [require(6)], __WEBPACK_AMD_DEFINE_RESULT__ = (factory.apply(null, __WEBPACK_AMD_DEFINE_ARRAY__)), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)); // AMD
	    } else if (typeof exports === 'object') {
	        module.exports = factory(require('../moment')); // Node
	    } else {
	        factory(window.moment); // Browser global
	    }
	}(function (moment) {
	    return moment.lang("cy", {
	        months: "Ionawr_Chwefror_Mawrth_Ebrill_Mai_Mehefin_Gorffennaf_Awst_Medi_Hydref_Tachwedd_Rhagfyr".split("_"),
	        monthsShort: "Ion_Chwe_Maw_Ebr_Mai_Meh_Gor_Aws_Med_Hyd_Tach_Rhag".split("_"),
	        weekdays: "Dydd Sul_Dydd Llun_Dydd Mawrth_Dydd Mercher_Dydd Iau_Dydd Gwener_Dydd Sadwrn".split("_"),
	        weekdaysShort: "Sul_Llun_Maw_Mer_Iau_Gwe_Sad".split("_"),
	        weekdaysMin: "Su_Ll_Ma_Me_Ia_Gw_Sa".split("_"),
	        // time formats are the same as en-gb
	        longDateFormat: {
	            LT: "HH:mm",
	            L: "DD/MM/YYYY",
	            LL: "D MMMM YYYY",
	            LLL: "D MMMM YYYY LT",
	            LLLL: "dddd, D MMMM YYYY LT"
	        },
	        calendar: {
	            sameDay: '[Heddiw am] LT',
	            nextDay: '[Yfory am] LT',
	            nextWeek: 'dddd [am] LT',
	            lastDay: '[Ddoe am] LT',
	            lastWeek: 'dddd [diwethaf am] LT',
	            sameElse: 'L'
	        },
	        relativeTime: {
	            future: "mewn %s",
	            past: "%s yn àl",
	            s: "ychydig eiliadau",
	            m: "munud",
	            mm: "%d munud",
	            h: "awr",
	            hh: "%d awr",
	            d: "diwrnod",
	            dd: "%d diwrnod",
	            M: "mis",
	            MM: "%d mis",
	            y: "blwyddyn",
	            yy: "%d flynedd"
	        },
	        // traditional ordinal numbers above 31 are not commonly used in colloquial Welsh
	        ordinal: function (number) {
	            var b = number,
	                output = '',
	                lookup = [
	                    '', 'af', 'il', 'ydd', 'ydd', 'ed', 'ed', 'ed', 'fed', 'fed', 'fed', // 1af to 10fed
	                    'eg', 'fed', 'eg', 'eg', 'fed', 'eg', 'eg', 'fed', 'eg', 'fed' // 11eg to 20fed
	                ];

	            if (b > 20) {
	                if (b === 40 || b === 50 || b === 60 || b === 80 || b === 100) {
	                    output = 'fed'; // not 30ain, 70ain or 90ain
	                } else {
	                    output = 'ain';
	                }
	            } else if (b > 0) {
	                output = lookup[b];
	            }

	            return number + output;
	        },
	        week : {
	            dow : 1, // Monday is the first day of the week.
	            doy : 4  // The week that contains Jan 4th is the first week of the year.
	        }
	    });
	}));


/***/ },
/* 19 */
/***/ function(module, exports, require) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;// moment.js language configuration
	// language : danish (da)
	// author : Ulrik Nielsen : https://github.com/mrbase

	(function (factory) {
	    if (true) {
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [require(6)], __WEBPACK_AMD_DEFINE_RESULT__ = (factory.apply(null, __WEBPACK_AMD_DEFINE_ARRAY__)), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)); // AMD
	    } else if (typeof exports === 'object') {
	        module.exports = factory(require('../moment')); // Node
	    } else {
	        factory(window.moment); // Browser global
	    }
	}(function (moment) {
	    return moment.lang('da', {
	        months : "januar_februar_marts_april_maj_juni_juli_august_september_oktober_november_december".split("_"),
	        monthsShort : "jan_feb_mar_apr_maj_jun_jul_aug_sep_okt_nov_dec".split("_"),
	        weekdays : "søndag_mandag_tirsdag_onsdag_torsdag_fredag_lørdag".split("_"),
	        weekdaysShort : "søn_man_tir_ons_tor_fre_lør".split("_"),
	        weekdaysMin : "sø_ma_ti_on_to_fr_lø".split("_"),
	        longDateFormat : {
	            LT : "HH:mm",
	            L : "DD/MM/YYYY",
	            LL : "D MMMM YYYY",
	            LLL : "D MMMM YYYY LT",
	            LLLL : "dddd D. MMMM, YYYY LT"
	        },
	        calendar : {
	            sameDay : '[I dag kl.] LT',
	            nextDay : '[I morgen kl.] LT',
	            nextWeek : 'dddd [kl.] LT',
	            lastDay : '[I går kl.] LT',
	            lastWeek : '[sidste] dddd [kl] LT',
	            sameElse : 'L'
	        },
	        relativeTime : {
	            future : "om %s",
	            past : "%s siden",
	            s : "få sekunder",
	            m : "et minut",
	            mm : "%d minutter",
	            h : "en time",
	            hh : "%d timer",
	            d : "en dag",
	            dd : "%d dage",
	            M : "en måned",
	            MM : "%d måneder",
	            y : "et år",
	            yy : "%d år"
	        },
	        ordinal : '%d.',
	        week : {
	            dow : 1, // Monday is the first day of the week.
	            doy : 4  // The week that contains Jan 4th is the first week of the year.
	        }
	    });
	}));


/***/ },
/* 20 */
/***/ function(module, exports, require) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;// moment.js language configuration
	// language : german (de)
	// author : lluchs : https://github.com/lluchs
	// author: Menelion Elensúle: https://github.com/Oire

	(function (factory) {
	    if (true) {
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [require(6)], __WEBPACK_AMD_DEFINE_RESULT__ = (factory.apply(null, __WEBPACK_AMD_DEFINE_ARRAY__)), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)); // AMD
	    } else if (typeof exports === 'object') {
	        module.exports = factory(require('../moment')); // Node
	    } else {
	        factory(window.moment); // Browser global
	    }
	}(function (moment) {
	    function processRelativeTime(number, withoutSuffix, key, isFuture) {
	        var format = {
	            'm': ['eine Minute', 'einer Minute'],
	            'h': ['eine Stunde', 'einer Stunde'],
	            'd': ['ein Tag', 'einem Tag'],
	            'dd': [number + ' Tage', number + ' Tagen'],
	            'M': ['ein Monat', 'einem Monat'],
	            'MM': [number + ' Monate', number + ' Monaten'],
	            'y': ['ein Jahr', 'einem Jahr'],
	            'yy': [number + ' Jahre', number + ' Jahren']
	        };
	        return withoutSuffix ? format[key][0] : format[key][1];
	    }

	    return moment.lang('de', {
	        months : "Januar_Februar_März_April_Mai_Juni_Juli_August_September_Oktober_November_Dezember".split("_"),
	        monthsShort : "Jan._Febr._Mrz._Apr._Mai_Jun._Jul._Aug._Sept._Okt._Nov._Dez.".split("_"),
	        weekdays : "Sonntag_Montag_Dienstag_Mittwoch_Donnerstag_Freitag_Samstag".split("_"),
	        weekdaysShort : "So._Mo._Di._Mi._Do._Fr._Sa.".split("_"),
	        weekdaysMin : "So_Mo_Di_Mi_Do_Fr_Sa".split("_"),
	        longDateFormat : {
	            LT: "H:mm [Uhr]",
	            L : "DD.MM.YYYY",
	            LL : "D. MMMM YYYY",
	            LLL : "D. MMMM YYYY LT",
	            LLLL : "dddd, D. MMMM YYYY LT"
	        },
	        calendar : {
	            sameDay: "[Heute um] LT",
	            sameElse: "L",
	            nextDay: '[Morgen um] LT',
	            nextWeek: 'dddd [um] LT',
	            lastDay: '[Gestern um] LT',
	            lastWeek: '[letzten] dddd [um] LT'
	        },
	        relativeTime : {
	            future : "in %s",
	            past : "vor %s",
	            s : "ein paar Sekunden",
	            m : processRelativeTime,
	            mm : "%d Minuten",
	            h : processRelativeTime,
	            hh : "%d Stunden",
	            d : processRelativeTime,
	            dd : processRelativeTime,
	            M : processRelativeTime,
	            MM : processRelativeTime,
	            y : processRelativeTime,
	            yy : processRelativeTime
	        },
	        ordinal : '%d.',
	        week : {
	            dow : 1, // Monday is the first day of the week.
	            doy : 4  // The week that contains Jan 4th is the first week of the year.
	        }
	    });
	}));


/***/ },
/* 21 */
/***/ function(module, exports, require) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;// moment.js language configuration
	// language : modern greek (el)
	// author : Aggelos Karalias : https://github.com/mehiel

	(function (factory) {
	    if (true) {
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [require(6)], __WEBPACK_AMD_DEFINE_RESULT__ = (factory.apply(null, __WEBPACK_AMD_DEFINE_ARRAY__)), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)); // AMD
	    } else if (typeof exports === 'object') {
	        module.exports = factory(require('../moment')); // Node
	    } else {
	        factory(window.moment); // Browser global
	    }
	}(function (moment) {
	    return moment.lang('el', {
	        monthsNominativeEl : "Ιανουάριος_Φεβρουάριος_Μάρτιος_Απρίλιος_Μάιος_Ιούνιος_Ιούλιος_Αύγουστος_Σεπτέμβριος_Οκτώβριος_Νοέμβριος_Δεκέμβριος".split("_"),
	        monthsGenitiveEl : "Ιανουαρίου_Φεβρουαρίου_Μαρτίου_Απριλίου_Μαΐου_Ιουνίου_Ιουλίου_Αυγούστου_Σεπτεμβρίου_Οκτωβρίου_Νοεμβρίου_Δεκεμβρίου".split("_"),
	        months : function (momentToFormat, format) {
	            if (/D/.test(format.substring(0, format.indexOf("MMMM")))) { // if there is a day number before 'MMMM'
	                return this._monthsGenitiveEl[momentToFormat.month()];
	            } else {
	                return this._monthsNominativeEl[momentToFormat.month()];
	            }
	        },
	        monthsShort : "Ιαν_Φεβ_Μαρ_Απρ_Μαϊ_Ιουν_Ιουλ_Αυγ_Σεπ_Οκτ_Νοε_Δεκ".split("_"),
	        weekdays : "Κυριακή_Δευτέρα_Τρίτη_Τετάρτη_Πέμπτη_Παρασκευή_Σάββατο".split("_"),
	        weekdaysShort : "Κυρ_Δευ_Τρι_Τετ_Πεμ_Παρ_Σαβ".split("_"),
	        weekdaysMin : "Κυ_Δε_Τρ_Τε_Πε_Πα_Σα".split("_"),
	        meridiem : function (hours, minutes, isLower) {
	            if (hours > 11) {
	                return isLower ? 'μμ' : 'ΜΜ';
	            } else {
	                return isLower ? 'πμ' : 'ΠΜ';
	            }
	        },
	        longDateFormat : {
	            LT : "h:mm A",
	            L : "DD/MM/YYYY",
	            LL : "D MMMM YYYY",
	            LLL : "D MMMM YYYY LT",
	            LLLL : "dddd, D MMMM YYYY LT"
	        },
	        calendarEl : {
	            sameDay : '[Σήμερα {}] LT',
	            nextDay : '[Αύριο {}] LT',
	            nextWeek : 'dddd [{}] LT',
	            lastDay : '[Χθες {}] LT',
	            lastWeek : '[την προηγούμενη] dddd [{}] LT',
	            sameElse : 'L'
	        },
	        calendar : function (key, mom) {
	            var output = this._calendarEl[key],
	                hours = mom && mom.hours();

	            return output.replace("{}", (hours % 12 === 1 ? "στη" : "στις"));
	        },
	        relativeTime : {
	            future : "σε %s",
	            past : "%s πριν",
	            s : "δευτερόλεπτα",
	            m : "ένα λεπτό",
	            mm : "%d λεπτά",
	            h : "μία ώρα",
	            hh : "%d ώρες",
	            d : "μία μέρα",
	            dd : "%d μέρες",
	            M : "ένας μήνας",
	            MM : "%d μήνες",
	            y : "ένας χρόνος",
	            yy : "%d χρόνια"
	        },
	        ordinal : function (number) {
	            return number + 'η';
	        },
	        week : {
	            dow : 1, // Monday is the first day of the week.
	            doy : 4  // The week that contains Jan 4st is the first week of the year.
	        }
	    });
	}));


/***/ },
/* 22 */
/***/ function(module, exports, require) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;// moment.js language configuration
	// language : australian english (en-au)

	(function (factory) {
	    if (true) {
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [require(6)], __WEBPACK_AMD_DEFINE_RESULT__ = (factory.apply(null, __WEBPACK_AMD_DEFINE_ARRAY__)), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)); // AMD
	    } else if (typeof exports === 'object') {
	        module.exports = factory(require('../moment')); // Node
	    } else {
	        factory(window.moment); // Browser global
	    }
	}(function (moment) {
	    return moment.lang('en-au', {
	        months : "January_February_March_April_May_June_July_August_September_October_November_December".split("_"),
	        monthsShort : "Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec".split("_"),
	        weekdays : "Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"),
	        weekdaysShort : "Sun_Mon_Tue_Wed_Thu_Fri_Sat".split("_"),
	        weekdaysMin : "Su_Mo_Tu_We_Th_Fr_Sa".split("_"),
	        longDateFormat : {
	            LT : "h:mm A",
	            L : "DD/MM/YYYY",
	            LL : "D MMMM YYYY",
	            LLL : "D MMMM YYYY LT",
	            LLLL : "dddd, D MMMM YYYY LT"
	        },
	        calendar : {
	            sameDay : '[Today at] LT',
	            nextDay : '[Tomorrow at] LT',
	            nextWeek : 'dddd [at] LT',
	            lastDay : '[Yesterday at] LT',
	            lastWeek : '[Last] dddd [at] LT',
	            sameElse : 'L'
	        },
	        relativeTime : {
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
	        ordinal : function (number) {
	            var b = number % 10,
	                output = (~~ (number % 100 / 10) === 1) ? 'th' :
	                (b === 1) ? 'st' :
	                (b === 2) ? 'nd' :
	                (b === 3) ? 'rd' : 'th';
	            return number + output;
	        },
	        week : {
	            dow : 1, // Monday is the first day of the week.
	            doy : 4  // The week that contains Jan 4th is the first week of the year.
	        }
	    });
	}));


/***/ },
/* 23 */
/***/ function(module, exports, require) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;// moment.js language configuration
	// language : canadian english (en-ca)
	// author : Jonathan Abourbih : https://github.com/jonbca

	(function (factory) {
	    if (true) {
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [require(6)], __WEBPACK_AMD_DEFINE_RESULT__ = (factory.apply(null, __WEBPACK_AMD_DEFINE_ARRAY__)), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)); // AMD
	    } else if (typeof exports === 'object') {
	        module.exports = factory(require('../moment')); // Node
	    } else {
	        factory(window.moment); // Browser global
	    }
	}(function (moment) {
	    return moment.lang('en-ca', {
	        months : "January_February_March_April_May_June_July_August_September_October_November_December".split("_"),
	        monthsShort : "Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec".split("_"),
	        weekdays : "Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"),
	        weekdaysShort : "Sun_Mon_Tue_Wed_Thu_Fri_Sat".split("_"),
	        weekdaysMin : "Su_Mo_Tu_We_Th_Fr_Sa".split("_"),
	        longDateFormat : {
	            LT : "h:mm A",
	            L : "YYYY-MM-DD",
	            LL : "D MMMM, YYYY",
	            LLL : "D MMMM, YYYY LT",
	            LLLL : "dddd, D MMMM, YYYY LT"
	        },
	        calendar : {
	            sameDay : '[Today at] LT',
	            nextDay : '[Tomorrow at] LT',
	            nextWeek : 'dddd [at] LT',
	            lastDay : '[Yesterday at] LT',
	            lastWeek : '[Last] dddd [at] LT',
	            sameElse : 'L'
	        },
	        relativeTime : {
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
	        ordinal : function (number) {
	            var b = number % 10,
	                output = (~~ (number % 100 / 10) === 1) ? 'th' :
	                (b === 1) ? 'st' :
	                (b === 2) ? 'nd' :
	                (b === 3) ? 'rd' : 'th';
	            return number + output;
	        }
	    });
	}));


/***/ },
/* 24 */
/***/ function(module, exports, require) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;// moment.js language configuration
	// language : great britain english (en-gb)
	// author : Chris Gedrim : https://github.com/chrisgedrim

	(function (factory) {
	    if (true) {
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [require(6)], __WEBPACK_AMD_DEFINE_RESULT__ = (factory.apply(null, __WEBPACK_AMD_DEFINE_ARRAY__)), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)); // AMD
	    } else if (typeof exports === 'object') {
	        module.exports = factory(require('../moment')); // Node
	    } else {
	        factory(window.moment); // Browser global
	    }
	}(function (moment) {
	    return moment.lang('en-gb', {
	        months : "January_February_March_April_May_June_July_August_September_October_November_December".split("_"),
	        monthsShort : "Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec".split("_"),
	        weekdays : "Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"),
	        weekdaysShort : "Sun_Mon_Tue_Wed_Thu_Fri_Sat".split("_"),
	        weekdaysMin : "Su_Mo_Tu_We_Th_Fr_Sa".split("_"),
	        longDateFormat : {
	            LT : "HH:mm",
	            L : "DD/MM/YYYY",
	            LL : "D MMMM YYYY",
	            LLL : "D MMMM YYYY LT",
	            LLLL : "dddd, D MMMM YYYY LT"
	        },
	        calendar : {
	            sameDay : '[Today at] LT',
	            nextDay : '[Tomorrow at] LT',
	            nextWeek : 'dddd [at] LT',
	            lastDay : '[Yesterday at] LT',
	            lastWeek : '[Last] dddd [at] LT',
	            sameElse : 'L'
	        },
	        relativeTime : {
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
	        ordinal : function (number) {
	            var b = number % 10,
	                output = (~~ (number % 100 / 10) === 1) ? 'th' :
	                (b === 1) ? 'st' :
	                (b === 2) ? 'nd' :
	                (b === 3) ? 'rd' : 'th';
	            return number + output;
	        },
	        week : {
	            dow : 1, // Monday is the first day of the week.
	            doy : 4  // The week that contains Jan 4th is the first week of the year.
	        }
	    });
	}));


/***/ },
/* 25 */
/***/ function(module, exports, require) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;// moment.js language configuration
	// language : esperanto (eo)
	// author : Colin Dean : https://github.com/colindean
	// komento: Mi estas malcerta se mi korekte traktis akuzativojn en tiu traduko.
	//          Se ne, bonvolu korekti kaj avizi min por ke mi povas lerni!

	(function (factory) {
	    if (true) {
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [require(6)], __WEBPACK_AMD_DEFINE_RESULT__ = (factory.apply(null, __WEBPACK_AMD_DEFINE_ARRAY__)), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)); // AMD
	    } else if (typeof exports === 'object') {
	        module.exports = factory(require('../moment')); // Node
	    } else {
	        factory(window.moment); // Browser global
	    }
	}(function (moment) {
	    return moment.lang('eo', {
	        months : "januaro_februaro_marto_aprilo_majo_junio_julio_aŭgusto_septembro_oktobro_novembro_decembro".split("_"),
	        monthsShort : "jan_feb_mar_apr_maj_jun_jul_aŭg_sep_okt_nov_dec".split("_"),
	        weekdays : "Dimanĉo_Lundo_Mardo_Merkredo_Ĵaŭdo_Vendredo_Sabato".split("_"),
	        weekdaysShort : "Dim_Lun_Mard_Merk_Ĵaŭ_Ven_Sab".split("_"),
	        weekdaysMin : "Di_Lu_Ma_Me_Ĵa_Ve_Sa".split("_"),
	        longDateFormat : {
	            LT : "HH:mm",
	            L : "YYYY-MM-DD",
	            LL : "D[-an de] MMMM, YYYY",
	            LLL : "D[-an de] MMMM, YYYY LT",
	            LLLL : "dddd, [la] D[-an de] MMMM, YYYY LT"
	        },
	        meridiem : function (hours, minutes, isLower) {
	            if (hours > 11) {
	                return isLower ? 'p.t.m.' : 'P.T.M.';
	            } else {
	                return isLower ? 'a.t.m.' : 'A.T.M.';
	            }
	        },
	        calendar : {
	            sameDay : '[Hodiaŭ je] LT',
	            nextDay : '[Morgaŭ je] LT',
	            nextWeek : 'dddd [je] LT',
	            lastDay : '[Hieraŭ je] LT',
	            lastWeek : '[pasinta] dddd [je] LT',
	            sameElse : 'L'
	        },
	        relativeTime : {
	            future : "je %s",
	            past : "antaŭ %s",
	            s : "sekundoj",
	            m : "minuto",
	            mm : "%d minutoj",
	            h : "horo",
	            hh : "%d horoj",
	            d : "tago",//ne 'diurno', ĉar estas uzita por proksimumo
	            dd : "%d tagoj",
	            M : "monato",
	            MM : "%d monatoj",
	            y : "jaro",
	            yy : "%d jaroj"
	        },
	        ordinal : "%da",
	        week : {
	            dow : 1, // Monday is the first day of the week.
	            doy : 7  // The week that contains Jan 1st is the first week of the year.
	        }
	    });
	}));


/***/ },
/* 26 */
/***/ function(module, exports, require) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;// moment.js language configuration
	// language : spanish (es)
	// author : Julio Napurí : https://github.com/julionc

	(function (factory) {
	    if (true) {
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [require(6)], __WEBPACK_AMD_DEFINE_RESULT__ = (factory.apply(null, __WEBPACK_AMD_DEFINE_ARRAY__)), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)); // AMD
	    } else if (typeof exports === 'object') {
	        module.exports = factory(require('../moment')); // Node
	    } else {
	        factory(window.moment); // Browser global
	    }
	}(function (moment) {
	    return moment.lang('es', {
	        months : "enero_febrero_marzo_abril_mayo_junio_julio_agosto_septiembre_octubre_noviembre_diciembre".split("_"),
	        monthsShort : "ene._feb._mar._abr._may._jun._jul._ago._sep._oct._nov._dic.".split("_"),
	        weekdays : "domingo_lunes_martes_miércoles_jueves_viernes_sábado".split("_"),
	        weekdaysShort : "dom._lun._mar._mié._jue._vie._sáb.".split("_"),
	        weekdaysMin : "Do_Lu_Ma_Mi_Ju_Vi_Sá".split("_"),
	        longDateFormat : {
	            LT : "H:mm",
	            L : "DD/MM/YYYY",
	            LL : "D [de] MMMM [de] YYYY",
	            LLL : "D [de] MMMM [de] YYYY LT",
	            LLLL : "dddd, D [de] MMMM [de] YYYY LT"
	        },
	        calendar : {
	            sameDay : function () {
	                return '[hoy a la' + ((this.hours() !== 1) ? 's' : '') + '] LT';
	            },
	            nextDay : function () {
	                return '[mañana a la' + ((this.hours() !== 1) ? 's' : '') + '] LT';
	            },
	            nextWeek : function () {
	                return 'dddd [a la' + ((this.hours() !== 1) ? 's' : '') + '] LT';
	            },
	            lastDay : function () {
	                return '[ayer a la' + ((this.hours() !== 1) ? 's' : '') + '] LT';
	            },
	            lastWeek : function () {
	                return '[el] dddd [pasado a la' + ((this.hours() !== 1) ? 's' : '') + '] LT';
	            },
	            sameElse : 'L'
	        },
	        relativeTime : {
	            future : "en %s",
	            past : "hace %s",
	            s : "unos segundos",
	            m : "un minuto",
	            mm : "%d minutos",
	            h : "una hora",
	            hh : "%d horas",
	            d : "un día",
	            dd : "%d días",
	            M : "un mes",
	            MM : "%d meses",
	            y : "un año",
	            yy : "%d años"
	        },
	        ordinal : '%dº',
	        week : {
	            dow : 1, // Monday is the first day of the week.
	            doy : 4  // The week that contains Jan 4th is the first week of the year.
	        }
	    });
	}));


/***/ },
/* 27 */
/***/ function(module, exports, require) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;// moment.js language configuration
	// language : estonian (et)
	// author : Henry Kehlmann : https://github.com/madhenry
	// improvements : Illimar Tambek : https://github.com/ragulka

	(function (factory) {
	    if (true) {
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [require(6)], __WEBPACK_AMD_DEFINE_RESULT__ = (factory.apply(null, __WEBPACK_AMD_DEFINE_ARRAY__)), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)); // AMD
	    } else if (typeof exports === 'object') {
	        module.exports = factory(require('../moment')); // Node
	    } else {
	        factory(window.moment); // Browser global
	    }
	}(function (moment) {
	    function processRelativeTime(number, withoutSuffix, key, isFuture) {
	        var format = {
	            's' : ['mõne sekundi', 'mõni sekund', 'paar sekundit'],
	            'm' : ['ühe minuti', 'üks minut'],
	            'mm': [number + ' minuti', number + ' minutit'],
	            'h' : ['ühe tunni', 'tund aega', 'üks tund'],
	            'hh': [number + ' tunni', number + ' tundi'],
	            'd' : ['ühe päeva', 'üks päev'],
	            'M' : ['kuu aja', 'kuu aega', 'üks kuu'],
	            'MM': [number + ' kuu', number + ' kuud'],
	            'y' : ['ühe aasta', 'aasta', 'üks aasta'],
	            'yy': [number + ' aasta', number + ' aastat']
	        };
	        if (withoutSuffix) {
	            return format[key][2] ? format[key][2] : format[key][1];
	        }
	        return isFuture ? format[key][0] : format[key][1];
	    }

	    return moment.lang('et', {
	        months        : "jaanuar_veebruar_märts_aprill_mai_juuni_juuli_august_september_oktoober_november_detsember".split("_"),
	        monthsShort   : "jaan_veebr_märts_apr_mai_juuni_juuli_aug_sept_okt_nov_dets".split("_"),
	        weekdays      : "pühapäev_esmaspäev_teisipäev_kolmapäev_neljapäev_reede_laupäev".split("_"),
	        weekdaysShort : "P_E_T_K_N_R_L".split("_"),
	        weekdaysMin   : "P_E_T_K_N_R_L".split("_"),
	        longDateFormat : {
	            LT   : "H:mm",
	            L    : "DD.MM.YYYY",
	            LL   : "D. MMMM YYYY",
	            LLL  : "D. MMMM YYYY LT",
	            LLLL : "dddd, D. MMMM YYYY LT"
	        },
	        calendar : {
	            sameDay  : '[Täna,] LT',
	            nextDay  : '[Homme,] LT',
	            nextWeek : '[Järgmine] dddd LT',
	            lastDay  : '[Eile,] LT',
	            lastWeek : '[Eelmine] dddd LT',
	            sameElse : 'L'
	        },
	        relativeTime : {
	            future : "%s pärast",
	            past   : "%s tagasi",
	            s      : processRelativeTime,
	            m      : processRelativeTime,
	            mm     : processRelativeTime,
	            h      : processRelativeTime,
	            hh     : processRelativeTime,
	            d      : processRelativeTime,
	            dd     : '%d päeva',
	            M      : processRelativeTime,
	            MM     : processRelativeTime,
	            y      : processRelativeTime,
	            yy     : processRelativeTime
	        },
	        ordinal : '%d.',
	        week : {
	            dow : 1, // Monday is the first day of the week.
	            doy : 4  // The week that contains Jan 4th is the first week of the year.
	        }
	    });
	}));


/***/ },
/* 28 */
/***/ function(module, exports, require) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;// moment.js language configuration
	// language : euskara (eu)
	// author : Eneko Illarramendi : https://github.com/eillarra

	(function (factory) {
	    if (true) {
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [require(6)], __WEBPACK_AMD_DEFINE_RESULT__ = (factory.apply(null, __WEBPACK_AMD_DEFINE_ARRAY__)), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)); // AMD
	    } else if (typeof exports === 'object') {
	        module.exports = factory(require('../moment')); // Node
	    } else {
	        factory(window.moment); // Browser global
	    }
	}(function (moment) {
	    return moment.lang('eu', {
	        months : "urtarrila_otsaila_martxoa_apirila_maiatza_ekaina_uztaila_abuztua_iraila_urria_azaroa_abendua".split("_"),
	        monthsShort : "urt._ots._mar._api._mai._eka._uzt._abu._ira._urr._aza._abe.".split("_"),
	        weekdays : "igandea_astelehena_asteartea_asteazkena_osteguna_ostirala_larunbata".split("_"),
	        weekdaysShort : "ig._al._ar._az._og._ol._lr.".split("_"),
	        weekdaysMin : "ig_al_ar_az_og_ol_lr".split("_"),
	        longDateFormat : {
	            LT : "HH:mm",
	            L : "YYYY-MM-DD",
	            LL : "YYYY[ko] MMMM[ren] D[a]",
	            LLL : "YYYY[ko] MMMM[ren] D[a] LT",
	            LLLL : "dddd, YYYY[ko] MMMM[ren] D[a] LT",
	            l : "YYYY-M-D",
	            ll : "YYYY[ko] MMM D[a]",
	            lll : "YYYY[ko] MMM D[a] LT",
	            llll : "ddd, YYYY[ko] MMM D[a] LT"
	        },
	        calendar : {
	            sameDay : '[gaur] LT[etan]',
	            nextDay : '[bihar] LT[etan]',
	            nextWeek : 'dddd LT[etan]',
	            lastDay : '[atzo] LT[etan]',
	            lastWeek : '[aurreko] dddd LT[etan]',
	            sameElse : 'L'
	        },
	        relativeTime : {
	            future : "%s barru",
	            past : "duela %s",
	            s : "segundo batzuk",
	            m : "minutu bat",
	            mm : "%d minutu",
	            h : "ordu bat",
	            hh : "%d ordu",
	            d : "egun bat",
	            dd : "%d egun",
	            M : "hilabete bat",
	            MM : "%d hilabete",
	            y : "urte bat",
	            yy : "%d urte"
	        },
	        ordinal : '%d.',
	        week : {
	            dow : 1, // Monday is the first day of the week.
	            doy : 7  // The week that contains Jan 1st is the first week of the year.
	        }
	    });
	}));


/***/ },
/* 29 */
/***/ function(module, exports, require) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;// moment.js language configuration
	// language : Persian Language
	// author : Ebrahim Byagowi : https://github.com/ebraminio

	(function (factory) {
	    if (true) {
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [require(6)], __WEBPACK_AMD_DEFINE_RESULT__ = (factory.apply(null, __WEBPACK_AMD_DEFINE_ARRAY__)), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)); // AMD
	    } else if (typeof exports === 'object') {
	        module.exports = factory(require('../moment')); // Node
	    } else {
	        factory(window.moment); // Browser global
	    }
	}(function (moment) {
	    var symbolMap = {
	        '1': '۱',
	        '2': '۲',
	        '3': '۳',
	        '4': '۴',
	        '5': '۵',
	        '6': '۶',
	        '7': '۷',
	        '8': '۸',
	        '9': '۹',
	        '0': '۰'
	    }, numberMap = {
	        '۱': '1',
	        '۲': '2',
	        '۳': '3',
	        '۴': '4',
	        '۵': '5',
	        '۶': '6',
	        '۷': '7',
	        '۸': '8',
	        '۹': '9',
	        '۰': '0'
	    };

	    return moment.lang('fa', {
	        months : 'ژانویه_فوریه_مارس_آوریل_مه_ژوئن_ژوئیه_اوت_سپتامبر_اکتبر_نوامبر_دسامبر'.split('_'),
	        monthsShort : 'ژانویه_فوریه_مارس_آوریل_مه_ژوئن_ژوئیه_اوت_سپتامبر_اکتبر_نوامبر_دسامبر'.split('_'),
	        weekdays : 'یک\u200cشنبه_دوشنبه_سه\u200cشنبه_چهارشنبه_پنج\u200cشنبه_جمعه_شنبه'.split('_'),
	        weekdaysShort : 'یک\u200cشنبه_دوشنبه_سه\u200cشنبه_چهارشنبه_پنج\u200cشنبه_جمعه_شنبه'.split('_'),
	        weekdaysMin : 'ی_د_س_چ_پ_ج_ش'.split('_'),
	        longDateFormat : {
	            LT : 'HH:mm',
	            L : 'DD/MM/YYYY',
	            LL : 'D MMMM YYYY',
	            LLL : 'D MMMM YYYY LT',
	            LLLL : 'dddd, D MMMM YYYY LT'
	        },
	        meridiem : function (hour, minute, isLower) {
	            if (hour < 12) {
	                return "قبل از ظهر";
	            } else {
	                return "بعد از ظهر";
	            }
	        },
	        calendar : {
	            sameDay : '[امروز ساعت] LT',
	            nextDay : '[فردا ساعت] LT',
	            nextWeek : 'dddd [ساعت] LT',
	            lastDay : '[دیروز ساعت] LT',
	            lastWeek : 'dddd [پیش] [ساعت] LT',
	            sameElse : 'L'
	        },
	        relativeTime : {
	            future : 'در %s',
	            past : '%s پیش',
	            s : 'چندین ثانیه',
	            m : 'یک دقیقه',
	            mm : '%d دقیقه',
	            h : 'یک ساعت',
	            hh : '%d ساعت',
	            d : 'یک روز',
	            dd : '%d روز',
	            M : 'یک ماه',
	            MM : '%d ماه',
	            y : 'یک سال',
	            yy : '%d سال'
	        },
	        preparse: function (string) {
	            return string.replace(/[۰-۹]/g, function (match) {
	                return numberMap[match];
	            }).replace(/،/g, ',');
	        },
	        postformat: function (string) {
	            return string.replace(/\d/g, function (match) {
	                return symbolMap[match];
	            }).replace(/,/g, '،');
	        },
	        ordinal : '%dم',
	        week : {
	            dow : 6, // Saturday is the first day of the week.
	            doy : 12 // The week that contains Jan 1st is the first week of the year.
	        }
	    });
	}));


/***/ },
/* 30 */
/***/ function(module, exports, require) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;// moment.js language configuration
	// language : finnish (fi)
	// author : Tarmo Aidantausta : https://github.com/bleadof

	(function (factory) {
	    if (true) {
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [require(6)], __WEBPACK_AMD_DEFINE_RESULT__ = (factory.apply(null, __WEBPACK_AMD_DEFINE_ARRAY__)), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)); // AMD
	    } else if (typeof exports === 'object') {
	        module.exports = factory(require('../moment')); // Node
	    } else {
	        factory(window.moment); // Browser global
	    }
	}(function (moment) {
	    var numbers_past = 'nolla yksi kaksi kolme neljä viisi kuusi seitsemän kahdeksan yhdeksän'.split(' '),
	        numbers_future = ['nolla', 'yhden', 'kahden', 'kolmen', 'neljän', 'viiden', 'kuuden',
	                          numbers_past[7], numbers_past[8], numbers_past[9]];

	    function translate(number, withoutSuffix, key, isFuture) {
	        var result = "";
	        switch (key) {
	        case 's':
	            return isFuture ? 'muutaman sekunnin' : 'muutama sekunti';
	        case 'm':
	            return isFuture ? 'minuutin' : 'minuutti';
	        case 'mm':
	            result = isFuture ? 'minuutin' : 'minuuttia';
	            break;
	        case 'h':
	            return isFuture ? 'tunnin' : 'tunti';
	        case 'hh':
	            result = isFuture ? 'tunnin' : 'tuntia';
	            break;
	        case 'd':
	            return isFuture ? 'päivän' : 'päivä';
	        case 'dd':
	            result = isFuture ? 'päivän' : 'päivää';
	            break;
	        case 'M':
	            return isFuture ? 'kuukauden' : 'kuukausi';
	        case 'MM':
	            result = isFuture ? 'kuukauden' : 'kuukautta';
	            break;
	        case 'y':
	            return isFuture ? 'vuoden' : 'vuosi';
	        case 'yy':
	            result = isFuture ? 'vuoden' : 'vuotta';
	            break;
	        }
	        result = verbal_number(number, isFuture) + " " + result;
	        return result;
	    }

	    function verbal_number(number, isFuture) {
	        return number < 10 ? (isFuture ? numbers_future[number] : numbers_past[number]) : number;
	    }

	    return moment.lang('fi', {
	        months : "tammikuu_helmikuu_maaliskuu_huhtikuu_toukokuu_kesäkuu_heinäkuu_elokuu_syyskuu_lokakuu_marraskuu_joulukuu".split("_"),
	        monthsShort : "tammi_helmi_maalis_huhti_touko_kesä_heinä_elo_syys_loka_marras_joulu".split("_"),
	        weekdays : "sunnuntai_maanantai_tiistai_keskiviikko_torstai_perjantai_lauantai".split("_"),
	        weekdaysShort : "su_ma_ti_ke_to_pe_la".split("_"),
	        weekdaysMin : "su_ma_ti_ke_to_pe_la".split("_"),
	        longDateFormat : {
	            LT : "HH.mm",
	            L : "DD.MM.YYYY",
	            LL : "Do MMMM[ta] YYYY",
	            LLL : "Do MMMM[ta] YYYY, [klo] LT",
	            LLLL : "dddd, Do MMMM[ta] YYYY, [klo] LT",
	            l : "D.M.YYYY",
	            ll : "Do MMM YYYY",
	            lll : "Do MMM YYYY, [klo] LT",
	            llll : "ddd, Do MMM YYYY, [klo] LT"
	        },
	        calendar : {
	            sameDay : '[tänään] [klo] LT',
	            nextDay : '[huomenna] [klo] LT',
	            nextWeek : 'dddd [klo] LT',
	            lastDay : '[eilen] [klo] LT',
	            lastWeek : '[viime] dddd[na] [klo] LT',
	            sameElse : 'L'
	        },
	        relativeTime : {
	            future : "%s päästä",
	            past : "%s sitten",
	            s : translate,
	            m : translate,
	            mm : translate,
	            h : translate,
	            hh : translate,
	            d : translate,
	            dd : translate,
	            M : translate,
	            MM : translate,
	            y : translate,
	            yy : translate
	        },
	        ordinal : "%d.",
	        week : {
	            dow : 1, // Monday is the first day of the week.
	            doy : 4  // The week that contains Jan 4th is the first week of the year.
	        }
	    });
	}));


/***/ },
/* 31 */
/***/ function(module, exports, require) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;// moment.js language configuration
	// language : faroese (fo)
	// author : Ragnar Johannesen : https://github.com/ragnar123

	(function (factory) {
	    if (true) {
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [require(6)], __WEBPACK_AMD_DEFINE_RESULT__ = (factory.apply(null, __WEBPACK_AMD_DEFINE_ARRAY__)), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)); // AMD
	    } else if (typeof exports === 'object') {
	        module.exports = factory(require('../moment')); // Node
	    } else {
	        factory(window.moment); // Browser global
	    }
	}(function (moment) {
	    return moment.lang('fo', {
	        months : "januar_februar_mars_apríl_mai_juni_juli_august_september_oktober_november_desember".split("_"),
	        monthsShort : "jan_feb_mar_apr_mai_jun_jul_aug_sep_okt_nov_des".split("_"),
	        weekdays : "sunnudagur_mánadagur_týsdagur_mikudagur_hósdagur_fríggjadagur_leygardagur".split("_"),
	        weekdaysShort : "sun_mán_týs_mik_hós_frí_ley".split("_"),
	        weekdaysMin : "su_má_tý_mi_hó_fr_le".split("_"),
	        longDateFormat : {
	            LT : "HH:mm",
	            L : "DD/MM/YYYY",
	            LL : "D MMMM YYYY",
	            LLL : "D MMMM YYYY LT",
	            LLLL : "dddd D. MMMM, YYYY LT"
	        },
	        calendar : {
	            sameDay : '[Í dag kl.] LT',
	            nextDay : '[Í morgin kl.] LT',
	            nextWeek : 'dddd [kl.] LT',
	            lastDay : '[Í gjár kl.] LT',
	            lastWeek : '[síðstu] dddd [kl] LT',
	            sameElse : 'L'
	        },
	        relativeTime : {
	            future : "um %s",
	            past : "%s síðani",
	            s : "fá sekund",
	            m : "ein minutt",
	            mm : "%d minuttir",
	            h : "ein tími",
	            hh : "%d tímar",
	            d : "ein dagur",
	            dd : "%d dagar",
	            M : "ein mánaði",
	            MM : "%d mánaðir",
	            y : "eitt ár",
	            yy : "%d ár"
	        },
	        ordinal : '%d.',
	        week : {
	            dow : 1, // Monday is the first day of the week.
	            doy : 4  // The week that contains Jan 4th is the first week of the year.
	        }
	    });
	}));


/***/ },
/* 32 */
/***/ function(module, exports, require) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;// moment.js language configuration
	// language : canadian french (fr-ca)
	// author : Jonathan Abourbih : https://github.com/jonbca

	(function (factory) {
	    if (true) {
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [require(6)], __WEBPACK_AMD_DEFINE_RESULT__ = (factory.apply(null, __WEBPACK_AMD_DEFINE_ARRAY__)), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)); // AMD
	    } else if (typeof exports === 'object') {
	        module.exports = factory(require('../moment')); // Node
	    } else {
	        factory(window.moment); // Browser global
	    }
	}(function (moment) {
	    return moment.lang('fr-ca', {
	        months : "janvier_février_mars_avril_mai_juin_juillet_août_septembre_octobre_novembre_décembre".split("_"),
	        monthsShort : "janv._févr._mars_avr._mai_juin_juil._août_sept._oct._nov._déc.".split("_"),
	        weekdays : "dimanche_lundi_mardi_mercredi_jeudi_vendredi_samedi".split("_"),
	        weekdaysShort : "dim._lun._mar._mer._jeu._ven._sam.".split("_"),
	        weekdaysMin : "Di_Lu_Ma_Me_Je_Ve_Sa".split("_"),
	        longDateFormat : {
	            LT : "HH:mm",
	            L : "YYYY-MM-DD",
	            LL : "D MMMM YYYY",
	            LLL : "D MMMM YYYY LT",
	            LLLL : "dddd D MMMM YYYY LT"
	        },
	        calendar : {
	            sameDay: "[Aujourd'hui à] LT",
	            nextDay: '[Demain à] LT',
	            nextWeek: 'dddd [à] LT',
	            lastDay: '[Hier à] LT',
	            lastWeek: 'dddd [dernier à] LT',
	            sameElse: 'L'
	        },
	        relativeTime : {
	            future : "dans %s",
	            past : "il y a %s",
	            s : "quelques secondes",
	            m : "une minute",
	            mm : "%d minutes",
	            h : "une heure",
	            hh : "%d heures",
	            d : "un jour",
	            dd : "%d jours",
	            M : "un mois",
	            MM : "%d mois",
	            y : "un an",
	            yy : "%d ans"
	        },
	        ordinal : function (number) {
	            return number + (number === 1 ? 'er' : '');
	        }
	    });
	}));


/***/ },
/* 33 */
/***/ function(module, exports, require) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;// moment.js language configuration
	// language : french (fr)
	// author : John Fischer : https://github.com/jfroffice

	(function (factory) {
	    if (true) {
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [require(6)], __WEBPACK_AMD_DEFINE_RESULT__ = (factory.apply(null, __WEBPACK_AMD_DEFINE_ARRAY__)), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)); // AMD
	    } else if (typeof exports === 'object') {
	        module.exports = factory(require('../moment')); // Node
	    } else {
	        factory(window.moment); // Browser global
	    }
	}(function (moment) {
	    return moment.lang('fr', {
	        months : "janvier_février_mars_avril_mai_juin_juillet_août_septembre_octobre_novembre_décembre".split("_"),
	        monthsShort : "janv._févr._mars_avr._mai_juin_juil._août_sept._oct._nov._déc.".split("_"),
	        weekdays : "dimanche_lundi_mardi_mercredi_jeudi_vendredi_samedi".split("_"),
	        weekdaysShort : "dim._lun._mar._mer._jeu._ven._sam.".split("_"),
	        weekdaysMin : "Di_Lu_Ma_Me_Je_Ve_Sa".split("_"),
	        longDateFormat : {
	            LT : "HH:mm",
	            L : "DD/MM/YYYY",
	            LL : "D MMMM YYYY",
	            LLL : "D MMMM YYYY LT",
	            LLLL : "dddd D MMMM YYYY LT"
	        },
	        calendar : {
	            sameDay: "[Aujourd'hui à] LT",
	            nextDay: '[Demain à] LT',
	            nextWeek: 'dddd [à] LT',
	            lastDay: '[Hier à] LT',
	            lastWeek: 'dddd [dernier à] LT',
	            sameElse: 'L'
	        },
	        relativeTime : {
	            future : "dans %s",
	            past : "il y a %s",
	            s : "quelques secondes",
	            m : "une minute",
	            mm : "%d minutes",
	            h : "une heure",
	            hh : "%d heures",
	            d : "un jour",
	            dd : "%d jours",
	            M : "un mois",
	            MM : "%d mois",
	            y : "un an",
	            yy : "%d ans"
	        },
	        ordinal : function (number) {
	            return number + (number === 1 ? 'er' : '');
	        },
	        week : {
	            dow : 1, // Monday is the first day of the week.
	            doy : 4  // The week that contains Jan 4th is the first week of the year.
	        }
	    });
	}));


/***/ },
/* 34 */
/***/ function(module, exports, require) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;// moment.js language configuration
	// language : galician (gl)
	// author : Juan G. Hurtado : https://github.com/juanghurtado

	(function (factory) {
	    if (true) {
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [require(6)], __WEBPACK_AMD_DEFINE_RESULT__ = (factory.apply(null, __WEBPACK_AMD_DEFINE_ARRAY__)), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)); // AMD
	    } else if (typeof exports === 'object') {
	        module.exports = factory(require('../moment')); // Node
	    } else {
	        factory(window.moment); // Browser global
	    }
	}(function (moment) {
	    return moment.lang('gl', {
	        months : "Xaneiro_Febreiro_Marzo_Abril_Maio_Xuño_Xullo_Agosto_Setembro_Outubro_Novembro_Decembro".split("_"),
	        monthsShort : "Xan._Feb._Mar._Abr._Mai._Xuñ._Xul._Ago._Set._Out._Nov._Dec.".split("_"),
	        weekdays : "Domingo_Luns_Martes_Mércores_Xoves_Venres_Sábado".split("_"),
	        weekdaysShort : "Dom._Lun._Mar._Mér._Xov._Ven._Sáb.".split("_"),
	        weekdaysMin : "Do_Lu_Ma_Mé_Xo_Ve_Sá".split("_"),
	        longDateFormat : {
	            LT : "H:mm",
	            L : "DD/MM/YYYY",
	            LL : "D MMMM YYYY",
	            LLL : "D MMMM YYYY LT",
	            LLLL : "dddd D MMMM YYYY LT"
	        },
	        calendar : {
	            sameDay : function () {
	                return '[hoxe ' + ((this.hours() !== 1) ? 'ás' : 'á') + '] LT';
	            },
	            nextDay : function () {
	                return '[mañá ' + ((this.hours() !== 1) ? 'ás' : 'á') + '] LT';
	            },
	            nextWeek : function () {
	                return 'dddd [' + ((this.hours() !== 1) ? 'ás' : 'a') + '] LT';
	            },
	            lastDay : function () {
	                return '[onte ' + ((this.hours() !== 1) ? 'á' : 'a') + '] LT';
	            },
	            lastWeek : function () {
	                return '[o] dddd [pasado ' + ((this.hours() !== 1) ? 'ás' : 'a') + '] LT';
	            },
	            sameElse : 'L'
	        },
	        relativeTime : {
	            future : function (str) {
	                if (str === "uns segundos") {
	                    return "nuns segundos";
	                }
	                return "en " + str;
	            },
	            past : "hai %s",
	            s : "uns segundos",
	            m : "un minuto",
	            mm : "%d minutos",
	            h : "unha hora",
	            hh : "%d horas",
	            d : "un día",
	            dd : "%d días",
	            M : "un mes",
	            MM : "%d meses",
	            y : "un ano",
	            yy : "%d anos"
	        },
	        ordinal : '%dº',
	        week : {
	            dow : 1, // Monday is the first day of the week.
	            doy : 7  // The week that contains Jan 1st is the first week of the year.
	        }
	    });
	}));


/***/ },
/* 35 */
/***/ function(module, exports, require) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;// moment.js language configuration
	// language : Hebrew (he)
	// author : Tomer Cohen : https://github.com/tomer
	// author : Moshe Simantov : https://github.com/DevelopmentIL
	// author : Tal Ater : https://github.com/TalAter

	(function (factory) {
	    if (true) {
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [require(6)], __WEBPACK_AMD_DEFINE_RESULT__ = (factory.apply(null, __WEBPACK_AMD_DEFINE_ARRAY__)), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)); // AMD
	    } else if (typeof exports === 'object') {
	        module.exports = factory(require('../moment')); // Node
	    } else {
	        factory(window.moment); // Browser global
	    }
	}(function (moment) {
	    return moment.lang('he', {
	        months : "ינואר_פברואר_מרץ_אפריל_מאי_יוני_יולי_אוגוסט_ספטמבר_אוקטובר_נובמבר_דצמבר".split("_"),
	        monthsShort : "ינו׳_פבר׳_מרץ_אפר׳_מאי_יוני_יולי_אוג׳_ספט׳_אוק׳_נוב׳_דצמ׳".split("_"),
	        weekdays : "ראשון_שני_שלישי_רביעי_חמישי_שישי_שבת".split("_"),
	        weekdaysShort : "א׳_ב׳_ג׳_ד׳_ה׳_ו׳_ש׳".split("_"),
	        weekdaysMin : "א_ב_ג_ד_ה_ו_ש".split("_"),
	        longDateFormat : {
	            LT : "HH:mm",
	            L : "DD/MM/YYYY",
	            LL : "D [ב]MMMM YYYY",
	            LLL : "D [ב]MMMM YYYY LT",
	            LLLL : "dddd, D [ב]MMMM YYYY LT",
	            l : "D/M/YYYY",
	            ll : "D MMM YYYY",
	            lll : "D MMM YYYY LT",
	            llll : "ddd, D MMM YYYY LT"
	        },
	        calendar : {
	            sameDay : '[היום ב־]LT',
	            nextDay : '[מחר ב־]LT',
	            nextWeek : 'dddd [בשעה] LT',
	            lastDay : '[אתמול ב־]LT',
	            lastWeek : '[ביום] dddd [האחרון בשעה] LT',
	            sameElse : 'L'
	        },
	        relativeTime : {
	            future : "בעוד %s",
	            past : "לפני %s",
	            s : "מספר שניות",
	            m : "דקה",
	            mm : "%d דקות",
	            h : "שעה",
	            hh : function (number) {
	                if (number === 2) {
	                    return "שעתיים";
	                }
	                return number + " שעות";
	            },
	            d : "יום",
	            dd : function (number) {
	                if (number === 2) {
	                    return "יומיים";
	                }
	                return number + " ימים";
	            },
	            M : "חודש",
	            MM : function (number) {
	                if (number === 2) {
	                    return "חודשיים";
	                }
	                return number + " חודשים";
	            },
	            y : "שנה",
	            yy : function (number) {
	                if (number === 2) {
	                    return "שנתיים";
	                }
	                return number + " שנים";
	            }
	        }
	    });
	}));


/***/ },
/* 36 */
/***/ function(module, exports, require) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;// moment.js language configuration
	// language : hindi (hi)
	// author : Mayank Singhal : https://github.com/mayanksinghal

	(function (factory) {
	    if (true) {
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [require(6)], __WEBPACK_AMD_DEFINE_RESULT__ = (factory.apply(null, __WEBPACK_AMD_DEFINE_ARRAY__)), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)); // AMD
	    } else if (typeof exports === 'object') {
	        module.exports = factory(require('../moment')); // Node
	    } else {
	        factory(window.moment); // Browser global
	    }
	}(function (moment) {
	    var symbolMap = {
	        '1': '१',
	        '2': '२',
	        '3': '३',
	        '4': '४',
	        '5': '५',
	        '6': '६',
	        '7': '७',
	        '8': '८',
	        '9': '९',
	        '0': '०'
	    },
	    numberMap = {
	        '१': '1',
	        '२': '2',
	        '३': '3',
	        '४': '4',
	        '५': '5',
	        '६': '6',
	        '७': '7',
	        '८': '8',
	        '९': '9',
	        '०': '0'
	    };

	    return moment.lang('hi', {
	        months : 'जनवरी_फ़रवरी_मार्च_अप्रैल_मई_जून_जुलाई_अगस्त_सितम्बर_अक्टूबर_नवम्बर_दिसम्बर'.split("_"),
	        monthsShort : 'जन._फ़र._मार्च_अप्रै._मई_जून_जुल._अग._सित._अक्टू._नव._दिस.'.split("_"),
	        weekdays : 'रविवार_सोमवार_मंगलवार_बुधवार_गुरूवार_शुक्रवार_शनिवार'.split("_"),
	        weekdaysShort : 'रवि_सोम_मंगल_बुध_गुरू_शुक्र_शनि'.split("_"),
	        weekdaysMin : 'र_सो_मं_बु_गु_शु_श'.split("_"),
	        longDateFormat : {
	            LT : "A h:mm बजे",
	            L : "DD/MM/YYYY",
	            LL : "D MMMM YYYY",
	            LLL : "D MMMM YYYY, LT",
	            LLLL : "dddd, D MMMM YYYY, LT"
	        },
	        calendar : {
	            sameDay : '[आज] LT',
	            nextDay : '[कल] LT',
	            nextWeek : 'dddd, LT',
	            lastDay : '[कल] LT',
	            lastWeek : '[पिछले] dddd, LT',
	            sameElse : 'L'
	        },
	        relativeTime : {
	            future : "%s में",
	            past : "%s पहले",
	            s : "कुछ ही क्षण",
	            m : "एक मिनट",
	            mm : "%d मिनट",
	            h : "एक घंटा",
	            hh : "%d घंटे",
	            d : "एक दिन",
	            dd : "%d दिन",
	            M : "एक महीने",
	            MM : "%d महीने",
	            y : "एक वर्ष",
	            yy : "%d वर्ष"
	        },
	        preparse: function (string) {
	            return string.replace(/[१२३४५६७८९०]/g, function (match) {
	                return numberMap[match];
	            });
	        },
	        postformat: function (string) {
	            return string.replace(/\d/g, function (match) {
	                return symbolMap[match];
	            });
	        },
	        // Hindi notation for meridiems are quite fuzzy in practice. While there exists
	        // a rigid notion of a 'Pahar' it is not used as rigidly in modern Hindi.
	        meridiem : function (hour, minute, isLower) {
	            if (hour < 4) {
	                return "रात";
	            } else if (hour < 10) {
	                return "सुबह";
	            } else if (hour < 17) {
	                return "दोपहर";
	            } else if (hour < 20) {
	                return "शाम";
	            } else {
	                return "रात";
	            }
	        },
	        week : {
	            dow : 0, // Sunday is the first day of the week.
	            doy : 6  // The week that contains Jan 1st is the first week of the year.
	        }
	    });
	}));


/***/ },
/* 37 */
/***/ function(module, exports, require) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;// moment.js language configuration
	// language : hrvatski (hr)
	// author : Bojan Marković : https://github.com/bmarkovic

	// based on (sl) translation by Robert Sedovšek

	(function (factory) {
	    if (true) {
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [require(6)], __WEBPACK_AMD_DEFINE_RESULT__ = (factory.apply(null, __WEBPACK_AMD_DEFINE_ARRAY__)), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)); // AMD
	    } else if (typeof exports === 'object') {
	        module.exports = factory(require('../moment')); // Node
	    } else {
	        factory(window.moment); // Browser global
	    }
	}(function (moment) {

	    function translate(number, withoutSuffix, key) {
	        var result = number + " ";
	        switch (key) {
	        case 'm':
	            return withoutSuffix ? 'jedna minuta' : 'jedne minute';
	        case 'mm':
	            if (number === 1) {
	                result += 'minuta';
	            } else if (number === 2 || number === 3 || number === 4) {
	                result += 'minute';
	            } else {
	                result += 'minuta';
	            }
	            return result;
	        case 'h':
	            return withoutSuffix ? 'jedan sat' : 'jednog sata';
	        case 'hh':
	            if (number === 1) {
	                result += 'sat';
	            } else if (number === 2 || number === 3 || number === 4) {
	                result += 'sata';
	            } else {
	                result += 'sati';
	            }
	            return result;
	        case 'dd':
	            if (number === 1) {
	                result += 'dan';
	            } else {
	                result += 'dana';
	            }
	            return result;
	        case 'MM':
	            if (number === 1) {
	                result += 'mjesec';
	            } else if (number === 2 || number === 3 || number === 4) {
	                result += 'mjeseca';
	            } else {
	                result += 'mjeseci';
	            }
	            return result;
	        case 'yy':
	            if (number === 1) {
	                result += 'godina';
	            } else if (number === 2 || number === 3 || number === 4) {
	                result += 'godine';
	            } else {
	                result += 'godina';
	            }
	            return result;
	        }
	    }

	    return moment.lang('hr', {
	        months : "sječanj_veljača_ožujak_travanj_svibanj_lipanj_srpanj_kolovoz_rujan_listopad_studeni_prosinac".split("_"),
	        monthsShort : "sje._vel._ožu._tra._svi._lip._srp._kol._ruj._lis._stu._pro.".split("_"),
	        weekdays : "nedjelja_ponedjeljak_utorak_srijeda_četvrtak_petak_subota".split("_"),
	        weekdaysShort : "ned._pon._uto._sri._čet._pet._sub.".split("_"),
	        weekdaysMin : "ne_po_ut_sr_če_pe_su".split("_"),
	        longDateFormat : {
	            LT : "H:mm",
	            L : "DD. MM. YYYY",
	            LL : "D. MMMM YYYY",
	            LLL : "D. MMMM YYYY LT",
	            LLLL : "dddd, D. MMMM YYYY LT"
	        },
	        calendar : {
	            sameDay  : '[danas u] LT',
	            nextDay  : '[sutra u] LT',

	            nextWeek : function () {
	                switch (this.day()) {
	                case 0:
	                    return '[u] [nedjelju] [u] LT';
	                case 3:
	                    return '[u] [srijedu] [u] LT';
	                case 6:
	                    return '[u] [subotu] [u] LT';
	                case 1:
	                case 2:
	                case 4:
	                case 5:
	                    return '[u] dddd [u] LT';
	                }
	            },
	            lastDay  : '[jučer u] LT',
	            lastWeek : function () {
	                switch (this.day()) {
	                case 0:
	                case 3:
	                    return '[prošlu] dddd [u] LT';
	                case 6:
	                    return '[prošle] [subote] [u] LT';
	                case 1:
	                case 2:
	                case 4:
	                case 5:
	                    return '[prošli] dddd [u] LT';
	                }
	            },
	            sameElse : 'L'
	        },
	        relativeTime : {
	            future : "za %s",
	            past   : "prije %s",
	            s      : "par sekundi",
	            m      : translate,
	            mm     : translate,
	            h      : translate,
	            hh     : translate,
	            d      : "dan",
	            dd     : translate,
	            M      : "mjesec",
	            MM     : translate,
	            y      : "godinu",
	            yy     : translate
	        },
	        ordinal : '%d.',
	        week : {
	            dow : 1, // Monday is the first day of the week.
	            doy : 7  // The week that contains Jan 1st is the first week of the year.
	        }
	    });
	}));


/***/ },
/* 38 */
/***/ function(module, exports, require) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;// moment.js language configuration
	// language : hungarian (hu)
	// author : Adam Brunner : https://github.com/adambrunner

	(function (factory) {
	    if (true) {
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [require(6)], __WEBPACK_AMD_DEFINE_RESULT__ = (factory.apply(null, __WEBPACK_AMD_DEFINE_ARRAY__)), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)); // AMD
	    } else if (typeof exports === 'object') {
	        module.exports = factory(require('../moment')); // Node
	    } else {
	        factory(window.moment); // Browser global
	    }
	}(function (moment) {
	    var weekEndings = 'vasárnap hétfőn kedden szerdán csütörtökön pénteken szombaton'.split(' ');

	    function translate(number, withoutSuffix, key, isFuture) {
	        var num = number,
	            suffix;

	        switch (key) {
	        case 's':
	            return (isFuture || withoutSuffix) ? 'néhány másodperc' : 'néhány másodperce';
	        case 'm':
	            return 'egy' + (isFuture || withoutSuffix ? ' perc' : ' perce');
	        case 'mm':
	            return num + (isFuture || withoutSuffix ? ' perc' : ' perce');
	        case 'h':
	            return 'egy' + (isFuture || withoutSuffix ? ' óra' : ' órája');
	        case 'hh':
	            return num + (isFuture || withoutSuffix ? ' óra' : ' órája');
	        case 'd':
	            return 'egy' + (isFuture || withoutSuffix ? ' nap' : ' napja');
	        case 'dd':
	            return num + (isFuture || withoutSuffix ? ' nap' : ' napja');
	        case 'M':
	            return 'egy' + (isFuture || withoutSuffix ? ' hónap' : ' hónapja');
	        case 'MM':
	            return num + (isFuture || withoutSuffix ? ' hónap' : ' hónapja');
	        case 'y':
	            return 'egy' + (isFuture || withoutSuffix ? ' év' : ' éve');
	        case 'yy':
	            return num + (isFuture || withoutSuffix ? ' év' : ' éve');
	        }

	        return '';
	    }

	    function week(isFuture) {
	        return (isFuture ? '' : '[múlt] ') + '[' + weekEndings[this.day()] + '] LT[-kor]';
	    }

	    return moment.lang('hu', {
	        months : "január_február_március_április_május_június_július_augusztus_szeptember_október_november_december".split("_"),
	        monthsShort : "jan_feb_márc_ápr_máj_jún_júl_aug_szept_okt_nov_dec".split("_"),
	        weekdays : "vasárnap_hétfő_kedd_szerda_csütörtök_péntek_szombat".split("_"),
	        weekdaysShort : "vas_hét_kedd_sze_csüt_pén_szo".split("_"),
	        weekdaysMin : "v_h_k_sze_cs_p_szo".split("_"),
	        longDateFormat : {
	            LT : "H:mm",
	            L : "YYYY.MM.DD.",
	            LL : "YYYY. MMMM D.",
	            LLL : "YYYY. MMMM D., LT",
	            LLLL : "YYYY. MMMM D., dddd LT"
	        },
	        calendar : {
	            sameDay : '[ma] LT[-kor]',
	            nextDay : '[holnap] LT[-kor]',
	            nextWeek : function () {
	                return week.call(this, true);
	            },
	            lastDay : '[tegnap] LT[-kor]',
	            lastWeek : function () {
	                return week.call(this, false);
	            },
	            sameElse : 'L'
	        },
	        relativeTime : {
	            future : "%s múlva",
	            past : "%s",
	            s : translate,
	            m : translate,
	            mm : translate,
	            h : translate,
	            hh : translate,
	            d : translate,
	            dd : translate,
	            M : translate,
	            MM : translate,
	            y : translate,
	            yy : translate
	        },
	        ordinal : '%d.',
	        week : {
	            dow : 1, // Monday is the first day of the week.
	            doy : 7  // The week that contains Jan 1st is the first week of the year.
	        }
	    });
	}));


/***/ },
/* 39 */
/***/ function(module, exports, require) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;// moment.js language configuration
	// language : Armenian (hy-am)
	// author : Armendarabyan : https://github.com/armendarabyan

	(function (factory) {
	    if (true) {
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [require(6)], __WEBPACK_AMD_DEFINE_RESULT__ = (factory.apply(null, __WEBPACK_AMD_DEFINE_ARRAY__)), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)); // AMD
	    } else if (typeof exports === 'object') {
	        module.exports = factory(require('../moment')); // Node
	    } else {
	        factory(window.moment); // Browser global
	    }
	}(function (moment) {

	    function monthsCaseReplace(m, format) {
	        var months = {
	            'nominative': 'հունվար_փետրվար_մարտ_ապրիլ_մայիս_հունիս_հուլիս_օգոստոս_սեպտեմբեր_հոկտեմբեր_նոյեմբեր_դեկտեմբեր'.split('_'),
	            'accusative': 'հունվարի_փետրվարի_մարտի_ապրիլի_մայիսի_հունիսի_հուլիսի_օգոստոսի_սեպտեմբերի_հոկտեմբերի_նոյեմբերի_դեկտեմբերի'.split('_')
	        },

	        nounCase = (/D[oD]?(\[[^\[\]]*\]|\s+)+MMMM?/).test(format) ?
	            'accusative' :
	            'nominative';

	        return months[nounCase][m.month()];
	    }

	    function monthsShortCaseReplace(m, format) {
	        var monthsShort = 'հնվ_փտր_մրտ_ապր_մյս_հնս_հլս_օգս_սպտ_հկտ_նմբ_դկտ'.split('_');

	        return monthsShort[m.month()];
	    }

	    function weekdaysCaseReplace(m, format) {
	        var weekdays = 'կիրակի_երկուշաբթի_երեքշաբթի_չորեքշաբթի_հինգշաբթի_ուրբաթ_շաբաթ'.split('_');

	        return weekdays[m.day()];
	    }

	    return moment.lang('hy-am', {
	        months : monthsCaseReplace,
	        monthsShort : monthsShortCaseReplace,
	        weekdays : weekdaysCaseReplace,
	        weekdaysShort : "կրկ_երկ_երք_չրք_հնգ_ուրբ_շբթ".split("_"),
	        weekdaysMin : "կրկ_երկ_երք_չրք_հնգ_ուրբ_շբթ".split("_"),
	        longDateFormat : {
	            LT : "HH:mm",
	            L : "DD.MM.YYYY",
	            LL : "D MMMM YYYY թ.",
	            LLL : "D MMMM YYYY թ., LT",
	            LLLL : "dddd, D MMMM YYYY թ., LT"
	        },
	        calendar : {
	            sameDay: '[այսօր] LT',
	            nextDay: '[վաղը] LT',
	            lastDay: '[երեկ] LT',
	            nextWeek: function () {
	                return 'dddd [օրը ժամը] LT';
	            },
	            lastWeek: function () {
	                return '[անցած] dddd [օրը ժամը] LT';
	            },
	            sameElse: 'L'
	        },
	        relativeTime : {
	            future : "%s հետո",
	            past : "%s առաջ",
	            s : "մի քանի վայրկյան",
	            m : "րոպե",
	            mm : "%d րոպե",
	            h : "ժամ",
	            hh : "%d ժամ",
	            d : "օր",
	            dd : "%d օր",
	            M : "ամիս",
	            MM : "%d ամիս",
	            y : "տարի",
	            yy : "%d տարի"
	        },

	        meridiem : function (hour) {
	            if (hour < 4) {
	                return "գիշերվա";
	            } else if (hour < 12) {
	                return "առավոտվա";
	            } else if (hour < 17) {
	                return "ցերեկվա";
	            } else {
	                return "երեկոյան";
	            }
	        },

	        ordinal: function (number, period) {
	            switch (period) {
	            case 'DDD':
	            case 'w':
	            case 'W':
	            case 'DDDo':
	                if (number === 1) {
	                    return number + '-ին';
	                }
	                return number + '-րդ';
	            default:
	                return number;
	            }
	        },

	        week : {
	            dow : 1, // Monday is the first day of the week.
	            doy : 7  // The week that contains Jan 1st is the first week of the year.
	        }
	    });
	}));


/***/ },
/* 40 */
/***/ function(module, exports, require) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;// moment.js language configuration
	// language : Bahasa Indonesia (id)
	// author : Mohammad Satrio Utomo : https://github.com/tyok
	// reference: http://id.wikisource.org/wiki/Pedoman_Umum_Ejaan_Bahasa_Indonesia_yang_Disempurnakan

	(function (factory) {
	    if (true) {
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [require(6)], __WEBPACK_AMD_DEFINE_RESULT__ = (factory.apply(null, __WEBPACK_AMD_DEFINE_ARRAY__)), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)); // AMD
	    } else if (typeof exports === 'object') {
	        module.exports = factory(require('../moment')); // Node
	    } else {
	        factory(window.moment); // Browser global
	    }
	}(function (moment) {
	    return moment.lang('id', {
	        months : "Januari_Februari_Maret_April_Mei_Juni_Juli_Agustus_September_Oktober_November_Desember".split("_"),
	        monthsShort : "Jan_Feb_Mar_Apr_Mei_Jun_Jul_Ags_Sep_Okt_Nov_Des".split("_"),
	        weekdays : "Minggu_Senin_Selasa_Rabu_Kamis_Jumat_Sabtu".split("_"),
	        weekdaysShort : "Min_Sen_Sel_Rab_Kam_Jum_Sab".split("_"),
	        weekdaysMin : "Mg_Sn_Sl_Rb_Km_Jm_Sb".split("_"),
	        longDateFormat : {
	            LT : "HH.mm",
	            L : "DD/MM/YYYY",
	            LL : "D MMMM YYYY",
	            LLL : "D MMMM YYYY [pukul] LT",
	            LLLL : "dddd, D MMMM YYYY [pukul] LT"
	        },
	        meridiem : function (hours, minutes, isLower) {
	            if (hours < 11) {
	                return 'pagi';
	            } else if (hours < 15) {
	                return 'siang';
	            } else if (hours < 19) {
	                return 'sore';
	            } else {
	                return 'malam';
	            }
	        },
	        calendar : {
	            sameDay : '[Hari ini pukul] LT',
	            nextDay : '[Besok pukul] LT',
	            nextWeek : 'dddd [pukul] LT',
	            lastDay : '[Kemarin pukul] LT',
	            lastWeek : 'dddd [lalu pukul] LT',
	            sameElse : 'L'
	        },
	        relativeTime : {
	            future : "dalam %s",
	            past : "%s yang lalu",
	            s : "beberapa detik",
	            m : "semenit",
	            mm : "%d menit",
	            h : "sejam",
	            hh : "%d jam",
	            d : "sehari",
	            dd : "%d hari",
	            M : "sebulan",
	            MM : "%d bulan",
	            y : "setahun",
	            yy : "%d tahun"
	        },
	        week : {
	            dow : 1, // Monday is the first day of the week.
	            doy : 7  // The week that contains Jan 1st is the first week of the year.
	        }
	    });
	}));


/***/ },
/* 41 */
/***/ function(module, exports, require) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;// moment.js language configuration
	// language : icelandic (is)
	// author : Hinrik Örn Sigurðsson : https://github.com/hinrik

	(function (factory) {
	    if (true) {
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [require(6)], __WEBPACK_AMD_DEFINE_RESULT__ = (factory.apply(null, __WEBPACK_AMD_DEFINE_ARRAY__)), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)); // AMD
	    } else if (typeof exports === 'object') {
	        module.exports = factory(require('../moment')); // Node
	    } else {
	        factory(window.moment); // Browser global
	    }
	}(function (moment) {
	    function plural(n) {
	        if (n % 100 === 11) {
	            return true;
	        } else if (n % 10 === 1) {
	            return false;
	        }
	        return true;
	    }

	    function translate(number, withoutSuffix, key, isFuture) {
	        var result = number + " ";
	        switch (key) {
	        case 's':
	            return withoutSuffix || isFuture ? 'nokkrar sekúndur' : 'nokkrum sekúndum';
	        case 'm':
	            return withoutSuffix ? 'mínúta' : 'mínútu';
	        case 'mm':
	            if (plural(number)) {
	                return result + (withoutSuffix || isFuture ? 'mínútur' : 'mínútum');
	            } else if (withoutSuffix) {
	                return result + 'mínúta';
	            }
	            return result + 'mínútu';
	        case 'hh':
	            if (plural(number)) {
	                return result + (withoutSuffix || isFuture ? 'klukkustundir' : 'klukkustundum');
	            }
	            return result + 'klukkustund';
	        case 'd':
	            if (withoutSuffix) {
	                return 'dagur';
	            }
	            return isFuture ? 'dag' : 'degi';
	        case 'dd':
	            if (plural(number)) {
	                if (withoutSuffix) {
	                    return result + 'dagar';
	                }
	                return result + (isFuture ? 'daga' : 'dögum');
	            } else if (withoutSuffix) {
	                return result + 'dagur';
	            }
	            return result + (isFuture ? 'dag' : 'degi');
	        case 'M':
	            if (withoutSuffix) {
	                return 'mánuður';
	            }
	            return isFuture ? 'mánuð' : 'mánuði';
	        case 'MM':
	            if (plural(number)) {
	                if (withoutSuffix) {
	                    return result + 'mánuðir';
	                }
	                return result + (isFuture ? 'mánuði' : 'mánuðum');
	            } else if (withoutSuffix) {
	                return result + 'mánuður';
	            }
	            return result + (isFuture ? 'mánuð' : 'mánuði');
	        case 'y':
	            return withoutSuffix || isFuture ? 'ár' : 'ári';
	        case 'yy':
	            if (plural(number)) {
	                return result + (withoutSuffix || isFuture ? 'ár' : 'árum');
	            }
	            return result + (withoutSuffix || isFuture ? 'ár' : 'ári');
	        }
	    }

	    return moment.lang('is', {
	        months : "janúar_febrúar_mars_apríl_maí_júní_júlí_ágúst_september_október_nóvember_desember".split("_"),
	        monthsShort : "jan_feb_mar_apr_maí_jún_júl_ágú_sep_okt_nóv_des".split("_"),
	        weekdays : "sunnudagur_mánudagur_þriðjudagur_miðvikudagur_fimmtudagur_föstudagur_laugardagur".split("_"),
	        weekdaysShort : "sun_mán_þri_mið_fim_fös_lau".split("_"),
	        weekdaysMin : "Su_Má_Þr_Mi_Fi_Fö_La".split("_"),
	        longDateFormat : {
	            LT : "H:mm",
	            L : "DD/MM/YYYY",
	            LL : "D. MMMM YYYY",
	            LLL : "D. MMMM YYYY [kl.] LT",
	            LLLL : "dddd, D. MMMM YYYY [kl.] LT"
	        },
	        calendar : {
	            sameDay : '[í dag kl.] LT',
	            nextDay : '[á morgun kl.] LT',
	            nextWeek : 'dddd [kl.] LT',
	            lastDay : '[í gær kl.] LT',
	            lastWeek : '[síðasta] dddd [kl.] LT',
	            sameElse : 'L'
	        },
	        relativeTime : {
	            future : "eftir %s",
	            past : "fyrir %s síðan",
	            s : translate,
	            m : translate,
	            mm : translate,
	            h : "klukkustund",
	            hh : translate,
	            d : translate,
	            dd : translate,
	            M : translate,
	            MM : translate,
	            y : translate,
	            yy : translate
	        },
	        ordinal : '%d.',
	        week : {
	            dow : 1, // Monday is the first day of the week.
	            doy : 4  // The week that contains Jan 4th is the first week of the year.
	        }
	    });
	}));


/***/ },
/* 42 */
/***/ function(module, exports, require) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;// moment.js language configuration
	// language : italian (it)
	// author : Lorenzo : https://github.com/aliem
	// author: Mattia Larentis: https://github.com/nostalgiaz

	(function (factory) {
	    if (true) {
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [require(6)], __WEBPACK_AMD_DEFINE_RESULT__ = (factory.apply(null, __WEBPACK_AMD_DEFINE_ARRAY__)), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)); // AMD
	    } else if (typeof exports === 'object') {
	        module.exports = factory(require('../moment')); // Node
	    } else {
	        factory(window.moment); // Browser global
	    }
	}(function (moment) {
	    return moment.lang('it', {
	        months : "Gennaio_Febbraio_Marzo_Aprile_Maggio_Giugno_Luglio_Agosto_Settembre_Ottobre_Novembre_Dicembre".split("_"),
	        monthsShort : "Gen_Feb_Mar_Apr_Mag_Giu_Lug_Ago_Set_Ott_Nov_Dic".split("_"),
	        weekdays : "Domenica_Lunedì_Martedì_Mercoledì_Giovedì_Venerdì_Sabato".split("_"),
	        weekdaysShort : "Dom_Lun_Mar_Mer_Gio_Ven_Sab".split("_"),
	        weekdaysMin : "D_L_Ma_Me_G_V_S".split("_"),
	        longDateFormat : {
	            LT : "HH:mm",
	            L : "DD/MM/YYYY",
	            LL : "D MMMM YYYY",
	            LLL : "D MMMM YYYY LT",
	            LLLL : "dddd, D MMMM YYYY LT"
	        },
	        calendar : {
	            sameDay: '[Oggi alle] LT',
	            nextDay: '[Domani alle] LT',
	            nextWeek: 'dddd [alle] LT',
	            lastDay: '[Ieri alle] LT',
	            lastWeek: '[lo scorso] dddd [alle] LT',
	            sameElse: 'L'
	        },
	        relativeTime : {
	            future : function (s) {
	                return ((/^[0-9].+$/).test(s) ? "tra" : "in") + " " + s;
	            },
	            past : "%s fa",
	            s : "alcuni secondi",
	            m : "un minuto",
	            mm : "%d minuti",
	            h : "un'ora",
	            hh : "%d ore",
	            d : "un giorno",
	            dd : "%d giorni",
	            M : "un mese",
	            MM : "%d mesi",
	            y : "un anno",
	            yy : "%d anni"
	        },
	        ordinal: '%dº',
	        week : {
	            dow : 1, // Monday is the first day of the week.
	            doy : 4  // The week that contains Jan 4th is the first week of the year.
	        }
	    });
	}));


/***/ },
/* 43 */
/***/ function(module, exports, require) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;// moment.js language configuration
	// language : japanese (ja)
	// author : LI Long : https://github.com/baryon

	(function (factory) {
	    if (true) {
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [require(6)], __WEBPACK_AMD_DEFINE_RESULT__ = (factory.apply(null, __WEBPACK_AMD_DEFINE_ARRAY__)), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)); // AMD
	    } else if (typeof exports === 'object') {
	        module.exports = factory(require('../moment')); // Node
	    } else {
	        factory(window.moment); // Browser global
	    }
	}(function (moment) {
	    return moment.lang('ja', {
	        months : "1月_2月_3月_4月_5月_6月_7月_8月_9月_10月_11月_12月".split("_"),
	        monthsShort : "1月_2月_3月_4月_5月_6月_7月_8月_9月_10月_11月_12月".split("_"),
	        weekdays : "日曜日_月曜日_火曜日_水曜日_木曜日_金曜日_土曜日".split("_"),
	        weekdaysShort : "日_月_火_水_木_金_土".split("_"),
	        weekdaysMin : "日_月_火_水_木_金_土".split("_"),
	        longDateFormat : {
	            LT : "Ah時m分",
	            L : "YYYY/MM/DD",
	            LL : "YYYY年M月D日",
	            LLL : "YYYY年M月D日LT",
	            LLLL : "YYYY年M月D日LT dddd"
	        },
	        meridiem : function (hour, minute, isLower) {
	            if (hour < 12) {
	                return "午前";
	            } else {
	                return "午後";
	            }
	        },
	        calendar : {
	            sameDay : '[今日] LT',
	            nextDay : '[明日] LT',
	            nextWeek : '[来週]dddd LT',
	            lastDay : '[昨日] LT',
	            lastWeek : '[前週]dddd LT',
	            sameElse : 'L'
	        },
	        relativeTime : {
	            future : "%s後",
	            past : "%s前",
	            s : "数秒",
	            m : "1分",
	            mm : "%d分",
	            h : "1時間",
	            hh : "%d時間",
	            d : "1日",
	            dd : "%d日",
	            M : "1ヶ月",
	            MM : "%dヶ月",
	            y : "1年",
	            yy : "%d年"
	        }
	    });
	}));


/***/ },
/* 44 */
/***/ function(module, exports, require) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;// moment.js language configuration
	// language : Georgian (ka)
	// author : Irakli Janiashvili : https://github.com/irakli-janiashvili

	(function (factory) {
	    if (true) {
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [require(6)], __WEBPACK_AMD_DEFINE_RESULT__ = (factory.apply(null, __WEBPACK_AMD_DEFINE_ARRAY__)), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)); // AMD
	    } else if (typeof exports === 'object') {
	        module.exports = factory(require('../moment')); // Node
	    } else {
	        factory(window.moment); // Browser global
	    }
	}(function (moment) {

	    function monthsCaseReplace(m, format) {
	        var months = {
	            'nominative': 'იანვარი_თებერვალი_მარტი_აპრილი_მაისი_ივნისი_ივლისი_აგვისტო_სექტემბერი_ოქტომბერი_ნოემბერი_დეკემბერი'.split('_'),
	            'accusative': 'იანვარს_თებერვალს_მარტს_აპრილის_მაისს_ივნისს_ივლისს_აგვისტს_სექტემბერს_ოქტომბერს_ნოემბერს_დეკემბერს'.split('_')
	        },

	        nounCase = (/D[oD] *MMMM?/).test(format) ?
	            'accusative' :
	            'nominative';

	        return months[nounCase][m.month()];
	    }

	    function weekdaysCaseReplace(m, format) {
	        var weekdays = {
	            'nominative': 'კვირა_ორშაბათი_სამშაბათი_ოთხშაბათი_ხუთშაბათი_პარასკევი_შაბათი'.split('_'),
	            'accusative': 'კვირას_ორშაბათს_სამშაბათს_ოთხშაბათს_ხუთშაბათს_პარასკევს_შაბათს'.split('_')
	        },

	        nounCase = (/(წინა|შემდეგ)/).test(format) ?
	            'accusative' :
	            'nominative';

	        return weekdays[nounCase][m.day()];
	    }

	    return moment.lang('ka', {
	        months : monthsCaseReplace,
	        monthsShort : "იან_თებ_მარ_აპრ_მაი_ივნ_ივლ_აგვ_სექ_ოქტ_ნოე_დეკ".split("_"),
	        weekdays : weekdaysCaseReplace,
	        weekdaysShort : "კვი_ორშ_სამ_ოთხ_ხუთ_პარ_შაბ".split("_"),
	        weekdaysMin : "კვ_ორ_სა_ოთ_ხუ_პა_შა".split("_"),
	        longDateFormat : {
	            LT : "h:mm A",
	            L : "DD/MM/YYYY",
	            LL : "D MMMM YYYY",
	            LLL : "D MMMM YYYY LT",
	            LLLL : "dddd, D MMMM YYYY LT"
	        },
	        calendar : {
	            sameDay : '[დღეს] LT[-ზე]',
	            nextDay : '[ხვალ] LT[-ზე]',
	            lastDay : '[გუშინ] LT[-ზე]',
	            nextWeek : '[შემდეგ] dddd LT[-ზე]',
	            lastWeek : '[წინა] dddd LT-ზე',
	            sameElse : 'L'
	        },
	        relativeTime : {
	            future : function (s) {
	                return (/(წამი|წუთი|საათი|წელი)/).test(s) ?
	                    s.replace(/ი$/, "ში") :
	                    s + "ში";
	            },
	            past : function (s) {
	                if ((/(წამი|წუთი|საათი|დღე|თვე)/).test(s)) {
	                    return s.replace(/(ი|ე)$/, "ის წინ");
	                }
	                if ((/წელი/).test(s)) {
	                    return s.replace(/წელი$/, "წლის წინ");
	                }
	            },
	            s : "რამდენიმე წამი",
	            m : "წუთი",
	            mm : "%d წუთი",
	            h : "საათი",
	            hh : "%d საათი",
	            d : "დღე",
	            dd : "%d დღე",
	            M : "თვე",
	            MM : "%d თვე",
	            y : "წელი",
	            yy : "%d წელი"
	        },
	        ordinal : function (number) {
	            if (number === 0) {
	                return number;
	            }

	            if (number === 1) {
	                return number + "-ლი";
	            }

	            if ((number < 20) || (number <= 100 && (number % 20 === 0)) || (number % 100 === 0)) {
	                return "მე-" + number;
	            }

	            return number + "-ე";
	        },
	        week : {
	            dow : 1,
	            doy : 7
	        }
	    });
	}));


/***/ },
/* 45 */
/***/ function(module, exports, require) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;// moment.js language configuration
	// language : korean (ko)
	//
	// authors 
	//
	// - Kyungwook, Park : https://github.com/kyungw00k
	// - Jeeeyul Lee <jeeeyul@gmail.com>
	(function (factory) {
	    if (true) {
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [require(6)], __WEBPACK_AMD_DEFINE_RESULT__ = (factory.apply(null, __WEBPACK_AMD_DEFINE_ARRAY__)), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)); // AMD
	    } else if (typeof exports === 'object') {
	        module.exports = factory(require('../moment')); // Node
	    } else {
	        factory(window.moment); // Browser global
	    }
	}(function (moment) {
	    return moment.lang('ko', {
	        months : "1월_2월_3월_4월_5월_6월_7월_8월_9월_10월_11월_12월".split("_"),
	        monthsShort : "1월_2월_3월_4월_5월_6월_7월_8월_9월_10월_11월_12월".split("_"),
	        weekdays : "일요일_월요일_화요일_수요일_목요일_금요일_토요일".split("_"),
	        weekdaysShort : "일_월_화_수_목_금_토".split("_"),
	        weekdaysMin : "일_월_화_수_목_금_토".split("_"),
	        longDateFormat : {
	            LT : "A h시 mm분",
	            L : "YYYY.MM.DD",
	            LL : "YYYY년 MMMM D일",
	            LLL : "YYYY년 MMMM D일 LT",
	            LLLL : "YYYY년 MMMM D일 dddd LT"
	        },
	        meridiem : function (hour, minute, isUpper) {
	            return hour < 12 ? '오전' : '오후';
	        },
	        calendar : {
	            sameDay : '오늘 LT',
	            nextDay : '내일 LT',
	            nextWeek : 'dddd LT',
	            lastDay : '어제 LT',
	            lastWeek : '지난주 dddd LT',
	            sameElse : 'L'
	        },
	        relativeTime : {
	            future : "%s 후",
	            past : "%s 전",
	            s : "몇초",
	            ss : "%d초",
	            m : "일분",
	            mm : "%d분",
	            h : "한시간",
	            hh : "%d시간",
	            d : "하루",
	            dd : "%d일",
	            M : "한달",
	            MM : "%d달",
	            y : "일년",
	            yy : "%d년"
	        },
	        ordinal : '%d일',
	        meridiemParse : /(오전|오후)/,
	        isPM : function (token) {
	            return token === "오후";
	        }
	    });
	}));


/***/ },
/* 46 */
/***/ function(module, exports, require) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;// moment.js language configuration
	// language : Luxembourgish (lb)
	// author : mweimerskirch : https://github.com/mweimerskirch

	// Note: Luxembourgish has a very particular phonological rule ("Eifeler Regel") that causes the
	// deletion of the final "n" in certain contexts. That's what the "eifelerRegelAppliesToWeekday"
	// and "eifelerRegelAppliesToNumber" methods are meant for

	(function (factory) {
	    if (true) {
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [require(6)], __WEBPACK_AMD_DEFINE_RESULT__ = (factory.apply(null, __WEBPACK_AMD_DEFINE_ARRAY__)), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)); // AMD
	    } else if (typeof exports === 'object') {
	        module.exports = factory(require('../moment')); // Node
	    } else {
	        factory(window.moment); // Browser global
	    }
	}(function (moment) {
	    function processRelativeTime(number, withoutSuffix, key, isFuture) {
	        var format = {
	            'm': ['eng Minutt', 'enger Minutt'],
	            'h': ['eng Stonn', 'enger Stonn'],
	            'd': ['een Dag', 'engem Dag'],
	            'dd': [number + ' Deeg', number + ' Deeg'],
	            'M': ['ee Mount', 'engem Mount'],
	            'MM': [number + ' Méint', number + ' Méint'],
	            'y': ['ee Joer', 'engem Joer'],
	            'yy': [number + ' Joer', number + ' Joer']
	        };
	        return withoutSuffix ? format[key][0] : format[key][1];
	    }

	    function processFutureTime(string) {
	        var number = string.substr(0, string.indexOf(' '));
	        if (eifelerRegelAppliesToNumber(number)) {
	            return "a " + string;
	        }
	        return "an " + string;
	    }

	    function processPastTime(string) {
	        var number = string.substr(0, string.indexOf(' '));
	        if (eifelerRegelAppliesToNumber(number)) {
	            return "viru " + string;
	        }
	        return "virun " + string;
	    }

	    function processLastWeek(string1) {
	        var weekday = this.format('d');
	        if (eifelerRegelAppliesToWeekday(weekday)) {
	            return '[Leschte] dddd [um] LT';
	        }
	        return '[Leschten] dddd [um] LT';
	    }

	    /**
	     * Returns true if the word before the given week day loses the "-n" ending.
	     * e.g. "Leschten Dënschdeg" but "Leschte Méindeg"
	     *
	     * @param weekday {integer}
	     * @returns {boolean}
	     */
	    function eifelerRegelAppliesToWeekday(weekday) {
	        weekday = parseInt(weekday, 10);
	        switch (weekday) {
	        case 0: // Sonndeg
	        case 1: // Méindeg
	        case 3: // Mëttwoch
	        case 5: // Freideg
	        case 6: // Samschdeg
	            return true;
	        default: // 2 Dënschdeg, 4 Donneschdeg
	            return false;
	        }
	    }

	    /**
	     * Returns true if the word before the given number loses the "-n" ending.
	     * e.g. "an 10 Deeg" but "a 5 Deeg"
	     *
	     * @param number {integer}
	     * @returns {boolean}
	     */
	    function eifelerRegelAppliesToNumber(number) {
	        number = parseInt(number, 10);
	        if (isNaN(number)) {
	            return false;
	        }
	        if (number < 0) {
	            // Negative Number --> always true
	            return true;
	        } else if (number < 10) {
	            // Only 1 digit
	            if (4 <= number && number <= 7) {
	                return true;
	            }
	            return false;
	        } else if (number < 100) {
	            // 2 digits
	            var lastDigit = number % 10, firstDigit = number / 10;
	            if (lastDigit === 0) {
	                return eifelerRegelAppliesToNumber(firstDigit);
	            }
	            return eifelerRegelAppliesToNumber(lastDigit);
	        } else if (number < 10000) {
	            // 3 or 4 digits --> recursively check first digit
	            while (number >= 10) {
	                number = number / 10;
	            }
	            return eifelerRegelAppliesToNumber(number);
	        } else {
	            // Anything larger than 4 digits: recursively check first n-3 digits
	            number = number / 1000;
	            return eifelerRegelAppliesToNumber(number);
	        }
	    }

	    return moment.lang('lb', {
	        months: "Januar_Februar_Mäerz_Abrëll_Mee_Juni_Juli_August_September_Oktober_November_Dezember".split("_"),
	        monthsShort: "Jan._Febr._Mrz._Abr._Mee_Jun._Jul._Aug._Sept._Okt._Nov._Dez.".split("_"),
	        weekdays: "Sonndeg_Méindeg_Dënschdeg_Mëttwoch_Donneschdeg_Freideg_Samschdeg".split("_"),
	        weekdaysShort: "So._Mé._Dë._Më._Do._Fr._Sa.".split("_"),
	        weekdaysMin: "So_Mé_Dë_Më_Do_Fr_Sa".split("_"),
	        longDateFormat: {
	            LT: "H:mm [Auer]",
	            L: "DD.MM.YYYY",
	            LL: "D. MMMM YYYY",
	            LLL: "D. MMMM YYYY LT",
	            LLLL: "dddd, D. MMMM YYYY LT"
	        },
	        calendar: {
	            sameDay: "[Haut um] LT",
	            sameElse: "L",
	            nextDay: '[Muer um] LT',
	            nextWeek: 'dddd [um] LT',
	            lastDay: '[Gëschter um] LT',
	            lastWeek: processLastWeek
	        },
	        relativeTime: {
	            future: processFutureTime,
	            past: processPastTime,
	            s: "e puer Sekonnen",
	            m: processRelativeTime,
	            mm: "%d Minutten",
	            h: processRelativeTime,
	            hh: "%d Stonnen",
	            d: processRelativeTime,
	            dd: processRelativeTime,
	            M: processRelativeTime,
	            MM: processRelativeTime,
	            y: processRelativeTime,
	            yy: processRelativeTime
	        },
	        ordinal: '%d.',
	        week: {
	            dow: 1, // Monday is the first day of the week.
	            doy: 4  // The week that contains Jan 4th is the first week of the year.
	        }
	    });
	}));


/***/ },
/* 47 */
/***/ function(module, exports, require) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;// moment.js language configuration
	// language : Lithuanian (lt)
	// author : Mindaugas Mozūras : https://github.com/mmozuras

	(function (factory) {
	    if (true) {
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [require(6)], __WEBPACK_AMD_DEFINE_RESULT__ = (factory.apply(null, __WEBPACK_AMD_DEFINE_ARRAY__)), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)); // AMD
	    } else if (typeof exports === 'object') {
	        module.exports = factory(require('../moment')); // Node
	    } else {
	        factory(window.moment); // Browser global
	    }
	}(function (moment) {
	    var units = {
	        "m" : "minutė_minutės_minutę",
	        "mm": "minutės_minučių_minutes",
	        "h" : "valanda_valandos_valandą",
	        "hh": "valandos_valandų_valandas",
	        "d" : "diena_dienos_dieną",
	        "dd": "dienos_dienų_dienas",
	        "M" : "mėnuo_mėnesio_mėnesį",
	        "MM": "mėnesiai_mėnesių_mėnesius",
	        "y" : "metai_metų_metus",
	        "yy": "metai_metų_metus"
	    },
	    weekDays = "pirmadienis_antradienis_trečiadienis_ketvirtadienis_penktadienis_šeštadienis_sekmadienis".split("_");

	    function translateSeconds(number, withoutSuffix, key, isFuture) {
	        if (withoutSuffix) {
	            return "kelios sekundės";
	        } else {
	            return isFuture ? "kelių sekundžių" : "kelias sekundes";
	        }
	    }

	    function translateSingular(number, withoutSuffix, key, isFuture) {
	        return withoutSuffix ? forms(key)[0] : (isFuture ? forms(key)[1] : forms(key)[2]);
	    }

	    function special(number) {
	        return number % 10 === 0 || (number > 10 && number < 20);
	    }

	    function forms(key) {
	        return units[key].split("_");
	    }

	    function translate(number, withoutSuffix, key, isFuture) {
	        var result = number + " ";
	        if (number === 1) {
	            return result + translateSingular(number, withoutSuffix, key[0], isFuture);
	        } else if (withoutSuffix) {
	            return result + (special(number) ? forms(key)[1] : forms(key)[0]);
	        } else {
	            if (isFuture) {
	                return result + forms(key)[1];
	            } else {
	                return result + (special(number) ? forms(key)[1] : forms(key)[2]);
	            }
	        }
	    }

	    function relativeWeekDay(moment, format) {
	        var nominative = format.indexOf('dddd LT') === -1,
	            weekDay = weekDays[moment.weekday()];

	        return nominative ? weekDay : weekDay.substring(0, weekDay.length - 2) + "į";
	    }

	    return moment.lang("lt", {
	        months : "sausio_vasario_kovo_balandžio_gegužės_biržėlio_liepos_rugpjūčio_rugsėjo_spalio_lapkričio_gruodžio".split("_"),
	        monthsShort : "sau_vas_kov_bal_geg_bir_lie_rgp_rgs_spa_lap_grd".split("_"),
	        weekdays : relativeWeekDay,
	        weekdaysShort : "Sek_Pir_Ant_Tre_Ket_Pen_Šeš".split("_"),
	        weekdaysMin : "S_P_A_T_K_Pn_Š".split("_"),
	        longDateFormat : {
	            LT : "HH:mm",
	            L : "YYYY-MM-DD",
	            LL : "YYYY [m.] MMMM D [d.]",
	            LLL : "YYYY [m.] MMMM D [d.], LT [val.]",
	            LLLL : "YYYY [m.] MMMM D [d.], dddd, LT [val.]",
	            l : "YYYY-MM-DD",
	            ll : "YYYY [m.] MMMM D [d.]",
	            lll : "YYYY [m.] MMMM D [d.], LT [val.]",
	            llll : "YYYY [m.] MMMM D [d.], ddd, LT [val.]"
	        },
	        calendar : {
	            sameDay : "[Šiandien] LT",
	            nextDay : "[Rytoj] LT",
	            nextWeek : "dddd LT",
	            lastDay : "[Vakar] LT",
	            lastWeek : "[Praėjusį] dddd LT",
	            sameElse : "L"
	        },
	        relativeTime : {
	            future : "po %s",
	            past : "prieš %s",
	            s : translateSeconds,
	            m : translateSingular,
	            mm : translate,
	            h : translateSingular,
	            hh : translate,
	            d : translateSingular,
	            dd : translate,
	            M : translateSingular,
	            MM : translate,
	            y : translateSingular,
	            yy : translate
	        },
	        ordinal : function (number) {
	            return number + '-oji';
	        },
	        week : {
	            dow : 1, // Monday is the first day of the week.
	            doy : 4  // The week that contains Jan 4th is the first week of the year.
	        }
	    });
	}));


/***/ },
/* 48 */
/***/ function(module, exports, require) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;// moment.js language configuration
	// language : latvian (lv)
	// author : Kristaps Karlsons : https://github.com/skakri

	(function (factory) {
	    if (true) {
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [require(6)], __WEBPACK_AMD_DEFINE_RESULT__ = (factory.apply(null, __WEBPACK_AMD_DEFINE_ARRAY__)), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)); // AMD
	    } else if (typeof exports === 'object') {
	        module.exports = factory(require('../moment')); // Node
	    } else {
	        factory(window.moment); // Browser global
	    }
	}(function (moment) {
	    var units = {
	        'mm': 'minūti_minūtes_minūte_minūtes',
	        'hh': 'stundu_stundas_stunda_stundas',
	        'dd': 'dienu_dienas_diena_dienas',
	        'MM': 'mēnesi_mēnešus_mēnesis_mēneši',
	        'yy': 'gadu_gadus_gads_gadi'
	    };

	    function format(word, number, withoutSuffix) {
	        var forms = word.split('_');
	        if (withoutSuffix) {
	            return number % 10 === 1 && number !== 11 ? forms[2] : forms[3];
	        } else {
	            return number % 10 === 1 && number !== 11 ? forms[0] : forms[1];
	        }
	    }

	    function relativeTimeWithPlural(number, withoutSuffix, key) {
	        return number + ' ' + format(units[key], number, withoutSuffix);
	    }

	    return moment.lang('lv', {
	        months : "janvāris_februāris_marts_aprīlis_maijs_jūnijs_jūlijs_augusts_septembris_oktobris_novembris_decembris".split("_"),
	        monthsShort : "jan_feb_mar_apr_mai_jūn_jūl_aug_sep_okt_nov_dec".split("_"),
	        weekdays : "svētdiena_pirmdiena_otrdiena_trešdiena_ceturtdiena_piektdiena_sestdiena".split("_"),
	        weekdaysShort : "Sv_P_O_T_C_Pk_S".split("_"),
	        weekdaysMin : "Sv_P_O_T_C_Pk_S".split("_"),
	        longDateFormat : {
	            LT : "HH:mm",
	            L : "DD.MM.YYYY",
	            LL : "YYYY. [gada] D. MMMM",
	            LLL : "YYYY. [gada] D. MMMM, LT",
	            LLLL : "YYYY. [gada] D. MMMM, dddd, LT"
	        },
	        calendar : {
	            sameDay : '[Šodien pulksten] LT',
	            nextDay : '[Rīt pulksten] LT',
	            nextWeek : 'dddd [pulksten] LT',
	            lastDay : '[Vakar pulksten] LT',
	            lastWeek : '[Pagājušā] dddd [pulksten] LT',
	            sameElse : 'L'
	        },
	        relativeTime : {
	            future : "%s vēlāk",
	            past : "%s agrāk",
	            s : "dažas sekundes",
	            m : "minūti",
	            mm : relativeTimeWithPlural,
	            h : "stundu",
	            hh : relativeTimeWithPlural,
	            d : "dienu",
	            dd : relativeTimeWithPlural,
	            M : "mēnesi",
	            MM : relativeTimeWithPlural,
	            y : "gadu",
	            yy : relativeTimeWithPlural
	        },
	        ordinal : '%d.',
	        week : {
	            dow : 1, // Monday is the first day of the week.
	            doy : 4  // The week that contains Jan 4th is the first week of the year.
	        }
	    });
	}));


/***/ },
/* 49 */
/***/ function(module, exports, require) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;// moment.js language configuration
	// language : macedonian (mk)
	// author : Borislav Mickov : https://github.com/B0k0

	(function (factory) {
	    if (true) {
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [require(6)], __WEBPACK_AMD_DEFINE_RESULT__ = (factory.apply(null, __WEBPACK_AMD_DEFINE_ARRAY__)), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)); // AMD
	    } else if (typeof exports === 'object') {
	        module.exports = factory(require('../moment')); // Node
	    } else {
	        factory(window.moment); // Browser global
	    }
	}(function (moment) {
	    return moment.lang('mk', {
	        months : "јануари_февруари_март_април_мај_јуни_јули_август_септември_октомври_ноември_декември".split("_"),
	        monthsShort : "јан_фев_мар_апр_мај_јун_јул_авг_сеп_окт_ное_дек".split("_"),
	        weekdays : "недела_понеделник_вторник_среда_четврток_петок_сабота".split("_"),
	        weekdaysShort : "нед_пон_вто_сре_чет_пет_саб".split("_"),
	        weekdaysMin : "нe_пo_вт_ср_че_пе_сa".split("_"),
	        longDateFormat : {
	            LT : "H:mm",
	            L : "D.MM.YYYY",
	            LL : "D MMMM YYYY",
	            LLL : "D MMMM YYYY LT",
	            LLLL : "dddd, D MMMM YYYY LT"
	        },
	        calendar : {
	            sameDay : '[Денес во] LT',
	            nextDay : '[Утре во] LT',
	            nextWeek : 'dddd [во] LT',
	            lastDay : '[Вчера во] LT',
	            lastWeek : function () {
	                switch (this.day()) {
	                case 0:
	                case 3:
	                case 6:
	                    return '[Во изминатата] dddd [во] LT';
	                case 1:
	                case 2:
	                case 4:
	                case 5:
	                    return '[Во изминатиот] dddd [во] LT';
	                }
	            },
	            sameElse : 'L'
	        },
	        relativeTime : {
	            future : "после %s",
	            past : "пред %s",
	            s : "неколку секунди",
	            m : "минута",
	            mm : "%d минути",
	            h : "час",
	            hh : "%d часа",
	            d : "ден",
	            dd : "%d дена",
	            M : "месец",
	            MM : "%d месеци",
	            y : "година",
	            yy : "%d години"
	        },
	        ordinal : function (number) {
	            var lastDigit = number % 10,
	                last2Digits = number % 100;
	            if (number === 0) {
	                return number + '-ев';
	            } else if (last2Digits === 0) {
	                return number + '-ен';
	            } else if (last2Digits > 10 && last2Digits < 20) {
	                return number + '-ти';
	            } else if (lastDigit === 1) {
	                return number + '-ви';
	            } else if (lastDigit === 2) {
	                return number + '-ри';
	            } else if (lastDigit === 7 || lastDigit === 8) {
	                return number + '-ми';
	            } else {
	                return number + '-ти';
	            }
	        },
	        week : {
	            dow : 1, // Monday is the first day of the week.
	            doy : 7  // The week that contains Jan 1st is the first week of the year.
	        }
	    });
	}));


/***/ },
/* 50 */
/***/ function(module, exports, require) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;// moment.js language configuration
	// language : malayalam (ml)
	// author : Floyd Pink : https://github.com/floydpink

	(function (factory) {
	    if (true) {
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [require(6)], __WEBPACK_AMD_DEFINE_RESULT__ = (factory.apply(null, __WEBPACK_AMD_DEFINE_ARRAY__)), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)); // AMD
	    } else if (typeof exports === 'object') {
	        module.exports = factory(require('../moment')); // Node
	    } else {
	        factory(window.moment); // Browser global
	    }
	}(function (moment) {
	    return moment.lang('ml', {
	        months : 'ജനുവരി_ഫെബ്രുവരി_മാർച്ച്_ഏപ്രിൽ_മേയ്_ജൂൺ_ജൂലൈ_ഓഗസ്റ്റ്_സെപ്റ്റംബർ_ഒക്ടോബർ_നവംബർ_ഡിസംബർ'.split("_"),
	        monthsShort : 'ജനു._ഫെബ്രു._മാർ._ഏപ്രി._മേയ്_ജൂൺ_ജൂലൈ._ഓഗ._സെപ്റ്റ._ഒക്ടോ._നവം._ഡിസം.'.split("_"),
	        weekdays : 'ഞായറാഴ്ച_തിങ്കളാഴ്ച_ചൊവ്വാഴ്ച_ബുധനാഴ്ച_വ്യാഴാഴ്ച_വെള്ളിയാഴ്ച_ശനിയാഴ്ച'.split("_"),
	        weekdaysShort : 'ഞായർ_തിങ്കൾ_ചൊവ്വ_ബുധൻ_വ്യാഴം_വെള്ളി_ശനി'.split("_"),
	        weekdaysMin : 'ഞാ_തി_ചൊ_ബു_വ്യാ_വെ_ശ'.split("_"),
	        longDateFormat : {
	            LT : "A h:mm -നു",
	            L : "DD/MM/YYYY",
	            LL : "D MMMM YYYY",
	            LLL : "D MMMM YYYY, LT",
	            LLLL : "dddd, D MMMM YYYY, LT"
	        },
	        calendar : {
	            sameDay : '[ഇന്ന്] LT',
	            nextDay : '[നാളെ] LT',
	            nextWeek : 'dddd, LT',
	            lastDay : '[ഇന്നലെ] LT',
	            lastWeek : '[കഴിഞ്ഞ] dddd, LT',
	            sameElse : 'L'
	        },
	        relativeTime : {
	            future : "%s കഴിഞ്ഞ്",
	            past : "%s മുൻപ്",
	            s : "അൽപ നിമിഷങ്ങൾ",
	            m : "ഒരു മിനിറ്റ്",
	            mm : "%d മിനിറ്റ്",
	            h : "ഒരു മണിക്കൂർ",
	            hh : "%d മണിക്കൂർ",
	            d : "ഒരു ദിവസം",
	            dd : "%d ദിവസം",
	            M : "ഒരു മാസം",
	            MM : "%d മാസം",
	            y : "ഒരു വർഷം",
	            yy : "%d വർഷം"
	        },
	        meridiem : function (hour, minute, isLower) {
	            if (hour < 4) {
	                return "രാത്രി";
	            } else if (hour < 12) {
	                return "രാവിലെ";
	            } else if (hour < 17) {
	                return "ഉച്ച കഴിഞ്ഞ്";
	            } else if (hour < 20) {
	                return "വൈകുന്നേരം";
	            } else {
	                return "രാത്രി";
	            }
	        }
	    });
	}));


/***/ },
/* 51 */
/***/ function(module, exports, require) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;// moment.js language configuration
	// language : Marathi (mr)
	// author : Harshad Kale : https://github.com/kalehv

	(function (factory) {
	    if (true) {
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [require(6)], __WEBPACK_AMD_DEFINE_RESULT__ = (factory.apply(null, __WEBPACK_AMD_DEFINE_ARRAY__)), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)); // AMD
	    } else if (typeof exports === 'object') {
	        module.exports = factory(require('../moment')); // Node
	    } else {
	        factory(window.moment); // Browser global
	    }
	}(function (moment) {
	    var symbolMap = {
	        '1': '१',
	        '2': '२',
	        '3': '३',
	        '4': '४',
	        '5': '५',
	        '6': '६',
	        '7': '७',
	        '8': '८',
	        '9': '९',
	        '0': '०'
	    },
	    numberMap = {
	        '१': '1',
	        '२': '2',
	        '३': '3',
	        '४': '4',
	        '५': '5',
	        '६': '6',
	        '७': '7',
	        '८': '8',
	        '९': '9',
	        '०': '0'
	    };

	    return moment.lang('mr', {
	        months : 'जानेवारी_फेब्रुवारी_मार्च_एप्रिल_मे_जून_जुलै_ऑगस्ट_सप्टेंबर_ऑक्टोबर_नोव्हेंबर_डिसेंबर'.split("_"),
	        monthsShort: 'जाने._फेब्रु._मार्च._एप्रि._मे._जून._जुलै._ऑग._सप्टें._ऑक्टो._नोव्हें._डिसें.'.split("_"),
	        weekdays : 'रविवार_सोमवार_मंगळवार_बुधवार_गुरूवार_शुक्रवार_शनिवार'.split("_"),
	        weekdaysShort : 'रवि_सोम_मंगळ_बुध_गुरू_शुक्र_शनि'.split("_"),
	        weekdaysMin : 'र_सो_मं_बु_गु_शु_श'.split("_"),
	        longDateFormat : {
	            LT : "A h:mm वाजता",
	            L : "DD/MM/YYYY",
	            LL : "D MMMM YYYY",
	            LLL : "D MMMM YYYY, LT",
	            LLLL : "dddd, D MMMM YYYY, LT"
	        },
	        calendar : {
	            sameDay : '[आज] LT',
	            nextDay : '[उद्या] LT',
	            nextWeek : 'dddd, LT',
	            lastDay : '[काल] LT',
	            lastWeek: '[मागील] dddd, LT',
	            sameElse : 'L'
	        },
	        relativeTime : {
	            future : "%s नंतर",
	            past : "%s पूर्वी",
	            s : "सेकंद",
	            m: "एक मिनिट",
	            mm: "%d मिनिटे",
	            h : "एक तास",
	            hh : "%d तास",
	            d : "एक दिवस",
	            dd : "%d दिवस",
	            M : "एक महिना",
	            MM : "%d महिने",
	            y : "एक वर्ष",
	            yy : "%d वर्षे"
	        },
	        preparse: function (string) {
	            return string.replace(/[१२३४५६७८९०]/g, function (match) {
	                return numberMap[match];
	            });
	        },
	        postformat: function (string) {
	            return string.replace(/\d/g, function (match) {
	                return symbolMap[match];
	            });
	        },
	        meridiem: function (hour, minute, isLower)
	        {
	            if (hour < 4) {
	                return "रात्री";
	            } else if (hour < 10) {
	                return "सकाळी";
	            } else if (hour < 17) {
	                return "दुपारी";
	            } else if (hour < 20) {
	                return "सायंकाळी";
	            } else {
	                return "रात्री";
	            }
	        },
	        week : {
	            dow : 0, // Sunday is the first day of the week.
	            doy : 6  // The week that contains Jan 1st is the first week of the year.
	        }
	    });
	}));


/***/ },
/* 52 */
/***/ function(module, exports, require) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;// moment.js language configuration
	// language : Bahasa Malaysia (ms-MY)
	// author : Weldan Jamili : https://github.com/weldan

	(function (factory) {
	    if (true) {
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [require(6)], __WEBPACK_AMD_DEFINE_RESULT__ = (factory.apply(null, __WEBPACK_AMD_DEFINE_ARRAY__)), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)); // AMD
	    } else if (typeof exports === 'object') {
	        module.exports = factory(require('../moment')); // Node
	    } else {
	        factory(window.moment); // Browser global
	    }
	}(function (moment) {
	    return moment.lang('ms-my', {
	        months : "Januari_Februari_Mac_April_Mei_Jun_Julai_Ogos_September_Oktober_November_Disember".split("_"),
	        monthsShort : "Jan_Feb_Mac_Apr_Mei_Jun_Jul_Ogs_Sep_Okt_Nov_Dis".split("_"),
	        weekdays : "Ahad_Isnin_Selasa_Rabu_Khamis_Jumaat_Sabtu".split("_"),
	        weekdaysShort : "Ahd_Isn_Sel_Rab_Kha_Jum_Sab".split("_"),
	        weekdaysMin : "Ah_Is_Sl_Rb_Km_Jm_Sb".split("_"),
	        longDateFormat : {
	            LT : "HH.mm",
	            L : "DD/MM/YYYY",
	            LL : "D MMMM YYYY",
	            LLL : "D MMMM YYYY [pukul] LT",
	            LLLL : "dddd, D MMMM YYYY [pukul] LT"
	        },
	        meridiem : function (hours, minutes, isLower) {
	            if (hours < 11) {
	                return 'pagi';
	            } else if (hours < 15) {
	                return 'tengahari';
	            } else if (hours < 19) {
	                return 'petang';
	            } else {
	                return 'malam';
	            }
	        },
	        calendar : {
	            sameDay : '[Hari ini pukul] LT',
	            nextDay : '[Esok pukul] LT',
	            nextWeek : 'dddd [pukul] LT',
	            lastDay : '[Kelmarin pukul] LT',
	            lastWeek : 'dddd [lepas pukul] LT',
	            sameElse : 'L'
	        },
	        relativeTime : {
	            future : "dalam %s",
	            past : "%s yang lepas",
	            s : "beberapa saat",
	            m : "seminit",
	            mm : "%d minit",
	            h : "sejam",
	            hh : "%d jam",
	            d : "sehari",
	            dd : "%d hari",
	            M : "sebulan",
	            MM : "%d bulan",
	            y : "setahun",
	            yy : "%d tahun"
	        },
	        week : {
	            dow : 1, // Monday is the first day of the week.
	            doy : 7  // The week that contains Jan 1st is the first week of the year.
	        }
	    });
	}));


/***/ },
/* 53 */
/***/ function(module, exports, require) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;// moment.js language configuration
	// language : norwegian bokmål (nb)
	// authors : Espen Hovlandsdal : https://github.com/rexxars
	//           Sigurd Gartmann : https://github.com/sigurdga

	(function (factory) {
	    if (true) {
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [require(6)], __WEBPACK_AMD_DEFINE_RESULT__ = (factory.apply(null, __WEBPACK_AMD_DEFINE_ARRAY__)), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)); // AMD
	    } else if (typeof exports === 'object') {
	        module.exports = factory(require('../moment')); // Node
	    } else {
	        factory(window.moment); // Browser global
	    }
	}(function (moment) {
	    return moment.lang('nb', {
	        months : "januar_februar_mars_april_mai_juni_juli_august_september_oktober_november_desember".split("_"),
	        monthsShort : "jan._feb._mars_april_mai_juni_juli_aug._sep._okt._nov._des.".split("_"),
	        weekdays : "søndag_mandag_tirsdag_onsdag_torsdag_fredag_lørdag".split("_"),
	        weekdaysShort : "sø._ma._ti._on._to._fr._lø.".split("_"),
	        weekdaysMin : "sø_ma_ti_on_to_fr_lø".split("_"),
	        longDateFormat : {
	            LT : "H.mm",
	            L : "DD.MM.YYYY",
	            LL : "D. MMMM YYYY",
	            LLL : "D. MMMM YYYY [kl.] LT",
	            LLLL : "dddd D. MMMM YYYY [kl.] LT"
	        },
	        calendar : {
	            sameDay: '[i dag kl.] LT',
	            nextDay: '[i morgen kl.] LT',
	            nextWeek: 'dddd [kl.] LT',
	            lastDay: '[i går kl.] LT',
	            lastWeek: '[forrige] dddd [kl.] LT',
	            sameElse: 'L'
	        },
	        relativeTime : {
	            future : "om %s",
	            past : "for %s siden",
	            s : "noen sekunder",
	            m : "ett minutt",
	            mm : "%d minutter",
	            h : "en time",
	            hh : "%d timer",
	            d : "en dag",
	            dd : "%d dager",
	            M : "en måned",
	            MM : "%d måneder",
	            y : "ett år",
	            yy : "%d år"
	        },
	        ordinal : '%d.',
	        week : {
	            dow : 1, // Monday is the first day of the week.
	            doy : 4  // The week that contains Jan 4th is the first week of the year.
	        }
	    });
	}));


/***/ },
/* 54 */
/***/ function(module, exports, require) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;// moment.js language configuration
	// language : nepali/nepalese
	// author : suvash : https://github.com/suvash

	(function (factory) {
	    if (true) {
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [require(6)], __WEBPACK_AMD_DEFINE_RESULT__ = (factory.apply(null, __WEBPACK_AMD_DEFINE_ARRAY__)), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)); // AMD
	    } else if (typeof exports === 'object') {
	        module.exports = factory(require('../moment')); // Node
	    } else {
	        factory(window.moment); // Browser global
	    }
	}(function (moment) {
	    var symbolMap = {
	        '1': '१',
	        '2': '२',
	        '3': '३',
	        '4': '४',
	        '5': '५',
	        '6': '६',
	        '7': '७',
	        '8': '८',
	        '9': '९',
	        '0': '०'
	    },
	    numberMap = {
	        '१': '1',
	        '२': '2',
	        '३': '3',
	        '४': '4',
	        '५': '5',
	        '६': '6',
	        '७': '7',
	        '८': '8',
	        '९': '9',
	        '०': '0'
	    };

	    return moment.lang('ne', {
	        months : 'जनवरी_फेब्रुवरी_मार्च_अप्रिल_मई_जुन_जुलाई_अगष्ट_सेप्टेम्बर_अक्टोबर_नोभेम्बर_डिसेम्बर'.split("_"),
	        monthsShort : 'जन._फेब्रु._मार्च_अप्रि._मई_जुन_जुलाई._अग._सेप्ट._अक्टो._नोभे._डिसे.'.split("_"),
	        weekdays : 'आइतबार_सोमबार_मङ्गलबार_बुधबार_बिहिबार_शुक्रबार_शनिबार'.split("_"),
	        weekdaysShort : 'आइत._सोम._मङ्गल._बुध._बिहि._शुक्र._शनि.'.split("_"),
	        weekdaysMin : 'आइ._सो._मङ्_बु._बि._शु._श.'.split("_"),
	        longDateFormat : {
	            LT : "Aको h:mm बजे",
	            L : "DD/MM/YYYY",
	            LL : "D MMMM YYYY",
	            LLL : "D MMMM YYYY, LT",
	            LLLL : "dddd, D MMMM YYYY, LT"
	        },
	        preparse: function (string) {
	            return string.replace(/[१२३४५६७८९०]/g, function (match) {
	                return numberMap[match];
	            });
	        },
	        postformat: function (string) {
	            return string.replace(/\d/g, function (match) {
	                return symbolMap[match];
	            });
	        },
	        meridiem : function (hour, minute, isLower) {
	            if (hour < 3) {
	                return "राती";
	            } else if (hour < 10) {
	                return "बिहान";
	            } else if (hour < 15) {
	                return "दिउँसो";
	            } else if (hour < 18) {
	                return "बेलुका";
	            } else if (hour < 20) {
	                return "साँझ";
	            } else {
	                return "राती";
	            }
	        },
	        calendar : {
	            sameDay : '[आज] LT',
	            nextDay : '[भोली] LT',
	            nextWeek : '[आउँदो] dddd[,] LT',
	            lastDay : '[हिजो] LT',
	            lastWeek : '[गएको] dddd[,] LT',
	            sameElse : 'L'
	        },
	        relativeTime : {
	            future : "%sमा",
	            past : "%s अगाडी",
	            s : "केही समय",
	            m : "एक मिनेट",
	            mm : "%d मिनेट",
	            h : "एक घण्टा",
	            hh : "%d घण्टा",
	            d : "एक दिन",
	            dd : "%d दिन",
	            M : "एक महिना",
	            MM : "%d महिना",
	            y : "एक बर्ष",
	            yy : "%d बर्ष"
	        },
	        week : {
	            dow : 1, // Monday is the first day of the week.
	            doy : 7  // The week that contains Jan 1st is the first week of the year.
	        }
	    });
	}));


/***/ },
/* 55 */
/***/ function(module, exports, require) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;// moment.js language configuration
	// language : dutch (nl)
	// author : Joris Röling : https://github.com/jjupiter

	(function (factory) {
	    if (true) {
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [require(6)], __WEBPACK_AMD_DEFINE_RESULT__ = (factory.apply(null, __WEBPACK_AMD_DEFINE_ARRAY__)), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)); // AMD
	    } else if (typeof exports === 'object') {
	        module.exports = factory(require('../moment')); // Node
	    } else {
	        factory(window.moment); // Browser global
	    }
	}(function (moment) {
	    var monthsShortWithDots = "jan._feb._mrt._apr._mei_jun._jul._aug._sep._okt._nov._dec.".split("_"),
	        monthsShortWithoutDots = "jan_feb_mrt_apr_mei_jun_jul_aug_sep_okt_nov_dec".split("_");

	    return moment.lang('nl', {
	        months : "januari_februari_maart_april_mei_juni_juli_augustus_september_oktober_november_december".split("_"),
	        monthsShort : function (m, format) {
	            if (/-MMM-/.test(format)) {
	                return monthsShortWithoutDots[m.month()];
	            } else {
	                return monthsShortWithDots[m.month()];
	            }
	        },
	        weekdays : "zondag_maandag_dinsdag_woensdag_donderdag_vrijdag_zaterdag".split("_"),
	        weekdaysShort : "zo._ma._di._wo._do._vr._za.".split("_"),
	        weekdaysMin : "Zo_Ma_Di_Wo_Do_Vr_Za".split("_"),
	        longDateFormat : {
	            LT : "HH:mm",
	            L : "DD-MM-YYYY",
	            LL : "D MMMM YYYY",
	            LLL : "D MMMM YYYY LT",
	            LLLL : "dddd D MMMM YYYY LT"
	        },
	        calendar : {
	            sameDay: '[vandaag om] LT',
	            nextDay: '[morgen om] LT',
	            nextWeek: 'dddd [om] LT',
	            lastDay: '[gisteren om] LT',
	            lastWeek: '[afgelopen] dddd [om] LT',
	            sameElse: 'L'
	        },
	        relativeTime : {
	            future : "over %s",
	            past : "%s geleden",
	            s : "een paar seconden",
	            m : "één minuut",
	            mm : "%d minuten",
	            h : "één uur",
	            hh : "%d uur",
	            d : "één dag",
	            dd : "%d dagen",
	            M : "één maand",
	            MM : "%d maanden",
	            y : "één jaar",
	            yy : "%d jaar"
	        },
	        ordinal : function (number) {
	            return number + ((number === 1 || number === 8 || number >= 20) ? 'ste' : 'de');
	        },
	        week : {
	            dow : 1, // Monday is the first day of the week.
	            doy : 4  // The week that contains Jan 4th is the first week of the year.
	        }
	    });
	}));


/***/ },
/* 56 */
/***/ function(module, exports, require) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;// moment.js language configuration
	// language : norwegian nynorsk (nn)
	// author : https://github.com/mechuwind

	(function (factory) {
	    if (true) {
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [require(6)], __WEBPACK_AMD_DEFINE_RESULT__ = (factory.apply(null, __WEBPACK_AMD_DEFINE_ARRAY__)), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)); // AMD
	    } else if (typeof exports === 'object') {
	        module.exports = factory(require('../moment')); // Node
	    } else {
	        factory(window.moment); // Browser global
	    }
	}(function (moment) {
	    return moment.lang('nn', {
	        months : "januar_februar_mars_april_mai_juni_juli_august_september_oktober_november_desember".split("_"),
	        monthsShort : "jan_feb_mar_apr_mai_jun_jul_aug_sep_okt_nov_des".split("_"),
	        weekdays : "sundag_måndag_tysdag_onsdag_torsdag_fredag_laurdag".split("_"),
	        weekdaysShort : "sun_mån_tys_ons_tor_fre_lau".split("_"),
	        weekdaysMin : "su_må_ty_on_to_fr_lø".split("_"),
	        longDateFormat : {
	            LT : "HH:mm",
	            L : "DD.MM.YYYY",
	            LL : "D MMMM YYYY",
	            LLL : "D MMMM YYYY LT",
	            LLLL : "dddd D MMMM YYYY LT"
	        },
	        calendar : {
	            sameDay: '[I dag klokka] LT',
	            nextDay: '[I morgon klokka] LT',
	            nextWeek: 'dddd [klokka] LT',
	            lastDay: '[I går klokka] LT',
	            lastWeek: '[Føregående] dddd [klokka] LT',
	            sameElse: 'L'
	        },
	        relativeTime : {
	            future : "om %s",
	            past : "for %s siden",
	            s : "noen sekund",
	            m : "ett minutt",
	            mm : "%d minutt",
	            h : "en time",
	            hh : "%d timar",
	            d : "en dag",
	            dd : "%d dagar",
	            M : "en månad",
	            MM : "%d månader",
	            y : "ett år",
	            yy : "%d år"
	        },
	        ordinal : '%d.',
	        week : {
	            dow : 1, // Monday is the first day of the week.
	            doy : 4  // The week that contains Jan 4th is the first week of the year.
	        }
	    });
	}));


/***/ },
/* 57 */
/***/ function(module, exports, require) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;// moment.js language configuration
	// language : polish (pl)
	// author : Rafal Hirsz : https://github.com/evoL

	(function (factory) {
	    if (true) {
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [require(6)], __WEBPACK_AMD_DEFINE_RESULT__ = (factory.apply(null, __WEBPACK_AMD_DEFINE_ARRAY__)), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)); // AMD
	    } else if (typeof exports === 'object') {
	        module.exports = factory(require('../moment')); // Node
	    } else {
	        factory(window.moment); // Browser global
	    }
	}(function (moment) {
	    var monthsNominative = "styczeń_luty_marzec_kwiecień_maj_czerwiec_lipiec_sierpień_wrzesień_październik_listopad_grudzień".split("_"),
	        monthsSubjective = "stycznia_lutego_marca_kwietnia_maja_czerwca_lipca_sierpnia_września_października_listopada_grudnia".split("_");

	    function plural(n) {
	        return (n % 10 < 5) && (n % 10 > 1) && ((~~(n / 10) % 10) !== 1);
	    }

	    function translate(number, withoutSuffix, key) {
	        var result = number + " ";
	        switch (key) {
	        case 'm':
	            return withoutSuffix ? 'minuta' : 'minutę';
	        case 'mm':
	            return result + (plural(number) ? 'minuty' : 'minut');
	        case 'h':
	            return withoutSuffix  ? 'godzina'  : 'godzinę';
	        case 'hh':
	            return result + (plural(number) ? 'godziny' : 'godzin');
	        case 'MM':
	            return result + (plural(number) ? 'miesiące' : 'miesięcy');
	        case 'yy':
	            return result + (plural(number) ? 'lata' : 'lat');
	        }
	    }

	    return moment.lang('pl', {
	        months : function (momentToFormat, format) {
	            if (/D MMMM/.test(format)) {
	                return monthsSubjective[momentToFormat.month()];
	            } else {
	                return monthsNominative[momentToFormat.month()];
	            }
	        },
	        monthsShort : "sty_lut_mar_kwi_maj_cze_lip_sie_wrz_paź_lis_gru".split("_"),
	        weekdays : "niedziela_poniedziałek_wtorek_środa_czwartek_piątek_sobota".split("_"),
	        weekdaysShort : "nie_pon_wt_śr_czw_pt_sb".split("_"),
	        weekdaysMin : "N_Pn_Wt_Śr_Cz_Pt_So".split("_"),
	        longDateFormat : {
	            LT : "HH:mm",
	            L : "DD.MM.YYYY",
	            LL : "D MMMM YYYY",
	            LLL : "D MMMM YYYY LT",
	            LLLL : "dddd, D MMMM YYYY LT"
	        },
	        calendar : {
	            sameDay: '[Dziś o] LT',
	            nextDay: '[Jutro o] LT',
	            nextWeek: '[W] dddd [o] LT',
	            lastDay: '[Wczoraj o] LT',
	            lastWeek: function () {
	                switch (this.day()) {
	                case 0:
	                    return '[W zeszłą niedzielę o] LT';
	                case 3:
	                    return '[W zeszłą środę o] LT';
	                case 6:
	                    return '[W zeszłą sobotę o] LT';
	                default:
	                    return '[W zeszły] dddd [o] LT';
	                }
	            },
	            sameElse: 'L'
	        },
	        relativeTime : {
	            future : "za %s",
	            past : "%s temu",
	            s : "kilka sekund",
	            m : translate,
	            mm : translate,
	            h : translate,
	            hh : translate,
	            d : "1 dzień",
	            dd : '%d dni',
	            M : "miesiąc",
	            MM : translate,
	            y : "rok",
	            yy : translate
	        },
	        ordinal : '%d.',
	        week : {
	            dow : 1, // Monday is the first day of the week.
	            doy : 4  // The week that contains Jan 4th is the first week of the year.
	        }
	    });
	}));


/***/ },
/* 58 */
/***/ function(module, exports, require) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;// moment.js language configuration
	// language : brazilian portuguese (pt-br)
	// author : Caio Ribeiro Pereira : https://github.com/caio-ribeiro-pereira

	(function (factory) {
	    if (true) {
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [require(6)], __WEBPACK_AMD_DEFINE_RESULT__ = (factory.apply(null, __WEBPACK_AMD_DEFINE_ARRAY__)), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)); // AMD
	    } else if (typeof exports === 'object') {
	        module.exports = factory(require('../moment')); // Node
	    } else {
	        factory(window.moment); // Browser global
	    }
	}(function (moment) {
	    return moment.lang('pt-br', {
	        months : "Janeiro_Fevereiro_Março_Abril_Maio_Junho_Julho_Agosto_Setembro_Outubro_Novembro_Dezembro".split("_"),
	        monthsShort : "Jan_Fev_Mar_Abr_Mai_Jun_Jul_Ago_Set_Out_Nov_Dez".split("_"),
	        weekdays : "Domingo_Segunda-feira_Terça-feira_Quarta-feira_Quinta-feira_Sexta-feira_Sábado".split("_"),
	        weekdaysShort : "Dom_Seg_Ter_Qua_Qui_Sex_Sáb".split("_"),
	        weekdaysMin : "Dom_2ª_3ª_4ª_5ª_6ª_Sáb".split("_"),
	        longDateFormat : {
	            LT : "HH:mm",
	            L : "DD/MM/YYYY",
	            LL : "D [de] MMMM [de] YYYY",
	            LLL : "D [de] MMMM [de] YYYY LT",
	            LLLL : "dddd, D [de] MMMM [de] YYYY LT"
	        },
	        calendar : {
	            sameDay: '[Hoje às] LT',
	            nextDay: '[Amanhã às] LT',
	            nextWeek: 'dddd [às] LT',
	            lastDay: '[Ontem às] LT',
	            lastWeek: function () {
	                return (this.day() === 0 || this.day() === 6) ?
	                    '[Último] dddd [às] LT' : // Saturday + Sunday
	                    '[Última] dddd [às] LT'; // Monday - Friday
	            },
	            sameElse: 'L'
	        },
	        relativeTime : {
	            future : "em %s",
	            past : "%s atrás",
	            s : "segundos",
	            m : "um minuto",
	            mm : "%d minutos",
	            h : "uma hora",
	            hh : "%d horas",
	            d : "um dia",
	            dd : "%d dias",
	            M : "um mês",
	            MM : "%d meses",
	            y : "um ano",
	            yy : "%d anos"
	        },
	        ordinal : '%dº'
	    });
	}));


/***/ },
/* 59 */
/***/ function(module, exports, require) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;// moment.js language configuration
	// language : portuguese (pt)
	// author : Jefferson : https://github.com/jalex79

	(function (factory) {
	    if (true) {
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [require(6)], __WEBPACK_AMD_DEFINE_RESULT__ = (factory.apply(null, __WEBPACK_AMD_DEFINE_ARRAY__)), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)); // AMD
	    } else if (typeof exports === 'object') {
	        module.exports = factory(require('../moment')); // Node
	    } else {
	        factory(window.moment); // Browser global
	    }
	}(function (moment) {
	    return moment.lang('pt', {
	        months : "Janeiro_Fevereiro_Março_Abril_Maio_Junho_Julho_Agosto_Setembro_Outubro_Novembro_Dezembro".split("_"),
	        monthsShort : "Jan_Fev_Mar_Abr_Mai_Jun_Jul_Ago_Set_Out_Nov_Dez".split("_"),
	        weekdays : "Domingo_Segunda-feira_Terça-feira_Quarta-feira_Quinta-feira_Sexta-feira_Sábado".split("_"),
	        weekdaysShort : "Dom_Seg_Ter_Qua_Qui_Sex_Sáb".split("_"),
	        weekdaysMin : "Dom_2ª_3ª_4ª_5ª_6ª_Sáb".split("_"),
	        longDateFormat : {
	            LT : "HH:mm",
	            L : "DD/MM/YYYY",
	            LL : "D [de] MMMM [de] YYYY",
	            LLL : "D [de] MMMM [de] YYYY LT",
	            LLLL : "dddd, D [de] MMMM [de] YYYY LT"
	        },
	        calendar : {
	            sameDay: '[Hoje às] LT',
	            nextDay: '[Amanhã às] LT',
	            nextWeek: 'dddd [às] LT',
	            lastDay: '[Ontem às] LT',
	            lastWeek: function () {
	                return (this.day() === 0 || this.day() === 6) ?
	                    '[Último] dddd [às] LT' : // Saturday + Sunday
	                    '[Última] dddd [às] LT'; // Monday - Friday
	            },
	            sameElse: 'L'
	        },
	        relativeTime : {
	            future : "em %s",
	            past : "%s atrás",
	            s : "segundos",
	            m : "um minuto",
	            mm : "%d minutos",
	            h : "uma hora",
	            hh : "%d horas",
	            d : "um dia",
	            dd : "%d dias",
	            M : "um mês",
	            MM : "%d meses",
	            y : "um ano",
	            yy : "%d anos"
	        },
	        ordinal : '%dº',
	        week : {
	            dow : 1, // Monday is the first day of the week.
	            doy : 4  // The week that contains Jan 4th is the first week of the year.
	        }
	    });
	}));


/***/ },
/* 60 */
/***/ function(module, exports, require) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;// moment.js language configuration
	// language : romanian (ro)
	// author : Vlad Gurdiga : https://github.com/gurdiga
	// author : Valentin Agachi : https://github.com/avaly

	(function (factory) {
	    if (true) {
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [require(6)], __WEBPACK_AMD_DEFINE_RESULT__ = (factory.apply(null, __WEBPACK_AMD_DEFINE_ARRAY__)), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)); // AMD
	    } else if (typeof exports === 'object') {
	        module.exports = factory(require('../moment')); // Node
	    } else {
	        factory(window.moment); // Browser global
	    }
	}(function (moment) {
	    function relativeTimeWithPlural(number, withoutSuffix, key) {
	        var format = {
	            'mm': 'minute',
	            'hh': 'ore',
	            'dd': 'zile',
	            'MM': 'luni',
	            'yy': 'ani'
	        },
	            separator = ' ';
	        if (number % 100 >= 20 || (number >= 100 && number % 100 === 0)) {
	            separator = ' de ';
	        }

	        return number + separator + format[key];
	    }

	    return moment.lang('ro', {
	        months : "ianuarie_februarie_martie_aprilie_mai_iunie_iulie_august_septembrie_octombrie_noiembrie_decembrie".split("_"),
	        monthsShort : "ian_feb_mar_apr_mai_iun_iul_aug_sep_oct_noi_dec".split("_"),
	        weekdays : "duminică_luni_marți_miercuri_joi_vineri_sâmbătă".split("_"),
	        weekdaysShort : "Dum_Lun_Mar_Mie_Joi_Vin_Sâm".split("_"),
	        weekdaysMin : "Du_Lu_Ma_Mi_Jo_Vi_Sâ".split("_"),
	        longDateFormat : {
	            LT : "H:mm",
	            L : "DD.MM.YYYY",
	            LL : "D MMMM YYYY",
	            LLL : "D MMMM YYYY H:mm",
	            LLLL : "dddd, D MMMM YYYY H:mm"
	        },
	        calendar : {
	            sameDay: "[azi la] LT",
	            nextDay: '[mâine la] LT',
	            nextWeek: 'dddd [la] LT',
	            lastDay: '[ieri la] LT',
	            lastWeek: '[fosta] dddd [la] LT',
	            sameElse: 'L'
	        },
	        relativeTime : {
	            future : "peste %s",
	            past : "%s în urmă",
	            s : "câteva secunde",
	            m : "un minut",
	            mm : relativeTimeWithPlural,
	            h : "o oră",
	            hh : relativeTimeWithPlural,
	            d : "o zi",
	            dd : relativeTimeWithPlural,
	            M : "o lună",
	            MM : relativeTimeWithPlural,
	            y : "un an",
	            yy : relativeTimeWithPlural
	        },
	        week : {
	            dow : 1, // Monday is the first day of the week.
	            doy : 7  // The week that contains Jan 1st is the first week of the year.
	        }
	    });
	}));


/***/ },
/* 61 */
/***/ function(module, exports, require) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;// moment.js language configuration
	// language : serbian (rs)
	// author : Limon Monte : https://github.com/limonte
	// based on (bs) translation by Nedim Cholich

	(function (factory) {
	    if (true) {
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [require(6)], __WEBPACK_AMD_DEFINE_RESULT__ = (factory.apply(null, __WEBPACK_AMD_DEFINE_ARRAY__)), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)); // AMD
	    } else if (typeof exports === 'object') {
	        module.exports = factory(require('../moment')); // Node
	    } else {
	        factory(window.moment); // Browser global
	    }
	}(function (moment) {

	    function translate(number, withoutSuffix, key) {
	        var result = number + " ";
	        switch (key) {
	        case 'm':
	            return withoutSuffix ? 'jedna minuta' : 'jedne minute';
	        case 'mm':
	            if (number === 1) {
	                result += 'minuta';
	            } else if (number === 2 || number === 3 || number === 4) {
	                result += 'minute';
	            } else {
	                result += 'minuta';
	            }
	            return result;
	        case 'h':
	            return withoutSuffix ? 'jedan sat' : 'jednog sata';
	        case 'hh':
	            if (number === 1) {
	                result += 'sat';
	            } else if (number === 2 || number === 3 || number === 4) {
	                result += 'sata';
	            } else {
	                result += 'sati';
	            }
	            return result;
	        case 'dd':
	            if (number === 1) {
	                result += 'dan';
	            } else {
	                result += 'dana';
	            }
	            return result;
	        case 'MM':
	            if (number === 1) {
	                result += 'mesec';
	            } else if (number === 2 || number === 3 || number === 4) {
	                result += 'meseca';
	            } else {
	                result += 'meseci';
	            }
	            return result;
	        case 'yy':
	            if (number === 1) {
	                result += 'godina';
	            } else if (number === 2 || number === 3 || number === 4) {
	                result += 'godine';
	            } else {
	                result += 'godina';
	            }
	            return result;
	        }
	    }

	    return moment.lang('rs', {
	        months : "januar_februar_mart_april_maj_jun_jul_avgust_septembar_oktobar_novembar_decembar".split("_"),
	        monthsShort : "jan._feb._mar._apr._maj._jun._jul._avg._sep._okt._nov._dec.".split("_"),
	        weekdays : "nedelja_ponedeljak_utorak_sreda_četvrtak_petak_subota".split("_"),
	        weekdaysShort : "ned._pon._uto._sre._čet._pet._sub.".split("_"),
	        weekdaysMin : "ne_po_ut_sr_če_pe_su".split("_"),
	        longDateFormat : {
	            LT : "H:mm",
	            L : "DD. MM. YYYY",
	            LL : "D. MMMM YYYY",
	            LLL : "D. MMMM YYYY LT",
	            LLLL : "dddd, D. MMMM YYYY LT"
	        },
	        calendar : {
	            sameDay  : '[danas u] LT',
	            nextDay  : '[sutra u] LT',

	            nextWeek : function () {
	                switch (this.day()) {
	                case 0:
	                    return '[u] [nedelju] [u] LT';
	                case 3:
	                    return '[u] [sredu] [u] LT';
	                case 6:
	                    return '[u] [subotu] [u] LT';
	                case 1:
	                case 2:
	                case 4:
	                case 5:
	                    return '[u] dddd [u] LT';
	                }
	            },
	            lastDay  : '[juče u] LT',
	            lastWeek : function () {
	                switch (this.day()) {
	                case 0:
	                case 3:
	                    return '[prošlu] dddd [u] LT';
	                case 6:
	                    return '[prošle] [subote] [u] LT';
	                case 1:
	                case 2:
	                case 4:
	                case 5:
	                    return '[prošli] dddd [u] LT';
	                }
	            },
	            sameElse : 'L'
	        },
	        relativeTime : {
	            future : "za %s",
	            past   : "pre %s",
	            s      : "par sekundi",
	            m      : translate,
	            mm     : translate,
	            h      : translate,
	            hh     : translate,
	            d      : "dan",
	            dd     : translate,
	            M      : "mesec",
	            MM     : translate,
	            y      : "godinu",
	            yy     : translate
	        },
	        ordinal : '%d.',
	        week : {
	            dow : 1, // Monday is the first day of the week.
	            doy : 7  // The week that contains Jan 1st is the first week of the year.
	        }
	    });
	}));


/***/ },
/* 62 */
/***/ function(module, exports, require) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;// moment.js language configuration
	// language : russian (ru)
	// author : Viktorminator : https://github.com/Viktorminator
	// Author : Menelion Elensúle : https://github.com/Oire

	(function (factory) {
	    if (true) {
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [require(6)], __WEBPACK_AMD_DEFINE_RESULT__ = (factory.apply(null, __WEBPACK_AMD_DEFINE_ARRAY__)), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)); // AMD
	    } else if (typeof exports === 'object') {
	        module.exports = factory(require('../moment')); // Node
	    } else {
	        factory(window.moment); // Browser global
	    }
	}(function (moment) {
	    function plural(word, num) {
	        var forms = word.split('_');
	        return num % 10 === 1 && num % 100 !== 11 ? forms[0] : (num % 10 >= 2 && num % 10 <= 4 && (num % 100 < 10 || num % 100 >= 20) ? forms[1] : forms[2]);
	    }

	    function relativeTimeWithPlural(number, withoutSuffix, key) {
	        var format = {
	            'mm': 'минута_минуты_минут',
	            'hh': 'час_часа_часов',
	            'dd': 'день_дня_дней',
	            'MM': 'месяц_месяца_месяцев',
	            'yy': 'год_года_лет'
	        };
	        if (key === 'm') {
	            return withoutSuffix ? 'минута' : 'минуту';
	        }
	        else {
	            return number + ' ' + plural(format[key], +number);
	        }
	    }

	    function monthsCaseReplace(m, format) {
	        var months = {
	            'nominative': 'январь_февраль_март_апрель_май_июнь_июль_август_сентябрь_октябрь_ноябрь_декабрь'.split('_'),
	            'accusative': 'января_февраля_марта_апреля_мая_июня_июля_августа_сентября_октября_ноября_декабря'.split('_')
	        },

	        nounCase = (/D[oD]?(\[[^\[\]]*\]|\s+)+MMMM?/).test(format) ?
	            'accusative' :
	            'nominative';

	        return months[nounCase][m.month()];
	    }

	    function monthsShortCaseReplace(m, format) {
	        var monthsShort = {
	            'nominative': 'янв_фев_мар_апр_май_июнь_июль_авг_сен_окт_ноя_дек'.split('_'),
	            'accusative': 'янв_фев_мар_апр_мая_июня_июля_авг_сен_окт_ноя_дек'.split('_')
	        },

	        nounCase = (/D[oD]?(\[[^\[\]]*\]|\s+)+MMMM?/).test(format) ?
	            'accusative' :
	            'nominative';

	        return monthsShort[nounCase][m.month()];
	    }

	    function weekdaysCaseReplace(m, format) {
	        var weekdays = {
	            'nominative': 'воскресенье_понедельник_вторник_среда_четверг_пятница_суббота'.split('_'),
	            'accusative': 'воскресенье_понедельник_вторник_среду_четверг_пятницу_субботу'.split('_')
	        },

	        nounCase = (/\[ ?[Вв] ?(?:прошлую|следующую)? ?\] ?dddd/).test(format) ?
	            'accusative' :
	            'nominative';

	        return weekdays[nounCase][m.day()];
	    }

	    return moment.lang('ru', {
	        months : monthsCaseReplace,
	        monthsShort : monthsShortCaseReplace,
	        weekdays : weekdaysCaseReplace,
	        weekdaysShort : "вс_пн_вт_ср_чт_пт_сб".split("_"),
	        weekdaysMin : "вс_пн_вт_ср_чт_пт_сб".split("_"),
	        monthsParse : [/^янв/i, /^фев/i, /^мар/i, /^апр/i, /^ма[й|я]/i, /^июн/i, /^июл/i, /^авг/i, /^сен/i, /^окт/i, /^ноя/i, /^дек/i],
	        longDateFormat : {
	            LT : "HH:mm",
	            L : "DD.MM.YYYY",
	            LL : "D MMMM YYYY г.",
	            LLL : "D MMMM YYYY г., LT",
	            LLLL : "dddd, D MMMM YYYY г., LT"
	        },
	        calendar : {
	            sameDay: '[Сегодня в] LT',
	            nextDay: '[Завтра в] LT',
	            lastDay: '[Вчера в] LT',
	            nextWeek: function () {
	                return this.day() === 2 ? '[Во] dddd [в] LT' : '[В] dddd [в] LT';
	            },
	            lastWeek: function () {
	                switch (this.day()) {
	                case 0:
	                    return '[В прошлое] dddd [в] LT';
	                case 1:
	                case 2:
	                case 4:
	                    return '[В прошлый] dddd [в] LT';
	                case 3:
	                case 5:
	                case 6:
	                    return '[В прошлую] dddd [в] LT';
	                }
	            },
	            sameElse: 'L'
	        },
	        relativeTime : {
	            future : "через %s",
	            past : "%s назад",
	            s : "несколько секунд",
	            m : relativeTimeWithPlural,
	            mm : relativeTimeWithPlural,
	            h : "час",
	            hh : relativeTimeWithPlural,
	            d : "день",
	            dd : relativeTimeWithPlural,
	            M : "месяц",
	            MM : relativeTimeWithPlural,
	            y : "год",
	            yy : relativeTimeWithPlural
	        },

	        // M. E.: those two are virtually unused but a user might want to implement them for his/her website for some reason

	        meridiem : function (hour, minute, isLower) {
	            if (hour < 4) {
	                return "ночи";
	            } else if (hour < 12) {
	                return "утра";
	            } else if (hour < 17) {
	                return "дня";
	            } else {
	                return "вечера";
	            }
	        },

	        ordinal: function (number, period) {
	            switch (period) {
	            case 'M':
	            case 'd':
	            case 'DDD':
	                return number + '-й';
	            case 'D':
	                return number + '-го';
	            case 'w':
	            case 'W':
	                return number + '-я';
	            default:
	                return number;
	            }
	        },

	        week : {
	            dow : 1, // Monday is the first day of the week.
	            doy : 7  // The week that contains Jan 1st is the first week of the year.
	        }
	    });
	}));


/***/ },
/* 63 */
/***/ function(module, exports, require) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;// moment.js language configuration
	// language : slovak (sk)
	// author : Martin Minka : https://github.com/k2s
	// based on work of petrbela : https://github.com/petrbela

	(function (factory) {
	    if (true) {
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [require(6)], __WEBPACK_AMD_DEFINE_RESULT__ = (factory.apply(null, __WEBPACK_AMD_DEFINE_ARRAY__)), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)); // AMD
	    } else if (typeof exports === 'object') {
	        module.exports = factory(require('../moment')); // Node
	    } else {
	        factory(window.moment); // Browser global
	    }
	}(function (moment) {
	    var months = "január_február_marec_apríl_máj_jún_júl_august_september_október_november_december".split("_"),
	        monthsShort = "jan_feb_mar_apr_máj_jún_júl_aug_sep_okt_nov_dec".split("_");

	    function plural(n) {
	        return (n > 1) && (n < 5);
	    }

	    function translate(number, withoutSuffix, key, isFuture) {
	        var result = number + " ";
	        switch (key) {
	        case 's':  // a few seconds / in a few seconds / a few seconds ago
	            return (withoutSuffix || isFuture) ? 'pár sekúnd' : 'pár sekundami';
	        case 'm':  // a minute / in a minute / a minute ago
	            return withoutSuffix ? 'minúta' : (isFuture ? 'minútu' : 'minútou');
	        case 'mm': // 9 minutes / in 9 minutes / 9 minutes ago
	            if (withoutSuffix || isFuture) {
	                return result + (plural(number) ? 'minúty' : 'minút');
	            } else {
	                return result + 'minútami';
	            }
	            break;
	        case 'h':  // an hour / in an hour / an hour ago
	            return withoutSuffix ? 'hodina' : (isFuture ? 'hodinu' : 'hodinou');
	        case 'hh': // 9 hours / in 9 hours / 9 hours ago
	            if (withoutSuffix || isFuture) {
	                return result + (plural(number) ? 'hodiny' : 'hodín');
	            } else {
	                return result + 'hodinami';
	            }
	            break;
	        case 'd':  // a day / in a day / a day ago
	            return (withoutSuffix || isFuture) ? 'deň' : 'dňom';
	        case 'dd': // 9 days / in 9 days / 9 days ago
	            if (withoutSuffix || isFuture) {
	                return result + (plural(number) ? 'dni' : 'dní');
	            } else {
	                return result + 'dňami';
	            }
	            break;
	        case 'M':  // a month / in a month / a month ago
	            return (withoutSuffix || isFuture) ? 'mesiac' : 'mesiacom';
	        case 'MM': // 9 months / in 9 months / 9 months ago
	            if (withoutSuffix || isFuture) {
	                return result + (plural(number) ? 'mesiace' : 'mesiacov');
	            } else {
	                return result + 'mesiacmi';
	            }
	            break;
	        case 'y':  // a year / in a year / a year ago
	            return (withoutSuffix || isFuture) ? 'rok' : 'rokom';
	        case 'yy': // 9 years / in 9 years / 9 years ago
	            if (withoutSuffix || isFuture) {
	                return result + (plural(number) ? 'roky' : 'rokov');
	            } else {
	                return result + 'rokmi';
	            }
	            break;
	        }
	    }

	    return moment.lang('sk', {
	        months : months,
	        monthsShort : monthsShort,
	        monthsParse : (function (months, monthsShort) {
	            var i, _monthsParse = [];
	            for (i = 0; i < 12; i++) {
	                // use custom parser to solve problem with July (červenec)
	                _monthsParse[i] = new RegExp('^' + months[i] + '$|^' + monthsShort[i] + '$', 'i');
	            }
	            return _monthsParse;
	        }(months, monthsShort)),
	        weekdays : "nedeľa_pondelok_utorok_streda_štvrtok_piatok_sobota".split("_"),
	        weekdaysShort : "ne_po_ut_st_št_pi_so".split("_"),
	        weekdaysMin : "ne_po_ut_st_št_pi_so".split("_"),
	        longDateFormat : {
	            LT: "H:mm",
	            L : "DD.MM.YYYY",
	            LL : "D. MMMM YYYY",
	            LLL : "D. MMMM YYYY LT",
	            LLLL : "dddd D. MMMM YYYY LT"
	        },
	        calendar : {
	            sameDay: "[dnes o] LT",
	            nextDay: '[zajtra o] LT',
	            nextWeek: function () {
	                switch (this.day()) {
	                case 0:
	                    return '[v nedeľu o] LT';
	                case 1:
	                case 2:
	                    return '[v] dddd [o] LT';
	                case 3:
	                    return '[v stredu o] LT';
	                case 4:
	                    return '[vo štvrtok o] LT';
	                case 5:
	                    return '[v piatok o] LT';
	                case 6:
	                    return '[v sobotu o] LT';
	                }
	            },
	            lastDay: '[včera o] LT',
	            lastWeek: function () {
	                switch (this.day()) {
	                case 0:
	                    return '[minulú nedeľu o] LT';
	                case 1:
	                case 2:
	                    return '[minulý] dddd [o] LT';
	                case 3:
	                    return '[minulú stredu o] LT';
	                case 4:
	                case 5:
	                    return '[minulý] dddd [o] LT';
	                case 6:
	                    return '[minulú sobotu o] LT';
	                }
	            },
	            sameElse: "L"
	        },
	        relativeTime : {
	            future : "za %s",
	            past : "pred %s",
	            s : translate,
	            m : translate,
	            mm : translate,
	            h : translate,
	            hh : translate,
	            d : translate,
	            dd : translate,
	            M : translate,
	            MM : translate,
	            y : translate,
	            yy : translate
	        },
	        ordinal : '%d.',
	        week : {
	            dow : 1, // Monday is the first day of the week.
	            doy : 4  // The week that contains Jan 4th is the first week of the year.
	        }
	    });
	}));


/***/ },
/* 64 */
/***/ function(module, exports, require) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;// moment.js language configuration
	// language : slovenian (sl)
	// author : Robert Sedovšek : https://github.com/sedovsek

	(function (factory) {
	    if (true) {
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [require(6)], __WEBPACK_AMD_DEFINE_RESULT__ = (factory.apply(null, __WEBPACK_AMD_DEFINE_ARRAY__)), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)); // AMD
	    } else if (typeof exports === 'object') {
	        module.exports = factory(require('../moment')); // Node
	    } else {
	        factory(window.moment); // Browser global
	    }
	}(function (moment) {
	    function translate(number, withoutSuffix, key) {
	        var result = number + " ";
	        switch (key) {
	        case 'm':
	            return withoutSuffix ? 'ena minuta' : 'eno minuto';
	        case 'mm':
	            if (number === 1) {
	                result += 'minuta';
	            } else if (number === 2) {
	                result += 'minuti';
	            } else if (number === 3 || number === 4) {
	                result += 'minute';
	            } else {
	                result += 'minut';
	            }
	            return result;
	        case 'h':
	            return withoutSuffix ? 'ena ura' : 'eno uro';
	        case 'hh':
	            if (number === 1) {
	                result += 'ura';
	            } else if (number === 2) {
	                result += 'uri';
	            } else if (number === 3 || number === 4) {
	                result += 'ure';
	            } else {
	                result += 'ur';
	            }
	            return result;
	        case 'dd':
	            if (number === 1) {
	                result += 'dan';
	            } else {
	                result += 'dni';
	            }
	            return result;
	        case 'MM':
	            if (number === 1) {
	                result += 'mesec';
	            } else if (number === 2) {
	                result += 'meseca';
	            } else if (number === 3 || number === 4) {
	                result += 'mesece';
	            } else {
	                result += 'mesecev';
	            }
	            return result;
	        case 'yy':
	            if (number === 1) {
	                result += 'leto';
	            } else if (number === 2) {
	                result += 'leti';
	            } else if (number === 3 || number === 4) {
	                result += 'leta';
	            } else {
	                result += 'let';
	            }
	            return result;
	        }
	    }

	    return moment.lang('sl', {
	        months : "januar_februar_marec_april_maj_junij_julij_avgust_september_oktober_november_december".split("_"),
	        monthsShort : "jan._feb._mar._apr._maj._jun._jul._avg._sep._okt._nov._dec.".split("_"),
	        weekdays : "nedelja_ponedeljek_torek_sreda_četrtek_petek_sobota".split("_"),
	        weekdaysShort : "ned._pon._tor._sre._čet._pet._sob.".split("_"),
	        weekdaysMin : "ne_po_to_sr_če_pe_so".split("_"),
	        longDateFormat : {
	            LT : "H:mm",
	            L : "DD. MM. YYYY",
	            LL : "D. MMMM YYYY",
	            LLL : "D. MMMM YYYY LT",
	            LLLL : "dddd, D. MMMM YYYY LT"
	        },
	        calendar : {
	            sameDay  : '[danes ob] LT',
	            nextDay  : '[jutri ob] LT',

	            nextWeek : function () {
	                switch (this.day()) {
	                case 0:
	                    return '[v] [nedeljo] [ob] LT';
	                case 3:
	                    return '[v] [sredo] [ob] LT';
	                case 6:
	                    return '[v] [soboto] [ob] LT';
	                case 1:
	                case 2:
	                case 4:
	                case 5:
	                    return '[v] dddd [ob] LT';
	                }
	            },
	            lastDay  : '[včeraj ob] LT',
	            lastWeek : function () {
	                switch (this.day()) {
	                case 0:
	                case 3:
	                case 6:
	                    return '[prejšnja] dddd [ob] LT';
	                case 1:
	                case 2:
	                case 4:
	                case 5:
	                    return '[prejšnji] dddd [ob] LT';
	                }
	            },
	            sameElse : 'L'
	        },
	        relativeTime : {
	            future : "čez %s",
	            past   : "%s nazaj",
	            s      : "nekaj sekund",
	            m      : translate,
	            mm     : translate,
	            h      : translate,
	            hh     : translate,
	            d      : "en dan",
	            dd     : translate,
	            M      : "en mesec",
	            MM     : translate,
	            y      : "eno leto",
	            yy     : translate
	        },
	        ordinal : '%d.',
	        week : {
	            dow : 1, // Monday is the first day of the week.
	            doy : 7  // The week that contains Jan 1st is the first week of the year.
	        }
	    });
	}));


/***/ },
/* 65 */
/***/ function(module, exports, require) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;// moment.js language configuration
	// language : Albanian (sq)
	// author : Flakërim Ismani : https://github.com/flakerimi
	// author: Menelion Elensúle: https://github.com/Oire (tests)

	(function (factory) {
	    if (true) {
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [require(6)], __WEBPACK_AMD_DEFINE_RESULT__ = (factory.apply(null, __WEBPACK_AMD_DEFINE_ARRAY__)), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)); // AMD
	    } else if (typeof exports === 'object') {
	        module.exports = factory(require('../moment')); // Node
	    } else {
	        factory(window.moment); // Browser global
	    }
	}(function (moment) {
	    return moment.lang('sq', {
	        months : "Janar_Shkurt_Mars_Prill_Maj_Qershor_Korrik_Gusht_Shtator_Tetor_Nëntor_Dhjetor".split("_"),
	        monthsShort : "Jan_Shk_Mar_Pri_Maj_Qer_Kor_Gus_Sht_Tet_Nën_Dhj".split("_"),
	        weekdays : "E Diel_E Hënë_E Marte_E Mërkure_E Enjte_E Premte_E Shtunë".split("_"),
	        weekdaysShort : "Die_Hën_Mar_Mër_Enj_Pre_Sht".split("_"),
	        weekdaysMin : "D_H_Ma_Më_E_P_Sh".split("_"),
	        longDateFormat : {
	            LT : "HH:mm",
	            L : "DD/MM/YYYY",
	            LL : "D MMMM YYYY",
	            LLL : "D MMMM YYYY LT",
	            LLLL : "dddd, D MMMM YYYY LT"
	        },
	        calendar : {
	            sameDay : '[Sot në] LT',
	            nextDay : '[Neser në] LT',
	            nextWeek : 'dddd [në] LT',
	            lastDay : '[Dje në] LT',
	            lastWeek : 'dddd [e kaluar në] LT',
	            sameElse : 'L'
	        },
	        relativeTime : {
	            future : "në %s",
	            past : "%s me parë",
	            s : "disa sekonda",
	            m : "një minut",
	            mm : "%d minuta",
	            h : "një orë",
	            hh : "%d orë",
	            d : "një ditë",
	            dd : "%d ditë",
	            M : "një muaj",
	            MM : "%d muaj",
	            y : "një vit",
	            yy : "%d vite"
	        },
	        ordinal : '%d.',
	        week : {
	            dow : 1, // Monday is the first day of the week.
	            doy : 4  // The week that contains Jan 4th is the first week of the year.
	        }
	    });
	}));


/***/ },
/* 66 */
/***/ function(module, exports, require) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;// moment.js language configuration
	// language : swedish (sv)
	// author : Jens Alm : https://github.com/ulmus

	(function (factory) {
	    if (true) {
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [require(6)], __WEBPACK_AMD_DEFINE_RESULT__ = (factory.apply(null, __WEBPACK_AMD_DEFINE_ARRAY__)), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)); // AMD
	    } else if (typeof exports === 'object') {
	        module.exports = factory(require('../moment')); // Node
	    } else {
	        factory(window.moment); // Browser global
	    }
	}(function (moment) {
	    return moment.lang('sv', {
	        months : "januari_februari_mars_april_maj_juni_juli_augusti_september_oktober_november_december".split("_"),
	        monthsShort : "jan_feb_mar_apr_maj_jun_jul_aug_sep_okt_nov_dec".split("_"),
	        weekdays : "söndag_måndag_tisdag_onsdag_torsdag_fredag_lördag".split("_"),
	        weekdaysShort : "sön_mån_tis_ons_tor_fre_lör".split("_"),
	        weekdaysMin : "sö_må_ti_on_to_fr_lö".split("_"),
	        longDateFormat : {
	            LT : "HH:mm",
	            L : "YYYY-MM-DD",
	            LL : "D MMMM YYYY",
	            LLL : "D MMMM YYYY LT",
	            LLLL : "dddd D MMMM YYYY LT"
	        },
	        calendar : {
	            sameDay: '[Idag] LT',
	            nextDay: '[Imorgon] LT',
	            lastDay: '[Igår] LT',
	            nextWeek: 'dddd LT',
	            lastWeek: '[Förra] dddd[en] LT',
	            sameElse: 'L'
	        },
	        relativeTime : {
	            future : "om %s",
	            past : "för %s sedan",
	            s : "några sekunder",
	            m : "en minut",
	            mm : "%d minuter",
	            h : "en timme",
	            hh : "%d timmar",
	            d : "en dag",
	            dd : "%d dagar",
	            M : "en månad",
	            MM : "%d månader",
	            y : "ett år",
	            yy : "%d år"
	        },
	        ordinal : function (number) {
	            var b = number % 10,
	                output = (~~ (number % 100 / 10) === 1) ? 'e' :
	                (b === 1) ? 'a' :
	                (b === 2) ? 'a' :
	                (b === 3) ? 'e' : 'e';
	            return number + output;
	        },
	        week : {
	            dow : 1, // Monday is the first day of the week.
	            doy : 4  // The week that contains Jan 4th is the first week of the year.
	        }
	    });
	}));


/***/ },
/* 67 */
/***/ function(module, exports, require) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;// moment.js language configuration
	// language : tamil (ta)
	// author : Arjunkumar Krishnamoorthy : https://github.com/tk120404

	(function (factory) {
	    if (true) {
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [require(6)], __WEBPACK_AMD_DEFINE_RESULT__ = (factory.apply(null, __WEBPACK_AMD_DEFINE_ARRAY__)), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)); // AMD
	    } else if (typeof exports === 'object') {
	        module.exports = factory(require('../moment')); // Node
	    } else {
	        factory(window.moment); // Browser global
	    }
	}(function (moment) {
	    /*var symbolMap = {
	            '1': '௧',
	            '2': '௨',
	            '3': '௩',
	            '4': '௪',
	            '5': '௫',
	            '6': '௬',
	            '7': '௭',
	            '8': '௮',
	            '9': '௯',
	            '0': '௦'
	        },
	        numberMap = {
	            '௧': '1',
	            '௨': '2',
	            '௩': '3',
	            '௪': '4',
	            '௫': '5',
	            '௬': '6',
	            '௭': '7',
	            '௮': '8',
	            '௯': '9',
	            '௦': '0'
	        }; */

	    return moment.lang('ta', {
	        months : 'ஜனவரி_பிப்ரவரி_மார்ச்_ஏப்ரல்_மே_ஜூன்_ஜூலை_ஆகஸ்ட்_செப்டெம்பர்_அக்டோபர்_நவம்பர்_டிசம்பர்'.split("_"),
	        monthsShort : 'ஜனவரி_பிப்ரவரி_மார்ச்_ஏப்ரல்_மே_ஜூன்_ஜூலை_ஆகஸ்ட்_செப்டெம்பர்_அக்டோபர்_நவம்பர்_டிசம்பர்'.split("_"),
	        weekdays : 'ஞாயிற்றுக்கிழமை_திங்கட்கிழமை_செவ்வாய்கிழமை_புதன்கிழமை_வியாழக்கிழமை_வெள்ளிக்கிழமை_சனிக்கிழமை'.split("_"),
	        weekdaysShort : 'ஞாயிறு_திங்கள்_செவ்வாய்_புதன்_வியாழன்_வெள்ளி_சனி'.split("_"),
	        weekdaysMin : 'ஞா_தி_செ_பு_வி_வெ_ச'.split("_"),
	        longDateFormat : {
	            LT : "HH:mm",
	            L : "DD/MM/YYYY",
	            LL : "D MMMM YYYY",
	            LLL : "D MMMM YYYY, LT",
	            LLLL : "dddd, D MMMM YYYY, LT"
	        },
	        calendar : {
	            sameDay : '[இன்று] LT',
	            nextDay : '[நாளை] LT',
	            nextWeek : 'dddd, LT',
	            lastDay : '[நேற்று] LT',
	            lastWeek : '[கடந்த வாரம்] dddd, LT',
	            sameElse : 'L'
	        },
	        relativeTime : {
	            future : "%s இல்",
	            past : "%s முன்",
	            s : "ஒரு சில விநாடிகள்",
	            m : "ஒரு நிமிடம்",
	            mm : "%d நிமிடங்கள்",
	            h : "ஒரு மணி நேரம்",
	            hh : "%d மணி நேரம்",
	            d : "ஒரு நாள்",
	            dd : "%d நாட்கள்",
	            M : "ஒரு மாதம்",
	            MM : "%d மாதங்கள்",
	            y : "ஒரு வருடம்",
	            yy : "%d ஆண்டுகள்"
	        },
	/*        preparse: function (string) {
	            return string.replace(/[௧௨௩௪௫௬௭௮௯௦]/g, function (match) {
	                return numberMap[match];
	            });
	        },
	        postformat: function (string) {
	            return string.replace(/\d/g, function (match) {
	                return symbolMap[match];
	            });
	        },*/
	        ordinal : function (number) {
	            return number + 'வது';
	        },


	// refer http://ta.wikipedia.org/s/1er1      

	        meridiem : function (hour, minute, isLower) {
	            if (hour >= 6 && hour <= 10) {
	                return " காலை";
	            } else   if (hour >= 10 && hour <= 14) {
	                return " நண்பகல்";
	            } else    if (hour >= 14 && hour <= 18) {
	                return " எற்பாடு";
	            } else   if (hour >= 18 && hour <= 20) {
	                return " மாலை";
	            } else  if (hour >= 20 && hour <= 24) {
	                return " இரவு";
	            } else  if (hour >= 0 && hour <= 6) {
	                return " வைகறை";
	            }
	        },
	        week : {
	            dow : 0, // Sunday is the first day of the week.
	            doy : 6  // The week that contains Jan 1st is the first week of the year.
	        }
	    });
	}));


/***/ },
/* 68 */
/***/ function(module, exports, require) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;// moment.js language configuration
	// language : thai (th)
	// author : Kridsada Thanabulpong : https://github.com/sirn

	(function (factory) {
	    if (true) {
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [require(6)], __WEBPACK_AMD_DEFINE_RESULT__ = (factory.apply(null, __WEBPACK_AMD_DEFINE_ARRAY__)), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)); // AMD
	    } else if (typeof exports === 'object') {
	        module.exports = factory(require('../moment')); // Node
	    } else {
	        factory(window.moment); // Browser global
	    }
	}(function (moment) {
	    return moment.lang('th', {
	        months : "มกราคม_กุมภาพันธ์_มีนาคม_เมษายน_พฤษภาคม_มิถุนายน_กรกฎาคม_สิงหาคม_กันยายน_ตุลาคม_พฤศจิกายน_ธันวาคม".split("_"),
	        monthsShort : "มกรา_กุมภา_มีนา_เมษา_พฤษภา_มิถุนา_กรกฎา_สิงหา_กันยา_ตุลา_พฤศจิกา_ธันวา".split("_"),
	        weekdays : "อาทิตย์_จันทร์_อังคาร_พุธ_พฤหัสบดี_ศุกร์_เสาร์".split("_"),
	        weekdaysShort : "อาทิตย์_จันทร์_อังคาร_พุธ_พฤหัส_ศุกร์_เสาร์".split("_"), // yes, three characters difference
	        weekdaysMin : "อา._จ._อ._พ._พฤ._ศ._ส.".split("_"),
	        longDateFormat : {
	            LT : "H นาฬิกา m นาที",
	            L : "YYYY/MM/DD",
	            LL : "D MMMM YYYY",
	            LLL : "D MMMM YYYY เวลา LT",
	            LLLL : "วันddddที่ D MMMM YYYY เวลา LT"
	        },
	        meridiem : function (hour, minute, isLower) {
	            if (hour < 12) {
	                return "ก่อนเที่ยง";
	            } else {
	                return "หลังเที่ยง";
	            }
	        },
	        calendar : {
	            sameDay : '[วันนี้ เวลา] LT',
	            nextDay : '[พรุ่งนี้ เวลา] LT',
	            nextWeek : 'dddd[หน้า เวลา] LT',
	            lastDay : '[เมื่อวานนี้ เวลา] LT',
	            lastWeek : '[วัน]dddd[ที่แล้ว เวลา] LT',
	            sameElse : 'L'
	        },
	        relativeTime : {
	            future : "อีก %s",
	            past : "%sที่แล้ว",
	            s : "ไม่กี่วินาที",
	            m : "1 นาที",
	            mm : "%d นาที",
	            h : "1 ชั่วโมง",
	            hh : "%d ชั่วโมง",
	            d : "1 วัน",
	            dd : "%d วัน",
	            M : "1 เดือน",
	            MM : "%d เดือน",
	            y : "1 ปี",
	            yy : "%d ปี"
	        }
	    });
	}));


/***/ },
/* 69 */
/***/ function(module, exports, require) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;// moment.js language configuration
	// language : Tagalog/Filipino (tl-ph)
	// author : Dan Hagman

	(function (factory) {
	    if (true) {
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [require(6)], __WEBPACK_AMD_DEFINE_RESULT__ = (factory.apply(null, __WEBPACK_AMD_DEFINE_ARRAY__)), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)); // AMD
	    } else if (typeof exports === 'object') {
	        module.exports = factory(require('../moment')); // Node
	    } else {
	        factory(window.moment); // Browser global
	    }
	}(function (moment) {
	    return moment.lang('tl-ph', {
	        months : "Enero_Pebrero_Marso_Abril_Mayo_Hunyo_Hulyo_Agosto_Setyembre_Oktubre_Nobyembre_Disyembre".split("_"),
	        monthsShort : "Ene_Peb_Mar_Abr_May_Hun_Hul_Ago_Set_Okt_Nob_Dis".split("_"),
	        weekdays : "Linggo_Lunes_Martes_Miyerkules_Huwebes_Biyernes_Sabado".split("_"),
	        weekdaysShort : "Lin_Lun_Mar_Miy_Huw_Biy_Sab".split("_"),
	        weekdaysMin : "Li_Lu_Ma_Mi_Hu_Bi_Sab".split("_"),
	        longDateFormat : {
	            LT : "HH:mm",
	            L : "MM/D/YYYY",
	            LL : "MMMM D, YYYY",
	            LLL : "MMMM D, YYYY LT",
	            LLLL : "dddd, MMMM DD, YYYY LT"
	        },
	        calendar : {
	            sameDay: "[Ngayon sa] LT",
	            nextDay: '[Bukas sa] LT',
	            nextWeek: 'dddd [sa] LT',
	            lastDay: '[Kahapon sa] LT',
	            lastWeek: 'dddd [huling linggo] LT',
	            sameElse: 'L'
	        },
	        relativeTime : {
	            future : "sa loob ng %s",
	            past : "%s ang nakalipas",
	            s : "ilang segundo",
	            m : "isang minuto",
	            mm : "%d minuto",
	            h : "isang oras",
	            hh : "%d oras",
	            d : "isang araw",
	            dd : "%d araw",
	            M : "isang buwan",
	            MM : "%d buwan",
	            y : "isang taon",
	            yy : "%d taon"
	        },
	        ordinal : function (number) {
	            return number;
	        },
	        week : {
	            dow : 1, // Monday is the first day of the week.
	            doy : 4  // The week that contains Jan 4th is the first week of the year.
	        }
	    });
	}));


/***/ },
/* 70 */
/***/ function(module, exports, require) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;// moment.js language configuration
	// language : turkish (tr)
	// authors : Erhan Gundogan : https://github.com/erhangundogan,
	//           Burak Yiğit Kaya: https://github.com/BYK

	(function (factory) {
	    if (true) {
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [require(6)], __WEBPACK_AMD_DEFINE_RESULT__ = (factory.apply(null, __WEBPACK_AMD_DEFINE_ARRAY__)), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)); // AMD
	    } else if (typeof exports === 'object') {
	        module.exports = factory(require('../moment')); // Node
	    } else {
	        factory(window.moment); // Browser global
	    }
	}(function (moment) {

	    var suffixes = {
	        1: "'inci",
	        5: "'inci",
	        8: "'inci",
	        70: "'inci",
	        80: "'inci",

	        2: "'nci",
	        7: "'nci",
	        20: "'nci",
	        50: "'nci",

	        3: "'üncü",
	        4: "'üncü",
	        100: "'üncü",

	        6: "'ncı",

	        9: "'uncu",
	        10: "'uncu",
	        30: "'uncu",

	        60: "'ıncı",
	        90: "'ıncı"
	    };

	    return moment.lang('tr', {
	        months : "Ocak_Şubat_Mart_Nisan_Mayıs_Haziran_Temmuz_Ağustos_Eylül_Ekim_Kasım_Aralık".split("_"),
	        monthsShort : "Oca_Şub_Mar_Nis_May_Haz_Tem_Ağu_Eyl_Eki_Kas_Ara".split("_"),
	        weekdays : "Pazar_Pazartesi_Salı_Çarşamba_Perşembe_Cuma_Cumartesi".split("_"),
	        weekdaysShort : "Paz_Pts_Sal_Çar_Per_Cum_Cts".split("_"),
	        weekdaysMin : "Pz_Pt_Sa_Ça_Pe_Cu_Ct".split("_"),
	        longDateFormat : {
	            LT : "HH:mm",
	            L : "DD.MM.YYYY",
	            LL : "D MMMM YYYY",
	            LLL : "D MMMM YYYY LT",
	            LLLL : "dddd, D MMMM YYYY LT"
	        },
	        calendar : {
	            sameDay : '[bugün saat] LT',
	            nextDay : '[yarın saat] LT',
	            nextWeek : '[haftaya] dddd [saat] LT',
	            lastDay : '[dün] LT',
	            lastWeek : '[geçen hafta] dddd [saat] LT',
	            sameElse : 'L'
	        },
	        relativeTime : {
	            future : "%s sonra",
	            past : "%s önce",
	            s : "birkaç saniye",
	            m : "bir dakika",
	            mm : "%d dakika",
	            h : "bir saat",
	            hh : "%d saat",
	            d : "bir gün",
	            dd : "%d gün",
	            M : "bir ay",
	            MM : "%d ay",
	            y : "bir yıl",
	            yy : "%d yıl"
	        },
	        ordinal : function (number) {
	            if (number === 0) {  // special case for zero
	                return number + "'ıncı";
	            }
	            var a = number % 10,
	                b = number % 100 - a,
	                c = number >= 100 ? 100 : null;

	            return number + (suffixes[a] || suffixes[b] || suffixes[c]);
	        },
	        week : {
	            dow : 1, // Monday is the first day of the week.
	            doy : 7  // The week that contains Jan 1st is the first week of the year.
	        }
	    });
	}));


/***/ },
/* 71 */
/***/ function(module, exports, require) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;// moment.js language configuration
	// language : Morocco Central Atlas Tamaziɣt in Latin (tzm-la)
	// author : Abdel Said : https://github.com/abdelsaid

	(function (factory) {
	    if (true) {
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [require(6)], __WEBPACK_AMD_DEFINE_RESULT__ = (factory.apply(null, __WEBPACK_AMD_DEFINE_ARRAY__)), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)); // AMD
	    } else if (typeof exports === 'object') {
	        module.exports = factory(require('../moment')); // Node
	    } else {
	        factory(window.moment); // Browser global
	    }
	}(function (moment) {
	    return moment.lang('tzm-la', {
	        months : "innayr_brˤayrˤ_marˤsˤ_ibrir_mayyw_ywnyw_ywlywz_ɣwšt_šwtanbir_ktˤwbrˤ_nwwanbir_dwjnbir".split("_"),
	        monthsShort : "innayr_brˤayrˤ_marˤsˤ_ibrir_mayyw_ywnyw_ywlywz_ɣwšt_šwtanbir_ktˤwbrˤ_nwwanbir_dwjnbir".split("_"),
	        weekdays : "asamas_aynas_asinas_akras_akwas_asimwas_asiḍyas".split("_"),
	        weekdaysShort : "asamas_aynas_asinas_akras_akwas_asimwas_asiḍyas".split("_"),
	        weekdaysMin : "asamas_aynas_asinas_akras_akwas_asimwas_asiḍyas".split("_"),
	        longDateFormat : {
	            LT : "HH:mm",
	            L : "DD/MM/YYYY",
	            LL : "D MMMM YYYY",
	            LLL : "D MMMM YYYY LT",
	            LLLL : "dddd D MMMM YYYY LT"
	        },
	        calendar : {
	            sameDay: "[asdkh g] LT",
	            nextDay: '[aska g] LT',
	            nextWeek: 'dddd [g] LT',
	            lastDay: '[assant g] LT',
	            lastWeek: 'dddd [g] LT',
	            sameElse: 'L'
	        },
	        relativeTime : {
	            future : "dadkh s yan %s",
	            past : "yan %s",
	            s : "imik",
	            m : "minuḍ",
	            mm : "%d minuḍ",
	            h : "saɛa",
	            hh : "%d tassaɛin",
	            d : "ass",
	            dd : "%d ossan",
	            M : "ayowr",
	            MM : "%d iyyirn",
	            y : "asgas",
	            yy : "%d isgasn"
	        },
	        week : {
	            dow : 6, // Saturday is the first day of the week.
	            doy : 12  // The week that contains Jan 1st is the first week of the year.
	        }
	    });
	}));


/***/ },
/* 72 */
/***/ function(module, exports, require) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;// moment.js language configuration
	// language : Morocco Central Atlas Tamaziɣt (tzm)
	// author : Abdel Said : https://github.com/abdelsaid

	(function (factory) {
	    if (true) {
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [require(6)], __WEBPACK_AMD_DEFINE_RESULT__ = (factory.apply(null, __WEBPACK_AMD_DEFINE_ARRAY__)), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)); // AMD
	    } else if (typeof exports === 'object') {
	        module.exports = factory(require('../moment')); // Node
	    } else {
	        factory(window.moment); // Browser global
	    }
	}(function (moment) {
	    return moment.lang('tzm', {
	        months : "ⵉⵏⵏⴰⵢⵔ_ⴱⵕⴰⵢⵕ_ⵎⴰⵕⵚ_ⵉⴱⵔⵉⵔ_ⵎⴰⵢⵢⵓ_ⵢⵓⵏⵢⵓ_ⵢⵓⵍⵢⵓⵣ_ⵖⵓⵛⵜ_ⵛⵓⵜⴰⵏⴱⵉⵔ_ⴽⵟⵓⴱⵕ_ⵏⵓⵡⴰⵏⴱⵉⵔ_ⴷⵓⵊⵏⴱⵉⵔ".split("_"),
	        monthsShort : "ⵉⵏⵏⴰⵢⵔ_ⴱⵕⴰⵢⵕ_ⵎⴰⵕⵚ_ⵉⴱⵔⵉⵔ_ⵎⴰⵢⵢⵓ_ⵢⵓⵏⵢⵓ_ⵢⵓⵍⵢⵓⵣ_ⵖⵓⵛⵜ_ⵛⵓⵜⴰⵏⴱⵉⵔ_ⴽⵟⵓⴱⵕ_ⵏⵓⵡⴰⵏⴱⵉⵔ_ⴷⵓⵊⵏⴱⵉⵔ".split("_"),
	        weekdays : "ⴰⵙⴰⵎⴰⵙ_ⴰⵢⵏⴰⵙ_ⴰⵙⵉⵏⴰⵙ_ⴰⴽⵔⴰⵙ_ⴰⴽⵡⴰⵙ_ⴰⵙⵉⵎⵡⴰⵙ_ⴰⵙⵉⴹⵢⴰⵙ".split("_"),
	        weekdaysShort : "ⴰⵙⴰⵎⴰⵙ_ⴰⵢⵏⴰⵙ_ⴰⵙⵉⵏⴰⵙ_ⴰⴽⵔⴰⵙ_ⴰⴽⵡⴰⵙ_ⴰⵙⵉⵎⵡⴰⵙ_ⴰⵙⵉⴹⵢⴰⵙ".split("_"),
	        weekdaysMin : "ⴰⵙⴰⵎⴰⵙ_ⴰⵢⵏⴰⵙ_ⴰⵙⵉⵏⴰⵙ_ⴰⴽⵔⴰⵙ_ⴰⴽⵡⴰⵙ_ⴰⵙⵉⵎⵡⴰⵙ_ⴰⵙⵉⴹⵢⴰⵙ".split("_"),
	        longDateFormat : {
	            LT : "HH:mm",
	            L : "DD/MM/YYYY",
	            LL : "D MMMM YYYY",
	            LLL : "D MMMM YYYY LT",
	            LLLL : "dddd D MMMM YYYY LT"
	        },
	        calendar : {
	            sameDay: "[ⴰⵙⴷⵅ ⴴ] LT",
	            nextDay: '[ⴰⵙⴽⴰ ⴴ] LT',
	            nextWeek: 'dddd [ⴴ] LT',
	            lastDay: '[ⴰⵚⴰⵏⵜ ⴴ] LT',
	            lastWeek: 'dddd [ⴴ] LT',
	            sameElse: 'L'
	        },
	        relativeTime : {
	            future : "ⴷⴰⴷⵅ ⵙ ⵢⴰⵏ %s",
	            past : "ⵢⴰⵏ %s",
	            s : "ⵉⵎⵉⴽ",
	            m : "ⵎⵉⵏⵓⴺ",
	            mm : "%d ⵎⵉⵏⵓⴺ",
	            h : "ⵙⴰⵄⴰ",
	            hh : "%d ⵜⴰⵙⵙⴰⵄⵉⵏ",
	            d : "ⴰⵙⵙ",
	            dd : "%d oⵙⵙⴰⵏ",
	            M : "ⴰⵢoⵓⵔ",
	            MM : "%d ⵉⵢⵢⵉⵔⵏ",
	            y : "ⴰⵙⴳⴰⵙ",
	            yy : "%d ⵉⵙⴳⴰⵙⵏ"
	        },
	        week : {
	            dow : 6, // Saturday is the first day of the week.
	            doy : 12  // The week that contains Jan 1st is the first week of the year.
	        }
	    });
	}));


/***/ },
/* 73 */
/***/ function(module, exports, require) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;// moment.js language configuration
	// language : ukrainian (uk)
	// author : zemlanin : https://github.com/zemlanin
	// Author : Menelion Elensúle : https://github.com/Oire

	(function (factory) {
	    if (true) {
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [require(6)], __WEBPACK_AMD_DEFINE_RESULT__ = (factory.apply(null, __WEBPACK_AMD_DEFINE_ARRAY__)), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)); // AMD
	    } else if (typeof exports === 'object') {
	        module.exports = factory(require('../moment')); // Node
	    } else {
	        factory(window.moment); // Browser global
	    }
	}(function (moment) {
	    function plural(word, num) {
	        var forms = word.split('_');
	        return num % 10 === 1 && num % 100 !== 11 ? forms[0] : (num % 10 >= 2 && num % 10 <= 4 && (num % 100 < 10 || num % 100 >= 20) ? forms[1] : forms[2]);
	    }

	    function relativeTimeWithPlural(number, withoutSuffix, key) {
	        var format = {
	            'mm': 'хвилина_хвилини_хвилин',
	            'hh': 'година_години_годин',
	            'dd': 'день_дні_днів',
	            'MM': 'місяць_місяці_місяців',
	            'yy': 'рік_роки_років'
	        };
	        if (key === 'm') {
	            return withoutSuffix ? 'хвилина' : 'хвилину';
	        }
	        else if (key === 'h') {
	            return withoutSuffix ? 'година' : 'годину';
	        }
	        else {
	            return number + ' ' + plural(format[key], +number);
	        }
	    }

	    function monthsCaseReplace(m, format) {
	        var months = {
	            'nominative': 'січень_лютий_березень_квітень_травень_червень_липень_серпень_вересень_жовтень_листопад_грудень'.split('_'),
	            'accusative': 'січня_лютого_березня_квітня_травня_червня_липня_серпня_вересня_жовтня_листопада_грудня'.split('_')
	        },

	        nounCase = (/D[oD]? *MMMM?/).test(format) ?
	            'accusative' :
	            'nominative';

	        return months[nounCase][m.month()];
	    }

	    function weekdaysCaseReplace(m, format) {
	        var weekdays = {
	            'nominative': 'неділя_понеділок_вівторок_середа_четвер_п’ятниця_субота'.split('_'),
	            'accusative': 'неділю_понеділок_вівторок_середу_четвер_п’ятницю_суботу'.split('_'),
	            'genitive': 'неділі_понеділка_вівторка_середи_четверга_п’ятниці_суботи'.split('_')
	        },

	        nounCase = (/(\[[ВвУу]\]) ?dddd/).test(format) ?
	            'accusative' :
	            ((/\[?(?:минулої|наступної)? ?\] ?dddd/).test(format) ?
	                'genitive' :
	                'nominative');

	        return weekdays[nounCase][m.day()];
	    }

	    function processHoursFunction(str) {
	        return function () {
	            return str + 'о' + (this.hours() === 11 ? 'б' : '') + '] LT';
	        };
	    }

	    return moment.lang('uk', {
	        months : monthsCaseReplace,
	        monthsShort : "січ_лют_бер_квіт_трав_черв_лип_серп_вер_жовт_лист_груд".split("_"),
	        weekdays : weekdaysCaseReplace,
	        weekdaysShort : "нд_пн_вт_ср_чт_пт_сб".split("_"),
	        weekdaysMin : "нд_пн_вт_ср_чт_пт_сб".split("_"),
	        longDateFormat : {
	            LT : "HH:mm",
	            L : "DD.MM.YYYY",
	            LL : "D MMMM YYYY р.",
	            LLL : "D MMMM YYYY р., LT",
	            LLLL : "dddd, D MMMM YYYY р., LT"
	        },
	        calendar : {
	            sameDay: processHoursFunction('[Сьогодні '),
	            nextDay: processHoursFunction('[Завтра '),
	            lastDay: processHoursFunction('[Вчора '),
	            nextWeek: processHoursFunction('[У] dddd ['),
	            lastWeek: function () {
	                switch (this.day()) {
	                case 0:
	                case 3:
	                case 5:
	                case 6:
	                    return processHoursFunction('[Минулої] dddd [').call(this);
	                case 1:
	                case 2:
	                case 4:
	                    return processHoursFunction('[Минулого] dddd [').call(this);
	                }
	            },
	            sameElse: 'L'
	        },
	        relativeTime : {
	            future : "за %s",
	            past : "%s тому",
	            s : "декілька секунд",
	            m : relativeTimeWithPlural,
	            mm : relativeTimeWithPlural,
	            h : "годину",
	            hh : relativeTimeWithPlural,
	            d : "день",
	            dd : relativeTimeWithPlural,
	            M : "місяць",
	            MM : relativeTimeWithPlural,
	            y : "рік",
	            yy : relativeTimeWithPlural
	        },

	        // M. E.: those two are virtually unused but a user might want to implement them for his/her website for some reason

	        meridiem : function (hour, minute, isLower) {
	            if (hour < 4) {
	                return "ночі";
	            } else if (hour < 12) {
	                return "ранку";
	            } else if (hour < 17) {
	                return "дня";
	            } else {
	                return "вечора";
	            }
	        },

	        ordinal: function (number, period) {
	            switch (period) {
	            case 'M':
	            case 'd':
	            case 'DDD':
	            case 'w':
	            case 'W':
	                return number + '-й';
	            case 'D':
	                return number + '-го';
	            default:
	                return number;
	            }
	        },

	        week : {
	            dow : 1, // Monday is the first day of the week.
	            doy : 7  // The week that contains Jan 1st is the first week of the year.
	        }
	    });
	}));


/***/ },
/* 74 */
/***/ function(module, exports, require) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;// moment.js language configuration
	// language : uzbek
	// author : Sardor Muminov : https://github.com/muminoff

	(function (factory) {
	    if (true) {
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [require(6)], __WEBPACK_AMD_DEFINE_RESULT__ = (factory.apply(null, __WEBPACK_AMD_DEFINE_ARRAY__)), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)); // AMD
	    } else if (typeof exports === 'object') {
	        module.exports = factory(require('../moment')); // Node
	    } else {
	        factory(window.moment); // Browser global
	    }
	}(function (moment) {
	    return moment.lang('uz', {
	        months : "январь_февраль_март_апрель_май_июнь_июль_август_сентябрь_октябрь_ноябрь_декабрь".split("_"),
	        monthsShort : "янв_фев_мар_апр_май_июн_июл_авг_сен_окт_ноя_дек".split("_"),
	        weekdays : "Якшанба_Душанба_Сешанба_Чоршанба_Пайшанба_Жума_Шанба".split("_"),
	        weekdaysShort : "Якш_Душ_Сеш_Чор_Пай_Жум_Шан".split("_"),
	        weekdaysMin : "Як_Ду_Се_Чо_Па_Жу_Ша".split("_"),
	        longDateFormat : {
	            LT : "HH:mm",
	            L : "DD/MM/YYYY",
	            LL : "D MMMM YYYY",
	            LLL : "D MMMM YYYY LT",
	            LLLL : "D MMMM YYYY, dddd LT"
	        },
	        calendar : {
	            sameDay : '[Бугун соат] LT [да]',
	            nextDay : '[Эртага] LT [да]',
	            nextWeek : 'dddd [куни соат] LT [да]',
	            lastDay : '[Кеча соат] LT [да]',
	            lastWeek : '[Утган] dddd [куни соат] LT [да]',
	            sameElse : 'L'
	        },
	        relativeTime : {
	            future : "Якин %s ичида",
	            past : "Бир неча %s олдин",
	            s : "фурсат",
	            m : "бир дакика",
	            mm : "%d дакика",
	            h : "бир соат",
	            hh : "%d соат",
	            d : "бир кун",
	            dd : "%d кун",
	            M : "бир ой",
	            MM : "%d ой",
	            y : "бир йил",
	            yy : "%d йил"
	        },
	        week : {
	            dow : 1, // Monday is the first day of the week.
	            doy : 7  // The week that contains Jan 4th is the first week of the year.
	        }
	    });
	}));


/***/ },
/* 75 */
/***/ function(module, exports, require) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;// moment.js language configuration
	// language : vietnamese (vn)
	// author : Bang Nguyen : https://github.com/bangnk

	(function (factory) {
	    if (true) {
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [require(6)], __WEBPACK_AMD_DEFINE_RESULT__ = (factory.apply(null, __WEBPACK_AMD_DEFINE_ARRAY__)), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)); // AMD
	    } else if (typeof exports === 'object') {
	        module.exports = factory(require('../moment')); // Node
	    } else {
	        factory(window.moment); // Browser global
	    }
	}(function (moment) {
	    return moment.lang('vn', {
	        months : "tháng 1_tháng 2_tháng 3_tháng 4_tháng 5_tháng 6_tháng 7_tháng 8_tháng 9_tháng 10_tháng 11_tháng 12".split("_"),
	        monthsShort : "Th01_Th02_Th03_Th04_Th05_Th06_Th07_Th08_Th09_Th10_Th11_Th12".split("_"),
	        weekdays : "chủ nhật_thứ hai_thứ ba_thứ tư_thứ năm_thứ sáu_thứ bảy".split("_"),
	        weekdaysShort : "CN_T2_T3_T4_T5_T6_T7".split("_"),
	        weekdaysMin : "CN_T2_T3_T4_T5_T6_T7".split("_"),
	        longDateFormat : {
	            LT : "HH:mm",
	            L : "DD/MM/YYYY",
	            LL : "D MMMM [năm] YYYY",
	            LLL : "D MMMM [năm] YYYY LT",
	            LLLL : "dddd, D MMMM [năm] YYYY LT",
	            l : "DD/M/YYYY",
	            ll : "D MMM YYYY",
	            lll : "D MMM YYYY LT",
	            llll : "ddd, D MMM YYYY LT"
	        },
	        calendar : {
	            sameDay: "[Hôm nay lúc] LT",
	            nextDay: '[Ngày mai lúc] LT',
	            nextWeek: 'dddd [tuần tới lúc] LT',
	            lastDay: '[Hôm qua lúc] LT',
	            lastWeek: 'dddd [tuần rồi lúc] LT',
	            sameElse: 'L'
	        },
	        relativeTime : {
	            future : "%s tới",
	            past : "%s trước",
	            s : "vài giây",
	            m : "một phút",
	            mm : "%d phút",
	            h : "một giờ",
	            hh : "%d giờ",
	            d : "một ngày",
	            dd : "%d ngày",
	            M : "một tháng",
	            MM : "%d tháng",
	            y : "một năm",
	            yy : "%d năm"
	        },
	        ordinal : function (number) {
	            return number;
	        },
	        week : {
	            dow : 1, // Monday is the first day of the week.
	            doy : 4  // The week that contains Jan 4th is the first week of the year.
	        }
	    });
	}));


/***/ },
/* 76 */
/***/ function(module, exports, require) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;// moment.js language configuration
	// language : chinese
	// author : suupic : https://github.com/suupic
	// author : Zeno Zeng : https://github.com/zenozeng

	(function (factory) {
	    if (true) {
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [require(6)], __WEBPACK_AMD_DEFINE_RESULT__ = (factory.apply(null, __WEBPACK_AMD_DEFINE_ARRAY__)), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)); // AMD
	    } else if (typeof exports === 'object') {
	        module.exports = factory(require('../moment')); // Node
	    } else {
	        factory(window.moment); // Browser global
	    }
	}(function (moment) {
	    return moment.lang('zh-cn', {
	        months : "一月_二月_三月_四月_五月_六月_七月_八月_九月_十月_十一月_十二月".split("_"),
	        monthsShort : "1月_2月_3月_4月_5月_6月_7月_8月_9月_10月_11月_12月".split("_"),
	        weekdays : "星期日_星期一_星期二_星期三_星期四_星期五_星期六".split("_"),
	        weekdaysShort : "周日_周一_周二_周三_周四_周五_周六".split("_"),
	        weekdaysMin : "日_一_二_三_四_五_六".split("_"),
	        longDateFormat : {
	            LT : "Ah点mm",
	            L : "YYYY-MM-DD",
	            LL : "YYYY年MMMD日",
	            LLL : "YYYY年MMMD日LT",
	            LLLL : "YYYY年MMMD日ddddLT",
	            l : "YYYY-MM-DD",
	            ll : "YYYY年MMMD日",
	            lll : "YYYY年MMMD日LT",
	            llll : "YYYY年MMMD日ddddLT"
	        },
	        meridiem : function (hour, minute, isLower) {
	            var hm = hour * 100 + minute;
	            if (hm < 600) {
	                return "凌晨";
	            } else if (hm < 900) {
	                return "早上";
	            } else if (hm < 1130) {
	                return "上午";
	            } else if (hm < 1230) {
	                return "中午";
	            } else if (hm < 1800) {
	                return "下午";
	            } else {
	                return "晚上";
	            }
	        },
	        calendar : {
	            sameDay : function () {
	                return this.minutes() === 0 ? "[今天]Ah[点整]" : "[今天]LT";
	            },
	            nextDay : function () {
	                return this.minutes() === 0 ? "[明天]Ah[点整]" : "[明天]LT";
	            },
	            lastDay : function () {
	                return this.minutes() === 0 ? "[昨天]Ah[点整]" : "[昨天]LT";
	            },
	            nextWeek : function () {
	                var startOfWeek, prefix;
	                startOfWeek = moment().startOf('week');
	                prefix = this.unix() - startOfWeek.unix() >= 7 * 24 * 3600 ? '[下]' : '[本]';
	                return this.minutes() === 0 ? prefix + "dddAh点整" : prefix + "dddAh点mm";
	            },
	            lastWeek : function () {
	                var startOfWeek, prefix;
	                startOfWeek = moment().startOf('week');
	                prefix = this.unix() < startOfWeek.unix()  ? '[上]' : '[本]';
	                return this.minutes() === 0 ? prefix + "dddAh点整" : prefix + "dddAh点mm";
	            },
	            sameElse : 'LL'
	        },
	        ordinal : function (number, period) {
	            switch (period) {
	            case "d":
	            case "D":
	            case "DDD":
	                return number + "日";
	            case "M":
	                return number + "月";
	            case "w":
	            case "W":
	                return number + "周";
	            default:
	                return number;
	            }
	        },
	        relativeTime : {
	            future : "%s内",
	            past : "%s前",
	            s : "几秒",
	            m : "1分钟",
	            mm : "%d分钟",
	            h : "1小时",
	            hh : "%d小时",
	            d : "1天",
	            dd : "%d天",
	            M : "1个月",
	            MM : "%d个月",
	            y : "1年",
	            yy : "%d年"
	        },
	        week : {
	            // GB/T 7408-1994《数据元和交换格式·信息交换·日期和时间表示法》与ISO 8601:1988等效
	            dow : 1, // Monday is the first day of the week.
	            doy : 4  // The week that contains Jan 4th is the first week of the year.
	        }
	    });
	}));


/***/ },
/* 77 */
/***/ function(module, exports, require) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;// moment.js language configuration
	// language : traditional chinese (zh-tw)
	// author : Ben : https://github.com/ben-lin

	(function (factory) {
	    if (true) {
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [require(6)], __WEBPACK_AMD_DEFINE_RESULT__ = (factory.apply(null, __WEBPACK_AMD_DEFINE_ARRAY__)), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)); // AMD
	    } else if (typeof exports === 'object') {
	        module.exports = factory(require('../moment')); // Node
	    } else {
	        factory(window.moment); // Browser global
	    }
	}(function (moment) {
	    return moment.lang('zh-tw', {
	        months : "一月_二月_三月_四月_五月_六月_七月_八月_九月_十月_十一月_十二月".split("_"),
	        monthsShort : "1月_2月_3月_4月_5月_6月_7月_8月_9月_10月_11月_12月".split("_"),
	        weekdays : "星期日_星期一_星期二_星期三_星期四_星期五_星期六".split("_"),
	        weekdaysShort : "週日_週一_週二_週三_週四_週五_週六".split("_"),
	        weekdaysMin : "日_一_二_三_四_五_六".split("_"),
	        longDateFormat : {
	            LT : "Ah點mm",
	            L : "YYYY年MMMD日",
	            LL : "YYYY年MMMD日",
	            LLL : "YYYY年MMMD日LT",
	            LLLL : "YYYY年MMMD日ddddLT",
	            l : "YYYY年MMMD日",
	            ll : "YYYY年MMMD日",
	            lll : "YYYY年MMMD日LT",
	            llll : "YYYY年MMMD日ddddLT"
	        },
	        meridiem : function (hour, minute, isLower) {
	            var hm = hour * 100 + minute;
	            if (hm < 900) {
	                return "早上";
	            } else if (hm < 1130) {
	                return "上午";
	            } else if (hm < 1230) {
	                return "中午";
	            } else if (hm < 1800) {
	                return "下午";
	            } else {
	                return "晚上";
	            }
	        },
	        calendar : {
	            sameDay : '[今天]LT',
	            nextDay : '[明天]LT',
	            nextWeek : '[下]ddddLT',
	            lastDay : '[昨天]LT',
	            lastWeek : '[上]ddddLT',
	            sameElse : 'L'
	        },
	        ordinal : function (number, period) {
	            switch (period) {
	            case "d" :
	            case "D" :
	            case "DDD" :
	                return number + "日";
	            case "M" :
	                return number + "月";
	            case "w" :
	            case "W" :
	                return number + "週";
	            default :
	                return number;
	            }
	        },
	        relativeTime : {
	            future : "%s內",
	            past : "%s前",
	            s : "幾秒",
	            m : "一分鐘",
	            mm : "%d分鐘",
	            h : "一小時",
	            hh : "%d小時",
	            d : "一天",
	            dd : "%d天",
	            M : "一個月",
	            MM : "%d個月",
	            y : "一年",
	            yy : "%d年"
	        }
	    });
	}));


/***/ },
/* 78 */
/***/ function(module, exports, require) {

	module.exports = function(module) {
		if(!module.webpackPolyfill) {
			module.deprecate = function() {};
			module.paths = [];
			// module.parent = undefined by default
			module.children = [];
			module.webpackPolyfill = 1;
		}
		return module;
	}


/***/ }
/******/ ])