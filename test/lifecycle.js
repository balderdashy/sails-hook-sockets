/**
 * Module dependencies
 */

var lifecycle = require('./helpers/lifecycle.helper');


// Set up "before all" and "after all"
before(lifecycle.setup);
after(lifecycle.teardown);
