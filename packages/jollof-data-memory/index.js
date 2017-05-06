/**
 * Created by iyobo on 2016-10-30.
 */
const co = require('co');
const _ = require('lodash');
const path = require('path');
const promise = require('bluebird');

const Datastore = require('nedb-jollof')
var convertToJollof = require('./util/conversionUtil.js').convertToJollof;
var convertConditionsFromJollof = require('./util/conversionUtil.js').convertConditionsFromJollof;

/**
 * A Jollof Data Adapter for Memory
 */
class JollofDataMemory {

    /**
     * Keep constructor free of async calls.
     * Only use to set initial values like connection strings and similar sync commands.
     * @param options
     */
    constructor(options) {
        this.connectionOptions = options || {};
        this.db = {};

        this._Datastore = Datastore;
        this._convertConditionsFromJollof = convertConditionsFromJollof;
        this._convertToJollof = convertToJollof;
    }


    /**
     * Jollof will run this on boot. Place all async or 'talking to database per collection' logic here.
     *
     * @param schema
     */
    * addSchema(schema) {

        //options are different each time because same adapter managers multiple stores/collections
        const options = _.cloneDeep(this.connectionOptions)
        options.filename = path.join(this.connectionOptions.filename, schema.name + '.db')
        this.db[schema.name] = promise.promisifyAll(new Datastore(options));
        return true;
    }




    /**
     * This is the primary Id field name to be used in all models under this adapter.
     * @returns {string}
     */
    get idField() {
        return '_id';
    }

    /**
     * These are fields that this adapter's datasource needs, but that might not relate to Jollof.
     * Jollof might use this to know and preserve these fields.
     *
     * @returns {string}
     */
    get keepFields() {
        return [];
    }

    /**
     *
     * @param collectionName
     * @param criteria
     * @param opts
     * @returns {*}
     */
    * find(collectionName, criteria, opts = {}) {
        //If we're paging
        let res;
        //console.log('find criteria', criteria)
        if (opts) {

            const options = {};

            if (opts.paging) {
                const page = opts.paging.page || 1;
                const limit = opts.paging.limit || 10;
                const skip = ((page - 1) * limit);

                options.paging = { skip, limit };
            }

            if (opts.sort) {
                options.sort = opts.sort;
            }

            res = yield this.db[collectionName].findOptsAsync(convertConditionsFromJollof(criteria), options);
        } else {
            res = yield this.db[collectionName].findAsync(convertConditionsFromJollof(criteria));
        }
        return convertToJollof(res);

    }

    /**
     *
     * @param collectionName
     * @param criteria
     * @param opts
     * @returns {*}
     */
    * count(collectionName, criteria, opts) {
        return yield this.db[collectionName].countAsync(convertConditionsFromJollof(criteria));
    }


    /**
     * Return how many items were updated
     * @param collectionName
     * @param criteria
     * @param newValues
     * @param params
     * @returns {*}
     */
    * update(collectionName, criteria, newValues, opts) {
        opts = convertFromJollof(opts);
        const res = yield this.db[collectionName].updateAsync(convertFromJollof(criteria), newValues);
        //console.log('item update result', res);
        return res;
    }


    /**
     * Return the created item
     * @param collectionName
     * @param criteria
     * @param newValues
     * @param params
     * @returns {*}
     */
    * create(collectionName, data) {

        const res = yield this.db[collectionName].insertAsync(data);
        return convertToJollof(res);
    }


    /**
     * Deletes all rows that match the criteria.
     * Return number of items deleted
     *
     * @param collectionName
     * @param criteria
     * @param params
     * @returns {*}
     */
    * remove(collectionName, criteria, opts) {

        _.merge(opts, { multi: true })
        return yield this.db[collectionName].removeAsync(convertFromJollof(criteria), opts);

    }

}

module.exports = JollofDataMemory;