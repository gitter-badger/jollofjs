const boom = require('boom');

/**
 * Created by iyobo on 2017-05-17.
 */

/**
 * Determines if one can view the Jollof admin
 * @param ctx
 * @param next
 * @returns {Promise.<void>}
 */
exports.canViewAdmin = async (ctx, next) => {

    //TODO: change this to actual auth.
    if (true) {
        console.log('Can see admin')
        await next();
    }
    else {
        //If user is not authorized to use admin, throw a misleading 404 to avoid hinting.
        throw new boom.notFound('Not Found')
    }

}