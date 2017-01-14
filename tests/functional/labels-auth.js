/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'intern',
  'intern!object',
  'intern/chai!assert',
  'require',
  'tests/functional/lib/helpers'
], function(intern, registerSuite, assert, require, FunctionalHelpers) {
  'use strict';

  registerSuite(function() {

    var url = function(path) {
      return intern.config.siteRoot + path;
    };

    return {
      name: 'Labels (auth)',

      setup: function() {
        return FunctionalHelpers.login(this);
      },

      teardown: function() {
        return FunctionalHelpers.logout(this);
      },

      'Label gear is visible': function() {
        return FunctionalHelpers.openPage(this, url('/issues/2'), '.js-Issue-labelEditor')
          .findByCssSelector('.js-Issue-labelEditor')
          .end();
      },

      'Label widget is opening on click': function() {
        return FunctionalHelpers.openPage(this, url('/issues/2'), '.js-Issue-labelEditor')
          .findByCssSelector('.js-LabelEditorLauncher').click()
          .end()
          .findByCssSelector('.js-LabelEditor')
          .end();
      }
    };
  });
});
